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

test("wms preview returns sample inventory summary", async () => {
  const port = 3130;
  const server = await startServer({ port });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${port}/api/integrations/wms/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ source: "sample" })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, true);
    assert.equal(preview.data.summary.inventoryItems, 2);
    assert.equal(preview.data.summary.movements, 2);
  } finally {
    await stopServer(server);
  }
});

test("wms preview can pull remote snapshot with bearer token and incremental cursor", async () => {
  const wmsPort = 3331;
  const apiPort = 3131;
  const captureFile = path.resolve(process.cwd(), "tmp-wms-remote-capture.json");

  const wmsServer = spawn(process.execPath, ["-e", `
    const fs = require('fs');
    const http = require('http');
    const server = http.createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      fs.writeFileSync(${JSON.stringify(captureFile)}, JSON.stringify({
        headers: request.headers,
        query: Object.fromEntries(url.searchParams.entries())
      }));
      const payload = {
        metadata: { sourceSystem: 'WMS-REMOTE', snapshotAt: '2026-04-23T13:00:00+08:00' },
        inventoryItems: [{ materialCode: 'MAT-R1', materialName: '远程料件', factoryCode: 'FAC-001', locationCode: 'WH-R-01', onHandQty: 50, safetyQty: 10, turnoverDays: 6, status: 'safe' }],
        movements: [{ transactionCode: 'WMS-R1', materialCode: 'MAT-R1', factoryCode: 'FAC-001', locationCode: 'WH-R-01', direction: 'inbound', qty: 50, refType: 'receipt', refCode: 'RC-1', sourceDocNo: 'ASN-1', occurredAt: '2026-04-23 12:30:00' }]
      };
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(payload));
    });
    server.listen(${wmsPort}, () => console.log('wms-remote-ready'));
  `], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let wmsStdout = "";
  wmsServer.stdout.on("data", (chunk) => {
    wmsStdout += chunk.toString();
  });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (wmsStdout.includes("wms-remote-ready")) {
      break;
    }
    await wait(200);
  }

  const server = await startServer({
    port: apiPort,
    env: {
      MES_WMS_BASE_URL: `http://127.0.0.1:${wmsPort}`,
      MES_WMS_SNAPSHOT_PATH: "/remote/wms",
      MES_WMS_AUTH_MODE: "bearer",
      MES_WMS_API_TOKEN: "wms-token-456"
    }
  });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${apiPort}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${apiPort}/api/integrations/wms/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ source: "remote", mode: "incremental", since: "2026-04-20 08:00:00" })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, true);
    assert.equal(preview.data.summary.inventoryItems, 1);
    const capture = JSON.parse(fs.readFileSync(captureFile, "utf8"));
    assert.equal(capture.headers.authorization, "Bearer wms-token-456");
    assert.equal(capture.query.mode, "incremental");
    assert.equal(capture.query.since, "2026-04-20 08:00:00");
  } finally {
    await stopServer(server);
    wmsServer.kill("SIGTERM");
    await wait(300);
    if (fs.existsSync(captureFile)) {
      fs.unlinkSync(captureFile);
    }
  }
});
