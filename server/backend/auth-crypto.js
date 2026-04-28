const crypto = require("crypto");
const { DEFAULT_JWT_SECRET } = require("./runtime-config");

const JWT_SECRET = process.env.MES_JWT_SECRET || DEFAULT_JWT_SECRET;
const PASSWORD_HASH_PREFIX = "scrypt";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function randomHex(bytes = 16) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password, salt = randomHex(16)) {
  const hashed = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${PASSWORD_HASH_PREFIX}$${salt}$${hashed}`;
}

function verifyPassword(password, storedPassword) {
  const normalizedStored = String(storedPassword || "");
  if (!normalizedStored) {
    return false;
  }

  if (!normalizedStored.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return normalizedStored === String(password || "");
  }

  const [, salt, expectedHash] = normalizedStored.split("$");
  const actualHash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return safeEqual(actualHash, expectedHash);
}

function signJwt(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const content = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${content}.${signature}`;
}

function verifyJwt(token) {
  const [header, body, signature] = String(token || "").split(".");

  if (!header || !body || !signature) {
    throw new Error("jwt_invalid");
  }

  const content = `${header}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("jwt_invalid");
  }

  const payload = JSON.parse(base64UrlDecode(body));
  const currentTime = Math.floor(Date.now() / 1000);

  if (payload.exp && Number(payload.exp) <= currentTime) {
    throw new Error("jwt_expired");
  }

  return payload;
}

module.exports = {
  hashPassword,
  randomHex,
  signJwt,
  verifyJwt,
  verifyPassword
};
