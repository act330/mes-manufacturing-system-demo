const { query } = require("./mysql-auth");
const { seedData } = require("./mes-seed");

const WORK_ORDER_STATUS_LABELS = {
  planned: "待排产",
  released: "已下发",
  running: "进行中",
  finishing: "收尾中",
  completed: "已完成",
  abnormal: "异常中",
  closed: "已关闭"
};

const WORK_ORDER_PRIORITY_LABELS = {
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急"
};

const APPROVAL_STATUS_LABELS = {
  pending: "待审批",
  approved: "已通过",
  rejected: "已驳回",
  cancelled: "已取消"
};

const EQUIPMENT_STATUS_LABELS = {
  running: "运行中",
  warning: "告警中",
  maintenance: "待保养",
  offline: "离线",
  changeover: "换料中"
};

const INVENTORY_STATUS_LABELS = {
  safe: "安全",
  warning: "预警",
  critical: "紧缺"
};

const EXCEPTION_STATUS_LABELS = {
  new: "待指派",
  assigned: "待指派",
  processing: "处理中",
  closed: "已闭环"
};

function isSuperAdmin(user) {
  return user?.roleCode === "super_admin";
}

function getFactoryScopeParams(user) {
  return [isSuperAdmin(user) ? 1 : 0, String(user?.factoryCode || "")];
}

function mapWorkOrderStatus(statusCode) {
  return WORK_ORDER_STATUS_LABELS[String(statusCode || "").trim()] || "未知";
}

function mapPriorityLevel(priorityCode) {
  return WORK_ORDER_PRIORITY_LABELS[String(priorityCode || "").trim()] || "中";
}

function mapApprovalStatus(statusCode) {
  return APPROVAL_STATUS_LABELS[String(statusCode || "").trim()] || "未知";
}

function mapEquipmentStatus(statusCode) {
  return EQUIPMENT_STATUS_LABELS[String(statusCode || "").trim()] || "未知";
}

function mapInventoryStatus(statusCode) {
  return INVENTORY_STATUS_LABELS[String(statusCode || "").trim()] || "安全";
}

function mapExceptionStatus(statusCode) {
  return EXCEPTION_STATUS_LABELS[String(statusCode || "").trim()] || "待指派";
}

function normalizeSettingValue(rawValue) {
  if (rawValue && typeof rawValue === "object") {
    return rawValue;
  }

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    return {};
  }
}

function buildInClause(values) {
  return values.map(() => "?").join(", ");
}

function createSeedIndex(items, keyName) {
  return new Map((items || []).map((item) => [String(item?.[keyName] || ""), item]));
}

function formatCycle(seconds) {
  const value = Number(seconds || 0);
  if (!value) {
    return "";
  }

  if (value >= 60 && value % 60 === 0) {
    return `${value / 60} 分钟`;
  }

  if (value >= 60) {
    return `${(value / 60).toFixed(1)} 分钟`;
  }

  return `${value} 秒`;
}

function formatDayCount(value) {
  const number = Number(value || 0);
  if (!number) {
    return "0 天";
  }

  return `${Number.isInteger(number) ? number : number.toFixed(1)} 天`;
}

function formatMonthLabel(date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}月`;
}

function formatWeekdayLabel(date) {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function listMySqlProductionReportRows(user) {
  return query(
    `
      SELECT
        DATE_FORMAT(log.created_at, '%Y-%m-%d') AS reportDate,
        DATE_FORMAT(log.created_at, '%Y-%m-01') AS reportMonth,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(log.payload_json, '$.outputQty')) AS UNSIGNED) AS outputQty,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(log.payload_json, '$.passQty')) AS UNSIGNED) AS passQty
      FROM mes_work_order_logs log
      INNER JOIN mes_work_orders wo ON wo.id = log.work_order_id
      INNER JOIN mes_factories f ON f.id = wo.factory_id
      WHERE
        log.event_type = 'production_report'
        AND (? = 1 OR f.factory_code = ?)
      ORDER BY log.created_at ASC, log.id ASC
    `,
    getFactoryScopeParams(user)
  );
}

async function listMySqlFactories(user) {
  const rows = await query(
    `
      SELECT
        factory_code AS code,
        factory_code AS id,
        factory_name AS name,
        shift_pattern AS shift,
        line_count AS lineCount,
        station_count AS stationCount,
        capacity_per_day AS capacityText,
        oee,
        efficiency,
        online_rate AS onlineRate
      FROM mes_factories
      WHERE (? = 1 OR factory_code = ?)
      ORDER BY id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item) => ({
    id: item.id,
    code: item.code,
    name: item.name,
    shift: item.shift,
    lines: Number(item.lineCount || 0),
    stations: Number(item.stationCount || 0),
    capacity: item.capacityText,
    oee: Number(item.oee || 0),
    efficiency: Number(item.efficiency || 0),
    onlineRate: Number(item.onlineRate || 0)
  }));
}

async function listMySqlWeeklyOutput(user) {
  const rows = await listMySqlProductionReportRows(user);
  if (!rows.length) {
    return [];
  }

  const dayMap = new Map();
  let maxDate = null;

  rows.forEach((item) => {
    const reportDate = new Date(`${item.reportDate}T00:00:00`);
    if (Number.isNaN(reportDate.getTime())) {
      return;
    }

    if (!maxDate || reportDate > maxDate) {
      maxDate = reportDate;
    }

    const key = item.reportDate;
    dayMap.set(key, Number(dayMap.get(key) || 0) + Number(item.outputQty || 0));
  });

  if (!maxDate) {
    return [];
  }

  const result = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const currentDate = new Date(maxDate);
    currentDate.setDate(maxDate.getDate() - offset);
    const key = formatDateKey(currentDate);
    const outputQty = Number(dayMap.get(key) || 0);

    result.push({
      day: formatWeekdayLabel(currentDate),
      value: Number((outputQty / 10000).toFixed(1))
    });
  }

  return result;
}

async function listMySqlEquipment(user) {
  const rows = await query(
    `
      SELECT
        eq.equipment_code AS code,
        eq.equipment_name AS name,
        f.factory_code AS factoryCode,
        COALESCE(st.station_name, l.line_name, f.factory_name, '') AS area,
        eq.oee,
        eq.runtime_hours AS runtimeHours,
        eq.alarm_count AS alarmCount,
        eq.status AS statusCode,
        eq.maintainer_name AS maintainer
      FROM mes_equipment eq
      LEFT JOIN mes_factories f ON f.id = eq.factory_id
      LEFT JOIN mes_lines l ON l.id = eq.line_id
      LEFT JOIN mes_stations st ON st.id = eq.station_id
      WHERE (? = 1 OR f.factory_code = ?)
      ORDER BY eq.id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item, index) => ({
    id: `EQ-${String(index + 1).padStart(4, "0")}`,
    name: item.name || "",
    code: item.code || "",
    area: item.area || "",
    oee: Number(Number(item.oee || 0).toFixed(1)),
    runtime: `${Number(Number(item.runtimeHours || 0).toFixed(1))} h`,
    alarm: Number(item.alarmCount || 0),
    status: mapEquipmentStatus(item.statusCode),
    maintainer: item.maintainer || "",
    factoryCode: item.factoryCode || ""
  }));
}

async function listMySqlCustomers(user) {
  const seedCustomerMap = createSeedIndex(seedData.customers, "code");
  const rows = await query(
    `
      SELECT
        c.customer_code AS code,
        c.customer_name AS name,
        c.customer_level AS level,
        c.region_name AS region,
        c.owner_name AS owner,
        COUNT(
          CASE
            WHEN wo.status IN ('planned', 'released', 'running', 'finishing', 'abnormal')
            THEN 1
            ELSE NULL
          END
        ) AS activeOrders
      FROM mes_customers c
      LEFT JOIN mes_work_orders wo ON wo.customer_id = c.id
      LEFT JOIN mes_factories f ON f.id = wo.factory_id
      WHERE (? = 1 OR f.factory_code = ? OR wo.id IS NULL)
      GROUP BY c.id, c.customer_code, c.customer_name, c.customer_level, c.region_name, c.owner_name
      ORDER BY c.id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item, index) => {
    const seedItem = seedCustomerMap.get(String(item.code || ""));

    return {
      id: seedItem?.id || `CUS-${String(index + 1).padStart(3, "0")}`,
      code: item.code || "",
      name: item.name || "",
      level: item.level || seedItem?.level || "C",
      region: item.region || seedItem?.region || "",
      owner: item.owner || seedItem?.owner || "",
      activeOrders: Number(item.activeOrders || 0),
      satisfaction: Number(seedItem?.satisfaction || 90)
    };
  });
}

async function listMySqlInventory(user) {
  const rows = await query(
    `
      SELECT
        ii.material_code AS code,
        ii.material_name AS material,
        f.factory_code AS factoryCode,
        ii.on_hand_qty AS onHandQty,
        ii.safety_qty AS safetyQty,
        ii.location_code AS locationCode,
        ii.turnover_days AS turnoverDays,
        ii.status AS statusCode
      FROM mes_inventory_items ii
      LEFT JOIN mes_factories f ON f.id = ii.factory_id
      WHERE (? = 1 OR f.factory_code = ?)
      ORDER BY ii.id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item, index) => ({
    id: `MAT-${String(index + 1).padStart(3, "0")}`,
    material: item.material || "",
    code: item.code || "",
    onHand: Number(item.onHandQty || 0),
    safety: Number(item.safetyQty || 0),
    location: item.locationCode || "",
    turnover: formatDayCount(item.turnoverDays),
    status: mapInventoryStatus(item.statusCode),
    factoryCode: item.factoryCode || ""
  }));
}

async function listMySqlWorkOrders(user) {
  const rows = await query(
    `
      SELECT
        wo.work_order_code AS id,
        p.product_name AS product,
        p.product_code AS productCode,
        l.line_name AS line,
        l.line_code AS lineCode,
        pr.route_code AS routeCode,
        f.factory_code AS factoryCode,
        wo.planned_qty AS planned,
        wo.produced_qty AS produced,
        wo.pass_rate AS passRate,
        wo.status AS statusCode,
        wo.priority_level AS priorityCode,
        DATE_FORMAT(wo.scheduled_end_at, '%Y-%m-%d %H:%i') AS due,
        wo.manager_name AS manager
      FROM mes_work_orders wo
      INNER JOIN mes_factories f ON f.id = wo.factory_id
      LEFT JOIN mes_products p ON p.id = wo.product_id
      LEFT JOIN mes_lines l ON l.id = wo.line_id
      LEFT JOIN mes_process_routes pr ON pr.id = wo.route_id
      WHERE (? = 1 OR f.factory_code = ?)
      ORDER BY COALESCE(wo.scheduled_end_at, wo.created_at) ASC, wo.id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item) => ({
    id: item.id,
    product: item.product || "",
    productCode: item.productCode || "",
    line: item.line || "",
    lineCode: item.lineCode || "",
    routeCode: item.routeCode || "",
    factoryCode: item.factoryCode || "",
    planned: Number(item.planned || 0),
    produced: Number(item.produced || 0),
    passRate: Number(item.passRate || 0),
    status: mapWorkOrderStatus(item.statusCode),
    priority: mapPriorityLevel(item.priorityCode),
    due: item.due || "",
    manager: item.manager || ""
  }));
}

async function listMySqlMonthlyTrend(user) {
  const rows = await listMySqlProductionReportRows(user);
  if (!rows.length) {
    return [];
  }

  const monthMap = new Map();
  let maxMonth = null;

  rows.forEach((item) => {
    const reportMonth = new Date(`${item.reportMonth}T00:00:00`);
    if (Number.isNaN(reportMonth.getTime())) {
      return;
    }

    if (!maxMonth || reportMonth > maxMonth) {
      maxMonth = reportMonth;
    }

    const key = item.reportMonth;
    const bucket = monthMap.get(key) || {
      outputQty: 0,
      passQty: 0
    };

    bucket.outputQty += Number(item.outputQty || 0);
    bucket.passQty += Number(item.passQty || 0);
    monthMap.set(key, bucket);
  });

  if (!maxMonth) {
    return [];
  }

  const result = [];

  for (let offset = 11; offset >= 0; offset -= 1) {
    const currentMonth = new Date(maxMonth);
    currentMonth.setMonth(maxMonth.getMonth() - offset);
    const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-01`;
    const bucket = monthMap.get(key) || {
      outputQty: 0,
      passQty: 0
    };
    const outputQty = Number(bucket.outputQty || 0);
    const passQty = Number(bucket.passQty || 0);

    result.push({
      month: formatMonthLabel(currentMonth),
      output: Number((outputQty / 10000).toFixed(1)),
      quality: outputQty ? Number(((passQty / outputQty) * 100).toFixed(1)) : 0
    });
  }

  return result;
}

async function listMySqlExceptions(user) {
  const rows = await query(
    `
      SELECT
        et.exception_code AS id,
        et.exception_type AS type,
        COALESCE(
          CASE
            WHEN l.line_name IS NOT NULL AND st.station_name IS NOT NULL AND l.line_name <> st.station_name
              THEN CONCAT(l.line_name, '/', st.station_name)
            ELSE NULL
          END,
          st.station_name,
          l.line_name,
          ''
        ) AS station,
        et.owner_name AS owner,
        et.status AS statusCode,
        DATE_FORMAT(et.created_at, '%Y-%m-%d %H:%i') AS time,
        COALESCE(wf.factory_code, sf.factory_code, '') AS factoryCode
      FROM mes_exception_tickets et
      LEFT JOIN mes_work_orders wo ON wo.id = et.work_order_id
      LEFT JOIN mes_factories wf ON wf.id = wo.factory_id
      LEFT JOIN mes_stations st ON st.id = et.station_id
      LEFT JOIN mes_lines l ON l.id = st.line_id
      LEFT JOIN mes_factories sf ON sf.id = l.factory_id
      WHERE (? = 1 OR COALESCE(wf.factory_code, sf.factory_code, '') = ?)
      ORDER BY et.created_at DESC, et.id DESC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item) => ({
    id: item.id || "",
    type: item.type || "",
    station: item.station || "",
    owner: item.owner || "",
    status: mapExceptionStatus(item.statusCode),
    time: item.time || "",
    factoryCode: item.factoryCode || ""
  }));
}

async function listMySqlProcessRoutes(user) {
  const seedRouteMap = createSeedIndex(seedData.processRoutes, "code");
  const rows = await query(
    `
      SELECT
        pr.id AS routePk,
        pr.route_code AS code,
        p.product_name AS product,
        p.product_code AS productCode,
        pr.route_version AS version,
        pr.standard_cycle_seconds AS cycleSeconds,
        AVG(wo.pass_rate) AS passRate,
        GROUP_CONCAT(step.step_name ORDER BY step.sequence_no SEPARATOR '||') AS stepNames
      FROM mes_process_routes pr
      INNER JOIN mes_products p ON p.id = pr.product_id
      LEFT JOIN mes_process_route_steps step ON step.route_id = pr.id
      LEFT JOIN mes_work_orders wo ON wo.route_id = pr.id
      LEFT JOIN mes_factories f ON f.id = wo.factory_id
      WHERE (? = 1 OR f.factory_code = ? OR wo.id IS NULL)
      GROUP BY pr.id, pr.route_code, p.product_name, p.product_code, pr.route_version, pr.standard_cycle_seconds
      ORDER BY pr.id ASC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item, index) => {
    const seedItem = seedRouteMap.get(String(item.code || ""));

    return {
      id: seedItem?.id || `ROUTE-${String(index + 1).padStart(3, "0")}`,
      code: item.code || "",
      product: item.product || seedItem?.product || "",
      productCode: item.productCode || seedItem?.productCode || "",
      version: item.version || seedItem?.version || "",
      steps: item.stepNames
        ? String(item.stepNames).split("||").filter(Boolean)
        : Array.isArray(seedItem?.steps)
          ? seedItem.steps
          : [],
      passRate: Number(Number(item.passRate || seedItem?.passRate || 0).toFixed(1)),
      cycle: formatCycle(item.cycleSeconds) || seedItem?.cycle || ""
    };
  });
}

async function listMySqlDefectTop(user) {
  const colorMap = new Map((seedData.defectTop || []).map((item) => [item.name, item.color]));
  const fallbackColors = ["#2f80ff", "#22c2c8", "#ff9d37", "#eb5f5f", "#7b8ba3"];

  const rows = await query(
    `
      SELECT
        COALESCE(
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(log.payload_json, '$.defectType')), ''),
          '其他'
        ) AS defectName,
        SUM(
          COALESCE(
            CAST(JSON_UNQUOTE(JSON_EXTRACT(log.payload_json, '$.count')) AS UNSIGNED),
            1
          )
        ) AS defectCount
      FROM mes_work_order_logs log
      INNER JOIN mes_work_orders wo ON wo.id = log.work_order_id
      INNER JOIN mes_factories f ON f.id = wo.factory_id
      WHERE
        log.event_type = 'defect'
        AND (? = 1 OR f.factory_code = ?)
      GROUP BY defectName
      ORDER BY defectCount DESC, defectName ASC
      LIMIT 5
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item, index) => ({
    name: item.defectName || "其他",
    value: Number(item.defectCount || 0),
    color: colorMap.get(item.defectName) || fallbackColors[index % fallbackColors.length]
  }));
}

async function listMySqlTraceLots(user) {
  const records = await query(
    `
      SELECT
        tr.id AS traceRecordPk,
        CONCAT('TRACE-', LPAD(tr.id, 3, '0')) AS id,
        tr.trace_code AS keyword,
        p.product_name AS product,
        wo.work_order_code AS orderId,
        f.factory_code AS factoryCode,
        tr.qty,
        COALESCE(st.station_name, l.line_name, '') AS station,
        tr.trace_result AS result,
        tr.operator_name AS operator
      FROM mes_trace_records tr
      INNER JOIN mes_work_orders wo ON wo.id = tr.work_order_id
      INNER JOIN mes_factories f ON f.id = wo.factory_id
      LEFT JOIN mes_products p ON p.id = tr.product_id
      LEFT JOIN mes_stations st ON st.id = tr.current_station_id
      LEFT JOIN mes_lines l ON l.id = wo.line_id
      WHERE (? = 1 OR f.factory_code = ?)
      ORDER BY tr.id ASC
    `,
    getFactoryScopeParams(user)
  );

  const traceRecordIds = records.map((item) => Number(item.traceRecordPk)).filter(Boolean);
  let events = [];

  if (traceRecordIds.length) {
    events = await query(
      `
        SELECT
          trace_record_id AS traceRecordPk,
          DATE_FORMAT(event_time, '%Y-%m-%d %H:%i') AS time,
          event_title AS title,
          event_detail AS detail
        FROM mes_trace_events
        WHERE trace_record_id IN (${buildInClause(traceRecordIds)})
        ORDER BY event_time ASC, id ASC
      `,
      traceRecordIds
    );
  }

  const eventMap = new Map();

  events.forEach((item) => {
    const key = Number(item.traceRecordPk);
    const bucket = eventMap.get(key) || [];
    bucket.push({
      time: item.time || "",
      title: item.title || "",
      detail: item.detail || ""
    });
    eventMap.set(key, bucket);
  });

  return records.map((item) => ({
    id: item.id,
    keyword: item.keyword || "",
    product: item.product || "",
    orderId: item.orderId || "",
    factoryCode: item.factoryCode || "",
    qty: Number(item.qty || 0),
    station: item.station || "",
    result: item.result || "",
    operator: item.operator || "",
    timeline: eventMap.get(Number(item.traceRecordPk)) || []
  }));
}

async function listMySqlBarcodeRules() {
  const rows = await query(
    `
      SELECT
        rule_code AS ruleCode,
        rule_name AS ruleName,
        template_pattern AS templatePattern,
        printer_name AS printerName,
        queue_size AS queueSize,
        success_rate AS successRate,
        DATE_FORMAT(last_sync_at, '%Y-%m-%d %H:%i') AS lastSync
      FROM mes_barcode_rules
      ORDER BY id ASC
    `
  );

  return rows.map((item, index) => ({
    id: `BAR-RULE-${String(index + 1).padStart(3, "0")}`,
    ruleCode: item.ruleCode || "",
    rule: item.ruleName || "",
    sample: item.templatePattern || "",
    printer: item.printerName || "",
    queue: Number(item.queueSize || 0),
    success: `${Number(item.successRate || 0).toFixed(1)}%`,
    lastSync: item.lastSync || ""
  }));
}

async function listMySqlApprovals(user) {
  const rows = await query(
    `
      SELECT
        ar.approval_code AS id,
        ar.title,
        applicant.display_name AS applicant,
        dept.dept_name AS dept,
        ar.reason,
        ar.status AS statusCode,
        DATE_FORMAT(ar.submitted_at, '%Y-%m-%d %H:%i') AS time,
        factory.factory_code AS factoryCode,
        approver.display_name AS approver,
        DATE_FORMAT(ar.approved_at, '%Y-%m-%d %H:%i') AS approvedAt
      FROM mes_approval_requests ar
      LEFT JOIN mes_users applicant ON applicant.id = ar.applicant_id
      LEFT JOIN mes_departments dept ON dept.id = ar.department_id
      LEFT JOIN mes_factories factory ON factory.id = applicant.factory_id
      LEFT JOIN mes_users approver ON approver.id = ar.approver_id
      WHERE (? = 1 OR factory.factory_code = ?)
      ORDER BY ar.submitted_at DESC, ar.id DESC
    `,
    getFactoryScopeParams(user)
  );

  return rows.map((item) => ({
    id: item.id,
    title: item.title || "",
    applicant: item.applicant || "",
    dept: item.dept || "",
    reason: item.reason || "",
    status: mapApprovalStatus(item.statusCode),
    time: item.time || "",
    factoryCode: item.factoryCode || "",
    approver: item.approver || "",
    approvedAt: item.approvedAt || ""
  }));
}

async function listMySqlSettings() {
  const rows = await query(
    `
      SELECT
        setting_key AS settingKey,
        setting_name AS settingName,
        description,
        setting_value AS settingValue
      FROM mes_system_settings
      ORDER BY id ASC
    `
  );

  return rows.map((item) => {
    const parsedValue = normalizeSettingValue(item.settingValue);

    return {
      key: item.settingKey,
      title: item.settingName || "",
      desc: item.description || "",
      enabled: Boolean(parsedValue.enabled)
    };
  });
}

async function issueMySqlBarcode({ ruleCode, workOrderId, quantity, operator, actor }) {
  const ruleRows = await query(
    `
      SELECT
        id,
        rule_code AS ruleCode,
        rule_name AS ruleName,
        template_pattern AS templatePattern,
        printer_name AS printerName,
        queue_size AS queueSize,
        success_rate AS successRate,
        DATE_FORMAT(last_sync_at, '%Y-%m-%d %H:%i') AS lastSync
      FROM mes_barcode_rules
      WHERE rule_code = ?
      LIMIT 1
    `,
    [ruleCode]
  );

  const rule = ruleRows[0];
  if (!rule) {
    return { error: "未找到条码规则" };
  }

  const workOrderRows = await query(
    `
      SELECT
        wo.id AS workOrderPk,
        wo.work_order_code AS workOrderCode,
        f.factory_code AS factoryCode,
        l.line_name AS lineName,
        l.line_code AS lineCode
      FROM mes_work_orders wo
      INNER JOIN mes_factories f ON f.id = wo.factory_id
      LEFT JOIN mes_lines l ON l.id = wo.line_id
      WHERE wo.work_order_code = ?
      LIMIT 1
    `,
    [workOrderId]
  );

  const workOrder = workOrderRows[0];
  if (!workOrder) {
    return { error: "未找到工单" };
  }

  if (!isSuperAdmin(actor) && String(workOrder.factoryCode || "") !== String(actor?.factoryCode || "")) {
    return { error: "当前账号没有签发该工厂条码的权限" };
  }

  const count = Math.max(1, Math.min(Number(quantity || 1), 50));
  const date = new Date();
  const dateToken = `${String(date.getFullYear()).slice(2)}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const lineToken = String(workOrder.lineName || workOrder.lineCode || "").replaceAll("-", "");
  const typeMap = {
    "barcode-sn": "sn",
    "barcode-box": "box",
    "barcode-station": "station"
  };

  const startRows = await query("SELECT COUNT(*) AS total FROM mes_barcode_serials");
  const startSeq = Number(startRows[0]?.total || 0) + 1;
  const issuedAt = new Date();
  const issuedAtText = issuedAt.toISOString().slice(0, 19).replace("T", " ");
  const barcodeType = typeMap[rule.ruleCode] || "sn";

  const items = [];

  for (let index = 0; index < count; index += 1) {
    const seq = String(startSeq + index).padStart(4, "0");
    let value = `SN-${dateToken}-${lineToken}-${seq}`;

    if (rule.ruleCode === "barcode-box") {
      value = `BX-${dateToken}-${seq}`;
    }

    if (rule.ruleCode === "barcode-station") {
      value = `ST-${workOrder.workOrderCode}-${seq}`;
    }

    await query(
      `
        INSERT INTO mes_barcode_serials
          (barcode_value, rule_id, work_order_id, operator_id, barcode_type, status, issued_at)
        VALUES
          (
            ?,
            ?,
            ?,
            (SELECT u.id FROM mes_users u WHERE u.user_code = ? LIMIT 1),
            ?,
            'issued',
            ?
          )
      `,
      [value, Number(rule.id), Number(workOrder.workOrderPk), String(actor?.id || ""), barcodeType, issuedAtText]
    );

    const insertedRows = await query(
      `
        SELECT id
        FROM mes_barcode_serials
        WHERE barcode_value = ?
        LIMIT 1
      `,
      [value]
    );

    const insertedId = Number(insertedRows[0]?.id || 0);
    items.push({
      id: `BC-${String(insertedId || startSeq + index).padStart(4, "0")}`,
      ruleCode: rule.ruleCode,
      workOrderId: workOrder.workOrderCode,
      value,
      station: workOrder.lineName || "",
      operator: operator || actor?.name || "MES API",
      createdAt: issuedAtText
    });
  }

  await query(
    `
      UPDATE mes_barcode_rules
      SET
        queue_size = queue_size + ?,
        last_sync_at = ?
      WHERE id = ?
    `,
    [count, issuedAtText, Number(rule.id)]
  );

  const refreshedRules = await listMySqlBarcodeRules();
  const refreshedRule = refreshedRules.find((item) => item.ruleCode === rule.ruleCode) || null;

  return {
    rule: refreshedRule,
    items
  };
}

async function decideMySqlApproval(id, decision, actor) {
  const approvals = await listMySqlApprovals(actor);
  const target = approvals.find((item) => item.id === id);

  if (!target) {
    return null;
  }

  const nextStatusCode = decision === "approved" ? "approved" : "rejected";

  await query(
    `
      UPDATE mes_approval_requests
      SET
        status = ?,
        approver_id = (SELECT u.id FROM mes_users u WHERE u.user_code = ? LIMIT 1),
        approved_at = CURRENT_TIMESTAMP
      WHERE approval_code = ?
    `,
    [nextStatusCode, String(actor?.id || ""), id]
  );

  const refreshed = await listMySqlApprovals(actor);
  return refreshed.find((item) => item.id === id) || null;
}

async function toggleMySqlSetting(key, actor) {
  const rows = await query(
    `
      SELECT
        setting_key AS settingKey,
        setting_name AS settingName,
        description,
        setting_value AS settingValue
      FROM mes_system_settings
      WHERE setting_key = ?
      LIMIT 1
    `,
    [key]
  );

  const current = rows[0];
  if (!current) {
    return null;
  }

  const parsedValue = normalizeSettingValue(current.settingValue);
  const nextValue = {
    ...parsedValue,
    enabled: !Boolean(parsedValue.enabled)
  };

  await query(
    `
      UPDATE mes_system_settings
      SET
        setting_value = CAST(? AS JSON),
        updated_by = (SELECT u.id FROM mes_users u WHERE u.user_code = ? LIMIT 1),
        updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `,
    [JSON.stringify(nextValue), String(actor?.id || ""), key]
  );

  const settings = await listMySqlSettings();
  return settings.find((item) => item.key === key) || null;
}

module.exports = {
  listMySqlApprovals,
  listMySqlBarcodeRules,
  listMySqlCustomers,
  listMySqlDefectTop,
  listMySqlEquipment,
  listMySqlExceptions,
  listMySqlFactories,
  listMySqlInventory,
  listMySqlMonthlyTrend,
  listMySqlProcessRoutes,
  listMySqlSettings,
  listMySqlTraceLots,
  listMySqlWeeklyOutput,
  listMySqlWorkOrders,
  decideMySqlApproval,
  issueMySqlBarcode,
  toggleMySqlSetting
};
