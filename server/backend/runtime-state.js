const fs = require("fs");
const path = require("path");
const { seedData } = require("./mes-seed");
const { clone } = require("./data-scope");

const runtimeDir = path.join(__dirname, "..", "data");
const runtimeFile = path.join(runtimeDir, "runtime-store.json");

function ensureRuntimePath() {
  fs.mkdirSync(runtimeDir, { recursive: true });
}

function loadRuntimeState() {
  ensureRuntimePath();

  if (!fs.existsSync(runtimeFile)) {
    return clone(seedData);
  }

  try {
    const runtime = JSON.parse(fs.readFileSync(runtimeFile, "utf8"));
    return {
      ...clone(seedData),
      ...runtime
    };
  } catch (error) {
    return clone(seedData);
  }
}

function saveRuntimeState(db, authSessions) {
  if (authSessions instanceof Map) {
    db.authSessions = Array.from(authSessions.values());
  }

  ensureRuntimePath();
  fs.writeFileSync(runtimeFile, JSON.stringify(db, null, 2));
}

module.exports = {
  loadRuntimeState,
  saveRuntimeState
};
