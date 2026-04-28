const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { getDbConfig } = require("./db-env");

function resolveMysqlCommand() {
  return String(process.env.MES_MYSQL_BIN || "mysql").trim();
}

async function runDbRestore({ inputFile } = {}) {
  const resolvedInputFile = path.resolve(process.cwd(), String(inputFile || "").trim());
  if (!fs.existsSync(resolvedInputFile)) {
    throw new Error(`backup_not_found:${resolvedInputFile}`);
  }

  const dbConfig = getDbConfig();

  const args = [
    "--host", dbConfig.host,
    "--port", String(dbConfig.port),
    "--user", dbConfig.user,
    dbConfig.database
  ];

  await new Promise((resolve, reject) => {
    const client = spawn(resolveMysqlCommand(), args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MYSQL_PWD: dbConfig.password
      },
      stdio: ["pipe", "pipe", "pipe"]
    });

    let stderr = "";
    client.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    fs.createReadStream(resolvedInputFile).pipe(client.stdin);

    client.on("error", reject);
    client.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `mysql_restore_exit_${code}`));
        return;
      }

      resolve();
    });
  });

  return {
    database: dbConfig.database,
    inputFile: resolvedInputFile
  };
}

if (require.main === module) {
  const inputArg = process.argv.find((item) => item.startsWith("--input="));

  runDbRestore({
    inputFile: inputArg ? inputArg.slice("--input=".length) : ""
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
  runDbRestore
};
