export const STORAGE_KEYS = {
  user: "mes-demo-user",
  remember: "mes-demo-remember",
  sidebar: "mes-demo-sidebar",
  token: "mes-demo-token",
  menuCache: "mes-demo-menu-cache"
};

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function moduleDescription(key) {
  const descriptions = {
    dashboard: "经营总览、工单、质量和异常驾驶舱",
    productionConfig: "工厂、产线、工位和班次产能配置",
    customer: "客户主数据与订单活跃度管理",
    process: "工艺路线、版本和标准节拍管理",
    barcode: "条码赋码、打印和站点追溯绑定",
    production: "工单执行、报工和计划偏差监控",
    equipment: "设备联网、OEE 和维护保养协同",
    warehouse: "库存、缺料预警和仓储协同",
    traceability: "按批次、SN 和工单进行履历回溯",
    reports: "日报、周报、月报及多维统计分析",
    approval: "工单变更、让步接收和异常审批闭环",
    settings: "系统参数、开关配置和部署建议"
  };

  return descriptions[key] || "";
}

export function slugToTitle(value) {
  return String(value || "")
    .replaceAll("-", " ")
    .replaceAll("/", " ")
    .trim();
}

export function normalizeWorkOrderStatus(filterValue) {
  const statusMap = {
    all: "",
    running: "进行中",
    in_progress: "进行中",
    finishing: "收尾中",
    completed: "已完成",
    abnormal: "异常中",
    "进行中": "进行中",
    "收尾中": "收尾中",
    "已完成": "已完成",
    "异常中": "异常中"
  };

  return statusMap[filterValue] || "";
}

export function filterWorkOrdersByStatus(workOrders, filterValue) {
  const normalizedStatus = normalizeWorkOrderStatus(filterValue);
  if (!normalizedStatus) {
    return workOrders;
  }

  return workOrders.filter((item) => item.status === normalizedStatus);
}

export function getOnlineOrders(workOrders) {
  return workOrders.filter((item) => item.status === "进行中" || item.status === "收尾中");
}

export function getEquipmentAlarmCount(equipment) {
  return equipment.filter((item) => Number(item.alarm || 0) > 0).length;
}

export function getPendingExceptionsCount(exceptions) {
  return exceptions.filter((item) => item.status !== "已闭环").length;
}

export function matchTrace(traceItem, keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query || !traceItem) {
    return false;
  }

  return [traceItem.keyword, traceItem.orderId, traceItem.product].some((part) =>
    String(part || "")
      .toLowerCase()
      .includes(query)
  );
}

export function normalizeRequestError(error, fallbackMessage) {
  if (error instanceof TypeError) {
    return "无法连接 MES API，请先运行 npm run dev 或 npm start。";
  }

  return error?.message || fallbackMessage;
}

export function productionStatusType(status) {
  return {
    进行中: "info",
    收尾中: "warning",
    已完成: "success",
    异常中: "danger"
  }[status] || "info";
}

export function priorityType(priority) {
  return {
    高: "danger",
    中: "warning",
    低: "success"
  }[priority] || "info";
}

export function exceptionStatusType(status) {
  return {
    待指派: "warning",
    处理中: "info",
    已闭环: "success"
  }[status] || "info";
}

export function approvalStatusType(status) {
  return {
    待审批: "warning",
    已通过: "success",
    已驳回: "danger"
  }[status] || "info";
}

export function customerLevelType(level) {
  return {
    A: "danger",
    B: "warning",
    C: "info"
  }[level] || "info";
}

export function equipmentStatusType(status) {
  if (status.includes("运行")) {
    return "success";
  }
  if (status.includes("告警")) {
    return "danger";
  }
  if (status.includes("保养") || status.includes("换料")) {
    return "warning";
  }
  return "info";
}
