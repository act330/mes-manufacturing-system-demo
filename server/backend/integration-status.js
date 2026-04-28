const { getErpConfig, getLastSuccessfulErpSync } = require("./integration-erp");
const { getErpSchedulerStatus } = require("./erp-sync-scheduler");
const { getPrinterConfig, getPrinterRuntime } = require("./integration-printer");
const { getLastSuccessfulWmsSync, getWmsConfig } = require("./integration-wms");
const { getWmsSchedulerStatus } = require("./wms-sync-scheduler");

const INTEGRATION_DEFINITIONS = [
  {
    key: "erp",
    label: "ERP / APS",
    envKey: "MES_ERP_BASE_URL",
    purpose: "销售订单、主数据、BOM、工艺路线和排产计划"
  },
  {
    key: "wms",
    label: "WMS",
    envKey: "MES_WMS_BASE_URL",
    purpose: "发料、入库、库存同步"
  },
  {
    key: "deviceGateway",
    label: "设备采集网关",
    envKey: "MES_DEVICE_GATEWAY_URL",
    purpose: "设备状态、工艺参数、停机事件"
  },
  {
    key: "printerService",
    label: "打印服务",
    envKey: "MES_PRINTER_SERVICE_URL",
    purpose: "标签打印、模板下发、打印回执"
  }
];

async function getIntegrationStatus() {
  const erpConfig = getErpConfig();
  const erpLastSync = await getLastSuccessfulErpSync();
  const erpScheduler = await getErpSchedulerStatus();
  const wmsConfig = getWmsConfig();
  const wmsLastSync = await getLastSuccessfulWmsSync();
  const wmsScheduler = await getWmsSchedulerStatus();
  const printerConfig = getPrinterConfig();
  const printerRuntime = await getPrinterRuntime();

  return INTEGRATION_DEFINITIONS.map((item) => {
    const endpoint = String(process.env[item.envKey] || "").trim();
    const extra = {};

    if (item.key === "erp") {
      extra.snapshotPath = erpConfig.snapshotPath;
      extra.deltaPath = erpConfig.deltaPath || "";
      extra.authMode = erpConfig.authMode;
      extra.lastSuccessfulSyncAt = erpLastSync?.createdAt || "";
      extra.scheduler = erpScheduler;
    }

    if (item.key === "wms") {
      extra.snapshotPath = wmsConfig.snapshotPath;
      extra.deltaPath = wmsConfig.deltaPath || "";
      extra.authMode = wmsConfig.authMode;
      extra.lastSuccessfulSyncAt = wmsLastSync?.createdAt || "";
      extra.scheduler = wmsScheduler;
    }

    if (item.key === "printerService") {
      extra.submitPath = printerConfig.submitPath;
      extra.statusPath = printerConfig.statusPath;
      extra.authMode = printerConfig.authMode;
      extra.printers = printerRuntime.printers.length;
      extra.lastJobAt = printerRuntime.latestJobs[0]?.createdAt || "";
    }

    return {
      key: item.key,
      label: item.label,
      purpose: item.purpose,
      configured: Boolean(endpoint),
      endpoint,
      ...extra
    };
  });
}

module.exports = {
  getIntegrationStatus
};
