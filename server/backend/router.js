const { store } = require("./store");
const { sendJson, sendRouteError } = require("./http-utils");
const { getSessionFromRequest } = require("./request-context");
const {
  handleProtectedAuthRoute,
  handlePublicAuthRoute,
  handleSessionAuthRoute
} = require("./routes/auth-routes");
const { handleBusinessRoute } = require("./routes/business-routes");
const { handleIntegrationRoute } = require("./routes/integration-routes");

async function handleHealthRoute({ request, response, url }) {
  if (url.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, {
      status: "ok",
      service: "mes-api",
      time: new Date().toISOString()
    });
    return true;
  }

  if (url.pathname === "/api/health/ready" && request.method === "GET") {
    const status = await store.checkReadiness();
    sendJson(response, status.ok ? 200 : 503, status);
    return true;
  }

  return false;
}

async function handleApiRequest(request, response) {
  const url = new URL(request.url || "/", "http://localhost");

  if (!url.pathname.startsWith("/api/")) {
    return false;
  }

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return true;
  }

  try {
    const baseContext = { request, response, url };

    if (await handleHealthRoute(baseContext)) {
      return true;
    }

    if (await handlePublicAuthRoute(baseContext)) {
      return true;
    }

    const session = await getSessionFromRequest(request);
    const authContext = { ...baseContext, session };

    if (await handleSessionAuthRoute(authContext)) {
      return true;
    }

    if (!session) {
      sendJson(response, 401, {
        error: "未登录或登录态已过期"
      });
      return true;
    }

    if (await handleProtectedAuthRoute(authContext)) {
      return true;
    }

    if (await handleBusinessRoute(authContext)) {
      return true;
    }

    if (await handleIntegrationRoute(authContext)) {
      return true;
    }

    sendJson(response, 404, {
      error: "接口不存在"
    });
    return true;
  } catch (error) {
    return sendRouteError(response, error);
  }
}

module.exports = {
  handleApiRequest
};
