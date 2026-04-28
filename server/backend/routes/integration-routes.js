const { sendJson, readBody } = require("../http-utils");
const { ensurePermission } = require("../request-context");
const { getIntegrationStatus } = require("../integration-status");
const {
  getErpConfig,
  getLastSuccessfulErpSync,
  importErpSnapshot,
  listErpSyncLogs,
  previewErpSync
} = require("../integration-erp");
const {
  buildPrintJobPreview,
  getPrinterRuntime,
  listPrinterJobs,
  submitPrintJob
} = require("../integration-printer");
const {
  getLastSuccessfulWmsSync,
  getWmsConfig,
  importWmsSnapshot,
  listWmsSyncLogs,
  previewWmsSync
} = require("../integration-wms");
const { getErpSchedulerStatus } = require("../erp-sync-scheduler");
const { getWmsSchedulerStatus } = require("../wms-sync-scheduler");

async function handleIntegrationRoute({ request, response, url, session }) {
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

  return false;
}

module.exports = {
  handleIntegrationRoute
};
