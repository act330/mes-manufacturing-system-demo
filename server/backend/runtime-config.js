const DEFAULT_JWT_SECRET = "mes-demo-jwt-secret";

function asBoolean(value, defaultValue = false) {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return defaultValue;
  }

  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function asNumber(value, defaultValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

const ACCESS_TOKEN_TTL_SECONDS = asNumber(process.env.MES_ACCESS_TOKEN_TTL_SECONDS, 60 * 15);
const REFRESH_TOKEN_TTL_SECONDS = asNumber(process.env.MES_REFRESH_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 7);
const SESSION_IDLE_TIMEOUT_SECONDS = asNumber(process.env.MES_SESSION_IDLE_TIMEOUT_SECONDS, 60 * 60 * 8);
const MAX_ACTIVE_SESSIONS = asNumber(process.env.MES_MAX_ACTIVE_SESSIONS, 5);
const AUTH_ACCESS_COOKIE_NAME =
  String(process.env.MES_AUTH_ACCESS_COOKIE_NAME || process.env.MES_AUTH_COOKIE_NAME || "mes_session").trim() ||
  "mes_session";
const AUTH_REFRESH_COOKIE_NAME =
  String(process.env.MES_AUTH_REFRESH_COOKIE_NAME || process.env.MES_REFRESH_COOKIE_NAME || "mes_refresh").trim() ||
  "mes_refresh";
const AUTH_COOKIE_MAX_AGE_SECONDS = ACCESS_TOKEN_TTL_SECONDS;
const REFRESH_COOKIE_MAX_AGE_SECONDS = REFRESH_TOKEN_TTL_SECONDS;
const COOKIE_SECURE = asBoolean(process.env.MES_COOKIE_SECURE, process.env.NODE_ENV === "production");
const REQUEST_LOG_ENABLED = asBoolean(process.env.MES_REQUEST_LOG, true);
const LOGIN_MAX_FAILURES = asNumber(process.env.MES_LOGIN_MAX_FAILURES, 5);
const LOGIN_LOCKOUT_MINUTES = asNumber(process.env.MES_LOGIN_LOCKOUT_MINUTES, 15);
const SSO_ENABLED = asBoolean(process.env.MES_SSO_ENABLED, false);
const SSO_PROVIDER_KEY = String(process.env.MES_SSO_PROVIDER_KEY || "corp_oidc").trim() || "corp_oidc";
const SSO_PROVIDER_LABEL = String(process.env.MES_SSO_PROVIDER_LABEL || "企业 SSO").trim() || "企业 SSO";
const SSO_AUTH_URL = String(process.env.MES_SSO_AUTH_URL || "").trim();
const SSO_CLIENT_ID = String(process.env.MES_SSO_CLIENT_ID || "").trim();
const SSO_SCOPE = String(process.env.MES_SSO_SCOPE || "openid profile email").trim();
const SSO_CALLBACK_URL = String(process.env.MES_SSO_CALLBACK_URL || "").trim();

function validateRuntimeSecurity() {
  const jwtSecret = String(process.env.MES_JWT_SECRET || "").trim();
  const isPlaceholder =
    !jwtSecret ||
    jwtSecret === DEFAULT_JWT_SECRET ||
    jwtSecret.includes("replace-with-a-strong-secret");

  if (process.env.NODE_ENV === "production" && isPlaceholder) {
    throw new Error("MES_JWT_SECRET must be replaced with a strong secret in production.");
  }

  if (isPlaceholder) {
    console.warn("[security] MES_JWT_SECRET is still using a placeholder or demo value.");
  }

  if (COOKIE_SECURE === false && process.env.NODE_ENV === "production") {
    console.warn("[security] MES_COOKIE_SECURE should be true in production.");
  }

  if (REFRESH_TOKEN_TTL_SECONDS <= ACCESS_TOKEN_TTL_SECONDS) {
    console.warn("[security] MES_REFRESH_TOKEN_TTL_SECONDS should be greater than MES_ACCESS_TOKEN_TTL_SECONDS.");
  }
}

module.exports = {
  ACCESS_TOKEN_TTL_SECONDS,
  AUTH_ACCESS_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_REFRESH_COOKIE_NAME,
  COOKIE_SECURE,
  DEFAULT_JWT_SECRET,
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_FAILURES,
  MAX_ACTIVE_SESSIONS,
  REQUEST_LOG_ENABLED,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
  SSO_AUTH_URL,
  SSO_CALLBACK_URL,
  SSO_CLIENT_ID,
  SSO_ENABLED,
  SSO_PROVIDER_KEY,
  SSO_PROVIDER_LABEL,
  SSO_SCOPE,
  validateRuntimeSecurity
};
