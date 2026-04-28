const fs = require("fs");
const path = require("path");
const { getPool, query } = require("./mysql-auth");

const ERP_SNAPSHOT_SAMPLE_PATH = path.resolve(__dirname, "..", "..", "docs", "examples", "erp-aps-snapshot.json");
const ERP_SYNC_LOG_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS mes_integration_sync_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    integration_key VARCHAR(64) NOT NULL,
    source_mode VARCHAR(32) NOT NULL,
    status ENUM('success', 'failed') NOT NULL,
    actor_user_code VARCHAR(32) DEFAULT NULL,
    snapshot_at DATETIME DEFAULT NULL,
    summary_json JSON DEFAULT NULL,
    error_message VARCHAR(500) DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mes_integration_sync_logs_key (integration_key),
    KEY idx_mes_integration_sync_logs_status (status)
  ) ENGINE=InnoDB
`;

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function parseDateTime(value, fallback = "") {
  const raw = String(value || "").trim();
  if (!raw) {
    return fallback;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toISOString().slice(0, 19).replace("T", " ");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueBy(items, keyResolver) {
  const map = new Map();

  for (const item of items) {
    const key = String(keyResolver(item) || "").trim();
    if (!key) {
      continue;
    }

    map.set(key, item);
  }

  return Array.from(map.values());
}

function toInteger(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, Math.round(parsed));
}

function toDecimal(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapRouteStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const map = {
    draft: "draft",
    released: "released",
    active: "released",
    archived: "archived"
  };

  return map[normalized] || "released";
}

function mapPriority(priority) {
  const normalized = String(priority || "").trim().toLowerCase();
  const map = {
    low: "low",
    medium: "medium",
    normal: "medium",
    high: "high",
    urgent: "urgent",
    紧急: "urgent",
    高: "high",
    中: "medium",
    低: "low"
  };

  return map[normalized] || "medium";
}

function mapWorkOrderStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const map = {
    planned: "planned",
    released: "released",
    running: "running",
    finishing: "finishing",
    completed: "completed",
    abnormal: "abnormal",
    closed: "closed",
    待排产: "planned",
    已下发: "released",
    进行中: "running",
    收尾中: "finishing",
    已完成: "completed",
    异常中: "abnormal",
    已关闭: "closed"
  };

  return map[normalized] || "released";
}

function normalizeCustomer(item) {
  return {
    code: String(item?.code || item?.customerCode || "").trim(),
    name: String(item?.name || item?.customerName || "").trim(),
    level: String(item?.level || item?.customerLevel || "C").trim().toUpperCase(),
    region: String(item?.region || item?.regionName || "").trim(),
    owner: String(item?.owner || item?.ownerName || "").trim()
  };
}

function normalizeProduct(item) {
  return {
    code: String(item?.code || item?.productCode || "").trim(),
    name: String(item?.name || item?.productName || "").trim(),
    version: String(item?.version || item?.productVersion || "").trim(),
    uom: String(item?.uom || "PCS").trim() || "PCS"
  };
}

function normalizeRouteStep(item, index) {
  return {
    code: String(item?.code || item?.stepCode || `STEP-${index + 1}`).trim(),
    name: String(item?.name || item?.stepName || `工步${index + 1}`).trim(),
    stationCode: String(item?.stationCode || "").trim(),
    sequenceNo: toInteger(item?.sequenceNo, index + 1),
    isQualityGate: Boolean(item?.isQualityGate)
  };
}

function normalizeRoute(item) {
  const steps = uniqueBy(
    normalizeArray(item?.steps).map((step, index) => normalizeRouteStep(step, index)),
    (step) => step.code
  ).sort((left, right) => left.sequenceNo - right.sequenceNo);

  return {
    code: String(item?.code || item?.routeCode || "").trim(),
    productCode: String(item?.productCode || "").trim(),
    version: String(item?.version || item?.routeVersion || "").trim(),
    cycleSeconds: toInteger(item?.cycleSeconds || item?.standardCycleSeconds, 0),
    status: mapRouteStatus(item?.status),
    steps
  };
}

function normalizeWorkOrder(item) {
  return {
    code: String(item?.code || item?.workOrderCode || "").trim(),
    factoryCode: String(item?.factoryCode || "").trim(),
    customerCode: String(item?.customerCode || "").trim(),
    productCode: String(item?.productCode || "").trim(),
    routeCode: String(item?.routeCode || "").trim(),
    lineCode: String(item?.lineCode || "").trim(),
    lineName: String(item?.lineName || item?.line || item?.lineCode || "").trim(),
    plannedQty: toInteger(item?.plannedQty || item?.planned, 0),
    producedQty: toInteger(item?.producedQty || item?.produced, 0),
    passRate: Number(toDecimal(item?.passRate, 0).toFixed(2)),
    priority: mapPriority(item?.priority),
    status: mapWorkOrderStatus(item?.status),
    managerName: String(item?.managerName || item?.manager || "").trim(),
    scheduledStartAt: parseDateTime(item?.scheduledStartAt || item?.startAt || item?.scheduledStart),
    scheduledEndAt: parseDateTime(item?.scheduledEndAt || item?.endAt || item?.scheduledEnd)
  };
}

function buildNormalizedSnapshot(rawSnapshot, sourceMode) {
  return {
    metadata: {
      sourceSystem: String(rawSnapshot?.metadata?.sourceSystem || "ERP-APS").trim() || "ERP-APS",
      snapshotAt: parseDateTime(rawSnapshot?.metadata?.snapshotAt, now()),
      sourceMode
    },
    customers: uniqueBy(normalizeArray(rawSnapshot?.customers).map(normalizeCustomer), (item) => item.code),
    products: uniqueBy(normalizeArray(rawSnapshot?.products).map(normalizeProduct), (item) => item.code),
    routes: uniqueBy(normalizeArray(rawSnapshot?.routes).map(normalizeRoute), (item) => item.code),
    workOrders: uniqueBy(normalizeArray(rawSnapshot?.workOrders).map(normalizeWorkOrder), (item) => item.code)
  };
}

function validateSnapshot(snapshot) {
  const errors = [];
  const warnings = [];

  if (!snapshot.customers.length) {
    warnings.push("客户清单为空。");
  }

  if (!snapshot.products.length) {
    warnings.push("产品清单为空。");
  }

  snapshot.customers.forEach((item, index) => {
    if (!item.code || !item.name) {
      errors.push(`customers[${index}] 缺少 code 或 name。`);
    }
  });

  snapshot.products.forEach((item, index) => {
    if (!item.code || !item.name) {
      errors.push(`products[${index}] 缺少 code 或 name。`);
    }
  });

  const productCodeSet = new Set(snapshot.products.map((item) => item.code));
  snapshot.routes.forEach((item, index) => {
    if (!item.code || !item.productCode) {
      errors.push(`routes[${index}] 缺少 code 或 productCode。`);
    }
    if (item.productCode && !productCodeSet.has(item.productCode)) {
      errors.push(`routes[${index}] 引用了不存在的 productCode=${item.productCode}。`);
    }
    if (!item.steps.length) {
      warnings.push(`routes[${index}] 没有配置 steps。`);
    }
  });

  const routeCodeSet = new Set(snapshot.routes.map((item) => item.code));
  const customerCodeSet = new Set(snapshot.customers.map((item) => item.code));
  snapshot.workOrders.forEach((item, index) => {
    if (!item.code || !item.factoryCode || !item.productCode) {
      errors.push(`workOrders[${index}] 缺少 code / factoryCode / productCode。`);
    }
    if (item.customerCode && !customerCodeSet.has(item.customerCode)) {
      errors.push(`workOrders[${index}] 引用了不存在的 customerCode=${item.customerCode}。`);
    }
    if (item.routeCode && !routeCodeSet.has(item.routeCode)) {
      errors.push(`workOrders[${index}] 引用了不存在的 routeCode=${item.routeCode}。`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}

function buildPreviewResult(snapshot, validation) {
  return {
    metadata: snapshot.metadata,
    validation,
    summary: {
      customers: snapshot.customers.length,
      products: snapshot.products.length,
      routes: snapshot.routes.length,
      routeSteps: snapshot.routes.reduce((sum, item) => sum + item.steps.length, 0),
      workOrders: snapshot.workOrders.length
    },
    snapshot
  };
}

function getErpConfig() {
  const authMode = String(process.env.MES_ERP_AUTH_MODE || "").trim().toLowerCase();
  const baseUrl = String(process.env.MES_ERP_BASE_URL || "").trim();
  const apiToken = String(process.env.MES_ERP_API_TOKEN || "").trim();
  const apiKey = String(process.env.MES_ERP_API_KEY || "").trim();

  return {
    baseUrl,
    snapshotPath: String(process.env.MES_ERP_SNAPSHOT_PATH || "/mes/snapshot").trim() || "/mes/snapshot",
    deltaPath: String(process.env.MES_ERP_DELTA_PATH || "").trim() || "",
    authMode:
      authMode ||
      (apiToken ? "bearer" : apiKey ? "api-key" : process.env.MES_ERP_USERNAME ? "basic" : "none"),
    apiToken,
    apiKey,
    apiKeyHeader: String(process.env.MES_ERP_API_KEY_HEADER || "x-api-key").trim() || "x-api-key",
    username: String(process.env.MES_ERP_USERNAME || "").trim(),
    password: String(process.env.MES_ERP_PASSWORD || "").trim(),
    timeoutMs: Number(process.env.MES_ERP_TIMEOUT_MS || 10000)
    ,
    modeParam: String(process.env.MES_ERP_MODE_PARAM || "mode").trim() || "mode",
    sinceParam: String(process.env.MES_ERP_SINCE_PARAM || "since").trim() || "since",
    fullModeValue: String(process.env.MES_ERP_FULL_MODE_VALUE || "full").trim() || "full",
    incrementalModeValue: String(process.env.MES_ERP_INCREMENTAL_MODE_VALUE || "incremental").trim() || "incremental",
    syncScheduleEnabled: String(process.env.MES_ERP_SYNC_ENABLED || "").trim().toLowerCase() === "true",
    syncIntervalSeconds: Math.max(30, Number(process.env.MES_ERP_SYNC_INTERVAL_SECONDS || 1800)),
    syncDefaultMode: String(process.env.MES_ERP_SYNC_DEFAULT_MODE || "incremental").trim().toLowerCase() || "incremental",
    schedulerActorUserCode: String(process.env.MES_ERP_SYNC_ACTOR_USER_CODE || "").trim()
  };
}

function readSampleSnapshot() {
  return JSON.parse(fs.readFileSync(ERP_SNAPSHOT_SAMPLE_PATH, "utf8"));
}

function buildRemoteHeaders(config) {
  const headers = {
    Accept: "application/json"
  };

  if (config.authMode === "bearer" && config.apiToken) {
    headers.Authorization = `Bearer ${config.apiToken}`;
  }

  if (config.authMode === "api-key" && config.apiKey) {
    headers[config.apiKeyHeader] = config.apiKey;
  }

  if (config.authMode === "basic" && config.username) {
    const basicToken = Buffer.from(`${config.username}:${config.password}`).toString("base64");
    headers.Authorization = `Basic ${basicToken}`;
  }

  return headers;
}

async function fetchRemoteSnapshot({ mode = "full", since = "" } = {}) {
  const config = getErpConfig();
  if (!config.baseUrl) {
    throw new Error("erp_not_configured");
  }

  const isIncremental = String(mode || "").trim().toLowerCase() === "incremental";
  const pathName = isIncremental && config.deltaPath ? config.deltaPath : config.snapshotPath;
  const url = new URL(pathName, config.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = buildRemoteHeaders(config);

  url.searchParams.set(config.modeParam, isIncremental ? config.incrementalModeValue : config.fullModeValue);
  if (since) {
    url.searchParams.set(config.sinceParam, since);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`erp_http_${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getLastSuccessfulErpSync() {
  await ensureIntegrationTables();

  const rows = await query(
    `
      SELECT
        id,
        source_mode AS sourceMode,
        DATE_FORMAT(snapshot_at, '%Y-%m-%d %H:%i:%s') AS snapshotAt,
        summary_json AS summaryJson,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM mes_integration_sync_logs
      WHERE integration_key = 'erp' AND status = 'success'
      ORDER BY id DESC
      LIMIT 1
    `
  );

  const item = rows[0];
  if (!item) {
    return null;
  }

  return {
    id: Number(item.id),
    sourceMode: item.sourceMode,
    snapshotAt: item.snapshotAt || "",
    summary: item.summaryJson && typeof item.summaryJson === "object" ? item.summaryJson : JSON.parse(item.summaryJson || "{}"),
    createdAt: item.createdAt || ""
  };
}

async function resolveSnapshotInput({ source = "remote", payload, mode = "full", since = "" } = {}) {
  const normalizedMode = String(mode || "full").trim().toLowerCase();

  if (payload && typeof payload === "object") {
    return {
      sourceMode: "payload",
      syncMode: normalizedMode,
      since,
      rawSnapshot: payload
    };
  }

  if (String(source || "").trim().toLowerCase() === "sample") {
    return {
      sourceMode: "sample",
      syncMode: normalizedMode,
      since,
      rawSnapshot: readSampleSnapshot()
    };
  }

  let resolvedSince = since;
  if (!resolvedSince && normalizedMode === "incremental") {
    const lastSync = await getLastSuccessfulErpSync();
    resolvedSince = lastSync?.snapshotAt || "";
  }

  return {
    sourceMode: "remote",
    syncMode: normalizedMode,
    since: resolvedSince,
    rawSnapshot: await fetchRemoteSnapshot({
      mode: normalizedMode,
      since: resolvedSince
    })
  };
}

async function previewErpSync({ source, payload, mode, since } = {}) {
  const resolved = await resolveSnapshotInput({ source, payload, mode, since });
  const snapshot = buildNormalizedSnapshot(resolved.rawSnapshot, resolved.sourceMode);
  const validation = validateSnapshot(snapshot);
  const preview = buildPreviewResult(snapshot, validation);
  preview.syncContext = {
    sourceMode: resolved.sourceMode,
    syncMode: resolved.syncMode,
    since: resolved.since || ""
  };
  return preview;
}

async function ensureIntegrationTables() {
  const pool = await getPool();
  await pool.query(ERP_SYNC_LOG_TABLE_SQL);
}

async function writeSyncLog({ sourceMode, syncMode, since, status, actorUserCode, snapshotAt, summary, errorMessage }) {
  await ensureIntegrationTables();

  await query(
    `
      INSERT INTO mes_integration_sync_logs
        (integration_key, source_mode, status, actor_user_code, snapshot_at, summary_json, error_message)
      VALUES
        ('erp', ?, ?, ?, ?, CAST(? AS JSON), ?)
    `,
    [
      sourceMode,
      status,
      actorUserCode || null,
      snapshotAt || null,
      JSON.stringify({
        ...(summary || {}),
        syncMode: syncMode || "full",
        since: since || ""
      }),
      errorMessage || null
    ]
  );
}

async function listErpSyncLogs(limit = 20) {
  await ensureIntegrationTables();
  const safeLimit = Math.max(1, Math.min(Number(limit || 20), 100));

  const rows = await query(
    `
      SELECT
        id,
        integration_key AS integrationKey,
        source_mode AS sourceMode,
        status,
        actor_user_code AS actorUserCode,
        DATE_FORMAT(snapshot_at, '%Y-%m-%d %H:%i:%s') AS snapshotAt,
        summary_json AS summaryJson,
        error_message AS errorMessage,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
      FROM mes_integration_sync_logs
      WHERE integration_key = 'erp'
      ORDER BY id DESC
      LIMIT ${safeLimit}
    `
  );

  return rows.map((item) => ({
    id: Number(item.id),
    integrationKey: item.integrationKey,
    sourceMode: item.sourceMode,
    status: item.status,
    actorUserCode: item.actorUserCode || "",
    snapshotAt: item.snapshotAt || "",
    summary: item.summaryJson && typeof item.summaryJson === "object" ? item.summaryJson : JSON.parse(item.summaryJson || "{}"),
    errorMessage: item.errorMessage || "",
    createdAt: item.createdAt || ""
  }));
}

async function getFactoryId(connection, factoryCode) {
  const [rows] = await connection.execute(
    "SELECT id FROM mes_factories WHERE factory_code = ? LIMIT 1",
    [factoryCode]
  );

  return Number(rows[0]?.id || 0);
}

async function ensureLine(connection, factoryId, lineCode, lineName) {
  if (!lineCode) {
    return 0;
  }

  const [existing] = await connection.execute(
    "SELECT id FROM mes_lines WHERE line_code = ? LIMIT 1",
    [lineCode]
  );

  if (existing[0]?.id) {
    await connection.execute(
      `
        UPDATE mes_lines
        SET line_name = ?, factory_id = ?
        WHERE id = ?
      `,
      [lineName || lineCode, factoryId, existing[0].id]
    );
    return Number(existing[0].id);
  }

  const [inserted] = await connection.execute(
    `
      INSERT INTO mes_lines (line_code, line_name, factory_id, line_type, status)
      VALUES (?, ?, ?, 'ERP_SYNC', 'online')
    `,
    [lineCode, lineName || lineCode, factoryId]
  );

  return Number(inserted.insertId || 0);
}

async function upsertCustomer(connection, item) {
  await connection.execute(
    `
      INSERT INTO mes_customers (customer_code, customer_name, customer_level, region_name, owner_name)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        customer_name = VALUES(customer_name),
        customer_level = VALUES(customer_level),
        region_name = VALUES(region_name),
        owner_name = VALUES(owner_name)
    `,
    [item.code, item.name, item.level, item.region, item.owner]
  );

  const [rows] = await connection.execute(
    "SELECT id FROM mes_customers WHERE customer_code = ? LIMIT 1",
    [item.code]
  );

  return Number(rows[0]?.id || 0);
}

async function upsertProduct(connection, item) {
  await connection.execute(
    `
      INSERT INTO mes_products (product_code, product_name, product_version, uom)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        product_name = VALUES(product_name),
        product_version = VALUES(product_version),
        uom = VALUES(uom)
    `,
    [item.code, item.name, item.version, item.uom]
  );

  const [rows] = await connection.execute(
    "SELECT id FROM mes_products WHERE product_code = ? LIMIT 1",
    [item.code]
  );

  return Number(rows[0]?.id || 0);
}

async function upsertRoute(connection, item, productId) {
  await connection.execute(
    `
      INSERT INTO mes_process_routes (route_code, product_id, route_version, standard_cycle_seconds, status)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        product_id = VALUES(product_id),
        route_version = VALUES(route_version),
        standard_cycle_seconds = VALUES(standard_cycle_seconds),
        status = VALUES(status)
    `,
    [item.code, productId, item.version, item.cycleSeconds || null, item.status]
  );

  const [rows] = await connection.execute(
    "SELECT id FROM mes_process_routes WHERE route_code = ? LIMIT 1",
    [item.code]
  );

  const routeId = Number(rows[0]?.id || 0);
  await connection.execute("DELETE FROM mes_process_route_steps WHERE route_id = ?", [routeId]);

  for (const step of item.steps) {
    let stationId = null;

    if (step.stationCode) {
      const [stationRows] = await connection.execute(
        "SELECT id FROM mes_stations WHERE station_code = ? LIMIT 1",
        [step.stationCode]
      );
      stationId = stationRows[0]?.id || null;
    }

    await connection.execute(
      `
        INSERT INTO mes_process_route_steps
          (route_id, step_code, step_name, station_id, sequence_no, is_quality_gate)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [routeId, step.code, step.name, stationId, step.sequenceNo, step.isQualityGate ? 1 : 0]
    );
  }

  return routeId;
}

async function upsertWorkOrder(connection, item, ids) {
  await connection.execute(
    `
      INSERT INTO mes_work_orders
        (
          work_order_code,
          factory_id,
          customer_id,
          product_id,
          route_id,
          line_id,
          planned_qty,
          produced_qty,
          pass_rate,
          priority_level,
          status,
          manager_name,
          scheduled_start_at,
          scheduled_end_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        factory_id = VALUES(factory_id),
        customer_id = VALUES(customer_id),
        product_id = VALUES(product_id),
        route_id = VALUES(route_id),
        line_id = VALUES(line_id),
        planned_qty = VALUES(planned_qty),
        produced_qty = VALUES(produced_qty),
        pass_rate = VALUES(pass_rate),
        priority_level = VALUES(priority_level),
        status = VALUES(status),
        manager_name = VALUES(manager_name),
        scheduled_start_at = VALUES(scheduled_start_at),
        scheduled_end_at = VALUES(scheduled_end_at)
    `,
    [
      item.code,
      ids.factoryId,
      ids.customerId || null,
      ids.productId,
      ids.routeId || null,
      ids.lineId || null,
      item.plannedQty,
      item.producedQty,
      item.passRate,
      item.priority,
      item.status,
      item.managerName || null,
      item.scheduledStartAt || null,
      item.scheduledEndAt || null
    ]
  );
}

async function importErpSnapshot({ source, payload, actorUserCode, mode, since }) {
  const preview = await previewErpSync({ source, payload, mode, since });
  if (!preview.validation.ok) {
    await writeSyncLog({
      sourceMode: preview.metadata.sourceMode,
      syncMode: preview.syncContext.syncMode,
      since: preview.syncContext.since,
      status: "failed",
      actorUserCode,
      snapshotAt: preview.metadata.snapshotAt,
      summary: preview.summary,
      errorMessage: preview.validation.errors.join(" | ")
    });

    return {
      ok: false,
      preview
    };
  }

  const pool = await getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const customerIdMap = new Map();
    const productIdMap = new Map();
    const routeIdMap = new Map();

    for (const item of preview.snapshot.customers) {
      customerIdMap.set(item.code, await upsertCustomer(connection, item));
    }

    for (const item of preview.snapshot.products) {
      productIdMap.set(item.code, await upsertProduct(connection, item));
    }

    for (const item of preview.snapshot.routes) {
      routeIdMap.set(item.code, await upsertRoute(connection, item, productIdMap.get(item.productCode)));
    }

    for (const item of preview.snapshot.workOrders) {
      const factoryId = await getFactoryId(connection, item.factoryCode);
      if (!factoryId) {
        throw new Error(`factory_not_found:${item.factoryCode}`);
      }

      const lineId = item.lineCode
        ? await ensureLine(connection, factoryId, item.lineCode, item.lineName)
        : 0;

      await upsertWorkOrder(connection, item, {
        factoryId,
        customerId: item.customerCode ? customerIdMap.get(item.customerCode) : 0,
        productId: productIdMap.get(item.productCode),
        routeId: item.routeCode ? routeIdMap.get(item.routeCode) : 0,
        lineId
      });
    }

    await connection.commit();

    await writeSyncLog({
      sourceMode: preview.metadata.sourceMode,
      syncMode: preview.syncContext.syncMode,
      since: preview.syncContext.since,
      status: "success",
      actorUserCode,
      snapshotAt: preview.metadata.snapshotAt,
      summary: preview.summary,
      errorMessage: ""
    });

    return {
      ok: true,
      preview
    };
  } catch (error) {
    await connection.rollback();

    await writeSyncLog({
      sourceMode: preview.metadata.sourceMode,
      syncMode: preview.syncContext.syncMode,
      since: preview.syncContext.since,
      status: "failed",
      actorUserCode,
      snapshotAt: preview.metadata.snapshotAt,
      summary: preview.summary,
      errorMessage: error.message
    });

    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  getLastSuccessfulErpSync,
  fetchRemoteSnapshot,
  getErpConfig,
  importErpSnapshot,
  listErpSyncLogs,
  previewErpSync
};
