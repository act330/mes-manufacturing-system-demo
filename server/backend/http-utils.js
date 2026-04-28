const MAX_REQUEST_BODY_BYTES = 1024 * 1024;

function sendJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      chunks.push(chunk);
      size += chunk.length;

      if (size > MAX_REQUEST_BODY_BYTES) {
        reject(new Error("payload_too_large"));
      }
    });

    request.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("invalid_json"));
      }
    });

    request.on("error", reject);
  });
}

function sendRouteError(response, error) {
  if (error.message === "invalid_json") {
    sendJson(response, 400, { error: "请求体不是合法的 JSON" });
    return true;
  }

  if (error.message === "payload_too_large") {
    sendJson(response, 413, { error: "请求体过大" });
    return true;
  }

  sendJson(response, 500, {
    error: "服务器内部错误",
    detail: error.message
  });
  return true;
}

module.exports = {
  readBody,
  sendJson,
  sendRouteError
};
