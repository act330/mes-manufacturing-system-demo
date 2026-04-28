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

test("printer preview returns sample request summary", async () => {
  const port = 3140;
  const server = await startServer({ port });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const preview = await jsonRequest(`http://127.0.0.1:${port}/api/integrations/printer/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({ source: "sample" })
    });

    assert.equal(preview.response.status, 200);
    assert.equal(preview.data.validation.ok, true);
    assert.equal(preview.data.summary.itemCount, 1);
  } finally {
    await stopServer(server);
  }
});

test("printer submit can call remote service with api key", async () => {
  const printerPort = 3341;
  const apiPort = 3141;
  const captureFile = path.resolve(process.cwd(), "tmp-printer-remote-capture.json");

  const printerServer = spawn(process.execPath, ["-e", `
    const fs = require('fs');
    const http = require('http');
    const server = http.createServer((request, response) => {
      let body = '';
      request.on('data', (chunk) => { body += chunk.toString(); });
      request.on('end', () => {
        fs.writeFileSync(${JSON.stringify(captureFile)}, JSON.stringify({
          headers: request.headers,
          body: body ? JSON.parse(body) : {}
        }));
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ remoteJobId: 'PRINT-REMOTE-001', accepted: true }));
      });
    });
    server.listen(${printerPort}, () => console.log('printer-remote-ready'));
  `], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"]
  });

  let printerStdout = "";
  printerServer.stdout.on("data", (chunk) => {
    printerStdout += chunk.toString();
  });

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (printerStdout.includes("printer-remote-ready")) {
      break;
    }
    await wait(200);
  }

  const server = await startServer({
    port: apiPort,
    env: {
      MES_PRINTER_SERVICE_URL: `http://127.0.0.1:${printerPort}`,
      MES_PRINTER_SERVICE_AUTH_MODE: "api-key",
      MES_PRINTER_SERVICE_API_KEY: "printer-key-789"
    }
  });

  try {
    const login = await jsonRequest(`http://127.0.0.1:${apiPort}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "123456", factory: "FAC-001" })
    });
    const cookie = Object.entries(getCookieMap(login.response)).map(([key, value]) => `${key}=${value}`).join("; ");

    const submit = await jsonRequest(`http://127.0.0.1:${apiPort}/api/integrations/printer/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie
      },
      body: JSON.stringify({
        mode: "remote",
        source: "payload",
        payload: {
          printerCode: "PRN-001",
          printerName: "ZT410-A",
          ruleCode: "barcode-sn",
          copies: 1,
          items: [{ barcodeValue: "SN-260418-SMT01-0086" }]
        }
      })
    });

    assert.equal(submit.response.status, 200);
    assert.equal(submit.data.ok, true);
    const capture = JSON.parse(fs.readFileSync(captureFile, "utf8"));
    assert.equal(capture.headers["x-api-key"], "printer-key-789");
    assert.equal(capture.body.printerName, "ZT410-A");
    assert.equal(capture.body.items.length, 1);
  } finally {
    await stopServer(server);
    printerServer.kill("SIGTERM");
    await wait(300);
    if (fs.existsSync(captureFile)) {
      fs.unlinkSync(captureFile);
    }
  }
});
