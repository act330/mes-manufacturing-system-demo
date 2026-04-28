const {
  getMySqlAuthSession,
  isMySqlBackplaneEnabled,
  listMySqlAuthSessionsByUser,
  revokeMySqlAuthSession,
  revokeMySqlAuthSessionsByUser,
  saveMySqlAuthSession
} = require("./mysql-auth");
const { isSessionExpired, now, parseDateTimeValue } = require("./auth-session");
const { MAX_ACTIVE_SESSIONS } = require("./runtime-config");

function createAuthSessionStore({ initialSessions = [], persistSessions } = {}) {
  const authSessions = new Map(
    initialSessions.map((item) => [String(item?.sessionId || ""), { ...item }]).filter((item) => item[0])
  );

  function listSessions() {
    return Array.from(authSessions.values()).map((item) => ({ ...item }));
  }

  function persistMemorySessions() {
    if (typeof persistSessions === "function") {
      persistSessions(listSessions());
    }
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
    persistMemorySessions();
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
    persistMemorySessions();
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
    persistMemorySessions();
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

  return {
    enforceSessionLimit,
    getAuthSession,
    listSessions,
    revokeAuthSession,
    revokeAuthSessionsByUser,
    saveAuthSession
  };
}

module.exports = {
  createAuthSessionStore
};
