const fs = require("fs");
const path = require("path");
const { getPool, isMySqlBackplaneEnabled, query } = require("./mysql-auth");

const PRINTER_SAMPLE_PATH = path.resolve(__dirname, "..", "..", "docs", "examples", "printer-print-request.json");

const memoryPrintJobs = [];

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
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

function toInteger(value, fallback = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(1, Math.round(parsed));
}

function getPrinterConfig() {
  const authMode = String(process.env.MES_PRINTER_SERVICE_AUTH_MODE || "").trim().toLowerCase();
  const baseUrl = String(process.env.MES_PRINTER_SERVICE_URL || "").trim();
  const apiToken = String(process.env.MES_PRINTER_SERVICE_API_TOKEN || "").trim();
  const apiKey = String(process.env.MES_PRINTER_SERVICE_API_KEY || "").trim();

  return {
    baseUrl,
    submitPath: String(process.env.MES_PRINTER_SERVICE_SUBMIT_PATH || "/print/jobs").trim() || "/print/jobs",
    statusPath: String(process.env.MES_PRINTER_SERVICE_STATUS_PATH || "/health").trim() || "/health",
    authMode:
      authMode ||
      (apiToken ? "bearer" : apiKey ? "api-key" : process.env.MES_PRINTER_SERVICE_USERNAME ? "basic" : "none"),
    apiToken,
    apiKey,
    apiKeyHeader:
      String(process.env.MES_PRINTER_SERVICE_API_KEY_HEADER || "x-api-key").trim() || "x-api-key",
    username: String(process.env.MES_PRINTER_SERVICE_USERNAME || "").trim(),
    password: String(process.env.MES_PRINTER_SERVICE_PASSWORD || "").trim(),
    timeoutMs: Number(process.env.MES_PRINTER_SERVICE_TIMEOUT_MS || 10000),
    defaultCopies: Math.max(1, Number(process.env.MES_PRINTER_SERVICE_DEFAULT_COPIES || 1))
  };
}

function buildRemoteHeaders(config) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
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

function readSampleRequest() {
  return JSON.parse(fs.readFileSync(PRINTER_SAMPLE_PATH, "utf8"));
}

async function ensurePrinterTables() {
  if (!isMySqlBackplaneEnabled()) {
    return;
  }

  const pool = await getPool();
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS mes_printers (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        printer_code VARCHAR(64) NOT NULL,
        printer_name VARCHAR(128) NOT NULL,
        factory_id BIGINT UNSIGNED DEFAULT NULL,
        ip_address VARCHAR(128) DEFAULT NULL,
        driver_name VARCHAR(128) DEFAULT NULL,
        status ENUM('online', 'offline', 'warning') NOT NULL DEFAULT 'online',
        last_seen_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_mes_printers_code (printer_code)
      ) ENGINE=InnoDB
    `
  );
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS mes_print_jobs (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        job_code VARCHAR(64) NOT NULL,
        rule_id BIGINT UNSIGNED DEFAULT NULL,
        printer_id BIGINT UNSIGNED DEFAULT NULL,
        source_mode VARCHAR(32) NOT NULL DEFAULT 'payload',
        status ENUM('queued', 'submitted', 'printed', 'failed', 'cancelled') NOT NULL DEFAULT 'queued',
        copies INT NOT NULL DEFAULT 1,
        request_payload_json JSON DEFAULT NULL,
        response_payload_json JSON DEFAULT NULL,
        error_message VARCHAR(500) DEFAULT NULL,
        operator_id BIGINT UNSIGNED DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME DEFAULT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_mes_print_jobs_code (job_code)
      ) ENGINE=InnoDB
    `
  );
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS mes_print_job_items (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        job_id BIGINT UNSIGNED NOT NULL,
        barcode_serial_id BIGINT UNSIGNED DEFAULT NULL,
        barcode_value VARCHAR(128) NOT NULL,
        copies INT NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        KEY idx_mes_print_job_items_job_id (job_id)
      ) ENGINE=InnoDB
    `
  );
}

async function listPrinters() {
  if (!isMySqlBackplaneEnabled()) {
    return [
      {
        printerCode: "PRN-001",
        printerName: "ZT410-A",
        status: "online",
        ipAddress: "127.0.0.1:9100"
      }
    ];
  }

  await ensurePrinterTables();
  const rows = await query(
    `
      SELECT
        printer_code AS printerCode,
        printer_name AS printerName,
        ip_address AS ipAddress,
        driver_name AS driverName,
        status,
        DATE_FORMAT(last_seen_at, '%Y-%m-%d %H:%i:%s') AS lastSeenAt
      FROM mes_printers
      ORDER BY id ASC
    `
  );

  return rows.map((item) => ({
    printerCode: item.printerCode,
    printerName: item.printerName,
    ipAddress: item.ipAddress || "",
    driverName: item.driverName || "",
    status: item.status,
    lastSeenAt: item.lastSeenAt || ""
  }));
}

async function getPrinterRule(ruleCode) {
  const rows = await query(
    `
      SELECT
        id,
        rule_code AS ruleCode,
        rule_name AS ruleName,
        template_pattern AS templatePattern,
        printer_name AS printerName
      FROM mes_barcode_rules
      WHERE rule_code = ?
      LIMIT 1
    `,
    [ruleCode]
  );

  return rows[0] || null;
}

async function getPrinterByCode(printerCode) {
  const rows = await query(
    `
      SELECT
        id,
        printer_code AS printerCode,
        printer_name AS printerName
      FROM mes_printers
      WHERE printer_code = ?
      LIMIT 1
    `,
    [printerCode]
  );

  return rows[0] || null;
}

async function getBarcodeSerials({
  values,
  workOrderId,
  ruleCode,
  quantity = 1
}) {
  if (!isMySqlBackplaneEnabled()) {
    return normalizeArray(values).map((value, index) => ({
      barcodeSerialId: 0,
      barcodeValue: String(value || "").trim(),
      workOrderId: workOrderId || "",
      ruleCode: ruleCode || "",
      printerName: "ZT410-A",
      templatePattern: "SN-YYMMDD-LINE-XXXX"
    }));
  }

  if (Array.isArray(values) && values.length) {
    const placeholders = values.map(() => "?").join(", ");
    const rows = await query(
      `
        SELECT
          bs.id AS barcodeSerialId,
          bs.barcode_value AS barcodeValue,
          wo.work_order_code AS workOrderId,
          br.rule_code AS ruleCode,
          br.printer_name AS printerName,
          br.template_pattern AS templatePattern
        FROM mes_barcode_serials bs
        INNER JOIN mes_barcode_rules br ON br.id = bs.rule_id
        LEFT JOIN mes_work_orders wo ON wo.id = bs.work_order_id
        WHERE bs.barcode_value IN (${placeholders})
        ORDER BY bs.id ASC
      `,
      values
    );
    return rows;
  }

  if (!workOrderId || !ruleCode) {
    return [];
  }

  return query(
    `
      SELECT
        bs.id AS barcodeSerialId,
        bs.barcode_value AS barcodeValue,
        wo.work_order_code AS workOrderId,
        br.rule_code AS ruleCode,
        br.printer_name AS printerName,
        br.template_pattern AS templatePattern
      FROM mes_barcode_serials bs
      INNER JOIN mes_barcode_rules br ON br.id = bs.rule_id
      INNER JOIN mes_work_orders wo ON wo.id = bs.work_order_id
      WHERE
        wo.work_order_code = ?
        AND br.rule_code = ?
      ORDER BY bs.id ASC
      LIMIT ${Math.max(1, Number(quantity || 1))}
    `,
    [workOrderId, ruleCode]
  );
}

function normalizeJobPayload(payload) {
  return {
    printerCode: String(payload?.printerCode || "").trim(),
    printerName: String(payload?.printerName || "").trim(),
    ruleCode: String(payload?.ruleCode || "").trim(),
    copies: toInteger(payload?.copies, 1),
    items: uniqueBy(
      normalizeArray(payload?.items).map((item, index) => ({
        barcodeValue: String(item?.barcodeValue || item?.value || "").trim(),
        barcodeSerialId: Number(item?.barcodeSerialId || 0),
        workOrderId: String(item?.workOrderId || "").trim(),
        copies: toInteger(item?.copies, payload?.copies || 1),
        templatePattern: String(item?.templatePattern || "").trim()
      })),
      (item, index) => item.barcodeValue || `item-${index}`
    ).filter((item) => item.barcodeValue)
  };
}

async function buildPrintJobPreview({
  source = "payload",
  payload,
  ruleCode,
  workOrderId,
  values,
  quantity,
  printerCode,
  printerName,
  copies
} = {}) {
  let normalized = null;

  if (payload && typeof payload === "object") {
    normalized = normalizeJobPayload(payload);
  } else if (String(source || "").trim().toLowerCase() === "sample") {
    normalized = normalizeJobPayload(readSampleRequest().payload);
  } else {
    const serials = await getBarcodeSerials({
      values,
      workOrderId,
      ruleCode,
      quantity
    });

    normalized = normalizeJobPayload({
      printerCode,
      printerName,
      ruleCode,
      copies,
      items: serials.map((item) => ({
        barcodeValue: item.barcodeValue,
        barcodeSerialId: item.barcodeSerialId,
        workOrderId: item.workOrderId,
        copies: copies || 1,
        templatePattern: item.templatePattern
      }))
    });
  }

  if (!normalized.ruleCode && ruleCode) {
    normalized.ruleCode = ruleCode;
  }

  const rule = normalized.ruleCode ? await getPrinterRule(normalized.ruleCode) : null;

  if (!normalized.printerName && rule?.printerName) {
    normalized.printerName = rule.printerName;
  }

  if (!normalized.printerCode && normalized.printerName) {
    const printers = await listPrinters();
    const printer = printers.find((item) => item.printerName === normalized.printerName);
    if (printer?.printerCode) {
      normalized.printerCode = printer.printerCode;
    }
  }

  const errors = [];

  if (!normalized.printerCode && !normalized.printerName) {
    errors.push("缺少 printerCode 或 printerName。");
  }

  if (!normalized.items.length) {
    errors.push("没有可打印的条码数据。");
  }

  return {
    validation: {
      ok: errors.length === 0,
      errors,
      warnings: []
    },
    summary: {
      ruleCode: normalized.ruleCode || "",
      printerCode: normalized.printerCode || "",
      printerName: normalized.printerName || "",
      itemCount: normalized.items.length,
      copies: normalized.copies
    },
    payload: normalized,
    rule
  };
}

async function dispatchPrintJob({ mode = "sample", payload }) {
  const normalizedMode = String(mode || "sample").trim().toLowerCase();

  if (normalizedMode === "sample") {
    return {
      ok: true,
      response: {
        remoteJobId: `SAMPLE-${Date.now()}`,
        acceptedAt: now(),
        printer: payload.printerName || payload.printerCode
      }
    };
  }

  const config = getPrinterConfig();
  if (!config.baseUrl) {
    throw new Error("printer_service_not_configured");
  }

  const url = new URL(config.submitPath, config.baseUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  const headers = buildRemoteHeaders(config);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      throw new Error(`printer_http_${response.status}`);
    }

    return {
      ok: true,
      response: body
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function persistPrintJob({
  mode,
  actorUserCode,
  preview,
  dispatchResult
}) {
  const jobCode = `PRINT-${Date.now()}`;
  const completedAt = now();
  const status = dispatchResult.ok ? "printed" : "failed";

  if (!isMySqlBackplaneEnabled()) {
    const job = {
      id: memoryPrintJobs.length + 1,
      jobCode,
      sourceMode: mode,
      status,
      copies: preview.payload.copies,
      printerCode: preview.payload.printerCode,
      printerName: preview.payload.printerName,
      ruleCode: preview.payload.ruleCode,
      itemCount: preview.payload.items.length,
      createdAt: completedAt,
      completedAt,
      responsePayload: dispatchResult.response || {},
      errorMessage: dispatchResult.ok ? "" : dispatchResult.error || ""
    };
    memoryPrintJobs.unshift(job);
    return job;
  }

  await ensurePrinterTables();

  const printer = preview.payload.printerCode
    ? await getPrinterByCode(preview.payload.printerCode)
    : null;
  const operatorRows = await query(
    "SELECT id FROM mes_users WHERE user_code = ? LIMIT 1",
    [String(actorUserCode || "")]
  );
  const operatorId = operatorRows[0]?.id || null;

  const result = await query(
    `
      INSERT INTO mes_print_jobs
        (
          job_code,
          rule_id,
          printer_id,
          source_mode,
          status,
          copies,
          request_payload_json,
          response_payload_json,
          error_message,
          operator_id,
          completed_at
        )
      VALUES (?, ?, ?, ?, ?, ?, CAST(? AS JSON), CAST(? AS JSON), ?, ?, ?)
    `,
    [
      jobCode,
      preview.rule?.id || null,
      printer?.id || null,
      mode,
      status,
      preview.payload.copies,
      JSON.stringify(preview.payload),
      JSON.stringify(dispatchResult.response || {}),
      dispatchResult.ok ? null : dispatchResult.error || "",
      operatorId,
      completedAt
    ]
  );

  const jobId = Number(result.insertId || 0);

  for (const item of preview.payload.items) {
    await query(
      `
        INSERT INTO mes_print_job_items (job_id, barcode_serial_id, barcode_value, copies)
        VALUES (?, ?, ?, ?)
      `,
      [jobId, item.barcodeSerialId || null, item.barcodeValue, item.copies]
    );

    if (dispatchResult.ok && item.barcodeSerialId) {
      await query(
        `
          UPDATE mes_barcode_serials
          SET status = 'printed'
          WHERE id = ?
        `,
        [item.barcodeSerialId]
      );
    }
  }

  const [rows] = await query(
    `
      SELECT
        pj.id,
        pj.job_code AS jobCode,
        pj.source_mode AS sourceMode,
        pj.status,
        pj.copies,
        br.rule_code AS ruleCode,
        p.printer_code AS printerCode,
        p.printer_name AS printerName,
        DATE_FORMAT(pj.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(pj.completed_at, '%Y-%m-%d %H:%i:%s') AS completedAt,
        pj.error_message AS errorMessage
      FROM mes_print_jobs pj
      LEFT JOIN mes_barcode_rules br ON br.id = pj.rule_id
      LEFT JOIN mes_printers p ON p.id = pj.printer_id
      WHERE pj.id = ?
      LIMIT 1
    `,
    [jobId]
  );

  return {
    ...(rows[0] || {}),
    responsePayload: dispatchResult.response || {}
  };
}

async function submitPrintJob({
  source,
  mode,
  payload,
  ruleCode,
  workOrderId,
  values,
  quantity,
  printerCode,
  printerName,
  copies,
  actorUserCode
}) {
  const preview = await buildPrintJobPreview({
    source,
    payload,
    ruleCode,
    workOrderId,
    values,
    quantity,
    printerCode,
    printerName,
    copies
  });

  if (!preview.validation.ok) {
    return {
      ok: false,
      preview
    };
  }

  const dispatchResult = await dispatchPrintJob({
    mode: mode || "sample",
    payload: preview.payload
  });

  return {
    ok: true,
    preview,
    job: await persistPrintJob({
      mode: mode || "sample",
      actorUserCode,
      preview,
      dispatchResult
    })
  };
}

async function listPrinterJobs(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit || 20), 100));

  if (!isMySqlBackplaneEnabled()) {
    return memoryPrintJobs.slice(0, safeLimit);
  }

  await ensurePrinterTables();
  const rows = await query(
    `
      SELECT
        pj.id,
        pj.job_code AS jobCode,
        pj.source_mode AS sourceMode,
        pj.status,
        pj.copies,
        br.rule_code AS ruleCode,
        p.printer_code AS printerCode,
        p.printer_name AS printerName,
        DATE_FORMAT(pj.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(pj.completed_at, '%Y-%m-%d %H:%i:%s') AS completedAt,
        pj.error_message AS errorMessage,
        COUNT(pji.id) AS itemCount
      FROM mes_print_jobs pj
      LEFT JOIN mes_barcode_rules br ON br.id = pj.rule_id
      LEFT JOIN mes_printers p ON p.id = pj.printer_id
      LEFT JOIN mes_print_job_items pji ON pji.job_id = pj.id
      GROUP BY pj.id, pj.job_code, pj.source_mode, pj.status, pj.copies, br.rule_code, p.printer_code, p.printer_name, pj.created_at, pj.completed_at, pj.error_message
      ORDER BY pj.id DESC
      LIMIT ${safeLimit}
    `
  );

  return rows.map((item) => ({
    id: Number(item.id),
    jobCode: item.jobCode,
    sourceMode: item.sourceMode,
    status: item.status,
    copies: Number(item.copies || 1),
    ruleCode: item.ruleCode || "",
    printerCode: item.printerCode || "",
    printerName: item.printerName || "",
    itemCount: Number(item.itemCount || 0),
    createdAt: item.createdAt || "",
    completedAt: item.completedAt || "",
    errorMessage: item.errorMessage || ""
  }));
}

async function getPrinterRuntime() {
  const config = getPrinterConfig();
  const jobs = await listPrinterJobs(10);
  const printers = await listPrinters();

  return {
    config,
    printers,
    latestJobs: jobs
  };
}

module.exports = {
  buildPrintJobPreview,
  getPrinterConfig,
  getPrinterRuntime,
  listPrinterJobs,
  submitPrintJob
};
