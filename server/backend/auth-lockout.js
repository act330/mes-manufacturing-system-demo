const {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_FAILURES
} = require("./runtime-config");

function createLoginLockout({
  maxFailures = LOGIN_MAX_FAILURES,
  lockoutMinutes = LOGIN_LOCKOUT_MINUTES
} = {}) {
  const failedLoginAttempts = new Map();

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

  function registerFailure(username, factory) {
    const key = getLoginAttemptKey(username, factory);
    const state = getFreshLoginAttemptState(key) || {
      count: 0,
      lockedUntil: 0
    };

    state.count += 1;

    if (state.count >= maxFailures) {
      state.lockedUntil = Date.now() + lockoutMinutes * 60 * 1000;
    }

    failedLoginAttempts.set(key, state);
    return state;
  }

  function clearFailures(username, factory) {
    failedLoginAttempts.delete(getLoginAttemptKey(username, factory));
  }

  function getLockMessage(username, factory) {
    const state = getFreshLoginAttemptState(getLoginAttemptKey(username, factory));
    if (!state?.lockedUntil) {
      return "";
    }

    const remainingMinutes = Math.max(1, Math.ceil((state.lockedUntil - Date.now()) / (60 * 1000)));
    return `登录失败次数过多，请在 ${remainingMinutes} 分钟后重试。`;
  }

  return {
    clearFailures,
    getLockMessage,
    registerFailure
  };
}

module.exports = {
  createLoginLockout
};
