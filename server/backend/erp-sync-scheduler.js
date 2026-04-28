const { importErpSnapshot, getErpConfig, getLastSuccessfulErpSync } = require("./integration-erp");

const schedulerState = {
  started: false,
  running: false,
  timer: null,
  intervalSeconds: 0,
  lastRunAt: "",
  lastSuccessAt: "",
  lastError: "",
  nextRunAt: "",
  mode: ""
};

function now() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function calculateNextRunAt(intervalSeconds) {
  return new Date(Date.now() + intervalSeconds * 1000).toISOString().slice(0, 19).replace("T", " ");
}

async function runErpSyncTick() {
  const config = getErpConfig();
  if (!config.syncScheduleEnabled || !config.baseUrl) {
    return;
  }

  if (schedulerState.running) {
    return;
  }

  schedulerState.running = true;
  schedulerState.lastRunAt = now();
  schedulerState.mode = config.syncDefaultMode;

  try {
    const result = await importErpSnapshot({
      source: "remote",
      mode: config.syncDefaultMode,
      actorUserCode: config.schedulerActorUserCode || ""
    });

    if (result.ok) {
      schedulerState.lastSuccessAt = now();
      schedulerState.lastError = "";
    } else {
      schedulerState.lastError = result.preview.validation.errors.join(" | ");
    }
  } catch (error) {
    schedulerState.lastError = error.message || String(error);
  } finally {
    schedulerState.running = false;
    schedulerState.nextRunAt = calculateNextRunAt(config.syncIntervalSeconds);
  }
}

function startErpSyncScheduler() {
  const config = getErpConfig();
  if (!config.syncScheduleEnabled || !config.baseUrl || schedulerState.started) {
    return;
  }

  schedulerState.started = true;
  schedulerState.intervalSeconds = config.syncIntervalSeconds;
  schedulerState.mode = config.syncDefaultMode;
  schedulerState.nextRunAt = calculateNextRunAt(config.syncIntervalSeconds);

  schedulerState.timer = setInterval(() => {
    runErpSyncTick().catch(() => {
    });
  }, config.syncIntervalSeconds * 1000);

  setTimeout(() => {
    runErpSyncTick().catch(() => {
    });
  }, 1000);
}

function stopErpSyncScheduler() {
  if (schedulerState.timer) {
    clearInterval(schedulerState.timer);
  }

  schedulerState.started = false;
  schedulerState.running = false;
  schedulerState.timer = null;
  schedulerState.nextRunAt = "";
}

async function getErpSchedulerStatus() {
  const config = getErpConfig();
  const lastSync = await getLastSuccessfulErpSync();

  return {
    enabled: config.syncScheduleEnabled,
    started: schedulerState.started,
    running: schedulerState.running,
    mode: schedulerState.mode || config.syncDefaultMode,
    intervalSeconds: config.syncIntervalSeconds,
    lastRunAt: schedulerState.lastRunAt,
    lastSuccessAt: schedulerState.lastSuccessAt || lastSync?.createdAt || "",
    lastSnapshotAt: lastSync?.snapshotAt || "",
    lastError: schedulerState.lastError,
    nextRunAt: schedulerState.nextRunAt
  };
}

module.exports = {
  getErpSchedulerStatus,
  runErpSyncTick,
  startErpSyncScheduler,
  stopErpSyncScheduler
};
