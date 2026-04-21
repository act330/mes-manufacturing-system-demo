function withChildren(parentKey, parentPermission, children) {
  return children.map((child) => ({
    parentKey,
    permission: child.permission || parentPermission,
    ...child
  }));
}

export const defaultModuleRegistry = [
  {
    key: "dashboard",
    routeName: "dashboard",
    path: "dashboard",
    label: "首页",
    section: "运营总览",
    permission: "dashboard:view",
    description: "经营总览、工单、质量和异常驾驶舱"
  },
  {
    key: "productionConfig",
    routeName: "productionConfig",
    path: "production-config",
    label: "生产配置",
    section: "基础主数据",
    permission: "production_config:view",
    description: "工厂、产线、工位和班次产能配置",
    children: withChildren("productionConfig", "production_config:view", [
      { key: "workshopManage", routeName: "productionConfigWorkshop", path: "workshop", label: "车间管理", description: "维护车间定义、负责人和区域归属" },
      { key: "lineManage", routeName: "productionConfigLine", path: "line", label: "产线管理", description: "配置产线、所属车间和产能参数" },
      { key: "cellManage", routeName: "productionConfigCell", path: "cell", label: "线体管理", description: "维护线体层级、节拍和线体属性" },
      { key: "stationManage", routeName: "productionConfigStation", path: "station", label: "工位管理", description: "维护工位定义、工位顺序和设备绑定" },
      { key: "shiftManage", routeName: "productionConfigShift", path: "shift", label: "班别管理", description: "配置班次、轮班模式与出勤规则" },
      { key: "calendarManage", routeName: "productionConfigCalendar", path: "calendar", label: "工作日历", description: "维护法定节假日、加班日和工作日历" }
    ])
  },
  {
    key: "customer",
    routeName: "customer",
    path: "customer",
    label: "客户管理",
    section: "基础主数据",
    permission: "customer:view",
    description: "客户主数据与订单活跃度管理",
    children: withChildren("customer", "customer:view", [
      { key: "customerDefinition", routeName: "customerDefinition", path: "definition", label: "客户定义", description: "维护客户编码、等级、地区和业务负责人" }
    ])
  },
  {
    key: "process",
    routeName: "process",
    path: "process",
    label: "工艺管理",
    section: "基础主数据",
    permission: "process:view",
    description: "工艺路线、版本和标准节拍管理",
    children: withChildren("process", "process:view", [
      { key: "materialManage", routeName: "processMaterial", path: "material", label: "物料管理", description: "维护物料主数据、规格型号和替代关系" },
      { key: "productManage", routeName: "processProduct", path: "product", label: "产品管理", description: "维护产品型号、版本和产品分类" },
      { key: "procedureManage", routeName: "processProcedure", path: "procedure", label: "工序管理", description: "维护工序编码、工艺属性和质量关卡" },
      { key: "stepManage", routeName: "processStep", path: "step", label: "工步管理", description: "配置工步、作业指引与标准工时" },
      { key: "routeManage", routeName: "processRoute", path: "route", label: "工艺路线", description: "维护产品工艺路线、版本发布和工艺顺序" },
      { key: "engineeringBom", routeName: "processEngineeringBom", path: "engineering-bom", label: "工程BOM", description: "维护工程设计 BOM 和版本映射" },
      { key: "manufacturingBom", routeName: "processManufacturingBom", path: "manufacturing-bom", label: "制造BOM（导入料表）", description: "管理制造 BOM、替代料和导入料表" },
      { key: "substituteManage", routeName: "processSubstitute", path: "substitute", label: "替代品", description: "维护替代料、替代策略和生效范围" },
      { key: "programBurnManage", routeName: "processBurning", path: "burning", label: "烧录管理", description: "维护程序烧录文件、版本和设备绑定" }
    ])
  },
  {
    key: "barcode",
    routeName: "barcode",
    path: "barcode",
    label: "条码管理",
    section: "执行与采集",
    permission: "barcode:view",
    description: "条码赋码、打印和站点追溯绑定",
    children: withChildren("barcode", "barcode:view", [
      { key: "materialBarcodeRule", routeName: "barcodeMaterialRule", path: "material-rule", label: "物料条码规则", description: "配置来料与物料条码规则、打印模板和解析方式" },
      { key: "customerBarcodeRule", routeName: "barcodeCustomerRule", path: "customer-rule", label: "客户条码规则", description: "配置客户专用条码格式和映射关系" },
      { key: "finishedBarcodeRule", routeName: "barcodeFinishedRule", path: "finished-rule", label: "成品条码规则", description: "配置成品 SN、箱码和栈板码规则" },
      { key: "lotBarcodeRule", routeName: "barcodeLotRule", path: "lot-rule", label: "LOT条码规则", description: "维护批次条码规则、批次生成策略和追溯字段" }
    ])
  },
  {
    key: "production",
    routeName: "production",
    path: "production",
    label: "生产管理",
    section: "执行与采集",
    permission: "work_order:view",
    description: "工单执行、报工和计划偏差监控",
    children: withChildren("production", "work_order:view", [
      { key: "planManage", routeName: "productionPlan", path: "plan", label: "计划管理", description: "维护生产计划、排产、插单和达成分析" },
      { key: "workOrderManage", routeName: "productionWorkOrder", path: "work-order", label: "工单管理", description: "管理工单下达、状态流转和工单执行明细" },
      { key: "pidManage", routeName: "productionPid", path: "pid", label: "PID管理", description: "管理产品 PID、生产识别码和序列号映射" },
      { key: "engineeringManage", routeName: "productionEngineering", path: "engineering", label: "工程管理", description: "管理工程试产、工艺验证和变更控制" },
      { key: "exceptionManage", routeName: "productionException", path: "exception", label: "异常管理", description: "记录和闭环生产异常、工艺异常和停线问题" },
      { key: "repairManage", routeName: "productionRepair", path: "repair", label: "产品维修", description: "管理返修、复判、维修履历和维修结果" },
      { key: "inventoryManage", routeName: "productionInventory", path: "inventory", label: "生产库存", description: "管理在制品库存、工单余料和线边库存" }
    ])
  },
  {
    key: "equipment",
    routeName: "equipment",
    path: "equipment",
    label: "设备管理",
    section: "执行与采集",
    permission: "equipment:view",
    description: "设备联网、OEE 和维护保养协同",
    children: withChildren("equipment", "equipment:view", [
      { key: "equipmentLedger", routeName: "equipmentLedger", path: "ledger", label: "设备台账", description: "管理设备编码、型号、台账和保养计划" },
      { key: "equipmentEffect", routeName: "equipmentEffect", path: "effect-query", label: "效果查询", description: "统计设备运行效果、OEE 和异常趋势" }
    ])
  },
  {
    key: "warehouse",
    routeName: "warehouse",
    path: "warehouse",
    label: "仓库管理",
    section: "物流协同",
    permission: "warehouse:view",
    description: "库存、缺料预警和仓储协同",
    children: withChildren("warehouse", "warehouse:view", [
      { key: "warehouseManage", routeName: "warehouseManage", path: "warehouse-manage", label: "仓库管理", description: "维护仓库定义、仓别和业务范围" },
      { key: "locationManage", routeName: "warehouseLocation", path: "location", label: "库位管理", description: "维护库位、库区和库位容量规则" },
      { key: "stockManage", routeName: "warehouseStock", path: "stock", label: "库存管理", description: "管理实时库存、收发存和库存预警" }
    ])
  },
  {
    key: "traceability",
    routeName: "traceability",
    path: "traceability",
    label: "履历追溯",
    section: "质量闭环",
    permission: "trace:view",
    description: "按批次、SN 和工单进行履历回溯",
    children: withChildren("traceability", "trace:view", [
      { key: "materialTrace", routeName: "traceabilityMaterial", path: "material", label: "物料追溯", description: "按物料批次、供应商和工单执行物料反查" },
      { key: "productTrace", routeName: "traceabilityProduct", path: "product", label: "产品追溯", description: "按 SN、产品和工单执行整机追溯" },
      { key: "lotHistory", routeName: "traceabilityLot", path: "lot-history", label: "LOT履历", description: "查看批次履历、过站记录和质量结果" },
      { key: "mappingHistory", routeName: "traceabilityMapping", path: "mapping-history", label: "MAPPING履历", description: "查看序列号、箱码和产品映射关系履历" },
      { key: "repairHistory", routeName: "traceabilityRepair", path: "repair-history", label: "维修履历", description: "查看维修、复判、让步放行等维修履历记录" }
    ])
  },
  {
    key: "reports",
    routeName: "reports",
    path: "reports",
    label: "统计报表",
    section: "质量闭环",
    permission: "report:view",
    description: "日报、周报、月报及多维统计分析",
    children: withChildren("reports", "report:view", [
      { key: "progressStatistics", routeName: "reportsProgress", path: "progress", label: "生产进度统计", description: "查看工单进度、日产量和进度达成统计" },
      { key: "statusStatistics", routeName: "reportsStatus", path: "status", label: "生产状态统计", description: "查看工单状态、设备状态和现场运行状态统计" },
      { key: "exceptionStatistics", routeName: "reportsException", path: "exception", label: "异常提报统计", description: "统计异常提报数量、类型分布和闭环效率" },
      { key: "productQuantityStatistics", routeName: "reportsProductQuantity", path: "product-quantity", label: "生产产品数量", description: "查看产品产量、型号占比和客户交付数量统计" }
    ])
  },
  {
    key: "approval",
    routeName: "approval",
    path: "approval",
    label: "审批管理",
    section: "组织协同",
    permission: "approval:view",
    description: "工单变更、让步接收和异常审批闭环",
    children: withChildren("approval", "approval:view", [
      { key: "approvalGroup", routeName: "approvalGroup", path: "group", label: "审批小组", description: "维护审批小组、审批链路和流程配置" },
      { key: "approvalStarted", routeName: "approvalStarted", path: "started", label: "我发起的", description: "查看我发起的审批单和处理进度" },
      { key: "approvalReceived", routeName: "approvalReceived", path: "received", label: "我收到的", description: "查看待我审批和已处理的审批任务" },
      { key: "approvalCopied", routeName: "approvalCopied", path: "copied", label: "抄送我的", description: "查看抄送到我的审批记录和状态" }
    ])
  },
  {
    key: "settings",
    routeName: "settings",
    path: "settings",
    label: "系统设置",
    section: "组织协同",
    permission: "settings:view",
    description: "系统参数、开关配置和部署建议",
    children: withChildren("settings", "settings:view", [
      { key: "userManage", routeName: "settingsUser", path: "user", label: "用户管理", description: "管理用户账号、岗位、组织和账号状态" },
      { key: "roleManage", routeName: "settingsRole", path: "role", label: "角色管理", description: "维护角色权限、职责范围和授权关系" },
      { key: "menuManage", routeName: "settingsMenu", path: "menu", label: "菜单管理", description: "维护菜单树、功能按钮和菜单权限" },
      { key: "pdaMenu", routeName: "settingsPdaMenu", path: "pda-menu", label: "PDA菜单", description: "维护 PDA 端菜单和移动端权限" },
      { key: "padMenu", routeName: "settingsPadMenu", path: "pad-menu", label: "PAD菜单", description: "维护 PAD 端菜单和终端权限配置" },
      { key: "dictionaryManage", routeName: "settingsDictionary", path: "dictionary", label: "字典管理", description: "维护业务字典、状态枚举和系统常量" },
      { key: "printerManage", routeName: "settingsPrinter", path: "printer", label: "打印机管理", description: "维护打印机、标签模板和打印策略" },
      { key: "globalSettings", routeName: "settingsGlobal", path: "global", label: "全局设置", description: "配置系统全局参数、消息推送和基础开关" }
    ])
  }
];

export const extraRouteRegistry = [
  {
    key: "deliveryPlan",
    routeName: "deliveryPlan",
    path: "production/plan/delivery",
    label: "发货计划",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看客户交付计划与发货排程",
    parentKey: "production",
    parentLabel: "计划管理"
  },
  {
    key: "productionPlanDetail",
    routeName: "productionPlanDetail",
    path: "production/plan/production-schedule",
    label: "生产计划",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看生产计划、达成情况与排程结果",
    parentKey: "production",
    parentLabel: "计划管理"
  },
  {
    key: "productionPlanChangeDetail",
    routeName: "productionPlanChangeDetail",
    path: "production/plan/change-detail",
    label: "计划变更明细",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看计划变更记录与调整明细",
    parentKey: "production",
    parentLabel: "计划管理"
  },
  {
    key: "dispatchWork",
    routeName: "dispatchWork",
    path: "production/work-order/dispatch",
    label: "生产派工",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看派工记录、派工单与责任人分配",
    parentKey: "production",
    parentLabel: "工单管理"
  },
  {
    key: "executionView",
    routeName: "executionView",
    path: "production/work-order/execution",
    label: "执行现况",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看工单执行状态、进度与现场反馈",
    parentKey: "production",
    parentLabel: "工单管理"
  },
  {
    key: "reportManage",
    routeName: "reportManage",
    path: "production/work-order/report",
    label: "报工管理",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看报工记录、工时与工单产出汇总",
    parentKey: "production",
    parentLabel: "工单管理"
  },
  {
    key: "pidList",
    routeName: "pidList",
    path: "production/pid/list",
    label: "PID列表",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看PID清单、序列号与绑定记录",
    parentKey: "production",
    parentLabel: "PID管理"
  },
  {
    key: "pidPrint",
    routeName: "pidPrint",
    path: "production/pid/print",
    label: "PID打印",
    section: "执行与采集",
    permission: "barcode:view",
    description: "查看PID打印任务、打印日志与模板配置",
    parentKey: "production",
    parentLabel: "PID管理"
  },
  {
    key: "stationPass",
    routeName: "stationPass",
    path: "production/engineering/station-pass",
    label: "过站管理",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看过站记录、锁站状态和过站结果",
    parentKey: "production",
    parentLabel: "工程管理"
  },
  {
    key: "lotCompose",
    routeName: "lotCompose",
    path: "production/engineering/lot-compose",
    label: "LOT构成",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看LOT构成明细、批次关系和关联物料",
    parentKey: "production",
    parentLabel: "工程管理"
  },
  {
    key: "mappingCompose",
    routeName: "mappingCompose",
    path: "production/engineering/mapping",
    label: "Mapping",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看Mapping记录、映射关系和半成品关联",
    parentKey: "production",
    parentLabel: "工程管理"
  },
  {
    key: "exceptionReport",
    routeName: "exceptionReport",
    path: "production/exception/report",
    label: "异常上报",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看异常上报记录、提报人和异常明细",
    parentKey: "production",
    parentLabel: "异常管理"
  },
  {
    key: "exceptionAssign",
    routeName: "exceptionAssign",
    path: "production/exception/assign",
    label: "异常指派",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看异常指派记录、责任人和指派状态",
    parentKey: "production",
    parentLabel: "异常管理"
  },
  {
    key: "exceptionHandle",
    routeName: "exceptionHandle",
    path: "production/exception/handle",
    label: "异常处理",
    section: "执行与采集",
    permission: "work_order:view",
    description: "查看异常处理过程、处置结果和闭环情况",
    parentKey: "production",
    parentLabel: "异常管理"
  },
  {
    key: "exceptionOwner",
    routeName: "exceptionOwner",
    path: "production/exception/owner",
    label: "责任人管理",
    section: "执行与采集",
    permission: "work_order:view",
    description: "维护异常责任人、责任部门和处理时效",
    parentKey: "production",
    parentLabel: "异常管理"
  },
  {
    key: "softwareVersion",
    routeName: "softwareVersion",
    path: "process/burning/software-version",
    label: "软件版本",
    section: "基础主数据",
    permission: "process:view",
    description: "维护软件版本、产品版本与客户适配关系",
    parentKey: "process",
    parentLabel: "烧录管理"
  },
  {
    key: "hardwareVersion",
    routeName: "hardwareVersion",
    path: "process/burning/hardware-version",
    label: "硬件版本",
    section: "基础主数据",
    permission: "process:view",
    description: "维护硬件版本、硬件编号与启停状态",
    parentKey: "process",
    parentLabel: "烧录管理"
  }
];

export function filterModulesByPermissions(modules, permissions) {
  return modules
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) => ({
      ...item,
      children: item.children
        ? item.children.filter((child) => !child.permission || permissions.includes(child.permission))
        : []
    }));
}

export function flattenModuleRegistry(modules) {
  return modules.flatMap((item) => {
    const base = {
      key: item.key,
      routeName: item.routeName,
      label: item.label,
      section: item.section,
      description: item.description,
      permission: item.permission,
      parentKey: null,
      parentLabel: null,
      isChild: false
    };

    const children = (item.children || []).map((child) => ({
      key: child.key,
      routeName: child.routeName,
      label: child.label,
      section: item.section,
      description: child.description,
      permission: child.permission,
      parentKey: item.key,
      parentLabel: item.label,
      isChild: true
    }));

    return [base, ...children];
  });
}

export function findModuleByRouteName(modules, routeName) {
  return flattenModuleRegistry(modules).find((item) => item.routeName === routeName) || null;
}

export function findExtraRouteByName(routeName) {
  return extraRouteRegistry.find((item) => item.routeName === routeName) || null;
}
