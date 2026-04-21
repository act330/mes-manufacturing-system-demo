import { defaultModuleRegistry } from "../config/modules";
import { defaultData } from "../data/default-data";
import { deepClone, matchTrace } from "../utils/mes-utils";

const STATIC_DEMO_MODE = import.meta.env.VITE_STATIC_DEMO === "true";

const CLIENT_DATA_KEYS = [
  "factories",
  "customers",
  "processRoutes",
  "barcodeRules",
  "workOrders",
  "defectTop",
  "exceptions",
  "equipment",
  "inventory",
  "traceLots",
  "approvals",
  "weeklyOutput",
  "monthlyTrend",
  "settings"
];

const DEMO_ROLE_DEFINITIONS = {
  super_admin: {
    name: "系统管理员",
    permissions: [
      "dashboard:view",
      "production_config:view",
      "customer:view",
      "process:view",
      "barcode:view",
      "barcode:issue",
      "work_order:view",
      "work_order:update",
      "equipment:view",
      "warehouse:view",
      "trace:view",
      "report:view",
      "approval:view",
      "approval:decision",
      "settings:view",
      "settings:update",
      "user:view"
    ]
  },
  planner: {
    name: "生产计划员",
    permissions: [
      "dashboard:view",
      "production_config:view",
      "customer:view",
      "process:view",
      "barcode:view",
      "work_order:view",
      "work_order:update",
      "equipment:view",
      "warehouse:view",
      "trace:view",
      "report:view",
      "approval:view"
    ]
  },
  quality_engineer: {
    name: "质量工程师",
    permissions: [
      "dashboard:view",
      "customer:view",
      "process:view",
      "barcode:view",
      "work_order:view",
      "equipment:view",
      "trace:view",
      "report:view",
      "approval:view",
      "approval:decision"
    ]
  },
  shop_floor_operator: {
    name: "现场操作员",
    permissions: [
      "dashboard:view",
      "barcode:view",
      "barcode:issue",
      "work_order:view",
      "trace:view"
    ]
  }
};

const DEMO_ACCOUNTS = [
  {
    id: "USR-001",
    username: "admin",
    password: "123456",
    name: "易蓝",
    roleCode: "super_admin",
    dept: "信息化中心",
    factoryCode: "FAC-001"
  },
  {
    id: "USR-002",
    username: "planner",
    password: "123456",
    name: "陈计划",
    roleCode: "planner",
    dept: "生产计划部",
    factoryCode: "FAC-002"
  },
  {
    id: "USR-003",
    username: "quality",
    password: "123456",
    name: "李质控",
    roleCode: "quality_engineer",
    dept: "质量工程部",
    factoryCode: "FAC-003"
  },
  {
    id: "USR-004",
    username: "operator",
    password: "123456",
    name: "周婷",
    roleCode: "shop_floor_operator",
    dept: "装配车间",
    factoryCode: "FAC-001"
  }
];

function getFactoryName(factoryCode) {
  return defaultData.factories.find((item) => item.code === factoryCode)?.name || factoryCode;
}

function getRolePermissions(roleCode) {
  return DEMO_ROLE_DEFINITIONS[roleCode]?.permissions || [];
}

function getRoleName(roleCode) {
  return DEMO_ROLE_DEFINITIONS[roleCode]?.name || roleCode;
}

function buildClientData(dataState = defaultData) {
  const source = dataState || defaultData;
  const payload = {
    moduleRegistry: deepClone(defaultModuleRegistry)
  };

  CLIENT_DATA_KEYS.forEach((key) => {
    payload[key] = deepClone(source[key] ?? defaultData[key]);
  });

  return payload;
}

function buildUserView(account) {
  const permissions = getRolePermissions(account.roleCode);

  return {
    id: account.id,
    username: account.username,
    name: account.name,
    role: getRoleName(account.roleCode),
    roleCode: account.roleCode,
    dept: account.dept,
    factory: getFactoryName(account.factoryCode),
    factoryCode: account.factoryCode,
    permissions,
    modules: defaultModuleRegistry
      .filter((item) => !item.permission || permissions.includes(item.permission))
      .map((item) => item.key)
  };
}

function buildAuthPayload(account, dataState) {
  return {
    version: "static-demo",
    user: buildUserView(account),
    data: buildClientData(dataState)
  };
}

function resolveDemoAccount({ username, password, factory }) {
  const normalizedUsername = String(username || "").trim();
  const normalizedPassword = String(password || "").trim();
  const normalizedFactory = String(factory || "").trim();

  return (
    DEMO_ACCOUNTS.find((account) => {
      const matchedFactory =
        !normalizedFactory ||
        account.factoryCode === normalizedFactory ||
        getFactoryName(account.factoryCode) === normalizedFactory;

      return (
        account.username === normalizedUsername &&
        account.password === normalizedPassword &&
        matchedFactory
      );
    }) || null
  );
}

export function isStaticDemoMode() {
  return STATIC_DEMO_MODE;
}

export function demoLogin(credentials, dataState) {
  const account = resolveDemoAccount(credentials);

  if (!account) {
    return null;
  }

  return {
    token: `static-demo-token:${account.username}:${account.factoryCode}`,
    ...buildAuthPayload(account, dataState)
  };
}

export function demoHydrateSession(token, dataState) {
  const [, username, factoryCode] = String(token || "").split(":");
  const account =
    DEMO_ACCOUNTS.find((item) => item.username === username && item.factoryCode === factoryCode) || null;

  return account ? buildAuthPayload(account, dataState) : null;
}

export function demoSearchTrace(dataState, query) {
  const item = (dataState?.traceLots || []).find((traceItem) => matchTrace(traceItem, query)) || null;
  return {
    item: item ? deepClone(item) : null
  };
}

export function demoDecideApproval(dataState, id, decision) {
  const items = deepClone(dataState?.approvals || []);
  const index = items.findIndex((item) => item.id === id);

  if (index < 0) {
    return null;
  }

  items[index].status = decision === "approved" ? "已通过" : "已驳回";

  return {
    item: deepClone(items[index]),
    items
  };
}

export function demoToggleSetting(dataState, key) {
  const items = deepClone(dataState?.settings || []);
  const index = items.findIndex((item) => item.key === key);

  if (index < 0) {
    return null;
  }

  items[index].enabled = !items[index].enabled;

  return {
    item: deepClone(items[index]),
    items
  };
}
