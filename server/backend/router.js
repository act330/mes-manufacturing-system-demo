const { store } = require("./store");

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function getTokenFromRequest(request) {
  const header = request.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function getSessionFromRequest(request) {
  const token = getTokenFromRequest(request);
  return store.resolveSession(token);
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

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const body = await readBody(request);
      const result = store.login(body);

      if (!result) {
        sendJson(response, 401, {
          error: "账号、密码或工厂不正确"
        });
        return true;
      }

      sendJson(response, 200, result);
      return true;
    }

    const session = getSessionFromRequest(request);

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      if (!session) {
        sendJson(response, 401, { error: "登录已失效，请重新登录" });
        return true;
      }

      sendJson(response, 200, store.buildAuthPayload(session.user));
      return true;
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      if (session) {
        store.logout(session.token);
      }

      sendJson(response, 200, { success: true });
      return true;
    }

    if (!session) {
      sendJson(response, 401, {
        error: "未登录或登录态已过期"
      });
      return true;
    }

    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      sendJson(response, 200, store.buildAuthPayload(session.user));
      return true;
    }

    if (url.pathname === "/api/dashboard" && request.method === "GET") {
      if (!ensurePermission(session, response, "dashboard:view")) {
        return true;
      }

      sendJson(response, 200, store.getDashboardPayload());
      return true;
    }

    if (url.pathname === "/api/work-orders" && request.method === "GET") {
      if (!ensurePermission(session, response, "work_order:view")) {
        return true;
      }

      sendJson(response, 200, {
        items: store.listWorkOrders({
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
      const item = store.getWorkOrderById(id);
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

      const item = store.searchTrace(url.searchParams.get("q"));
      sendJson(response, 200, { item });
      return true;
    }

    if (url.pathname === "/api/barcodes/rules" && request.method === "GET") {
      if (!ensurePermission(session, response, "barcode:view")) {
        return true;
      }

      sendJson(response, 200, { items: store.listBarcodeRules() });
      return true;
    }

    if (url.pathname === "/api/barcodes/issue" && request.method === "POST") {
      if (!ensurePermission(session, response, "barcode:issue")) {
        return true;
      }

      const body = await readBody(request);
      const result = store.issueBarcode({
        ...body,
        operator: session.userView.name
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

      sendJson(response, 200, { items: store.listApprovals() });
      return true;
    }

    if (url.pathname.match(/^\/api\/approvals\/[^/]+\/decision$/) && request.method === "POST") {
      if (!ensurePermission(session, response, "approval:decision")) {
        return true;
      }

      const body = await readBody(request);
      const id = decodeURIComponent(url.pathname.split("/")[3]);
      const decision = body.decision === "rejected" ? "rejected" : "approved";
      const item = store.decideApproval(id, decision, session.userView);

      if (!item) {
        sendJson(response, 404, { error: "审批单不存在" });
        return true;
      }

      sendJson(response, 200, { item, items: store.listApprovals() });
      return true;
    }

    if (url.pathname === "/api/settings" && request.method === "GET") {
      if (!ensurePermission(session, response, "settings:view")) {
        return true;
      }

      sendJson(response, 200, { items: store.listSettings() });
      return true;
    }

    if (url.pathname.match(/^\/api\/settings\/[^/]+\/toggle$/) && request.method === "PATCH") {
      if (!ensurePermission(session, response, "settings:update")) {
        return true;
      }

      const key = decodeURIComponent(url.pathname.split("/")[3]);
      const item = store.toggleSetting(key, session.userView);
      if (!item) {
        sendJson(response, 404, { error: "设置项不存在" });
        return true;
      }

      sendJson(response, 200, { item, items: store.listSettings() });
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
