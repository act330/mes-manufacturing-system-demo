const { store } = require("./store");
const { getIntegrationStatus } = require("./integration-status");
const { importErpSnapshot, listErpSyncLogs, previewErpSync } = require("./integration-erp");
const { buildPrintJobPreview, getPrinterRuntime, listPrinterJobs, submitPrintJob } = require("./integration-printer");
const { importWmsSnapshot, listWmsSyncLogs, previewWmsSync } = require("./integration-wms");
const { getSsoProviders, buildSsoStartPayload } = require("./sso-config");
const {
  buildAccessCookieHeader,
  buildClearAuthCookieHeaders,
  buildRefreshCookieHeader,
  readAuthTokenFromCookies,
  readRefreshTokenFromCookies
} = require("./http-security");

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

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

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 1024 * 1024) {
        reject(new Error("payload_too_large"));
      }
    });

    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("invalid_json"));
      }
    });

    request.on("error", reject);
  });
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

    const session = await getSessionFromRequest(request);

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

    if (!session) {
      sendJson(response, 401, {
        error: "未登录或登录态已过期"
      });
      return true;
    }

    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      sendJson(response, 200, await store.buildAuthPayload(session.user));
      return true;
    }

    if (url.pathname === "/api/auth/logout-all" && request.method === "POST") {
      await store.logoutAll(session.user);
      sendJson(response, 200, { success: true }, {
        "Set-Cookie": buildClearAuthCookieHeaders()
      });
      return true;
    }

    if (url.pathname === "/api/dashboard" && request.method === "GET") {
      if (!ensurePermission(session, response, "dashboard:view")) {
        return true;
      }

      sendJson(response, 200, await store.getDashboardPayload(session.user));
      return true;
    }

    if (url.pathname === "/api/work-orders" && request.method === "GET") {
      if (!ensurePermission(session, response, "work_order:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: await store.listWorkOrders(session.user, {
          status: url.searchParams.get("status")
        })
      });
      return true;
    }

    if (url.pathname.startsWith("/api/work-orders/") && request.method === "GET") {
      if (!ensurePermission(session, response, "work_order:view")) {
        return true;
      }

      const id = decodeURIComponent(url.pathname.split("/").pop());
      const item = await store.getWorkOrderById(session.user, id);
      if (!item) {
        sendJson(response, 404, { error: "工单不存在" });
        return true;
      }

      sendJson(response, 200, { item });
      return true;
    }

    if (url.pathname === "/api/traceability/search" && request.method === "GET") {
      if (!ensurePermission(session, response, "trace:view")) {
        return true;
      }

      const item = await store.searchTrace(session.user, url.searchParams.get("q"));
      sendJson(response, 200, { item });
      return true;
    }

    if (url.pathname === "/api/barcodes/rules" && request.method === "GET") {
      if (!ensurePermission(session, response, "barcode:view")) {
        return true;
      }

      sendJson(response, 200, { items: await store.listBarcodeRules(session.user) });
      return true;
    }

    if (url.pathname === "/api/barcodes/issue" && request.method === "POST") {
      if (!ensurePermission(session, response, "barcode:issue")) {
        return true;
      }

      const body = await readBody(request);
      const result = await store.issueBarcode({
        ...body,
        operator: session.userView.name,
        actor: session.user
      });

      if (result.error) {
        sendJson(response, 400, { error: result.error });
        return true;
      }

      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname === "/api/approvals" && request.method === "GET") {
      if (!ensurePermission(session, response, "approval:view")) {
        return true;
      }

      sendJson(response, 200, { items: await store.listApprovals(session.user) });
      return true;
    }

    if (url.pathname.match(/^\/api\/approvals\/[^/]+\/decision$/) && request.method === "POST") {
      if (!ensurePermission(session, response, "approval:decision")) {
        return true;
      }

      const body = await readBody(request);
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      const decision = body.decision === "rejected" ? "rejected" : "approved";
      const item = await store.decideApproval(id, decision, session.user);

      if (!item) {
        sendJson(response, 404, { error: "审批单不存在" });
        return true;
      }

      sendJson(response, 200, { item, items: await store.listApprovals(session.user) });
      return true;
    }

    if (url.pathname === "/api/settings" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, { items: await store.listSettings(session.user) });
      return true;
    }

    if (url.pathname === "/api/integrations/status" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: await getIntegrationStatus()
      });
      return true;
    }

    if (url.pathname === "/api/integrations/erp/runtime" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      const { getErpConfig, getLastSuccessfulErpSync } = require("./integration-erp");
      const { getErpSchedulerStatus } = require("./erp-sync-scheduler");

      sendJson(response, 200, {
        config: getErpConfig(),
        lastSuccessfulSync: await getLastSuccessfulErpSync(),
        scheduler: await getErpSchedulerStatus()
      });
      return true;
    }

    if (url.pathname === "/api/integrations/printer/runtime" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, await getPrinterRuntime());
      return true;
    }

    if (url.pathname === "/api/integrations/wms/runtime" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      const { getWmsConfig, getLastSuccessfulWmsSync } = require("./integration-wms");
      const { getWmsSchedulerStatus } = require("./wms-sync-scheduler");

      sendJson(response, 200, {
        config: getWmsConfig(),
        lastSuccessfulSync: await getLastSuccessfulWmsSync(),
        scheduler: await getWmsSchedulerStatus()
      });
      return true;
    }

    if (url.pathname === "/api/integrations/erp/logs" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: await listErpSyncLogs(Number(url.searchParams.get("limit") || 20))
      });
      return true;
    }

    if (url.pathname === "/api/integrations/wms/logs" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: await listWmsSyncLogs(Number(url.searchParams.get("limit") || 20))
      });
      return true;
    }

    if (url.pathname === "/api/integrations/printer/jobs" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: await listPrinterJobs(Number(url.searchParams.get("limit") || 20))
      });
      return true;
    }

    if (url.pathname === "/api/integrations/erp/preview" && request.method === "POST") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      const body = await readBody(request);
      const preview = await previewErpSync({
        source: body.source,
        mode: body.mode,
        since: body.since,
        payload: body.payload
      });

      sendJson(response, 200, preview);
      return true;
    }

    if (url.pathname === "/api/integrations/wms/preview" && request.method === "POST") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      const body = await readBody(request);
      const preview = await previewWmsSync({
        source: body.source,
        mode: body.mode,
        since: body.since,
        payload: body.payload
      });

      sendJson(response, 200, preview);
      return true;
    }

    if (url.pathname === "/api/integrations/printer/preview" && request.method === "POST") {
      if (!ensurePermission(session, response, "barcode:view")) {
        return true;
      }

      const body = await readBody(request);
      const preview = await buildPrintJobPreview({
        source: body.source,
        payload: body.payload,
        ruleCode: body.ruleCode,
        workOrderId: body.workOrderId,
        values: body.values,
        quantity: body.quantity,
        printerCode: body.printerCode,
        printerName: body.printerName,
        copies: body.copies
      });

      sendJson(response, 200, preview);
      return true;
    }

    if (url.pathname === "/api/integrations/erp/sync" && request.method === "POST") {
      if (!ensurePermission(session, response, "settings:update")) {
        return true;
      }

      const body = await readBody(request);
      const result = await importErpSnapshot({
        source: body.source,
        mode: body.mode,
        since: body.since,
        payload: body.payload,
        actorUserCode: session.user.id
      });

      if (!result.ok) {
        sendJson(response, 400, {
          error: "ERP / APS snapshot 校验失败。",
          preview: result.preview
        });
        return true;
      }

      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname === "/api/integrations/wms/sync" && request.method === "POST") {
      if (!ensurePermission(session, response, "settings:update")) {
        return true;
      }

      const body = await readBody(request);
      const result = await importWmsSnapshot({
        source: body.source,
        mode: body.mode,
        since: body.since,
        payload: body.payload,
        actorUserCode: session.user.id
      });

      if (!result.ok) {
        sendJson(response, 400, {
          error: "WMS snapshot 校验失败。",
          preview: result.preview
        });
        return true;
      }

      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname === "/api/integrations/printer/submit" && request.method === "POST") {
      if (!ensurePermission(session, response, "barcode:issue")) {
        return true;
      }

      const body = await readBody(request);
      const result = await submitPrintJob({
        source: body.source,
        mode: body.mode,
        payload: body.payload,
        ruleCode: body.ruleCode,
        workOrderId: body.workOrderId,
        values: body.values,
        quantity: body.quantity,
        printerCode: body.printerCode,
        printerName: body.printerName,
        copies: body.copies,
        actorUserCode: session.user.id
      });

      if (!result.ok) {
        sendJson(response, 400, {
          error: "打印任务校验失败。",
          preview: result.preview
        });
        return true;
      }

      sendJson(response, 200, result);
      return true;
    }

    if (url.pathname.match(/^\/api\/settings\/[^/]+\/toggle$/) && request.method === "PATCH") {
      if (!ensurePermission(session, response, "settings:update")) {
        return true;
      }

      const key = decodeURIComponent(url.pathname.split("/")[3]);
      const item = await store.toggleSetting(key, session.user);
      if (!item) {
        sendJson(response, 404, { error: "设置项不存在" });
        return true;
      }

      sendJson(response, 200, { item, items: await store.listSettings(session.user) });
      return true;
    }

    sendJson(response, 404, {
      error: "接口不存在"
    });
    return true;
  } catch (error) {
    if (error.message === "invalid_json") {
      sendJson(response, 400, { error: "请求体不是合法的 JSON" });
      return true;
    }

    if (error.message === "payload_too_large") {
      sendJson(response, 413, { error: "请求体过大" });
      return true;
    }

    sendJson(response, 500, {
      error: "服务器内部错误",
      detail: error.message
    });
    return true;
  }
}

module.exports = {
  handleApiRequest
};
