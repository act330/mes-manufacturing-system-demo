const { store } = require("./store");
const { readAuthTokenFromCookies } = require("./http-security");
const { sendJson } = require("./http-utils");

function getTokenFromRequest(request) {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return readAuthTokenFromCookies(request);
  }

  return header.slice(7).trim();
}

function getSessionFromRequest(request) {
  const token = getTokenFromRequest(request);
  return store.resolveSession(token);
}

function getRequestContext(request) {
  return {
    ipAddress:
      String(request.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      request.socket?.remoteAddress ||
      "",
    userAgent: String(request.headers["user-agent"] || "")
  };
}

function hasPermission(session, permissionCode) {
  return session && session.userView.permissions.includes(permissionCode);
}

function ensurePermission(session, response, permissionCode) {
  if (!hasPermission(session, permissionCode)) {
    sendJson(response, 403, {
      error: "当前账号没有访问该资源的权限",
      permission: permissionCode
    });
    return false;
  }

  return true;
}

module.exports = {
  ensurePermission,
  getRequestContext,
  getSessionFromRequest,
  getTokenFromRequest,
  hasPermission
};
