function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const SCOPED_DATASET_PERMISSIONS = {
  customers: "customer:view",
  processRoutes: "process:view",
  barcodeRules: "barcode:view",
  workOrders: "work_order:view",
  equipment: "equipment:view",
  inventory: "warehouse:view",
  traceLots: "trace:view",
  approvals: "approval:view",
  settings: "settings:view"
};

function getPermissionCodes(user) {
  return Array.isArray(user?.permissionCodes)
    ? user.permissionCodes
    : Array.isArray(user?.permissions)
      ? user.permissions
      : [];
}

function hasPermission(user, permissionCode) {
  if (!permissionCode) {
    return true;
  }

  return getPermissionCodes(user).includes(permissionCode);
}

function isSuperAdmin(user) {
  return user?.roleCode === "super_admin";
}

function filterByFactory(items, user, fieldName = "factoryCode") {
  const source = Array.isArray(items) ? items : [];

  if (isSuperAdmin(user)) {
    return clone(source);
  }

  const targetFactoryCode = String(user?.factoryCode || "").trim();
  if (!targetFactoryCode) {
    return [];
  }

  return clone(
    source.filter((item) => {
      const currentFactoryCode = String(item?.[fieldName] || "").trim();
      return currentFactoryCode === targetFactoryCode;
    })
  );
}

function filterFactories(factories, user) {
  const source = Array.isArray(factories) ? factories : [];

  if (isSuperAdmin(user)) {
    return clone(source);
  }

  return clone(source.filter((item) => item.code === user?.factoryCode || item.id === user?.factoryCode));
}

function filterTraceLots(traceLots, visibleWorkOrders) {
  const visibleOrderIds = new Set((visibleWorkOrders || []).map((item) => item.id));

  return clone(
    (traceLots || []).filter((item) => {
      return visibleOrderIds.has(item.orderId);
    })
  );
}

function buildScopedMonthlyTrend(workOrders, allowGlobalTrend, monthlyTrend) {
  if (allowGlobalTrend) {
    return clone(monthlyTrend || []);
  }

  const grouped = new Map();

  (workOrders || []).forEach((item) => {
    const month = String(item?.due || "").slice(5, 7);
    if (!month) {
      return;
    }

    const key = `${month}月`;
    const current = grouped.get(key) || {
      month: key,
      output: 0,
      produced: 0,
      passRateSum: 0,
      count: 0
    };

    current.produced += Number(item.produced || 0);
    current.output = Number((current.produced / 100).toFixed(1));
    current.passRateSum += Number(item.passRate || 0);
    current.count += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((left, right) => Number.parseInt(left.month, 10) - Number.parseInt(right.month, 10))
    .map((item) => ({
      month: item.month,
      output: item.output,
      quality: Number((item.passRateSum / (item.count || 1)).toFixed(1))
    }));
}

function buildScopedWeeklyOutput(workOrders, allowGlobalTrend, weeklyOutput) {
  if (allowGlobalTrend) {
    return clone(weeklyOutput || []);
  }

  const weekdayLabels = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const grouped = new Map();

  (workOrders || []).forEach((item) => {
    const due = new Date(String(item?.due || "").replace(" ", "T"));
    if (Number.isNaN(due.getTime())) {
      return;
    }

    const key = weekdayLabels[due.getDay()];
    grouped.set(key, Number(((grouped.get(key) || 0) + Number(item.produced || 0) / 100).toFixed(1)));
  });

  return weekdayLabels
    .filter((label) => grouped.has(label))
    .map((label) => ({
      day: label,
      value: grouped.get(label)
    }));
}

function filterScopedData(db, user) {
  const allowGlobalTrend = isSuperAdmin(user);
  const factories = filterFactories(db.factories, user);
  const workOrders = hasPermission(user, SCOPED_DATASET_PERMISSIONS.workOrders)
    ? filterByFactory(db.workOrders, user)
    : [];
  const traceLots = hasPermission(user, SCOPED_DATASET_PERMISSIONS.traceLots)
    ? filterTraceLots(db.traceLots, workOrders)
    : [];
  const equipment = hasPermission(user, SCOPED_DATASET_PERMISSIONS.equipment)
    ? filterByFactory(db.equipment, user)
    : [];
  const inventory = hasPermission(user, SCOPED_DATASET_PERMISSIONS.inventory)
    ? filterByFactory(db.inventory, user)
    : [];
  const approvals = hasPermission(user, SCOPED_DATASET_PERMISSIONS.approvals)
    ? filterByFactory(db.approvals, user)
    : [];

  return {
    moduleRegistry: clone(db.moduleRegistry),
    factories,
    customers: hasPermission(user, SCOPED_DATASET_PERMISSIONS.customers) ? clone(db.customers) : [],
    processRoutes: hasPermission(user, SCOPED_DATASET_PERMISSIONS.processRoutes) ? clone(db.processRoutes) : [],
    barcodeRules: hasPermission(user, SCOPED_DATASET_PERMISSIONS.barcodeRules) ? clone(db.barcodeRules) : [],
    workOrders,
    defectTop: hasPermission(user, "dashboard:view") && allowGlobalTrend ? clone(db.defectTop) : [],
    exceptions: hasPermission(user, "dashboard:view") ? filterByFactory(db.exceptions, user) : [],
    equipment,
    inventory,
    traceLots,
    approvals,
    weeklyOutput: hasPermission(user, "dashboard:view")
      ? buildScopedWeeklyOutput(workOrders, allowGlobalTrend, db.weeklyOutput)
      : [],
    monthlyTrend: hasPermission(user, "dashboard:view")
      ? buildScopedMonthlyTrend(workOrders, allowGlobalTrend, db.monthlyTrend)
      : [],
    settings: hasPermission(user, SCOPED_DATASET_PERMISSIONS.settings) ? clone(db.settings) : []
  };
}

function buildDashboardPayload(dataState) {
  const workOrders = Array.isArray(dataState?.workOrders) ? dataState.workOrders : [];

  const totalOrders = workOrders.length;
  const onlineOrders = workOrders.filter((item) => item.status === "进行中" || item.status === "收尾中").length;
  const finishedOrders = workOrders.filter((item) => item.status === "已完成").length;
  const abnormalOrders = workOrders.filter((item) => item.status === "异常中").length;
  const totalPlanned = workOrders.reduce((sum, item) => sum + Number(item.planned || 0), 0);
  const totalProduced = workOrders.reduce((sum, item) => sum + Number(item.produced || 0), 0);
  const avgPassRate =
    workOrders.reduce((sum, item) => sum + Number(item.passRate || 0), 0) / (workOrders.length || 1);

  return {
    summary: {
      totalOrders,
      onlineOrders,
      finishedOrders,
      abnormalOrders,
      totalPlanned,
      totalProduced,
      avgPassRate: Number(avgPassRate.toFixed(1))
    },
    monthlyTrend: clone(dataState?.monthlyTrend || []),
    defectTop: clone(dataState?.defectTop || []),
    workOrders: clone(workOrders),
    exceptions: clone(dataState?.exceptions || []),
    weeklyOutput: clone(dataState?.weeklyOutput || [])
  };
}

function backfillArrayRecords(items, seedItems, keyName = "id", extraResolver = null) {
  const source = Array.isArray(items) ? items : [];
  const seedMap = new Map((seedItems || []).map((item) => [String(item?.[keyName] || ""), item]));

  let changed = false;

  const nextItems = source.map((item) => {
    const seedItem = seedMap.get(String(item?.[keyName] || ""));
    const merged = {
      ...(seedItem || {}),
      ...(item || {})
    };
    const resolved = typeof extraResolver === "function" ? extraResolver(merged, item, seedItem) : merged;

    if (JSON.stringify(resolved) !== JSON.stringify(item)) {
      changed = true;
    }

    return resolved;
  });

  return {
    changed,
    items: nextItems
  };
}

module.exports = {
  backfillArrayRecords,
  buildDashboardPayload,
  buildScopedMonthlyTrend,
  buildScopedWeeklyOutput,
  clone,
  filterScopedData,
  hasPermission,
  isSuperAdmin
};
