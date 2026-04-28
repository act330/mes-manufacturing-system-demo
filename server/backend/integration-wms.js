const fs = require("fs");
const path = require("path");
const { getPool, query } = require("./mysql-auth");

const WMS_SNAPSHOT_SAMPLE_PATH = path.resolve(__dirname, "..", "..", "docs", "examples", "wms-snapshot.json");

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

function mapInventoryStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  const map = {
    safe: "safe",
    warning: "warning",
    critical: "critical",
    安全: "safe",
    预警: "warning",
    紧缺: "critical"
  };

  return map[normalized] || "safe";
}

function mapMovementDirection(direction) {
  const normalized = String(direction || "").trim().toLowerCase();
  const map = {
    inbound: "inbound",
    outbound: "outbound",
    adjust: "adjust",
    in: "inbound",
    out: "outbound",
    入库: "inbound",
    出库: "outbound",
    调整: "adjust"
  };

  return map[normalized] || "inbound";
}

function normalizeInventoryItem(item) {
  return {
    materialCode: String(item?.materialCode || item?.code || "").trim(),
    materialName: String(item?.materialName || item?.material || "").trim(),
    factoryCode: String(item?.factoryCode || "").trim(),
    locationCode: String(item?.locationCode || item?.location || "").trim(),
    onHandQty: toInteger(item?.onHandQty || item?.onHand, 0),
    safetyQty: toInteger(item?.safetyQty || item?.safety, 0),
    turnoverDays: Number(toDecimal(item?.turnoverDays || item?.turnover, 0).toFixed(2)),
    status: mapInventoryStatus(item?.status)
  };
}

function normalizeMovement(item, index = 0) {
  return {
    transactionCode: String(item?.transactionCode || item?.code || `WMS-TXN-${index + 1}`).trim(),
    materialCode: String(item?.materialCode || "").trim(),
    factoryCode: String(item?.factoryCode || "").trim(),
    locationCode: String(item?.locationCode || "").trim(),
    direction: mapMovementDirection(item?.direction),
    qty: toInteger(item?.qty || item?.quantity, 0),
    refType: String(item?.refType || "").trim(),
    refCode: String(item?.refCode || "").trim(),
    sourceDocNo: String(item?.sourceDocNo || "").trim(),
    sourceSystem: String(item?.sourceSystem || "WMS").trim() || "WMS",
    occurredAt: parseDateTime(item?.occurredAt, now())
  };
}

function buildNormalizedSnapshot(rawSnapshot, sourceMode) {
  return {
    metadata: {
      sourceSystem: String(rawSnapshot?.metadata?.sourceSystem || "WMS").trim() || "WMS",
      snapshotAt: parseDateTime(rawSnapshot?.metadata?.snapshotAt, now()),
      sourceMode
    },
    inventoryItems: uniqueBy(normalizeArray(rawSnapshot?.inventoryItems).map(normalizeInventoryItem), (item) => item.materialCode),
    movements: uniqueBy(normalizeArray(rawSnapshot?.movements).map((item, index) => normalizeMovement(item, index)), (item) => item.transactionCode)
  };
}

function validateSnapshot(snapshot) {
  const errors = [];
  const warnings = [];

  snapshot.inventoryItems.forEach((item, index) => {
    if (!item.materialCode || !item.materialName) {
      errors.push(`inventoryItems[${index}] 缺少 materialCode 或 materialName。`);
    }

    if (!item.factoryCode) {
      errors.push(`inventoryItems[${index}] 缺少 factoryCode。`);
    }
  });

  const materialCodeSet = new Set(snapshot.inventoryItems.map((item) => item.materialCode));
  snapshot.movements.forEach((item, index) => {
    if (!item.transactionCode || !item.materialCode) {
      errors.push(`movements[${index}] 缺少 transactionCode 或 materialCode。`);
    }

    if (item.materialCode && !materialCodeSet.has(item.materialCode)) {
      warnings.push(`movements[${index}] 引用了 inventoryItems 中不存在的 materialCode=${item.materialCode}。`);
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
      inventoryItems: snapshot.inventoryItems.length,
      movements: snapshot.movements.length
    },
    snapshot
  };
}

function getWmsConfig() {
  const authMode = String(process.env.MES_WMS_AUTH_MODE || "").trim().toLowerCase();
  const baseUrl = String(process.env.MES_WMS_BASE_URL || "").trim();
  const apiToken = String(process.env.MES_WMS_API_TOKEN || "").trim();
  const apiKey = String(process.env.MES_WMS_API_KEY || "").trim();

  return {
    baseUrl,
    snapshotPath: String(process.env.MES_WMS_SNAPSHOT_PATH || "/wms/snapshot").trim() || "/wms/snapshot",
    deltaPath: String(process.env.MES_WMS_DELTA_PATH || "").trim() || "",
    authMode:
      authMode ||
      (apiToken ? "bearer" : apiKey ? "api-key" : process.env.MES_WMS_USERNAME ? "basic" : "none"),
    apiToken,
    apiKey,
    apiKeyHeader: String(process.env.MES_WMS_API_KEY_HEADER || "x-api-key").trim() || "x-api-key",
    username: String(process.env.MES_WMS_USERNAME || "").trim(),
    password: String(process.env.MES_WMS_PASSWORD || "").trim(),
    timeoutMs: Number(process.env.MES_WMS_TIMEOUT_MS || 10000),
    modeParam: String(process.env.MES_WMS_MODE_PARAM || "mode").trim() || "mode",
    sinceParam: String(process.env.MES_WMS_SINCE_PARAM || "since").trim() || "since",
    fullModeValue: String(process.env.MES_WMS_FULL_MODE_VALUE || "full").trim() || "full",
    incrementalModeValue: String(process.env.MES_WMS_INCREMENTAL_MODE_VALUE || "incremental").trim() || "incremental",
    syncScheduleEnabled: String(process.env.MES_WMS_SYNC_ENABLED || "").trim().toLowerCase() === "true",
    syncIntervalSeconds: Math.max(30, Number(process.env.MES_WMS_SYNC_INTERVAL_SECONDS || 1800)),
    syncDefaultMode: String(process.env.MES_WMS_SYNC_DEFAULT_MODE || "incremental").trim().toLowerCase() || "incremental",
    schedulerActorUserCode: String(process.env.MES_WMS_SYNC_ACTOR_USER_CODE || "").trim()
  };
}

function readSampleSnapshot() {
  return JSON.parse(fs.readFileSync(WMS_SNAPSHOT_SAMPLE_PATH, "utf8"));
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
  const config = getWmsConfig();
  if (!config.baseUrl) {
    throw new Error("wms_not_configured");
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
      throw new Error(`wms_http_${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureIntegrationTables() {
  const pool = await getPool();
  await pool.query(
    `
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
    `
  );
}

async function getLastSuccessfulWmsSync() {
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
      WHERE integration_key = 'wms' AND status = 'success'
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
    const lastSync = await getLastSuccessfulWmsSync();
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

async function previewWmsSync({ source, payload, mode, since } = {}) {
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

async function writeSyncLog({ sourceMode, syncMode, since, status, actorUserCode, snapshotAt, summary, errorMessage }) {
  await ensureIntegrationTables();

  await query(
    `
      INSERT INTO mes_integration_sync_logs
        (integration_key, source_mode, status, actor_user_code, snapshot_at, summary_json, error_message)
      VALUES
        ('wms', ?, ?, ?, ?, CAST(? AS JSON), ?)
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

async function listWmsSyncLogs(limit = 20) {
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
      WHERE integration_key = 'wms'
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

async function upsertInventoryItem(connection, item) {
  const factoryId = await getFactoryId(connection, item.factoryCode);
  if (!factoryId) {
    throw new Error(`factory_not_found:${item.factoryCode}`);
  }

  await connection.execute(
    `
      INSERT INTO mes_inventory_items
        (material_code, material_name, factory_id, location_code, on_hand_qty, safety_qty, turnover_days, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        material_name = VALUES(material_name),
        factory_id = VALUES(factory_id),
        location_code = VALUES(location_code),
        on_hand_qty = VALUES(on_hand_qty),
        safety_qty = VALUES(safety_qty),
        turnover_days = VALUES(turnover_days),
        status = VALUES(status)
    `,
    [
      item.materialCode,
      item.materialName,
      factoryId,
      item.locationCode || null,
      item.onHandQty,
      item.safetyQty,
      item.turnoverDays,
      item.status
    ]
  );

  return {
    factoryId
  };
}

async function insertInventoryMovement(connection, item) {
  const factoryId = await getFactoryId(connection, item.factoryCode);
  if (!factoryId) {
    throw new Error(`factory_not_found:${item.factoryCode}`);
  }

  await connection.execute(
    `
      INSERT INTO mes_inventory_transactions
        (
          transaction_code,
          material_code,
          factory_id,
          location_code,
          direction,
          qty,
          ref_type,
          ref_code,
          source_doc_no,
          source_system,
          occurred_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        material_code = VALUES(material_code),
        factory_id = VALUES(factory_id),
        location_code = VALUES(location_code),
        direction = VALUES(direction),
        qty = VALUES(qty),
        ref_type = VALUES(ref_type),
        ref_code = VALUES(ref_code),
        source_doc_no = VALUES(source_doc_no),
        source_system = VALUES(source_system),
        occurred_at = VALUES(occurred_at)
    `,
    [
      item.transactionCode,
      item.materialCode,
      factoryId,
      item.locationCode || null,
      item.direction,
      item.qty,
      item.refType || null,
      item.refCode || null,
      item.sourceDocNo || null,
      item.sourceSystem || "WMS",
      item.occurredAt
    ]
  );
}

async function importWmsSnapshot({ source, payload, actorUserCode, mode, since }) {
  const preview = await previewWmsSync({ source, payload, mode, since });
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

    for (const item of preview.snapshot.inventoryItems) {
      await upsertInventoryItem(connection, item);
    }

    for (const item of preview.snapshot.movements) {
      await insertInventoryMovement(connection, item);
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
  fetchRemoteSnapshot,
  getLastSuccessfulWmsSync,
  getWmsConfig,
  importWmsSnapshot,
  listWmsSyncLogs,
  previewWmsSync
};
