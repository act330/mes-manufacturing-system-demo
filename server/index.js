const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApiRequest } = require("./backend/router");

const port = Number(process.argv[2] || process.env.PORT || 3000);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist");
const hasBuiltFrontend = fs.existsSync(path.join(distRoot, "index.html"));
const staticRoot = hasBuiltFrontend ? distRoot : null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (request, response) => {
  const apiHandled = await handleApiRequest(request, response);
  if (apiHandled) {
    return;
  }

  if (!staticRoot) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Frontend build not found. Use `npm run dev` for development or `npm run build` before `npm start`.");
    return;
  }

  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(staticRoot, `.${requestedPath}`);

  if (!filePath.startsWith(staticRoot)) {
    response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile(path.join(staticRoot, "index.html"), (indexError, indexContent) => {
          if (indexError) {
            response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Internal Server Error");
            return;
          }

          response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
          });
          response.end(indexContent);
        });
        return;
      }

      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal Server Error");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(content);
  });
});

server.listen(port, () => {
  console.log(`MES server is running at http://localhost:${port}`);
});
