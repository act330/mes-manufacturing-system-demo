require("dotenv").config();

const { URL } = require("url");

function getRequiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`missing_env:${name}`);
  }

  return value;
}

function parseMySqlUrl() {
  const raw = String(process.env.MES_MYSQL_URL || "").trim();
  if (!raw) {
    return null;
  }

  const url = new URL(raw);

  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    charset: "utf8mb4",
    multipleStatements: true
  };
}

function getDbConfig() {
  const parsed = parseMySqlUrl();
  if (parsed) {
    return parsed;
  }

  return {
    host: getRequiredEnv("MES_MYSQL_HOST"),
    port: Number(process.env.MES_MYSQL_PORT || 3306),
    user: getRequiredEnv("MES_MYSQL_USER"),
    password: String(process.env.MES_MYSQL_PASSWORD || ""),
    database: getRequiredEnv("MES_MYSQL_DATABASE"),
    charset: "utf8mb4",
    multipleStatements: true
  };
}

function getRootConnectionConfig() {
  const config = getDbConfig();

  return {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    charset: config.charset,
    multipleStatements: true
  };
}

module.exports = {
  getDbConfig,
  getRootConnectionConfig,
  getRequiredEnv
};
