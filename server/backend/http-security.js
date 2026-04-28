const crypto = require("crypto");
const {
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_REFRESH_COOKIE_NAME,
  COOKIE_SECURE
  ,
  REFRESH_COOKIE_MAX_AGE_SECONDS
} = require("./runtime-config");

function generateRequestId() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return crypto.randomBytes(16).toString("hex");
}

function applyResponseSecurityHeaders(response, requestId) {
  response.setHeader("X-Request-Id", requestId);
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function parseCookieHeader(cookieHeader) {
  const cookieText = String(cookieHeader || "").trim();
  if (!cookieText) {
    return {};
  }

  return cookieText.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValueParts] = part.split("=");
    const key = String(rawKey || "").trim();
    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(rawValueParts.join("=").trim());
    return cookies;
  }, {});
}

function readAuthTokenFromCookies(request) {
  const cookies = parseCookieHeader(request?.headers?.cookie || "");
  return String(cookies[AUTH_ACCESS_COOKIE_NAME] || "").trim();
}

function readRefreshTokenFromCookies(request) {
  const cookies = parseCookieHeader(request?.headers?.cookie || "");
  return String(cookies[AUTH_REFRESH_COOKIE_NAME] || "").trim();
}

function buildAccessCookieHeader(token) {
  const parts = [
    `${AUTH_ACCESS_COOKIE_NAME}=${encodeURIComponent(String(token || ""))}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${AUTH_COOKIE_MAX_AGE_SECONDS}`
  ];

  if (COOKIE_SECURE) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function buildRefreshCookieHeader(token) {
  const parts = [
    `${AUTH_REFRESH_COOKIE_NAME}=${encodeURIComponent(String(token || ""))}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${REFRESH_COOKIE_MAX_AGE_SECONDS}`
  ];

  if (COOKIE_SECURE) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function buildClearAccessCookieHeader() {
  const parts = [
    `${AUTH_ACCESS_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];

  if (COOKIE_SECURE) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function buildClearRefreshCookieHeader() {
  const parts = [
    `${AUTH_REFRESH_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT"
  ];

  if (COOKIE_SECURE) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

function buildClearAuthCookieHeaders() {
  return [buildClearAccessCookieHeader(), buildClearRefreshCookieHeader()];
}

module.exports = {
  applyResponseSecurityHeaders,
  buildAccessCookieHeader,
  buildClearAccessCookieHeader,
  buildClearAuthCookieHeaders,
  buildClearRefreshCookieHeader,
  buildRefreshCookieHeader,
  generateRequestId,
  parseCookieHeader,
  readAuthTokenFromCookies,
  readRefreshTokenFromCookies
};
