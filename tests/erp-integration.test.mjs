import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer({
  port,
  env = {}
}) {
  const server = spawn(process.execPath, ["server/index.js", String(port)], {
    cwd: process.cwd(),
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

  server.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  const deadline = Date.now() + 10000;

  while (Date.now() < deadline) {
    if (stdout.includes("MES server is running")) {
      return server;
    }

    await wait(200);
  }

  server.kill("SIGTERM");
  throw new Error("server_start_timeout");
}

async function stopServer(server) {
  server.kill("SIGTERM");
  await wait(300);
}

function getCookieMap(response) {
  const cookies = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);

  return cookies.reduce((result, item) => {
    const [pair] = String(item).split(";");
    const [key, ...valueParts] = pair.split("=");
    result[String(key || "").trim()] = valueParts.join("=").trim();
    return result;
  }, {});
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  return {
    response,
    data: text ? JSON.parse(text) : null
  };
}

test("erp preview endpoint returns sample snapshot summary for admin", async () => {
  const port = 3120;
  const server = await startServer({ port });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${port}/api/integrations/erp/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ source: "sample" })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, true);
    assert.equal(preview.data.summary.customers, 2);
    assert.equal(preview.data.summary.products, 2);
    assert.equal(preview.data.summary.routes, 1);
    assert.equal(preview.data.summary.workOrders, 1);
  } finally {
    await stopServer(server);
  }
});

test("erp preview endpoint reports validation errors for malformed snapshot", async () => {
  const port = 3121;
  const server = await startServer({ port });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${port}/api/integrations/erp/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        payload: {
          metadata: { sourceSystem: "ERP" },
          products: [{ code: "PROD-X", name: "产品X" }],
          routes: [{ code: "ROUTE-X", productCode: "PROD-Y" }],
          workOrders: [{ code: "WO-X", factoryCode: "FAC-001", productCode: "PROD-X", routeCode: "ROUTE-X" }]
        }
      })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, false);
    assert.match(preview.data.validation.errors.join(" "), /PROD-Y/);
  } finally {
    await stopServer(server);
  }
});

test("erp preview can pull remote snapshot with api key and incremental cursor", async () => {
  const erpPort = 3321;
  const apiPort = 3122;
  const captureFile = path.resolve(process.cwd(), "tmp-erp-remote-capture.json");

  const erpServer = spawn(process.execPath, ["-e", `
    const fs = require('fs');
    const http = require('http');
    const server = http.createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      fs.writeFileSync(${JSON.stringify(captureFile)}, JSON.stringify({
        headers: request.headers,
        query: Object.fromEntries(url.searchParams.entries())
      }));
      const payload = {
        metadata: { sourceSystem: 'ERP-REMOTE', snapshotAt: '2026-04-23T11:00:00+08:00' },
        customers: [{ code: 'CUS-R1', name: '远程客户' }],
        products: [{ code: 'PROD-R1', name: '远程产品', version: 'V1.0', uom: 'PCS' }],
        routes: [{ code: 'ROUTE-R1', productCode: 'PROD-R1', version: 'V1.0', cycleSeconds: 60, status: 'released', steps: [{ code: 'STEP-R1', name: '远程工步', sequenceNo: 1 }] }],
        workOrders: [{ code: 'WO-R1', factoryCode: 'FAC-001', productCode: 'PROD-R1', routeCode: 'ROUTE-R1', plannedQty: 10, priority: 'high', status: 'released' }]
      };
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(payload));
    });
    server.listen(${erpPort}, () => console.log('erp-remote-ready'));
  `], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let erpStdout = "";
  erpServer.stdout.on("data", (chunk) => {
    erpStdout += chunk.toString();
  });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (erpStdout.includes("erp-remote-ready")) {
      break;
    }
    await wait(200);
  }

  const server = await startServer({
    port: apiPort,
    env: {
      MES_ERP_BASE_URL: `http://127.0.0.1:${erpPort}`,
      MES_ERP_SNAPSHOT_PATH: "/remote/snapshot",
      MES_ERP_API_KEY: "erp-key-123",
      MES_ERP_API_KEY_HEADER: "x-erp-key"
    }
  });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${apiPort}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${apiPort}/api/integrations/erp/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        source: "remote",
        mode: "incremental",
        since: "2026-04-20 08:00:00"
      })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, true);
    assert.equal(preview.data.metadata.sourceSystem, "ERP-REMOTE");
    assert.equal(preview.data.summary.workOrders, 1);
    const capture = JSON.parse(fs.readFileSync(captureFile, "utf8"));
    assert.equal(capture.headers["x-erp-key"], "erp-key-123");
    assert.equal(capture.query.mode, "incremental");
    assert.equal(capture.query.since, "2026-04-20 08:00:00");
  } finally {
    await stopServer(server);
    erpServer.kill("SIGTERM");
    await wait(300);
    if (fs.existsSync(captureFile)) {
      fs.unlinkSync(captureFile);
    }
  }
});
