const DEFAULT_MYSQL_PORT = 3306;

let poolPromise = null;
let authTablesReadyPromise = null;

function isMySqlBackplaneEnabled() {
  const driver = String(process.env.MES_DATA_DRIVER || process.env.MES_AUTH_PROVIDER || "")
    .trim()
    .toLowerCase();

  return driver === "mysql";
}

function parseMySqlUrl() {
  const raw = String(process.env.MES_MYSQL_URL || "").trim();
  if (!raw) {
    return null;
  }

  const url = new URL(raw);

  return {
    host: url.hostname,
    port: Number(url.port || DEFAULT_MYSQL_PORT),
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: url.searchParams.get("ssl") === "true" ? {} : undefined
  };
}

function getConnectionOptions() {
  const parsedUrl = parseMySqlUrl();
  if (parsedUrl) {
    return parsedUrl;
  }

  const host = String(process.env.MES_MYSQL_HOST || "").trim();
  const database = String(process.env.MES_MYSQL_DATABASE || "").trim();
  const user = String(process.env.MES_MYSQL_USER || "").trim();

  if (!host || !database || !user) {
    return null;
  }

  return {
    host,
    port: Number(process.env.MES_MYSQL_PORT || DEFAULT_MYSQL_PORT),
    user,
    password: String(process.env.MES_MYSQL_PASSWORD || ""),
    database,
    ssl: String(process.env.MES_MYSQL_SSL || "").trim().toLowerCase() === "true" ? {} : undefined
  };
}

async function getPool() {
  if (!isMySqlBackplaneEnabled()) {
    return null;
  }

  if (!poolPromise) {
    poolPromise = (async () => {
      const options = getConnectionOptions();
      if (!options) {
        throw new Error("mes_mysql_config_missing");
      }

      const mysql = require("mysql2/promise");

      return mysql.createPool({
        ...options,
        waitForConnections: true,
        connectionLimit: Number(process.env.MES_MYSQL_POOL_SIZE || 10),
        queueLimit: 0,
        charset: "utf8mb4"
      });
    })();
  }

  return poolPromise;
}

async function ensureAuthTables() {
  if (!isMySqlBackplaneEnabled()) {
    return;
  }

  if (!authTablesReadyPromise) {
    authTablesReadyPromise = (async () => {
      const pool = await getPool();
      await pool.query(
        `
          CREATE TABLE IF NOT EXISTS mes_auth_sessions (
            session_id VARCHAR(64) NOT NULL,
            user_code VARCHAR(32) NOT NULL,
            refresh_jti VARCHAR(64) NOT NULL,
            status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
            user_agent VARCHAR(255) DEFAULT NULL,
            ip_address VARCHAR(64) DEFAULT NULL,
            created_at DATETIME NOT NULL,
            last_seen_at DATETIME NOT NULL,
            access_expires_at DATETIME NOT NULL,
            refresh_expires_at DATETIME NOT NULL,
            rotation_count INT NOT NULL DEFAULT 0,
            revoked_at DATETIME DEFAULT NULL,
            PRIMARY KEY (session_id),
            KEY idx_mes_auth_sessions_user_code (user_code),
            KEY idx_mes_auth_sessions_status (status),
            KEY idx_mes_auth_sessions_refresh_jti (refresh_jti)
          ) ENGINE=InnoDB
        `
      );
    })();
  }

  return authTablesReadyPromise;
}

async function query(sql, params = []) {
  if (String(sql || "").includes("mes_auth_sessions")) {
    await ensureAuthTables();
  }

  const pool = await getPool();
  if (!pool) {
    return [];
  }

  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function loadUserRowByClause(columnName, value) {
  const rows = await query(
    `
      SELECT
        u.user_code AS userCode,
        u.username,
        u.password_hash AS passwordHash,
        u.display_name AS name,
        u.status,
        d.dept_name AS dept,
        f.factory_code AS factoryCode,
        f.factory_name AS factoryName
      FROM mes_users u
      LEFT JOIN mes_departments d ON d.id = u.department_id
      LEFT JOIN mes_factories f ON f.id = u.factory_id
      WHERE ${columnName} = ?
      LIMIT 1
    `,
    [value]
  );

  return rows[0] || null;
}

async function loadRolesForUser(userCode) {
  return query(
    `
      SELECT
        r.role_code AS roleCode,
        r.role_name AS roleName
      FROM mes_user_roles ur
      INNER JOIN mes_users u ON u.id = ur.user_id
      INNER JOIN mes_roles r ON r.id = ur.role_id
      WHERE u.user_code = ?
      ORDER BY r.id ASC
    `,
    [userCode]
  );
}

async function loadPermissionsForUser(userCode) {
  const rows = await query(
    `
      SELECT DISTINCT
        p.permission_code AS permissionCode
      FROM mes_user_roles ur
      INNER JOIN mes_users u ON u.id = ur.user_id
      INNER JOIN mes_role_permissions rp ON rp.role_id = ur.role_id
      INNER JOIN mes_permissions p ON p.id = rp.permission_id
      WHERE u.user_code = ?
      ORDER BY p.permission_code ASC
    `,
    [userCode]
  );

  return rows.map((item) => item.permissionCode);
}

function buildUserFromRow(row, roles, permissions) {
  const primaryRole = roles[0] || {};

  return {
    id: row.userCode,
    username: row.username,
    name: row.name,
    roleCode: primaryRole.roleCode || "",
    role: primaryRole.roleName || primaryRole.roleCode || "",
    dept: row.dept || "",
    factoryCode: row.factoryCode || "",
    factory: row.factoryName || "",
    status: row.status,
    permissionCodes: permissions
  };
}

function matchesFactory(user, factory) {
  const normalizedFactory = String(factory || "").trim();

  if (!normalizedFactory) {
    return true;
  }

  return user.factory === normalizedFactory || user.factoryCode === normalizedFactory;
}

async function hydrateUser(row) {
  if (!row) {
    return null;
  }

  const roles = await loadRolesForUser(row.userCode);
  const permissions = await loadPermissionsForUser(row.userCode);

  return buildUserFromRow(row, roles, permissions);
}

async function findMySqlUserByLogin({ username, factory }) {
  const row = await loadUserRowByClause("u.username", String(username || "").trim());
  const user = await hydrateUser(row);

  if (!user || !matchesFactory(user, factory)) {
    return null;
  }

  return {
    ...user,
    passwordHash: row.passwordHash
  };
}

async function findMySqlUserById(userId) {
  const row = await loadUserRowByClause("u.user_code", String(userId || "").trim());
  return hydrateUser(row);
}

async function touchMySqlUserLastLogin(userId) {
  await query(
    `
      UPDATE mes_users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE user_code = ?
    `,
    [String(userId || "").trim()]
  );
}

async function appendMySqlAuditLog(entry) {
  await query(
    `
      INSERT INTO mes_audit_logs (action_code, actor_id, target_code, detail_json, created_at)
      VALUES (
        ?,
        (SELECT u.id FROM mes_users u WHERE u.user_code = ? LIMIT 1),
        ?,
        CAST(? AS JSON),
        ?
      )
    `,
    [
      entry.action,
      String(entry.actorUserCode || ""),
      entry.target || null,
      JSON.stringify(entry.detail || {}),
      entry.time
    ]
  );
}

function mapSessionRow(row) {
  if (!row) {
    return null;
  }

  return {
    sessionId: row.sessionId,
    userId: row.userCode,
    refreshJti: row.refreshJti,
    status: row.status,
    userAgent: row.userAgent || "",
    ipAddress: row.ipAddress || "",
    createdAt: row.createdAt,
    lastSeenAt: row.lastSeenAt,
    accessExpiresAt: row.accessExpiresAt,
    refreshExpiresAt: row.refreshExpiresAt,
    rotationCount: Number(row.rotationCount || 0),
    revokedAt: row.revokedAt || ""
  };
}

async function saveMySqlAuthSession(session) {
  await query(
    `
      INSERT INTO mes_auth_sessions
        (
          session_id,
          user_code,
          refresh_jti,
          status,
          user_agent,
          ip_address,
          created_at,
          last_seen_at,
          access_expires_at,
          refresh_expires_at,
          rotation_count,
          revoked_at
        )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        refresh_jti = VALUES(refresh_jti),
        status = VALUES(status),
        user_agent = VALUES(user_agent),
        ip_address = VALUES(ip_address),
        last_seen_at = VALUES(last_seen_at),
        access_expires_at = VALUES(access_expires_at),
        refresh_expires_at = VALUES(refresh_expires_at),
        rotation_count = VALUES(rotation_count),
        revoked_at = VALUES(revoked_at)
    `,
    [
      session.sessionId,
      session.userId,
      session.refreshJti,
      session.status,
      session.userAgent || "",
      session.ipAddress || "",
      session.createdAt,
      session.lastSeenAt,
      session.accessExpiresAt,
      session.refreshExpiresAt,
      Number(session.rotationCount || 0),
      session.revokedAt || null
    ]
  );
}

async function getMySqlAuthSession(sessionId) {
  const rows = await query(
    `
      SELECT
        session_id AS sessionId,
        user_code AS userCode,
        refresh_jti AS refreshJti,
        status,
        user_agent AS userAgent,
        ip_address AS ipAddress,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(last_seen_at, '%Y-%m-%d %H:%i:%s') AS lastSeenAt,
        DATE_FORMAT(access_expires_at, '%Y-%m-%d %H:%i:%s') AS accessExpiresAt,
        DATE_FORMAT(refresh_expires_at, '%Y-%m-%d %H:%i:%s') AS refreshExpiresAt,
        rotation_count AS rotationCount,
        DATE_FORMAT(revoked_at, '%Y-%m-%d %H:%i:%s') AS revokedAt
      FROM mes_auth_sessions
      WHERE session_id = ?
      LIMIT 1
    `,
    [sessionId]
  );

  return mapSessionRow(rows[0]);
}

async function listMySqlAuthSessionsByUser(userId) {
  const rows = await query(
    `
      SELECT
        session_id AS sessionId,
        user_code AS userCode,
        refresh_jti AS refreshJti,
        status,
        user_agent AS userAgent,
        ip_address AS ipAddress,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(last_seen_at, '%Y-%m-%d %H:%i:%s') AS lastSeenAt,
        DATE_FORMAT(access_expires_at, '%Y-%m-%d %H:%i:%s') AS accessExpiresAt,
        DATE_FORMAT(refresh_expires_at, '%Y-%m-%d %H:%i:%s') AS refreshExpiresAt,
        rotation_count AS rotationCount,
        DATE_FORMAT(revoked_at, '%Y-%m-%d %H:%i:%s') AS revokedAt
      FROM mes_auth_sessions
      WHERE user_code = ?
      ORDER BY created_at ASC
    `,
    [userId]
  );

  return rows.map(mapSessionRow);
}

async function revokeMySqlAuthSession(sessionId, revokedAt) {
  await query(
    `
      UPDATE mes_auth_sessions
      SET
        status = 'revoked',
        revoked_at = ?,
        last_seen_at = ?
      WHERE session_id = ?
    `,
    [revokedAt, revokedAt, sessionId]
  );
}

async function revokeMySqlAuthSessionsByUser(userId, revokedAt) {
  await query(
    `
      UPDATE mes_auth_sessions
      SET
        status = 'revoked',
        revoked_at = ?,
        last_seen_at = ?
      WHERE user_code = ? AND status = 'active'
    `,
    [revokedAt, revokedAt, userId]
  );
}

async function pingMySql() {
  if (!isMySqlBackplaneEnabled()) {
    return true;
  }

  try {
    await query("SELECT 1 AS ok");
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  appendMySqlAuditLog,
  findMySqlUserById,
  findMySqlUserByLogin,
  getPool,
  getMySqlAuthSession,
  isMySqlBackplaneEnabled,
  listMySqlAuthSessionsByUser,
  pingMySql,
  query,
  revokeMySqlAuthSession,
  revokeMySqlAuthSessionsByUser,
  saveMySqlAuthSession,
  touchMySqlUserLastLogin
};
