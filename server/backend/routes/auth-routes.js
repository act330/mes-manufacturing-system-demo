const { store } = require("../store");
const { readBody, sendJson } = require("../http-utils");
const {
  getRequestContext,
  getTokenFromRequest
} = require("../request-context");
const {
  buildAccessCookieHeader,
  buildClearAuthCookieHeaders,
  buildRefreshCookieHeader,
  readRefreshTokenFromCookies
} = require("../http-security");
const { getSsoProviders, buildSsoStartPayload } = require("../sso-config");

async function handlePublicAuthRoute({ request, response, url }) {
  if (url.pathname === "/api/auth/login" && request.method === "POST") {
    const body = await readBody(request);
    const result = await store.login(body, getRequestContext(request));

    if (result?.error) {
      sendJson(response, result.code === "auth_locked" ? 429 : 401, {
        error: result.error,
        code: result.code || "auth_failed"
      });
      return true;
    }

    if (!result) {
      sendJson(response, 401, {
        error: "账号、密码或工厂不正确"
      });
      return true;
    }

    const { accessToken, refreshToken, ...payload } = result;
    sendJson(response, 200, payload, {
      "Set-Cookie": [buildAccessCookieHeader(accessToken), buildRefreshCookieHeader(refreshToken)]
    });
    return true;
  }

  if (url.pathname === "/api/auth/refresh" && request.method === "POST") {
    const result = await store.refreshSession(readRefreshTokenFromCookies(request), getRequestContext(request));

    if (!result) {
      sendJson(response, 401, {
        error: "刷新登录态失败，请重新登录。",
        code: "refresh_failed"
      }, {
        "Set-Cookie": buildClearAuthCookieHeaders()
      });
      return true;
    }

    const { accessToken, refreshToken, ...payload } = result;
    sendJson(response, 200, payload, {
      "Set-Cookie": [buildAccessCookieHeader(accessToken), buildRefreshCookieHeader(refreshToken)]
    });
    return true;
  }

  if (url.pathname === "/api/auth/sso/providers" && request.method === "GET") {
    sendJson(response, 200, {
      items: getSsoProviders()
    });
    return true;
  }

  if (url.pathname === "/api/auth/sso/start" && request.method === "GET") {
    const payload = buildSsoStartPayload({
      provider: url.searchParams.get("provider"),
      redirect: url.searchParams.get("redirect")
    });
    sendJson(response, payload.statusCode, payload.body);
    return true;
  }

  if (url.pathname === "/api/auth/sso/callback" && request.method === "GET") {
    sendJson(response, 501, {
      error: "SSO 回调接口已预留，等待接入企业统一身份认证。",
      code: "sso_not_implemented"
    });
    return true;
  }

  return false;
}

async function handleSessionAuthRoute({ request, response, url, session }) {
  if (url.pathname === "/api/auth/me" && request.method === "GET") {
    if (!session) {
      sendJson(response, 401, { error: "登录已失效，请重新登录" });
      return true;
    }

    sendJson(response, 200, await store.buildAuthPayload(session.user));
    return true;
  }

  if (url.pathname === "/api/auth/logout" && request.method === "POST") {
    await store.logout({
      accessToken: getTokenFromRequest(request),
      refreshToken: readRefreshTokenFromCookies(request)
    });

    sendJson(response, 200, { success: true }, {
      "Set-Cookie": buildClearAuthCookieHeaders()
    });
    return true;
  }

  return false;
}

async function handleProtectedAuthRoute({ request, response, url, session }) {
  if (url.pathname === "/api/auth/logout-all" && request.method === "POST") {
    await store.logoutAll(session.user);
    sendJson(response, 200, { success: true }, {
      "Set-Cookie": buildClearAuthCookieHeaders()
    });
    return true;
  }

  return false;
}

module.exports = {
  handleProtectedAuthRoute,
  handlePublicAuthRoute,
  handleSessionAuthRoute
};
