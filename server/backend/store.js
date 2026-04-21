const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { seedData } = require("./mes-seed");

const runtimeDir = path.join(__dirname, "..", "data");
const runtimeFile = path.join(runtimeDir, "runtime-store.json");
const JWT_SECRET = process.env.MES_JWT_SECRET || "mes-demo-jwt-secret";
const JWT_TTL_SECONDS = Number(process.env.MES_JWT_TTL_SECONDS || 60 * 60 * 8);
const PASSWORD_HASH_PREFIX = "scrypt";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hashed = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return `${PASSWORD_HASH_PREFIX}$${salt}$${hashed}`;
}

function verifyPassword(password, storedPassword) {
  const normalizedStored = String(storedPassword || "");
  if (!normalizedStored) {
    return false;
  }

  if (!normalizedStored.startsWith(`${PASSWORD_HASH_PREFIX}$`)) {
    return normalizedStored === String(password || "");
  }

  const [, salt, expectedHash] = normalizedStored.split("$");
  const actualHash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return safeEqual(actualHash, expectedHash);
}

function signJwt(payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const content = `${header}.${body}`;
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${content}.${signature}`;
}

function verifyJwt(token) {
  const [header, body, signature] = String(token || "").split(".");

  if (!header || !body || !signature) {
    throw new Error("jwt_invalid");
  }

  const content = `${header}.${body}`;
  const expectedSignature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(content)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error("jwt_invalid");
  }

  const payload = JSON.parse(base64UrlDecode(body));
  const currentTime = Math.floor(Date.now() / 1000);

  if (payload.exp && Number(payload.exp) <= currentTime) {
    throw new Error("jwt_expired");
  }

  return payload;
}

function ensureRuntimePath() {
  fs.mkdirSync(runtimeDir, { recursive: true });
}

function loadRuntimeState() {
  ensureRuntimePath();

  if (!fs.existsSync(runtimeFile)) {
    return clone(seedData);
  }

  try {
    const runtime = JSON.parse(fs.readFileSync(runtimeFile, "utf8"));
    return {
      ...clone(seedData),
      ...runtime
    };
  } catch (error) {
    return clone(seedData);
  }
}

function createStore() {
  const db = loadRuntimeState();
  const revokedTokens = new Map();

  function saveRuntimeState() {
    ensureRuntimePath();
    fs.writeFileSync(runtimeFile, JSON.stringify(db, null, 2));
  }

  function migrateUsers() {
    let changed = false;

    db.users = db.users.map((user) => {
      const nextUser = { ...user };

      if (!nextUser.passwordHash && nextUser.password) {
        nextUser.passwordHash = hashPassword(nextUser.password);
        changed = true;
      }

      if (nextUser.password) {
        delete nextUser.password;
        changed = true;
      }

      return nextUser;
    });

    if (changed) {
      saveRuntimeState();
    }
  }

  function pruneRevokedTokens() {
    const nowSeconds = Math.floor(Date.now() / 1000);
    for (const [jti, expiresAt] of revokedTokens.entries()) {
      if (Number(expiresAt || 0) <= nowSeconds) {
        revokedTokens.delete(jti);
      }
    }
  }

  function issueAuthToken(user) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + JWT_TTL_SECONDS;
    const jti = crypto.randomBytes(12).toString("hex");

    return signJwt({
      sub: user.id,
      username: user.username,
      roleCode: user.roleCode,
      factoryCode: user.factoryCode,
      iat: issuedAt,
      exp: expiresAt,
      jti
    });
  }

  function revokeToken(token) {
    try {
      const payload = verifyJwt(token);
      if (payload.jti) {
        revokedTokens.set(payload.jti, payload.exp || Math.floor(Date.now() / 1000) + JWT_TTL_SECONDS);
      }
      pruneRevokedTokens();
      return payload;
    } catch (error) {
      return null;
    }
  }

  migrateUsers();

  function now() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    const second = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  }

  function getRole(roleCode) {
    return db.roles.find((item) => item.code === roleCode) || null;
  }

  function getPermissionsByRole(roleCode) {
    const role = getRole(roleCode);
    return role ? [...role.permissionCodes] : [];
  }

  function buildUserView(user) {
    const role = getRole(user.roleCode);
    const permissions = getPermissionsByRole(user.roleCode);
    const availableModules = db.moduleRegistry
      .filter((item) => !item.permission || permissions.includes(item.permission))
      .map((item) => item.key);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: role ? role.name : user.roleCode,
      roleCode: user.roleCode,
      dept: user.dept,
      factory: user.factory,
      factoryCode: user.factoryCode,
      permissions,
      modules: availableModules
    };
  }

  function recordAudit(action, actor, target, detail) {
    db.auditLogs.unshift({
      id: `AUD-${String(db.auditLogs.length + 1).padStart(4, "0")}`,
      action,
      actor: actor ? actor.name : "system",
      actorId: actor ? actor.id : null,
      target,
      detail,
      time: now()
    });
    db.auditLogs = db.auditLogs.slice(0, 200);
  }

  function buildClientData() {
    return {
      moduleRegistry: clone(db.moduleRegistry),
      factories: clone(db.factories),
      customers: clone(db.customers),
      processRoutes: clone(db.processRoutes),
      barcodeRules: clone(db.barcodeRules),
      workOrders: clone(db.workOrders),
      defectTop: clone(db.defectTop),
      exceptions: clone(db.exceptions),
      equipment: clone(db.equipment),
      inventory: clone(db.inventory),
      traceLots: clone(db.traceLots),
      approvals: clone(db.approvals),
      weeklyOutput: clone(db.weeklyOutput),
      monthlyTrend: clone(db.monthlyTrend),
      settings: clone(db.settings)
    };
  }

  function buildAuthPayload(user) {
    return {
      version: db.version,
      user: buildUserView(user),
      data: buildClientData()
    };
  }

  function login({ username, password, factory }) {
    const normalizedFactory = String(factory || "").trim();
    const normalizedUsername = String(username || "").trim();

    const user = db.users.find((item) => {
      if (item.status !== "active") {
        return false;
      }

      const matchedFactory =
        !normalizedFactory ||
        item.factory === normalizedFactory ||
        item.factoryCode === normalizedFactory;

      return item.username === normalizedUsername && matchedFactory && verifyPassword(password, item.passwordHash);
    });

    if (!user) {
      return null;
    }

    const token = issueAuthToken(user);

    recordAudit("auth.login", user, user.id, `用户 ${user.username} 登录成功`);

    return {
      token,
      ...buildAuthPayload(user)
    };
  }

  function resolveSession(token) {
    if (!token) {
      return null;
    }

    let payload = null;
    try {
      payload = verifyJwt(token);
    } catch (error) {
      return null;
    }

    pruneRevokedTokens();
    if (payload.jti && revokedTokens.has(payload.jti)) {
      return null;
    }

    const user = db.users.find((item) => item.id === payload.sub);

    if (!user || user.status !== "active") {
      return null;
    }

    return {
      token,
      payload,
      user,
      userView: buildUserView(user)
    };
  }

  function logout(token) {
    const session = resolveSession(token);
    if (session) {
      recordAudit("auth.logout", session.user, session.user.id, `用户 ${session.user.username} 退出登录`);
    }
    revokeToken(token);
  }

  function getDashboardPayload() {
    const totalOrders = db.workOrders.length;
    const onlineOrders = db.workOrders.filter((item) => item.status === "进行中" || item.status === "收尾中").length;
    const finishedOrders = db.workOrders.filter((item) => item.status === "已完成").length;
    const abnormalOrders = db.workOrders.filter((item) => item.status === "异常中").length;
    const totalPlanned = db.workOrders.reduce((sum, item) => sum + item.planned, 0);
    const totalProduced = db.workOrders.reduce((sum, item) => sum + item.produced, 0);
    const avgPassRate =
      db.workOrders.reduce((sum, item) => sum + item.passRate, 0) / (db.workOrders.length || 1);

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
      monthlyTrend: clone(db.monthlyTrend),
      defectTop: clone(db.defectTop),
      workOrders: clone(db.workOrders),
      exceptions: clone(db.exceptions),
      weeklyOutput: clone(db.weeklyOutput)
    };
  }

  function normalizeWorkOrderStatusFilter(status) {
    const mapping = {
      all: "",
      running: "进行中",
      in_progress: "进行中",
      finishing: "收尾中",
      completed: "已完成",
      abnormal: "异常中",
      "进行中": "进行中",
      "收尾中": "收尾中",
      "已完成": "已完成",
      "异常中": "异常中"
    };

    return mapping[String(status || "all").trim()] || "";
  }

  function listWorkOrders(filters = {}) {
    const status = normalizeWorkOrderStatusFilter(filters.status);

    return clone(
      db.workOrders.filter((item) => {
        if (!status) {
          return true;
        }

        return item.status === status;
      })
    );
  }

  function getWorkOrderById(id) {
    const workOrder = db.workOrders.find((item) => item.id === id);
    return workOrder ? clone(workOrder) : null;
  }

  function searchTrace(query) {
    const keyword = String(query || "").trim().toLowerCase();
    if (!keyword) {
      return null;
    }

    const trace = db.traceLots.find((item) => {
      return [item.keyword, item.orderId, item.product].some((part) =>
        String(part || "")
          .toLowerCase()
          .includes(keyword)
      );
    });

    return trace ? clone(trace) : null;
  }

  function listBarcodeRules() {
    return clone(db.barcodeRules);
  }

  function issueBarcode({ ruleCode, workOrderId, quantity, operator }) {
    const rule = db.barcodeRules.find((item) => item.ruleCode === ruleCode);
    if (!rule) {
      return { error: "未找到条码规则" };
    }

    const workOrder = db.workOrders.find((item) => item.id === workOrderId);
    if (!workOrder) {
      return { error: "未找到工单" };
    }

    const count = Math.max(1, Math.min(Number(quantity || 1), 50));
    const dateToken = now().slice(2, 10).replaceAll("-", "");
    const lineToken = workOrder.line.replaceAll("-", "");
    const startSeq = db.barcodeIssuances.length + 1;

    const items = Array.from({ length: count }, (_, index) => {
      const seq = String(startSeq + index).padStart(4, "0");
      let value = `SN-${dateToken}-${lineToken}-${seq}`;

      if (rule.ruleCode === "barcode-box") {
        value = `BX-${dateToken}-${seq}`;
      }

      if (rule.ruleCode === "barcode-station") {
        value = `ST-${workOrder.id}-${seq}`;
      }

      return {
        id: `BC-${String(startSeq + index).padStart(4, "0")}`,
        ruleCode: rule.ruleCode,
        workOrderId: workOrder.id,
        value,
        station: workOrder.line,
        operator: operator || "MES API",
        createdAt: now()
      };
    });

    db.barcodeIssuances.push(...items);
    rule.queue += count;
    rule.lastSync = now();

    recordAudit(
      "barcode.issue",
      operator ? { id: null, name: operator } : null,
      workOrder.id,
      `按规则 ${rule.ruleCode} 为工单 ${workOrder.id} 签发 ${count} 个条码`
    );
    saveRuntimeState();

    return {
      rule: clone(rule),
      items: clone(items)
    };
  }

  function listApprovals() {
    return clone(db.approvals);
  }

  function decideApproval(id, decision, actor) {
    const approval = db.approvals.find((item) => item.id === id);
    if (!approval) {
      return null;
    }

    approval.status = decision === "approved" ? "已通过" : "已驳回";
    approval.approver = actor.name;
    approval.approvedAt = now();

    recordAudit(
      "approval.decision",
      actor,
      approval.id,
      `${approval.title} 被${decision === "approved" ? "通过" : "驳回"}`
    );
    saveRuntimeState();
    return clone(approval);
  }

  function listSettings() {
    return clone(db.settings);
  }

  function toggleSetting(key, actor) {
    const setting = db.settings.find((item) => item.key === key);
    if (!setting) {
      return null;
    }

    setting.enabled = !setting.enabled;
    recordAudit("settings.toggle", actor, key, `${setting.title} 切换为 ${setting.enabled ? "启用" : "停用"}`);
    saveRuntimeState();
    return clone(setting);
  }

  return {
    login,
    logout,
    resolveSession,
    buildAuthPayload,
    getDashboardPayload,
    listWorkOrders,
    getWorkOrderById,
    searchTrace,
    listBarcodeRules,
    issueBarcode,
    listApprovals,
    decideApproval,
    listSettings,
    toggleSetting,
    getClientData: buildClientData,
    getPermissionsByRole
  };
}

const store = createStore();

module.exports = {
  store
};
