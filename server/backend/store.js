const { seedData } = require("./mes-seed");
const { hashPassword, randomHex, verifyJwt, verifyPassword } = require("./auth-crypto");
const { createLoginLockout } = require("./auth-lockout");
const {
  buildSessionPayload,
  createAuthSessionTokens,
  issueAccessToken,
  issueRefreshToken,
  now,
  toDateTimeString
} = require("./auth-session");
const { createAuthSessionStore } = require("./auth-session-store");
const {
  loadRuntimeState,
  saveRuntimeState: persistRuntimeState
} = require("./runtime-state");
const {
  buildUserView: buildUserViewFromData,
  getPermissionsByRole: getPermissionsByRoleFromData
} = require("./user-access");
const {
  appendMySqlAuditLog,
  findMySqlUserById,
  findMySqlUserByLogin,
  isMySqlBackplaneEnabled,
  pingMySql,
  touchMySqlUserLastLogin
} = require("./mysql-auth");
const {
  backfillArrayRecords,
  buildDashboardPayload,
  clone,
  filterScopedData,
  hasPermission,
  isSuperAdmin
} = require("./data-scope");
const {
  decideMySqlApproval,
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
  issueMySqlBarcode,
  toggleMySqlSetting
} = require("./mysql-mes");
const {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS
} = require("./runtime-config");

function createStore() {
  const db = loadRuntimeState();
  db.authSessions = Array.isArray(db.authSessions) ? db.authSessions : [];
  const authSessionStore = createAuthSessionStore({
    initialSessions: db.authSessions,
    persistSessions: (sessions) => {
      db.authSessions = sessions;
      persistRuntimeState(db);
    }
  });
  const loginLockout = createLoginLockout();

  function saveRuntimeState() {
    db.authSessions = authSessionStore.listSessions();
    persistRuntimeState(db);
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

    return changed;
  }

  function backfillScopedFields() {
    let changed = false;

    if (!Array.isArray(db.authSessions)) {
      db.authSessions = [];
      changed = true;
    }

    const workOrdersResult = backfillArrayRecords(db.workOrders, seedData.workOrders);
    if (workOrdersResult.changed) {
      db.workOrders = workOrdersResult.items;
      changed = true;
    }

    const visibleWorkOrders = new Map((db.workOrders || []).map((item) => [item.id, item]));

    const traceLotsResult = backfillArrayRecords(
      db.traceLots,
      seedData.traceLots,
      "id",
      (merged) => ({
        ...merged,
        factoryCode: merged.factoryCode || visibleWorkOrders.get(merged.orderId)?.factoryCode || ""
      })
    );
    if (traceLotsResult.changed) {
      db.traceLots = traceLotsResult.items;
      changed = true;
    }

    const exceptionsResult = backfillArrayRecords(db.exceptions, seedData.exceptions);
    if (exceptionsResult.changed) {
      db.exceptions = exceptionsResult.items;
      changed = true;
    }

    const equipmentResult = backfillArrayRecords(db.equipment, seedData.equipment);
    if (equipmentResult.changed) {
      db.equipment = equipmentResult.items;
      changed = true;
    }

    const inventoryResult = backfillArrayRecords(db.inventory, seedData.inventory);
    if (inventoryResult.changed) {
      db.inventory = inventoryResult.items;
      changed = true;
    }

    const approvalsResult = backfillArrayRecords(db.approvals, seedData.approvals);
    if (approvalsResult.changed) {
      db.approvals = approvalsResult.items;
      changed = true;
    }

    return changed;
  }

  async function issueAuthTokens(user, requestContext = {}) {
    const tokens = createAuthSessionTokens(user, requestContext);
    await authSessionStore.saveAuthSession(tokens.sessionRecord);
    await authSessionStore.enforceSessionLimit(user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      session: tokens.session
    };
  }

  const userChanged = migrateUsers();
  const scopedFieldChanged = backfillScopedFields();

  if (userChanged || scopedFieldChanged) {
    saveRuntimeState();
  }

  function getPermissionsByRole(roleCode) {
    return getPermissionsByRoleFromData(db.roles, roleCode);
  }

  function buildUserView(user) {
    return buildUserViewFromData(user, {
      roles: db.roles,
      moduleRegistry: db.moduleRegistry
    });
  }

  function persistAuditToMySql(entry) {
    if (!isMySqlBackplaneEnabled()) {
      return;
    }

    appendMySqlAuditLog(entry).catch(() => {
    });
  }

  function recordAudit(action, actor, target, detail, options = {}) {
    const entry = {
      id: `AUD-${String(db.auditLogs.length + 1).padStart(4, "0")}`,
      action,
      actor: actor ? actor.name : "system",
      actorId: actor ? actor.id : null,
      target,
      detail,
      time: now()
    };

    db.auditLogs.unshift(entry);
    db.auditLogs = db.auditLogs.slice(0, 200);

    persistAuditToMySql({
      action,
      actorUserCode: actor?.id || "",
      target,
      time: entry.time,
      detail: {
        actor: entry.actor,
        actorId: entry.actorId,
        target,
        message: detail
      }
    });

    if (options.persistRuntime) {
      saveRuntimeState();
    }
  }

  async function buildClientData(user) {
    const userView = buildUserView(user);
    const baseData = filterScopedData(db, userView);

    if (!isMySqlBackplaneEnabled()) {
      return baseData;
    }

    const canViewWorkOrders = hasPermission(userView, "work_order:view");
    const canViewTrace = hasPermission(userView, "trace:view");
    const canViewApprovals = hasPermission(userView, "approval:view");
    const canViewSettings = hasPermission(userView, "settings:view");
    const canViewDashboard = hasPermission(userView, "dashboard:view");
    const canViewCustomers = hasPermission(userView, "customer:view");
    const canViewProcessRoutes = hasPermission(userView, "process:view");
    const canViewBarcodeRules = hasPermission(userView, "barcode:view");
    const canViewEquipment = hasPermission(userView, "equipment:view");
    const canViewInventory = hasPermission(userView, "warehouse:view");

    const [
      factories,
      customers,
      processRoutes,
      barcodeRules,
      workOrders,
      traceLots,
      approvals,
      settings,
      equipment,
      inventory,
      exceptions,
      defectTop,
      weeklyOutput,
      monthlyTrend
    ] = await Promise.all([
      listMySqlFactories(userView),
      canViewCustomers ? listMySqlCustomers(userView) : Promise.resolve([]),
      canViewProcessRoutes ? listMySqlProcessRoutes(userView) : Promise.resolve([]),
      canViewBarcodeRules ? listMySqlBarcodeRules() : Promise.resolve([]),
      canViewWorkOrders ? listMySqlWorkOrders(userView) : Promise.resolve([]),
      canViewTrace ? listMySqlTraceLots(userView) : Promise.resolve([]),
      canViewApprovals ? listMySqlApprovals(userView) : Promise.resolve([]),
      canViewSettings ? listMySqlSettings() : Promise.resolve([]),
      canViewEquipment ? listMySqlEquipment(userView) : Promise.resolve([]),
      canViewInventory ? listMySqlInventory(userView) : Promise.resolve([]),
      canViewDashboard ? listMySqlExceptions(userView) : Promise.resolve([]),
      canViewDashboard ? listMySqlDefectTop(userView) : Promise.resolve([]),
      canViewDashboard ? listMySqlWeeklyOutput(userView) : Promise.resolve([]),
      canViewDashboard ? listMySqlMonthlyTrend(userView) : Promise.resolve([])
    ]);

    return {
      ...baseData,
      factories: factories.length ? factories : baseData.factories,
      customers,
      processRoutes,
      barcodeRules,
      workOrders,
      traceLots,
      approvals,
      settings,
      equipment,
      inventory,
      exceptions,
      defectTop,
      weeklyOutput,
      monthlyTrend
    };
  }

  async function buildAuthPayload(user) {
    return {
      version: db.version,
      user: buildUserView(user),
      data: await buildClientData(user)
    };
  }

  async function login({ username, password, factory }, requestContext = {}) {
    const normalizedFactory = String(factory || "").trim();
    const normalizedUsername = String(username || "").trim();
    const lockMessage = loginLockout.getLockMessage(normalizedUsername, normalizedFactory);

    if (lockMessage) {
      recordAudit("auth.login_blocked", null, normalizedUsername, `用户 ${normalizedUsername} 登录被临时锁定`, {
        persistRuntime: true
      });
      return {
        error: lockMessage,
        code: "auth_locked"
      };
    }

    let user = null;

    if (isMySqlBackplaneEnabled()) {
      const mySqlUser = await findMySqlUserByLogin({
        username: normalizedUsername,
        factory: normalizedFactory
      });

      if (mySqlUser && mySqlUser.status === "active" && verifyPassword(password, mySqlUser.passwordHash)) {
        user = {
          id: mySqlUser.id,
          username: mySqlUser.username,
          name: mySqlUser.name,
          roleCode: mySqlUser.roleCode,
          role: mySqlUser.role,
          dept: mySqlUser.dept,
          factoryCode: mySqlUser.factoryCode,
          factory: mySqlUser.factory,
          permissionCodes: mySqlUser.permissionCodes,
          status: mySqlUser.status
        };

        await touchMySqlUserLastLogin(user.id);
      }
    } else {
      user = db.users.find((item) => {
        if (item.status !== "active") {
          return false;
        }

        const matchedFactory =
          !normalizedFactory ||
          item.factory === normalizedFactory ||
          item.factoryCode === normalizedFactory;

        return item.username === normalizedUsername && matchedFactory && verifyPassword(password, item.passwordHash);
      });
    }

    if (!user) {
      const failureState = loginLockout.registerFailure(normalizedUsername, normalizedFactory);
      recordAudit(
        "auth.login_failed",
        null,
        normalizedUsername,
        `用户 ${normalizedUsername} 登录失败，累计失败 ${failureState.count} 次`,
        { persistRuntime: true }
      );

      if (failureState.lockedUntil) {
        return {
          error: loginLockout.getLockMessage(normalizedUsername, normalizedFactory),
          code: "auth_locked"
        };
      }

      return null;
    }

    loginLockout.clearFailures(normalizedUsername, normalizedFactory);

    const tokens = await issueAuthTokens(user, requestContext);

    recordAudit("auth.login", user, user.id, `用户 ${user.username} 登录成功`, {
      persistRuntime: true
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      session: tokens.session,
      ...(await buildAuthPayload(user))
    };
  }

  async function resolveSession(token) {
    if (!token) {
      return null;
    }

    let payload = null;
    try {
      payload = verifyJwt(token);
    } catch (error) {
      return null;
    }

    if (payload.tokenType !== "access" || !payload.sid) {
      return null;
    }

    const authSession = await authSessionStore.getAuthSession(payload.sid);
    if (!authSession || authSession.userId !== payload.sub) {
      return null;
    }

    let user = null;

    if (isMySqlBackplaneEnabled()) {
      user = await findMySqlUserById(payload.sub);
    } else {
      user = db.users.find((item) => item.id === payload.sub) || null;
    }

    if (!user || user.status !== "active") {
      return null;
    }

    const touchedSession = {
      ...authSession,
      lastSeenAt: now(),
      accessExpiresAt: toDateTimeString(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000)
    };
    await authSessionStore.saveAuthSession(touchedSession);

    return {
      token,
      payload,
      user,
      userView: buildUserView(user),
      session: buildSessionPayload(
        touchedSession.sessionId,
        touchedSession.accessExpiresAt,
        touchedSession.refreshExpiresAt,
        touchedSession.rotationCount
      )
    };
  }

  async function checkReadiness() {
    if (!isMySqlBackplaneEnabled()) {
      return {
        ok: true,
        driver: "memory",
        database: "n/a"
      };
    }

    const dbReady = await pingMySql();

    return {
      ok: dbReady,
      driver: "mysql",
      database: dbReady ? "reachable" : "unreachable"
    };
  }

  async function refreshSession(refreshToken, requestContext = {}) {
    if (!refreshToken) {
      return null;
    }

    let payload = null;
    try {
      payload = verifyJwt(refreshToken);
    } catch (error) {
      return null;
    }

    if (payload.tokenType !== "refresh" || !payload.sid || !payload.jti) {
      return null;
    }

    const authSession = await authSessionStore.getAuthSession(payload.sid);
    if (!authSession || authSession.userId !== payload.sub || authSession.refreshJti !== payload.jti) {
      return null;
    }

    let user = null;
    if (isMySqlBackplaneEnabled()) {
      user = await findMySqlUserById(payload.sub);
    } else {
      user = db.users.find((item) => item.id === payload.sub) || null;
    }

    if (!user || user.status !== "active") {
      return null;
    }

    const nextRefreshJti = randomHex(16);
    const nextAccessExpiresAt = toDateTimeString(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
    const nextRefreshExpiresAt = toDateTimeString(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
    const nextSession = {
      ...authSession,
      refreshJti: nextRefreshJti,
      userAgent: requestContext.userAgent || authSession.userAgent,
      ipAddress: requestContext.ipAddress || authSession.ipAddress,
      lastSeenAt: now(),
      accessExpiresAt: nextAccessExpiresAt,
      refreshExpiresAt: nextRefreshExpiresAt,
      rotationCount: Number(authSession.rotationCount || 0) + 1,
      revokedAt: "",
      status: "active"
    };

    await authSessionStore.saveAuthSession(nextSession);

    recordAudit("auth.refresh", user, user.id, `用户 ${user.username} 刷新登录态`, {
      persistRuntime: true
    });

    return {
      accessToken: issueAccessToken(user, nextSession.sessionId),
      refreshToken: issueRefreshToken(user, nextSession.sessionId, nextRefreshJti),
      session: buildSessionPayload(nextSession.sessionId, nextAccessExpiresAt, nextRefreshExpiresAt, nextSession.rotationCount),
      user: buildUserView(user)
    };
  }

  async function logout({ accessToken, refreshToken } = {}) {
    let sessionId = "";
    let userId = "";

    try {
      const payload = verifyJwt(accessToken || "");
      if (payload.tokenType === "access") {
        sessionId = payload.sid || "";
        userId = payload.sub || "";
      }
    } catch (error) {
    }

    if (!sessionId) {
      try {
        const payload = verifyJwt(refreshToken || "");
        if (payload.tokenType === "refresh") {
          sessionId = payload.sid || "";
          userId = payload.sub || "";
        }
      } catch (error) {
      }
    }

    if (sessionId) {
      await authSessionStore.revokeAuthSession(sessionId);
    }

    if (userId) {
      let user = null;
      if (isMySqlBackplaneEnabled()) {
        user = await findMySqlUserById(userId);
      } else {
        user = db.users.find((item) => item.id === userId) || null;
      }

      if (user) {
        recordAudit("auth.logout", user, user.id, `用户 ${user.username} 退出登录`, {
          persistRuntime: true
        });
      }
    }
  }

  async function logoutAll(user) {
    await authSessionStore.revokeAuthSessionsByUser(user?.id || "");
    if (user) {
      recordAudit("auth.logout_all", user, user.id, `用户 ${user.username} 退出全部登录会话`, {
        persistRuntime: true
      });
    }
  }

  async function getDashboardPayload(user) {
    return buildDashboardPayload(await buildClientData(user));
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

  async function getScopedWorkOrders(user) {
    return (await buildClientData(user)).workOrders || [];
  }

  async function listWorkOrders(user, filters = {}) {
    const status = normalizeWorkOrderStatusFilter(filters.status);
    const workOrders = await getScopedWorkOrders(user);

    return clone(
      workOrders.filter((item) => {
        if (!status) {
          return true;
        }

        return item.status === status;
      })
    );
  }

  async function getWorkOrderById(user, id) {
    const workOrder = (await getScopedWorkOrders(user)).find((item) => item.id === id);
    return workOrder ? clone(workOrder) : null;
  }

  async function searchTrace(user, query) {
    const keyword = String(query || "").trim().toLowerCase();
    if (!keyword) {
      return null;
    }

    const trace = (((await buildClientData(user)).traceLots) || []).find((item) => {
      return [item.keyword, item.orderId, item.product].some((part) =>
        String(part || "")
          .toLowerCase()
          .includes(keyword)
      );
    });

    return trace ? clone(trace) : null;
  }

  async function listBarcodeRules(user) {
    if (!hasPermission(buildUserView(user), "barcode:view")) {
      return [];
    }

    if (isMySqlBackplaneEnabled()) {
      return clone(await listMySqlBarcodeRules());
    }

    return clone(db.barcodeRules);
  }

  function canAccessFactoryScopedRecord(user, factoryCode) {
    if (isSuperAdmin(user)) {
      return true;
    }

    return String(factoryCode || "") === String(user?.factoryCode || "");
  }

  async function issueBarcode({ ruleCode, workOrderId, quantity, operator, actor }) {
    if (isMySqlBackplaneEnabled()) {
      const result = await issueMySqlBarcode({ ruleCode, workOrderId, quantity, operator, actor });
      if (!result.error) {
        recordAudit(
          "barcode.issue",
          actor || (operator ? { id: "", name: operator } : null),
          workOrderId,
          `按规则 ${ruleCode} 为工单 ${workOrderId} 签发 ${result.items.length} 个条码`,
          { persistRuntime: true }
        );
      }

      return result;
    }

    const user = actor || null;
    const rule = db.barcodeRules.find((item) => item.ruleCode === ruleCode);
    if (!rule) {
      return { error: "未找到条码规则" };
    }

    const workOrder = isMySqlBackplaneEnabled()
      ? await getWorkOrderById(user || actor, workOrderId)
      : db.workOrders.find((item) => item.id === workOrderId);
    if (!workOrder) {
      return { error: "未找到工单" };
    }

    if (user && !canAccessFactoryScopedRecord(user, workOrder.factoryCode)) {
      return { error: "当前账号没有签发该工厂条码的权限" };
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
      user || (operator ? { id: "", name: operator } : null),
      workOrder.id,
      `按规则 ${rule.ruleCode} 为工单 ${workOrder.id} 签发 ${count} 个条码`
    );
    saveRuntimeState();

    return {
      rule: clone(rule),
      items: clone(items)
    };
  }

  async function listApprovals(user) {
    if (isMySqlBackplaneEnabled()) {
      return clone(await listMySqlApprovals(buildUserView(user)));
    }

    return clone((await buildClientData(user)).approvals || []);
  }

  async function decideApproval(id, decision, actor) {
    if (isMySqlBackplaneEnabled()) {
      const item = await decideMySqlApproval(id, decision, actor);
      if (!item) {
        return null;
      }

      recordAudit(
        "approval.decision",
        actor,
        item.id,
        `${item.title} 被${decision === "approved" ? "通过" : "驳回"}`,
        { persistRuntime: true }
      );
      return item;
    }

    const approval = db.approvals.find((item) => item.id === id);
    if (!approval) {
      return null;
    }

    if (!canAccessFactoryScopedRecord(actor, approval.factoryCode)) {
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

  async function listSettings(user) {
    if (!hasPermission(buildUserView(user), "settings:view")) {
      return [];
    }

    if (isMySqlBackplaneEnabled()) {
      return clone(await listMySqlSettings());
    }

    return clone(db.settings);
  }

  async function toggleSetting(key, actor) {
    if (isMySqlBackplaneEnabled()) {
      const item = await toggleMySqlSetting(key, actor);
      if (!item) {
        return null;
      }

      recordAudit("settings.toggle", actor, key, `${item.title} 切换为 ${item.enabled ? "启用" : "停用"}`, {
        persistRuntime: true
      });
      return item;
    }

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
    logoutAll,
    refreshSession,
    checkReadiness,
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
