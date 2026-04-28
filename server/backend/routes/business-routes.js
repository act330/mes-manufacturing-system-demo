const { store } = require("../store");
const { readBody, sendJson } = require("../http-utils");
const { ensurePermission } = require("../request-context");

async function handleBusinessRoute({ request, response, url, session }) {
  if (url.pathname === "/api/bootstrap" && request.method === "GET") {
    sendJson(response, 200, await store.buildAuthPayload(session.user));
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

  return false;
}

module.exports = {
  handleBusinessRoute
};
