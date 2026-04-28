const { spawn } = require("child_process");
const mysql = require("mysql2/promise");
const { getDbConfig } = require("./db-env");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(outputRef, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (outputRef.stdout.includes("MES server is running")) {
      return;
    }

    await wait(250);
  }

  throw new Error("server_start_timeout");
}

async function request(url, options = {}) {
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
    ok: response.ok,
    status: response.status,
    data
  };
}

async function runMySqlSmoke({ port = 3011 } = {}) {
  const outputRef = {
    stdout: "",
    stderr: ""
  };

  const server = spawn(process.execPath, ["server/index.js", String(port)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  server.stdout.on("data", (chunk) => {
    outputRef.stdout += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    outputRef.stderr += chunk.toString();
  });

  try {
    await waitForServer(outputRef);

    const login = await request(`http://127.0.0.1:${port}/api/auth/login`, {
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

    if (!login.ok || !login.data?.user?.username) {
      throw new Error(`login_failed:${JSON.stringify(login.data)}`);
    }

    const authCookie = login.response.headers.get("set-cookie")?.split(";")[0] || "";

    const [me, bootstrap, dashboard, workOrders, trace, approvals, settings] = await Promise.all([
      request(`http://127.0.0.1:${port}/api/auth/me`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/bootstrap`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/dashboard`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/work-orders`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/traceability/search?q=LOT-240418-03`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/approvals`, { headers: { Cookie: authCookie } }),
      request(`http://127.0.0.1:${port}/api/settings`, { headers: { Cookie: authCookie } })
    ]);

    const plannerLogin = await request(`http://127.0.0.1:${port}/api/auth/login`, {
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

    if (!plannerLogin.ok || !plannerLogin.data?.user?.username) {
      throw new Error(`planner_login_failed:${JSON.stringify(plannerLogin.data)}`);
    }

    const plannerCookie = plannerLogin.response.headers.get("set-cookie")?.split(";")[0] || "";

    const [plannerBootstrap, plannerSettings] = await Promise.all([
      request(`http://127.0.0.1:${port}/api/bootstrap`, { headers: { Cookie: plannerCookie } }),
      request(`http://127.0.0.1:${port}/api/settings`, { headers: { Cookie: plannerCookie } })
    ]);

    const pool = await mysql.createPool(getDbConfig());

    try {
      const [statsRows] = await pool.query(
        `
          SELECT
            (SELECT COUNT(*) FROM mes_work_orders) AS workOrderCount,
            (SELECT COUNT(*) FROM mes_equipment) AS equipmentCount,
            (SELECT COUNT(*) FROM mes_inventory_items) AS inventoryCount,
            (SELECT COUNT(*) FROM mes_exception_tickets) AS exceptionCount,
            (SELECT COUNT(*) FROM mes_work_order_logs WHERE event_type = 'defect') AS defectLogCount,
            (SELECT COUNT(*) FROM mes_work_order_logs WHERE event_type = 'production_report') AS productionReportCount
        `
      );

      const stats = statsRows[0] || {};

      return {
        api: {
          loginUser: login.data.user.username,
          meFactories: me.data?.data?.factories?.length || 0,
          bootstrap: {
            workOrders: bootstrap.data?.data?.workOrders?.length || 0,
            customers: bootstrap.data?.data?.customers?.length || 0,
            equipment: bootstrap.data?.data?.equipment?.length || 0,
            inventory: bootstrap.data?.data?.inventory?.length || 0,
            exceptions: bootstrap.data?.data?.exceptions?.length || 0,
            weeklyOutput: bootstrap.data?.data?.weeklyOutput?.length || 0,
            monthlyTrend: bootstrap.data?.data?.monthlyTrend?.length || 0
          },
          dashboard: {
            totalOrders: dashboard.data?.summary?.totalOrders || 0,
            defectTop: dashboard.data?.defectTop?.length || 0,
            weeklyOutput: dashboard.data?.weeklyOutput?.length || 0,
            monthlyTrend: dashboard.data?.monthlyTrend?.length || 0
          },
          workOrders: workOrders.data?.items?.length || 0,
          traceHit: trace.data?.item?.keyword || "",
          approvals: approvals.data?.items?.length || 0,
          settings: settings.data?.items?.length || 0,
          planner: {
            factories: plannerBootstrap.data?.data?.factories?.map((item) => item.code) || [],
            workOrders: plannerBootstrap.data?.data?.workOrders?.map((item) => `${item.id}:${item.factoryCode}`) || [],
            settingsStatus: plannerSettings.status
          }
        },
        database: {
          workOrderCount: Number(stats.workOrderCount || 0),
          equipmentCount: Number(stats.equipmentCount || 0),
          inventoryCount: Number(stats.inventoryCount || 0),
          exceptionCount: Number(stats.exceptionCount || 0),
          defectLogCount: Number(stats.defectLogCount || 0),
          productionReportCount: Number(stats.productionReportCount || 0)
        },
        server: {
          stdout: outputRef.stdout.trim(),
          stderr: outputRef.stderr.trim()
        }
      };
    } finally {
      await pool.end();
    }
  } finally {
    server.kill("SIGTERM");
    await wait(300);

    if (!server.killed) {
      server.kill("SIGKILL");
    }
  }
}

if (require.main === module) {
  runMySqlSmoke()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exitCode = 1;
    });
}

module.exports = {
  runMySqlSmoke
};
