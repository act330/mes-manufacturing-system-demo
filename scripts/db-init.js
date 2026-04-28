const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { getDbConfig, getRootConnectionConfig } = require("./db-env");

function resolvePath(filePath, fallbackPath) {
  if (filePath) {
    return path.resolve(process.cwd(), filePath);
  }

  return path.resolve(process.cwd(), fallbackPath);
}

async function databaseHasSeedData(connection) {
  const [tables] = await connection.query("SHOW TABLES LIKE 'mes_users'");
  if (!tables.length) {
    return false;
  }

  const [rows] = await connection.query("SELECT COUNT(*) AS total FROM mes_users");
  return Number(rows[0]?.total || 0) > 0;
}

async function runDbInit({
  reset = false,
  forceSeed = false,
  schemaPath,
  seedPath
} = {}) {
  const dbConfig = getDbConfig();
  const serverConnection = await mysql.createConnection(getRootConnectionConfig());

  const resolvedSchemaPath = resolvePath(schemaPath, "database/mysql_schema.sql");
  const resolvedSeedPath = resolvePath(seedPath, "database/mysql_seed.sql");

  try {
    if (reset) {
      await serverConnection.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
    }

    const schemaSql = fs.readFileSync(resolvedSchemaPath, "utf8");
    await serverConnection.query(schemaSql);

    const databaseConnection = await mysql.createConnection(dbConfig);

    try {
      const hasSeedData = await databaseHasSeedData(databaseConnection);
      let seeded = false;

      if (forceSeed || !hasSeedData) {
        const seedSql = fs.readFileSync(resolvedSeedPath, "utf8");
        await databaseConnection.query(seedSql);
        seeded = true;
      }

      return {
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
        reset,
        seeded,
        schemaPath: resolvedSchemaPath,
        seedPath: resolvedSeedPath
      };
    } finally {
      await databaseConnection.end();
    }
  } finally {
    await serverConnection.end();
  }
}

if (require.main === module) {
  const args = new Set(process.argv.slice(2));

  runDbInit({
    reset: args.has("--reset"),
    forceSeed: args.has("--force-seed")
  })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exitCode = 1;
    });
}

module.exports = {
  runDbInit
};
