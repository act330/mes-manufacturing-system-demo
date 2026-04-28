const {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS
} = require("./runtime-config");
const { randomHex, signJwt } = require("./auth-crypto");

function now() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function toDateTimeString(date) {
  return new Date(date).toISOString().slice(0, 19).replace("T", " ");
}

function parseDateTimeValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return 0;
  }

  const parsed = Date.parse(raw.replace(" ", "T"));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isSessionExpired(session) {
  const nowMs = Date.now();
  const refreshExpiresAt = parseDateTimeValue(session?.refreshExpiresAt);
  const lastSeenAt = parseDateTimeValue(session?.lastSeenAt);

  if (!refreshExpiresAt || refreshExpiresAt <= nowMs) {
    return true;
  }

  if (lastSeenAt && lastSeenAt + SESSION_IDLE_TIMEOUT_SECONDS * 1000 <= nowMs) {
    return true;
  }

  return false;
}

function buildSessionRecord({
  sessionId,
  userId,
  refreshJti,
  userAgent,
  ipAddress,
  accessExpiresAt,
  refreshExpiresAt,
  rotationCount = 0
}) {
  const createdAt = now();

  return {
    sessionId,
    userId,
    refreshJti,
    status: "active",
    userAgent: String(userAgent || "").slice(0, 255),
    ipAddress: String(ipAddress || "").slice(0, 64),
    createdAt,
    lastSeenAt: createdAt,
    accessExpiresAt,
    refreshExpiresAt,
    rotationCount,
    revokedAt: ""
  };
}

function issueAccessToken(user, sessionId) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;

  return signJwt({
    sub: user.id,
    tokenType: "access",
    sid: sessionId,
    username: user.username,
    roleCode: user.roleCode,
    factoryCode: user.factoryCode,
    iat: issuedAt,
    exp: expiresAt
  });
}

function issueRefreshToken(user, sessionId, refreshJti) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + REFRESH_TOKEN_TTL_SECONDS;

  return signJwt({
    sub: user.id,
    tokenType: "refresh",
    sid: sessionId,
    username: user.username,
    roleCode: user.roleCode,
    factoryCode: user.factoryCode,
    iat: issuedAt,
    exp: expiresAt,
    jti: refreshJti
  });
}

function buildSessionPayload(sessionId, accessExpiresAt, refreshExpiresAt, rotationCount = 0) {
  return {
    sessionId,
    accessExpiresAt,
    refreshExpiresAt,
    idleTimeoutSeconds: SESSION_IDLE_TIMEOUT_SECONDS,
    rotationCount
  };
}

function createAuthSessionTokens(user, requestContext = {}) {
  const sessionId = randomHex(16);
  const refreshJti = randomHex(16);
  const accessExpiresAt = toDateTimeString(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const refreshExpiresAt = toDateTimeString(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const sessionRecord = buildSessionRecord({
    sessionId,
    userId: user.id,
    refreshJti,
    userAgent: requestContext.userAgent,
    ipAddress: requestContext.ipAddress,
    accessExpiresAt,
    refreshExpiresAt
  });

  return {
    accessToken: issueAccessToken(user, sessionId),
    refreshToken: issueRefreshToken(user, sessionId, refreshJti),
    sessionRecord,
    session: buildSessionPayload(sessionId, accessExpiresAt, refreshExpiresAt, sessionRecord.rotationCount)
  };
}

module.exports = {
  buildSessionPayload,
  buildSessionRecord,
  createAuthSessionTokens,
  isSessionExpired,
  issueAccessToken,
  issueRefreshToken,
  now,
  parseDateTimeValue,
  toDateTimeString
};
