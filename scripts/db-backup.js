const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { getDbConfig } = require("./db-env");

function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${minute}${second}`;
}

function resolveDumpCommand() {
  return String(process.env.MES_MYSQLDUMP_BIN || "mysqldump").trim();
}

async function runDbBackup({ outputFile } = {}) {
  const dbConfig = getDbConfig();
  const database = dbConfig.database;
  const outputDir = path.resolve(process.cwd(), "backups");
  fs.mkdirSync(outputDir, { recursive: true });

  const resolvedOutputFile =
    outputFile
      ? path.resolve(process.cwd(), outputFile)
      : path.join(outputDir, `${database}-${getTimestamp()}.sql`);

  const args = [
    "--host", dbConfig.host,
    "--port", String(dbConfig.port),
    "--user", dbConfig.user,
    "--routines",
    "--events",
    "--triggers",
    "--single-transaction",
    database
  ];

  await new Promise((resolve, reject) => {
    const dump = spawn(resolveDumpCommand(), args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        MYSQL_PWD: dbConfig.password
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    const outputStream = fs.createWriteStream(resolvedOutputFile, { encoding: "utf8" });
    let stderr = "";

    dump.stdout.pipe(outputStream);
    dump.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    dump.on("error", reject);
    dump.on("close", (code) => {
      outputStream.end();

      if (code !== 0) {
        reject(new Error(stderr.trim() || `mysqldump_exit_${code}`));
        return;
      }

      resolve();
    });
  });

  return {
    database,
    outputFile: resolvedOutputFile
  };
}

if (require.main === module) {
  const outputArg = process.argv.find((item) => item.startsWith("--output="));

  runDbBackup({
    outputFile: outputArg ? outputArg.slice("--output=".length) : ""
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
  runDbBackup
};
