import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer({
  port,
  env = {}
}) {
  const projectRoot = process.cwd();
  const server = spawn(process.execPath, ["server/index.js", String(port)], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: "test",
      MES_DATA_DRIVER: "memory",
      MES_JWT_SECRET: "test-secret-value",
      MES_REQUEST_LOG: "false",
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";

  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    if (stdout.includes("MES server is running")) {
      return {
        server,
        stdout,
        stderr
      };
    }

    await wait(200);
  }

  server.kill("SIGTERM");
  throw new Error(`server_start_timeout:${stdout}:${stderr}`);
}

async function stopServer(instance) {
  if (!instance?.server) {
    return;
  }

  instance.server.kill("SIGTERM");
  await wait(300);

  if (!instance.server.killed) {
    instance.server.kill("SIGKILL");
  }
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    data = { raw: text };
  }

  return {
    response,
    data
  };
}

function getCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const value = response.headers.get("set-cookie");
  return value ? [value] : [];
}

function getCookieMap(response) {
  return getCookieHeaders(response).reduce((cookies, item) => {
    const [pair] = String(item || "").split(";");
    const [key, ...valueParts] = pair.split("=");
    cookies[String(key || "").trim()] = valueParts.join("=").trim();
    return cookies;
  }, {});
}

test("login sets auth cookie and cookie grants access to protected endpoints", async () => {
  const port = 3111;
  const instance = await startServer({ port });

  try {
    const { response, data } = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "admin",
        password: "123456",
        factory: "FAC-001"
      })
    });

    assert.equal(response.status, 200);
    assert.equal(data.user.username, "admin");

    const setCookie = getCookieHeaders(response).join(", ");
    assert.ok(setCookie);
    assert.match(setCookie, /mes_session=/);

    const authCookies = getCookieMap(response);
    const cookieHeader = Object.entries(authCookies).map(([key, value]) => `${key}=${value}`).join("; ");

    const me = await jsonRequest(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: {
        Cookie: cookieHeader
      }
    });
    assert.equal(me.response.status, 200);
    assert.equal(me.data.user.username, "admin");

    const plannerLogin = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "planner",
        password: "123456",
        factory: "FAC-002"
      })
    });

    const plannerCookie = plannerLogin.response.headers.get("set-cookie").split(";")[0];
    const plannerSettings = await jsonRequest(`http://127.0.0.1:${port}/api/settings`, {
      headers: {
        Cookie: plannerCookie
      }
    });

    assert.equal(plannerSettings.response.status, 403);
    assert.equal(plannerSettings.data.permission, "settings:view");

    const logout = await jsonRequest(`http://127.0.0.1:${port}/api/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: cookieHeader
      }
    });
    assert.equal(logout.response.status, 200);
    assert.match(logout.response.headers.get("set-cookie"), /Max-Age=0/);

    const meAfterLogout = await jsonRequest(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: {
        Cookie: getCookieHeaders(logout.response)[0].split(";")[0]
      }
    });
    assert.equal(meAfterLogout.response.status, 401);
  } finally {
    await stopServer(instance);
  }
});

test("refresh endpoint rotates cookies and old refresh token becomes invalid", async () => {
  const port = 3114;
  const instance = await startServer({ port });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "admin",
        password: "123456",
        factory: "FAC-001"
      })
    });

    const cookies = getCookieMap(login.response);
    const refreshRequestCookie = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join("; ");

    const refreshed = await jsonRequest(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshRequestCookie
      }
    });

    assert.equal(refreshed.response.status, 200);
    assert.ok(getCookieHeaders(refreshed.response).length >= 2);

    const invalidRefresh = await jsonRequest(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Cookie: refreshRequestCookie
      }
    });

    assert.equal(invalidRefresh.response.status, 401);
    assert.equal(invalidRefresh.data.code, "refresh_failed");
  } finally {
    await stopServer(instance);
  }
});

test("repeated failed logins trigger temporary lockout", async () => {
  const port = 3112;
  const instance = await startServer({
    port,
    env: {
      MES_LOGIN_MAX_FAILURES: "2",
      MES_LOGIN_LOCKOUT_MINUTES: "1"
    }
  });

  try {
    const badLoginBody = JSON.stringify({
      username: "admin",
      password: "wrong-password",
      factory: "FAC-001"
    });

    const first = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: badLoginBody
    });
    assert.equal(first.response.status, 401);

    const second = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: badLoginBody
    });
    assert.equal(second.response.status, 429);
    assert.equal(second.data.code, "auth_locked");

    const third = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: badLoginBody
    });
    assert.equal(third.response.status, 429);
    assert.equal(third.data.code, "auth_locked");
  } finally {
    await stopServer(instance);
  }
});

test("readiness endpoint reports memory mode healthy", async () => {
  const port = 3113;
  const instance = await startServer({ port });

  try {
    const ready = await jsonRequest(`http://127.0.0.1:${port}/api/health/ready`);
    assert.equal(ready.response.status, 200);
    assert.equal(ready.data.ok, true);
    assert.equal(ready.data.driver, "memory");
  } finally {
    await stopServer(instance);
  }
});

test("logout-all invalidates every active session for the same user", async () => {
  const port = 3115;
  const instance = await startServer({ port });

  try {
    const loginA = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const loginB = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });

    const cookieA = Object.entries(getCookieMap(loginA.response)).map(([key, value]) => `${key}=${value}`).join("; ");
    const cookieB = Object.entries(getCookieMap(loginB.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const logoutAll = await jsonRequest(`http://127.0.0.1:${port}/api/auth/logout-all`, {
      method: "POST",
      headers: {
        Cookie: cookieA
      }
    });
    assert.equal(logoutAll.response.status, 200);

    const meA = await jsonRequest(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { Cookie: cookieA }
    });
    const meB = await jsonRequest(`http://127.0.0.1:${port}/api/auth/me`, {
      headers: { Cookie: cookieB }
    });

    assert.equal(meA.response.status, 401);
    assert.equal(meB.response.status, 401);
  } finally {
    await stopServer(instance);
  }
});

test("sso provider endpoint is reserved even when not configured", async () => {
  const port = 3116;
  const instance = await startServer({ port });

  try {
    const providers = await jsonRequest(`http://127.0.0.1:${port}/api/auth/sso/providers`);
    assert.equal(providers.response.status, 200);
    assert.equal(Array.isArray(providers.data.items), true);

    const start = await jsonRequest(`http://127.0.0.1:${port}/api/auth/sso/start`);
    assert.equal(start.response.status, 501);
    assert.equal(start.data.code, "sso_not_configured");
  } finally {
    await stopServer(instance);
  }
});
