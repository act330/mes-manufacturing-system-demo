const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { seedData } = require("./mes-seed");
const {
  appendMySqlAuditLog,
  findMySqlUserById,
  findMySqlUserByLogin,
  getMySqlAuthSession,
  isMySqlBackplaneEnabled,
  listMySqlAuthSessionsByUser,
  pingMySql,
  revokeMySqlAuthSession,
  revokeMySqlAuthSessionsByUser,
  saveMySqlAuthSession,
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
  DEFAULT_JWT_SECRET,
  MAX_ACTIVE_SESSIONS,
  REFRESH_TOKEN_TTL_SECONDS,
  SESSION_IDLE_TIMEOUT_SECONDS,
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_FAILURES
} = require("./runtime-config");

const runtimeDir = path.join(__dirname, "..", "data");
const runtimeFile = path.join(runtimeDir, "runtime-store.json");
const JWT_SECRET = process.env.MES_JWT_SECRET || DEFAULT_JWT_SECRET;
const PASSWORD_HASH_PREFIX = "scrypt";

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
  db.authSessions = Array.isArray(db.authSessions) ? db.authSessions : [];
  const authSessions = new Map(
    db.authSessions.map((item) => [String(item?.sessionId || ""), { ...item }]).filter((item) => item[0])
  );
  const failedLoginAttempts = new Map();

  function saveRuntimeState() {
    db.authSessions = Array.from(authSessions.values());
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

  function toDateTimeString(date) {
    return new Date(date).toISOString().slice(0, 19).replace("T", " ");
  }

  function parseDateTimeValue(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return 0;
    }

    const parsed = Date.parse(raw.replace(" ", "T"));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function isSessionExpired(session) {
    const nowMs = Date.now();
    const refreshExpiresAt = parseDateTimeValue(session?.refreshExpiresAt);
    const lastSeenAt = parseDateTimeValue(session?.lastSeenAt);

    if (!refreshExpiresAt || refreshExpiresAt <= nowMs) {
      return true;
    }

    if (lastSeenAt && lastSeenAt + SESSION_IDLE_TIMEOUT_SECONDS * 1000 <= nowMs) {
      return true;
    }

    return false;
  }

  function buildSessionRecord({
    sessionId,
    userId,
    refreshJti,
    userAgent,
    ipAddress,
    accessExpiresAt,
    refreshExpiresAt,
    rotationCount = 0
  }) {
    const createdAt = now();

    return {
      sessionId,
      userId,
      refreshJti,
      status: "active",
      userAgent: String(userAgent || "").slice(0, 255),
      ipAddress: String(ipAddress || "").slice(0, 64),
      createdAt,
      lastSeenAt: createdAt,
      accessExpiresAt,
      refreshExpiresAt,
      rotationCount,
      revokedAt: ""
    };
  }

  function getMemorySession(sessionId) {
    const session = authSessions.get(String(sessionId || ""));
    if (!session) {
      return null;
    }

    if (session.status !== "active" || isSessionExpired(session)) {
      authSessions.delete(String(sessionId || ""));
      return null;
    }

    return { ...session };
  }

  async function getAuthSession(sessionId) {
    if (isMySqlBackplaneEnabled()) {
      const session = await getMySqlAuthSession(String(sessionId || ""));
      if (!session || session.status !== "active" || isSessionExpired(session)) {
        if (session?.sessionId) {
          await revokeMySqlAuthSession(session.sessionId, now());
        }
        return null;
      }

      return session;
    }

    return getMemorySession(sessionId);
  }

  async function saveAuthSession(session) {
    if (isMySqlBackplaneEnabled()) {
      await saveMySqlAuthSession(session);
      return;
    }

    authSessions.set(session.sessionId, { ...session });
    saveRuntimeState();
  }

  async function revokeAuthSession(sessionId) {
    if (!sessionId) {
      return;
    }

    if (isMySqlBackplaneEnabled()) {
      await revokeMySqlAuthSession(String(sessionId), now());
      return;
    }

    const existing = authSessions.get(String(sessionId));
    if (!existing) {
      return;
    }

    authSessions.set(String(sessionId), {
      ...existing,
      status: "revoked",
      revokedAt: now(),
      lastSeenAt: now()
    });
    saveRuntimeState();
  }

  async function revokeAuthSessionsByUser(userId) {
    if (!userId) {
      return;
    }

    if (isMySqlBackplaneEnabled()) {
      await revokeMySqlAuthSessionsByUser(String(userId), now());
      return;
    }

    for (const [sessionId, session] of authSessions.entries()) {
      if (session.userId === userId && session.status === "active") {
        authSessions.set(sessionId, {
          ...session,
          status: "revoked",
          revokedAt: now(),
          lastSeenAt: now()
        });
      }
    }
    saveRuntimeState();
  }

  async function listActiveSessionsByUser(userId) {
    if (isMySqlBackplaneEnabled()) {
      const sessions = await listMySqlAuthSessionsByUser(String(userId || ""));
      return sessions.filter((item) => item.status === "active" && !isSessionExpired(item));
    }

    return Array.from(authSessions.values()).filter(
      (item) => item.userId === userId && item.status === "active" && !isSessionExpired(item)
    );
  }

  async function enforceSessionLimit(userId) {
    const sessions = await listActiveSessionsByUser(userId);
    if (sessions.length <= MAX_ACTIVE_SESSIONS) {
      return;
    }

    const sorted = [...sessions].sort((left, right) => parseDateTimeValue(left.createdAt) - parseDateTimeValue(right.createdAt));
    const overLimit = sorted.slice(0, Math.max(0, sorted.length - MAX_ACTIVE_SESSIONS));

    for (const session of overLimit) {
      await revokeAuthSession(session.sessionId);
    }
  }

  function getLoginAttemptKey(username, factory) {
    return `${String(username || "").trim().toLowerCase()}::${String(factory || "").trim().toUpperCase()}`;
  }

  function getFreshLoginAttemptState(key) {
    const state = failedLoginAttempts.get(key);
    if (!state) {
      return null;
    }

    if (state.lockedUntil && state.lockedUntil <= Date.now()) {
      failedLoginAttempts.delete(key);
      return null;
    }

    return state;
  }

  function registerLoginFailure(username, factory) {
    const key = getLoginAttemptKey(username, factory);
    const state = getFreshLoginAttemptState(key) || {
      count: 0,
      lockedUntil: 0
    };

    state.count += 1;

    if (state.count >= LOGIN_MAX_FAILURES) {
      state.lockedUntil = Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000;
    }

    failedLoginAttempts.set(key, state);
    return state;
  }

  function clearLoginFailures(username, factory) {
    failedLoginAttempts.delete(getLoginAttemptKey(username, factory));
  }

  function getLoginLockMessage(username, factory) {
    const state = getFreshLoginAttemptState(getLoginAttemptKey(username, factory));
    if (!state?.lockedUntil) {
      return "";
    }

    const remainingMinutes = Math.max(1, Math.ceil((state.lockedUntil - Date.now()) / (60 * 1000)));
    return `登录失败次数过多，请在 ${remainingMinutes} 分钟后重试。`;
  }

  function issueAccessToken(user, sessionId) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + ACCESS_TOKEN_TTL_SECONDS;

    return signJwt({
      sub: user.id,
      tokenType: "access",
      sid: sessionId,
      username: user.username,
      roleCode: user.roleCode,
      factoryCode: user.factoryCode,
      iat: issuedAt,
      exp: expiresAt
    });
  }

  function issueRefreshToken(user, sessionId, refreshJti) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + REFRESH_TOKEN_TTL_SECONDS;

    return signJwt({
      sub: user.id,
      tokenType: "refresh",
      sid: sessionId,
      username: user.username,
      roleCode: user.roleCode,
      factoryCode: user.factoryCode,
      iat: issuedAt,
      exp: expiresAt,
      jti: refreshJti
    });
  }

  function buildSessionPayload(sessionId, accessExpiresAt, refreshExpiresAt, rotationCount = 0) {
    return {
      sessionId,
      accessExpiresAt,
      refreshExpiresAt,
      idleTimeoutSeconds: SESSION_IDLE_TIMEOUT_SECONDS,
      rotationCount
    };
  }

  async function issueAuthTokens(user, requestContext = {}) {
    const sessionId = crypto.randomBytes(16).toString("hex");
    const refreshJti = crypto.randomBytes(16).toString("hex");
    const accessExpiresAt = toDateTimeString(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
    const refreshExpiresAt = toDateTimeString(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

    const session = buildSessionRecord({
      sessionId,
      userId: user.id,
      refreshJti,
      userAgent: requestContext.userAgent,
      ipAddress: requestContext.ipAddress,
      accessExpiresAt,
      refreshExpiresAt
    });

    await saveAuthSession(session);
    await enforceSessionLimit(user.id);

    return {
      accessToken: issueAccessToken(user, sessionId),
      refreshToken: issueRefreshToken(user, sessionId, refreshJti),
      session: buildSessionPayload(sessionId, accessExpiresAt, refreshExpiresAt, session.rotationCount)
    };
  }

  const userChanged = migrateUsers();
  const scopedFieldChanged = backfillScopedFields();

  if (userChanged || scopedFieldChanged) {
    saveRuntimeState();
  }

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

  function getPermissionsForUser(user) {
    if (Array.isArray(user?.permissionCodes) && user.permissionCodes.length) {
      return [...user.permissionCodes];
    }

    if (Array.isArray(user?.permissions) && user.permissions.length) {
      return [...user.permissions];
    }

    return getPermissionsByRole(user?.roleCode);
  }

  function buildUserView(user) {
    const role = getRole(user.roleCode);
    const permissions = getPermissionsForUser(user);
    const availableModules = db.moduleRegistry
      .filter((item) => !item.permission || permissions.includes(item.permission))
      .map((item) => item.key);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role || (role ? role.name : user.roleCode),
      roleCode: user.roleCode,
      dept: user.dept,
      factory: user.factory,
      factoryCode: user.factoryCode,
      permissions,
      modules: availableModules
    };
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
    const lockMessage = getLoginLockMessage(normalizedUsername, normalizedFactory);

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
      const failureState = registerLoginFailure(normalizedUsername, normalizedFactory);
      recordAudit(
        "auth.login_failed",
        null,
        normalizedUsername,
        `用户 ${normalizedUsername} 登录失败，累计失败 ${failureState.count} 次`,
        { persistRuntime: true }
      );

      if (failureState.lockedUntil) {
        return {
          error: getLoginLockMessage(normalizedUsername, normalizedFactory),
          code: "auth_locked"
        };
      }

      return null;
    }

    clearLoginFailures(normalizedUsername, normalizedFactory);

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

    const authSession = await getAuthSession(payload.sid);
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
    await saveAuthSession(touchedSession);

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

    const authSession = await getAuthSession(payload.sid);
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

    const nextRefreshJti = crypto.randomBytes(16).toString("hex");
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

    await saveAuthSession(nextSession);

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
      await revokeAuthSession(sessionId);
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
    await revokeAuthSessionsByUser(user?.id || "");
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
