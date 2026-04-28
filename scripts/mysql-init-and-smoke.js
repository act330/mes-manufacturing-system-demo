require("dotenv").config();

const { runDbInit } = require("./db-init");
const { runMySqlSmoke } = require("./mysql-smoke");

async function runInitAndSmoke({ reset = false } = {}) {
  const initResult = await runDbInit({ reset });
  const smokeResult = await runMySqlSmoke();

  return {
    init: initResult,
    smoke: smokeResult
  };
}

if (require.main === module) {
  const reset = process.argv.includes("--reset");

  runInitAndSmoke({ reset })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exitCode = 1;
    });
}

module.exports = {
  runInitAndSmoke
};
