<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { utils as xlsxUtils, writeFileXLSX } from "xlsx";
import StatusPill from "../components/common/StatusPill.vue";
import { defaultModuleRegistry } from "../config/modules";
import { submodulePageConfigs } from "../config/submodule-page-configs";
import { deepClone } from "../utils/mes-utils";
import { useMesStore } from "../stores/mes";

const route = useRoute();
const router = useRouter();
const mesStore = useMesStore();

const pageSizeOptions = [10, 20, 50];
const currentPage = ref(1);
const pageSize = ref(10);
const selectedRowKeys = ref([]);
const rows = ref([]);
const filters = reactive({});
const modalForm = reactive({});
const activePanelKey = ref("");
const panelForm = reactive({});
const activeTraceTab = ref("");
const calendarYear = ref(2026);
const calendarMonth = ref(4);
const modalVisible = ref(false);
const modalMode = ref("add");
const modalKeepOpen = ref(false);
const editingRowId = ref("");
const confirmDialog = reactive({
  visible: false,
  title: "",
  message: "",
  confirmText: "确定",
  cancelText: "取消"
});
let confirmDialogHandler = null;
const dictionaryEntryDialog = reactive({
  visible: false,
  mode: "add",
  sourceRowId: "",
  dictionaryType: "",
  dictionaryName: "",
  keepOpen: false
});
const permissionDialog = reactive({
  visible: false,
  title: "",
  mode: "flat",
  search: "",
  nodes: [],
  countMode: "none"
});
const menuSheetDialog = reactive({
  visible: false,
  title: "",
  keyword: "",
  currentPage: 1,
  pageSize: 10,
  maximized: false,
  sourceRows: []
});
const approvalGroupDialog = reactive({
  visible: false,
  mode: "flow",
  title: "",
  currentPage: 1,
  pageSize: 10,
  maximized: false,
  flowNodes: [],
  sourceRows: []
});
const hierarchyDetailDialog = reactive({
  visible: false,
  title: "",
  currentPage: 1,
  pageSize: 10,
  columns: [],
  rows: []
});
const stationDetailDialog = reactive({
  visible: false,
  title: "",
  stationCode: "",
  stationName: "",
  line: "",
  cell: "",
  sourceRows: [],
  currentPage: 1,
  pageSize: 10
});
const procedureBindingDialog = reactive({
  visible: false,
  title: "",
  processName: "",
  sourceRows: [],
  currentPage: 1,
  pageSize: 10
});
const routeProcessDialog = reactive({
  visible: false,
  title: "",
  routeName: "",
  maximized: false,
  nodes: []
});
const floatingActionDialog = reactive({
  visible: false,
  title: "",
  fields: [],
  keepOpenEnabled: false,
  keepOpen: false,
  submitLabel: "确定",
  values: {}
});
let floatingActionDialogHandler = null;
const bomImportDialog = reactive({
  visible: false,
  fileName: "",
  keepOpen: false
});
const deliveryPlanImportDialog = reactive({
  visible: false,
  fileName: "",
  keepOpen: false
});
const barcodeDetailDialog = reactive({
  visible: false,
  maximized: false,
  kind: "",
  title: "",
  sourceKey: "",
  currentPage: 1,
  pageSize: 10,
  columns: [],
  rows: [],
  rowActions: [],
  toolbarActions: []
});
const barcodeTemplateDialog = reactive({
  visible: false,
  mode: "preview",
  rowId: "",
  ruleName: "",
  templateName: "",
  templateFileName: "",
  printerModel: "",
  paperSize: "",
  dpi: "",
  commandType: "PRN",
  sampleValue: "",
  displayText: "",
  subText: "",
  uploadedAt: "",
  uploadedBy: ""
});
const barcodeTemplateFileInput = ref(null);
const barcodeDirectUploadInput = ref(null);
const barcodeDirectUploadRowId = ref("");

const MENU_PERMISSION_TEMPLATE = [
  { key: "menu-user", label: "用户管理", checked: true },
  { key: "menu-factory", label: "工厂管理", checked: false },
  { key: "menu-material", label: "物料管理", checked: true },
  { key: "menu-barcode-rule", label: "物料条码规则", checked: true },
  { key: "menu-equipment-ledger", label: "设备台账", checked: true },
  { key: "menu-inspection-standard", label: "点检标准", checked: false },
  { key: "menu-maintain-project", label: "保养项目", checked: false },
  { key: "menu-material-trace", label: "物料追溯", checked: true },
  { key: "menu-warehouse", label: "仓库管理", checked: true },
  { key: "menu-outbound", label: "出库单管理", checked: false },
  { key: "menu-esop", label: "ESOP管理", checked: false },
  { key: "menu-customer-definition", label: "客户定义", checked: true },
  { key: "menu-inspection-item", label: "检查项目", checked: false },
  { key: "menu-recipe", label: "配方定义", checked: false }
];

const PDA_PERMISSION_TEMPLATE = [
  {
    key: "pda-production",
    label: "生产管理",
    checked: true,
    expanded: false,
    children: [
      { key: "pda-production-plan", label: "计划管理", checked: true },
      { key: "pda-production-work-order", label: "工单管理", checked: true }
    ]
  },
  {
    key: "pda-warehouse",
    label: "仓库管理",
    checked: false,
    expanded: false,
    children: [
      { key: "pda-warehouse-stock", label: "库存管理", checked: false },
      { key: "pda-warehouse-location", label: "库位管理", checked: false }
    ]
  },
  {
    key: "pda-production-config",
    label: "生产配置",
    checked: false,
    expanded: false,
    children: [{ key: "pda-production-config-workshop", label: "车间管理", checked: false }]
  },
  { key: "pda-process", label: "工艺管理", checked: false, expanded: false },
  { key: "pda-barcode", label: "条码管理", checked: false, expanded: false },
  {
    key: "pda-equipment",
    label: "设备管理",
    checked: false,
    expanded: false,
    children: [{ key: "pda-equipment-ledger", label: "设备台账", checked: false }]
  },
  { key: "pda-traceability", label: "生产追溯", checked: false, expanded: false },
  { key: "pda-settings", label: "系统设置", checked: false, expanded: false }
];

const BUTTON_PERMISSION_TEMPLATE = [
  {
    key: "button-user",
    label: "用户管理",
    checked: true,
    expanded: false,
    children: [
      { key: "button-user-add", label: "新增", checked: true },
      { key: "button-user-reset", label: "重置密码", checked: false }
    ]
  },
  {
    key: "button-barcode-rule",
    label: "物料条码规则",
    checked: false,
    expanded: false,
    children: [{ key: "button-barcode-rule-edit", label: "修改", checked: false }]
  },
  {
    key: "button-equipment-ledger",
    label: "设备台账",
    checked: true,
    expanded: false,
    children: [{ key: "button-equipment-ledger-export", label: "导出", checked: true }]
  },
  { key: "button-inspection-standard", label: "点检标准", checked: false, expanded: false },
  { key: "button-maintain-project", label: "保养项目", checked: false, expanded: false },
  { key: "button-esop", label: "ESOP管理", checked: false, expanded: false },
  { key: "button-customer-definition", label: "客户定义", checked: true, expanded: false },
  { key: "button-approval-group", label: "审批小组", checked: true, expanded: false },
  { key: "button-sampling", label: "抽样方案", checked: false, expanded: false },
  { key: "button-inbound", label: "入库单管理", checked: false, expanded: false },
  { key: "button-software", label: "软件版本", checked: true, expanded: false },
  { key: "button-test-menu", label: "测试菜单2", checked: true, expanded: false },
  { key: "button-delivery-plan", label: "发货计划", checked: true, expanded: false },
  { key: "button-work-order-list", label: "工单列表", checked: true, expanded: false }
];

const SUBMENU_DIALOG_TEMPLATES = {
  生产配置: [
    { id: "sub-001", name: "工厂管理", path: "/factory", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-002", name: "车间管理", path: "/workshop", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-003", name: "产线管理", path: "/production-line", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-004", name: "线体管理", path: "/line-body", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-005", name: "工位管理", path: "/work-station", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-006", name: "班别管理", path: "/class", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-007", name: "人员管理", path: "/people-bind-station", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
    { id: "sub-008", name: "工作日历", path: "/work-calendar", operator: "员工A(100000004)", updatedAt: "2026-03-19 11:18:38", createdAt: "2024-03-29 16:34:45" }
  ]
};
const APPROVAL_FLOW_TEMPLATES = {
  计划审批A组: [
    { id: "flow-1", name: "汉鑫-胡冰洁(hubj)" },
    { id: "flow-2", name: "姜计飞(jiang)" }
  ]
};
const APPROVAL_CC_TEMPLATES = {
  计划审批A组: [
    { id: "cc-1", name: "汉鑫-胡冰洁(hubj)", operator: "汉鑫-胡冰洁(hubj)", createdAt: "2024-09-19 17:26:59" },
    { id: "cc-2", name: "姜计飞(jiang)", operator: "汉鑫-胡冰洁(hubj)", createdAt: "2024-09-19 17:27:06" },
    { id: "cc-3", name: "朱义鹏(zyp)", operator: "汉鑫-胡冰洁(hubj)", createdAt: "2024-09-19 17:27:06" }
  ]
};
const CELL_DETAIL_ROWS_BY_LINE = {
  组装产线: [
    { id: "CELL-001", cellName: "域控产线", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-15 20:16:24", createdAt: "2026-01-15 20:16:24" },
    { id: "CELL-002", cellName: "组装A线-控制模块", operator: "马晓峰(mxz)", updatedAt: "2024-11-11 08:31:37", createdAt: "2024-11-11 08:31:37" },
    { id: "CELL-003", cellName: "组装A线-PTC", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 18:48:54", createdAt: "2024-09-19 14:47:54" }
  ],
  SMT产线: [
    { id: "CELL-101", cellName: "SMT A线", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 15:12:37", createdAt: "2024-09-19 15:12:37" },
    { id: "CELL-102", cellName: "SMT B线", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 15:16:22", createdAt: "2024-09-19 15:16:22" }
  ],
  波峰焊产线: [
    { id: "CELL-201", cellName: "波峰焊主线", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 15:18:12", createdAt: "2024-09-19 15:18:12" }
  ]
};
const STATION_DETAIL_ROWS_BY_CELL = {
  域控产线: [
    { id: "ST-101", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-001", stationName: "气密检测工位", stationLocation: "二号楼二楼" },
    { id: "ST-102", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-002", stationName: "装透气阀", stationLocation: "2号楼2层" },
    { id: "ST-103", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-003", stationName: "烧录-FCT-9", stationLocation: "二号楼二楼" },
    { id: "ST-104", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-004", stationName: "烧录-FCT-10", stationLocation: "二号楼二楼" },
    { id: "ST-105", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-005", stationName: "EOL-21工位", stationLocation: "二号楼二楼" },
    { id: "ST-106", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-006", stationName: "EOL-22工位", stationLocation: "二号楼二楼" },
    { id: "ST-107", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-007", stationName: "硅胶垫粘贴工位", stationLocation: "二号楼二楼" },
    { id: "ST-108", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-008", stationName: "壳体打胶工位", stationLocation: "二号楼二楼" },
    { id: "ST-109", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-009", stationName: "线路板组装工位", stationLocation: "二号楼二楼" },
    { id: "ST-110", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-010", stationName: "锁螺丝工位", stationLocation: "二号楼二楼" },
    { id: "ST-111", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-011", stationName: "铭牌粘贴工位", stationLocation: "二号楼二楼" },
    { id: "ST-112", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-012", stationName: "整机外观检查", stationLocation: "二号楼二楼" },
    { id: "ST-113", lineName: "组装产线", cellName: "域控产线", stationCode: "ST-DK-013", stationName: "包装确认工位", stationLocation: "二号楼二楼" }
  ]
};
const PROCEDURE_BINDING_ROWS = {
  镭雕: [],
  硅胶垫热贴: [
    { id: "PB-001", cellName: "域控产线", stationName: "硅胶垫粘贴工位", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2026-03-30 08:58:08", createdAt: "2026-03-30 08:58:08" }
  ],
  壳体打胶: [
    { id: "PB-002", cellName: "域控产线", stationName: "壳体打胶工位", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 08:57:31", createdAt: "2026-01-16 08:57:31" }
  ]
};
const ROUTE_PROCESS_FLOW_TEMPLATES = {
  SMT虚拟路线: [
    { id: "RF-001", code: "01", name: "镭雕打码", mode: "不读取设备数据", tone: "primary", tags: ["A"] },
    { id: "RF-002", code: "02", name: "上板-无", mode: "不读取设备数据", tone: "plain", tags: ["A"] },
    { id: "RF-003", code: "03", name: "SMT-炉前AOI", mode: "不读取设备数据", tone: "plain", tags: ["A"] },
    { id: "RF-004", code: "04", name: "回流焊", mode: "不读取设备数据", tone: "warning", tags: ["F", "A"] }
  ]
};
const PROCESS_BIND_STATION_OPTIONS = [
  "气密检测工位",
  "装透气阀",
  "烧录-FCT-9",
  "烧录-FCT-10",
  "EOL-21工位",
  "EOL-22工位",
  "硅胶垫粘贴工位",
  "壳体打胶工位"
];
const STEP_PRINT_PRINTER_OPTIONS = [
  "ZT410-A 条码打印机",
  "CL4NX 标签打印机",
  "域控组装打印机",
  "烧录工位打印机"
];
const ROUTE_PROCESS_OPTIONS = [
  "镭雕打码",
  "上板-无",
  "SMT-炉前AOI",
  "回流焊",
  "下板",
  "FCT测试"
];
const BOM_COPY_OPTIONS = [
  "不复制",
  "复制当前产品最新版本",
  "复制上一个版本BOM"
];

const pageConfig = computed(() => {
  return (
    submodulePageConfigs[route.name] || {
      title: route.meta.title || "子项页面",
      description: route.meta.description || "当前页面暂无配置。",
      filters: [],
      columns: [],
      rows: [],
      toolbarActions: [],
      rowActions: []
    }
  );
});

watch(
  pageConfig,
  (config) => {
    rows.value = deepClone(config.rows || []).map((row) => enrichRowForPage(row));
    selectedRowKeys.value = [];
    Object.keys(filters).forEach((key) => {
      delete filters[key];
    });
    (config.filters || []).forEach((item) => {
      if (item.type === "daterange") {
        filters[item.startKey] = typeof route.query[item.startKey] === "string" ? route.query[item.startKey] : "";
        filters[item.endKey] = typeof route.query[item.endKey] === "string" ? route.query[item.endKey] : "";
      } else {
        const routeValue = route.query[item.key];
        filters[item.key] =
          typeof routeValue === "string" && routeValue
            ? routeValue
            : item.type === "select"
              ? "all"
              : "";
      }
    });

    Object.keys(panelForm).forEach((key) => {
      delete panelForm[key];
    });
    Object.keys(modalForm).forEach((key) => {
      delete modalForm[key];
    });
    activePanelKey.value = config.panels?.[0]?.key || "";
    activeTraceTab.value =
      typeof route.query.tab === "string" && config.tabs?.includes(route.query.tab)
        ? route.query.tab
        : config.tabs?.[0] || "";
    modalVisible.value = false;
    modalMode.value = "add";
    editingRowId.value = "";
    closeConfirmDialog();
    closeDictionaryEntryDialog();
    closePermissionDialog();
    closeMenuSheetDialog();
    closeApprovalGroupDialog();
    closeHierarchyDetailDialog();
    closeStationDetailDialog();
    closeProcedureBindingDialog();
    closeRouteProcessDialog();
    closeFloatingActionDialog();
    closeBomImportDialog();
    closeDeliveryPlanImportDialog();
    closeBarcodeDetailDialog();
    closeBarcodeTemplateDialog();
    if (config.calendar) {
      calendarYear.value = config.calendar.year;
      calendarMonth.value = config.calendar.month;
    }
    (config.panels || []).forEach((panel) => {
      (panel.fields || []).forEach((field) => {
        panelForm[field.key] = field.value || "";
      });
    });

    const nextPage = Number(route.query.page);
    const nextPageSize = Number(route.query.pageSize);
    currentPage.value = Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1;
    pageSize.value = pageSizeOptions.includes(nextPageSize) ? nextPageSize : 10;
  },
  { immediate: true }
);

const filteredRows = computed(() => {
  return rows.value.filter((row) =>
    (pageConfig.value.filters || []).every((filterItem) => {
      const value = filters[filterItem.key];
      if (filterItem.type === "text") {
        if (!value) {
          return true;
        }
        const query = String(value).trim().toLowerCase();
        return (filterItem.matchFields || []).some((field) =>
          String(row[field] || "")
            .toLowerCase()
            .includes(query)
        );
      }

      if (filterItem.type === "select") {
        if (!value || value === "all") {
          return true;
        }
        return String(row[filterItem.matchField] || "") === String(value);
      }

      if (filterItem.type === "daterange") {
        const startValue = filters[filterItem.startKey];
        const endValue = filters[filterItem.endKey];
        const startField = filterItem.matchFieldStart || filterItem.matchField || filterItem.key;
        const endField = filterItem.matchFieldEnd || filterItem.matchField || filterItem.key;
        const currentStart = String(row[startField] || "");
        const currentEnd = String(row[endField] || "");

        if (startValue && currentStart && currentStart < startValue) {
          return false;
        }

        if (endValue && currentEnd && currentEnd > endValue) {
          return false;
        }

        return true;
      }

      return true;
    })
  );
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));

const modalVariant = computed(() => pageConfig.value.modalVariant || "default");
const modalKeepOpenEnabled = computed(() => Boolean(pageConfig.value.modalKeepOpenEnabled));
const hideModalCancel = computed(() => Boolean(pageConfig.value.hideModalCancel));
const permissionVisibleRows = computed(() => buildPermissionVisibleRows(permissionDialog.nodes, permissionDialog.search));
const permissionSelectedCount = computed(() => {
  if (permissionDialog.countMode === "top") {
    return permissionDialog.nodes.filter((node) => node.checked).length;
  }

  if (permissionDialog.countMode === "leaf") {
    return flattenPermissionNodes(permissionDialog.nodes).filter((node) => node.checked).length;
  }

  return 0;
});
const menuSheetFilteredRows = computed(() => {
  const query = String(menuSheetDialog.keyword || "")
    .trim()
    .toLowerCase();

  if (!query) {
    return menuSheetDialog.sourceRows;
  }

  return menuSheetDialog.sourceRows.filter((row) => {
    return ["name", "path", "operator", "updatedAt", "createdAt"].some((key) =>
      String(row[key] || "")
        .toLowerCase()
        .includes(query)
    );
  });
});
const menuSheetPageCount = computed(() => Math.max(1, Math.ceil(menuSheetFilteredRows.value.length / menuSheetDialog.pageSize)));
const menuSheetPagedRows = computed(() => {
  const start = (menuSheetDialog.currentPage - 1) * menuSheetDialog.pageSize;
  return menuSheetFilteredRows.value.slice(start, start + menuSheetDialog.pageSize);
});
const approvalGroupPageCount = computed(() =>
  Math.max(1, Math.ceil(approvalGroupDialog.sourceRows.length / approvalGroupDialog.pageSize))
);
const approvalGroupPagedRows = computed(() => {
  const start = (approvalGroupDialog.currentPage - 1) * approvalGroupDialog.pageSize;
  return approvalGroupDialog.sourceRows.slice(start, start + approvalGroupDialog.pageSize);
});
const hierarchyDetailPageCount = computed(() =>
  Math.max(1, Math.ceil(hierarchyDetailDialog.rows.length / hierarchyDetailDialog.pageSize))
);
const hierarchyDetailPagedRows = computed(() => {
  const start = (hierarchyDetailDialog.currentPage - 1) * hierarchyDetailDialog.pageSize;
  return hierarchyDetailDialog.rows.slice(start, start + hierarchyDetailDialog.pageSize);
});
const stationDetailFilteredRows = computed(() => {
  return stationDetailDialog.sourceRows.filter((row) => {
    const stationCodeMatched =
      !stationDetailDialog.stationCode || String(row.stationCode || "").toLowerCase().includes(stationDetailDialog.stationCode.trim().toLowerCase());
    const stationNameMatched =
      !stationDetailDialog.stationName || String(row.stationName || "").toLowerCase().includes(stationDetailDialog.stationName.trim().toLowerCase());
    const lineMatched = !stationDetailDialog.line || stationDetailDialog.line === "all" || row.lineName === stationDetailDialog.line;
    const cellMatched = !stationDetailDialog.cell || stationDetailDialog.cell === "all" || row.cellName === stationDetailDialog.cell;

    return stationCodeMatched && stationNameMatched && lineMatched && cellMatched;
  });
});
const stationDetailPageCount = computed(() =>
  Math.max(1, Math.ceil(stationDetailFilteredRows.value.length / stationDetailDialog.pageSize))
);
const stationDetailPagedRows = computed(() => {
  const start = (stationDetailDialog.currentPage - 1) * stationDetailDialog.pageSize;
  return stationDetailFilteredRows.value.slice(start, start + stationDetailDialog.pageSize);
});
const stationDetailLineOptions = computed(() => [
  ...new Set(stationDetailDialog.sourceRows.map((row) => row.lineName).filter(Boolean))
]);
const stationDetailCellOptions = computed(() => [
  ...new Set(stationDetailDialog.sourceRows.map((row) => row.cellName).filter(Boolean))
]);
const procedureBindingPageCount = computed(() =>
  Math.max(1, Math.ceil(procedureBindingDialog.sourceRows.length / procedureBindingDialog.pageSize))
);
const procedureBindingPagedRows = computed(() => {
  const start = (procedureBindingDialog.currentPage - 1) * procedureBindingDialog.pageSize;
  return procedureBindingDialog.sourceRows.slice(start, start + procedureBindingDialog.pageSize);
});
const barcodeDetailPageCount = computed(() =>
  Math.max(1, Math.ceil(barcodeDetailDialog.rows.length / barcodeDetailDialog.pageSize))
);
const barcodeDetailPagedRows = computed(() => {
  const start = (barcodeDetailDialog.currentPage - 1) * barcodeDetailDialog.pageSize;
  return barcodeDetailDialog.rows.slice(start, start + barcodeDetailDialog.pageSize);
});

const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});
const barcodeTemplatePreviewCells = computed(() =>
  buildQrPreviewCells(barcodeTemplateDialog.sampleValue || barcodeTemplateDialog.displayText || "20serialVal")
);
const barcodeTemplatePaperStyle = computed(() => {
  const match = String(barcodeTemplateDialog.paperSize || "").match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (!match) {
    return {};
  }

  return {
    aspectRatio: `${Number(match[1])} / ${Number(match[2])}`
  };
});

function isBarcodeTemplateRoute(routeName = route.name) {
  return ["barcodeCustomerRule", "barcodeFinishedRule"].includes(String(routeName || ""));
}

function isLotBarcodeRoute(routeName = route.name) {
  return String(routeName || "") === "barcodeLotRule";
}

function supportsBarcodeDetailDialog(routeName = route.name) {
  return isBarcodeTemplateRoute(routeName) || isLotBarcodeRoute(routeName);
}

function slugifyTemplateName(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "barcode-template";
}

function buildBarcodeTemplatePreset(row = {}) {
  const routeName = String(route.name || "");
  const isCustomerRule = routeName === "barcodeCustomerRule";
  const isFirstRow = String(row.id || "").endsWith("-1");
  const defaultValue = isCustomerRule
    ? isFirstRow
      ? "20serialVal"
      : "12VPTCserialVal"
    : String(row.ruleName || "").trim() || (isFirstRow ? "23122081002" : "704");

  return {
    labelName: isCustomerRule ? "客户二维码标签" : "成品条码标签",
    paperSize: "100 x 70 mm",
    printerModel: "ZT410-A 条码打印机",
    dpi: "300 DPI",
    commandType: "PRN",
    sampleValue: defaultValue,
    displayText: defaultValue,
    subText: isCustomerRule ? "客户条码预览" : "成品条码预览"
  };
}

function enrichRowForPageLegacy(row = {}) {
  if (!isBarcodeTemplateRoute()) {
    return row;
  }

  const sourceKey = row.ruleName || row.id || "barcode-template";
  return {
    ...row,
    template: row.template || "预览模板",
    templateFileName: row.templateFileName || `${slugifyTemplateName(sourceKey)}.prn`,
    templateProfile: {
      ...buildBarcodeTemplatePreset(row),
      ...(row.templateProfile || {})
    }
  };
}

/* function enrichRowForPage(row = {}) {
  if (!isBarcodeTemplateRoute()) {
    return row;
  }

  const sourceKey = row.ruleName || row.id || "barcode-template";
  const hasTemplateAsset = Boolean(row.hasTemplateAsset || row.templateFileName || row.templateProfile);
  const preferredMode = hasTemplateAsset ? "preview" : "upload";
    (String(row.template || "").includes("上传") || (!hasTemplateAsset && String(row.id || "").endsWith("-2"))
      ? "upload"
      : "preview");

  return {
    ...row,
    templateMode: preferredMode,
    template: preferredMode === "upload" && !hasTemplateAsset ? "上传模板" : "预览模板",
    templateFileName:
      preferredMode === "upload" && !hasTemplateAsset
        ? ""
        : row.templateFileName || `${slugifyTemplateName(sourceKey)}.prn`,
    templateProfile: {
      ...buildBarcodeTemplatePreset(row),
      ...(row.templateProfile || {})
    }
  };
} */

function enrichRowForPage(row = {}) {
  if (!isBarcodeTemplateRoute()) {
    return row;
  }

  const sourceKey = row.ruleName || row.id || "barcode-template";
  const hasTemplateAsset = Boolean(row.hasTemplateAsset || row.templateFileName || row.templateProfile);

  return {
    ...row,
    hasTemplateAsset,
    templateMode: hasTemplateAsset ? "preview" : "upload",
    template: hasTemplateAsset ? "预览模板" : "",
    templateFileName: hasTemplateAsset ? row.templateFileName || `${slugifyTemplateName(sourceKey)}.prn` : "",
    templateProfile: {
      ...buildBarcodeTemplatePreset(row),
      ...(row.templateProfile || {})
    }
  };
}

function buildQrPreviewCells(value) {
  const size = 21;
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  const reserved = Array.from({ length: size }, () => Array(size).fill(false));

  const lockCell = (rowIndex, columnIndex, dark) => {
    if (rowIndex < 0 || columnIndex < 0 || rowIndex >= size || columnIndex >= size) {
      return;
    }

    matrix[rowIndex][columnIndex] = Boolean(dark);
    reserved[rowIndex][columnIndex] = true;
  };

  const addFinder = (top, left) => {
    for (let rowIndex = -1; rowIndex <= 7; rowIndex += 1) {
      for (let columnIndex = -1; columnIndex <= 7; columnIndex += 1) {
        const targetRow = top + rowIndex;
        const targetColumn = left + columnIndex;
        if (targetRow < 0 || targetColumn < 0 || targetRow >= size || targetColumn >= size) {
          continue;
        }

        const isQuietZone = rowIndex === -1 || rowIndex === 7 || columnIndex === -1 || columnIndex === 7;
        const isOuterRing = rowIndex === 0 || rowIndex === 6 || columnIndex === 0 || columnIndex === 6;
        const isCenterBlock = rowIndex >= 2 && rowIndex <= 4 && columnIndex >= 2 && columnIndex <= 4;
        lockCell(targetRow, targetColumn, !isQuietZone && (isOuterRing || isCenterBlock));
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  for (let index = 8; index < size - 8; index += 1) {
    lockCell(6, index, index % 2 === 0);
    lockCell(index, 6, index % 2 === 0);
  }

  const text = String(value || "20serialVal");
  let seed = 0;
  for (const char of text) {
    seed = (seed * 131 + char.charCodeAt(0)) >>> 0;
  }
  if (!seed) {
    seed = 0x9e3779b9;
  }

  const nextBit = () => {
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >> 17;
    seed >>>= 0;
    seed ^= seed << 5;
    seed >>>= 0;
    return Boolean(seed & 1);
  };

  for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
      if (reserved[rowIndex][columnIndex]) {
        continue;
      }

      matrix[rowIndex][columnIndex] = nextBit();
    }
  }

  return matrix.flatMap((row, rowIndex) =>
    row.map((dark, columnIndex) => ({
      key: `${rowIndex}-${columnIndex}`,
      dark
    }))
  );
}

function clonePermissionNodes(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    partial: false,
    children: node.children?.length ? clonePermissionNodes(node.children) : []
  }));
}

function flattenPermissionNodes(nodes = []) {
  return nodes.flatMap((node) => {
    if (node.children?.length) {
      return flattenPermissionNodes(node.children);
    }

    return [node];
  });
}

function setPermissionNodesChecked(nodes = [], checked) {
  nodes.forEach((node) => {
    node.checked = checked;
    node.partial = false;
    if (node.children?.length) {
      setPermissionNodesChecked(node.children, checked);
    }
  });
}

function normalizePermissionNodes(nodes = []) {
  nodes.forEach((node) => {
    if (!node.children?.length) {
      node.partial = false;
      return;
    }

    normalizePermissionNodes(node.children);
    const childStates = node.children.map((child) => child.checked || child.partial);
    const everyChecked = node.children.every((child) => child.checked);
    node.checked = everyChecked;
    node.partial = childStates.some(Boolean) && !everyChecked;
  });
}

function buildPermissionVisibleRows(nodes = [], keyword = "", depth = 0) {
  const query = String(keyword || "")
    .trim()
    .toLowerCase();
  const rows = [];

  nodes.forEach((node) => {
    const childRows = node.children?.length ? buildPermissionVisibleRows(node.children, keyword, depth + 1) : [];
    const matchedSelf = !query || String(node.label || "").toLowerCase().includes(query);
    const visible = matchedSelf || childRows.length;

    if (!visible) {
      return;
    }

    rows.push({
      node,
      depth,
      hasChildren: Boolean(node.children?.length),
      forceExpanded: Boolean(query && childRows.length)
    });

    if (node.children?.length && (node.expanded || (query && childRows.length))) {
      rows.push(...childRows);
    }
  });

  return rows;
}

function togglePermissionNode(node, checked) {
  node.checked = checked;
  node.partial = false;
  if (node.children?.length) {
    setPermissionNodesChecked(node.children, checked);
  }
  normalizePermissionNodes(permissionDialog.nodes);
}

function togglePermissionExpand(node) {
  if (!node.children?.length) {
    return;
  }

  node.expanded = !node.expanded;
}

function handlePermissionBulkAction() {
  const allLeaves = flattenPermissionNodes(permissionDialog.nodes);
  if (!allLeaves.length) {
    return;
  }

  const shouldSelectAll = allLeaves.some((node) => !node.checked);
  if (shouldSelectAll) {
    setPermissionNodesChecked(permissionDialog.nodes, true);
  } else {
    allLeaves.forEach((node) => {
      node.checked = !node.checked;
    });
  }

  normalizePermissionNodes(permissionDialog.nodes);
}

function openPermissionDialog({ title, nodes, mode = "flat", countMode = "none" }) {
  permissionDialog.title = title;
  permissionDialog.mode = mode;
  permissionDialog.countMode = countMode;
  permissionDialog.search = "";
  permissionDialog.nodes = clonePermissionNodes(nodes);
  normalizePermissionNodes(permissionDialog.nodes);
  permissionDialog.visible = true;
}

function closePermissionDialog() {
  permissionDialog.visible = false;
  permissionDialog.title = "";
  permissionDialog.mode = "flat";
  permissionDialog.countMode = "none";
  permissionDialog.search = "";
  permissionDialog.nodes = [];
}

function buildGeneratedSubmenuRows(menuName) {
  const matchedModule = defaultModuleRegistry.find((item) => item.label === menuName);
  if (!matchedModule?.children?.length) {
    return [];
  }

  return matchedModule.children.map((child, index) => ({
    id: `${matchedModule.key}-${index + 1}`,
    name: child.label,
    path: `/${child.path}`,
    operator: "员工A(100000004)",
    updatedAt: "2026-03-19 11:18:36",
    createdAt: "2024-03-29 16:34:45"
  }));
}

function buildMenuSheetRows(menuName) {
  return deepClone(SUBMENU_DIALOG_TEMPLATES[menuName] || buildGeneratedSubmenuRows(menuName));
}

function openMenuSheetDialog(title, sourceRows) {
  menuSheetDialog.title = title;
  menuSheetDialog.keyword = "";
  menuSheetDialog.currentPage = 1;
  menuSheetDialog.pageSize = 10;
  menuSheetDialog.maximized = false;
  menuSheetDialog.sourceRows = deepClone(sourceRows);
  menuSheetDialog.visible = true;
}

function closeMenuSheetDialog() {
  menuSheetDialog.visible = false;
  menuSheetDialog.title = "";
  menuSheetDialog.keyword = "";
  menuSheetDialog.currentPage = 1;
  menuSheetDialog.pageSize = 10;
  menuSheetDialog.maximized = false;
  menuSheetDialog.sourceRows = [];
}

function openSubmenuSheet(row) {
  const title = row.name || row.label || pageConfig.value.title;
  const rowsForDialog = buildMenuSheetRows(title);
  if (!rowsForDialog.length) {
    mesStore.setToast(`${title} 暂无下级菜单。`);
    return;
  }
  openMenuSheetDialog(title, rowsForDialog);
}

function toggleMenuSheetMaximize() {
  menuSheetDialog.maximized = !menuSheetDialog.maximized;
}

function resetMenuSheetSearch() {
  menuSheetDialog.keyword = "";
  menuSheetDialog.currentPage = 1;
}

function handleMenuSheetToolbarAction(actionKey) {
  switch (actionKey) {
    case "menuSort":
      menuSheetDialog.sourceRows = [...menuSheetDialog.sourceRows].reverse();
      mesStore.setToast(`${menuSheetDialog.title} 菜单排序已更新。`);
      break;
    case "add":
      menuSheetDialog.sourceRows.unshift({
        id: `sheet-${Date.now()}`,
        name: `${menuSheetDialog.title}新增菜单`,
        path: `/new-${Date.now().toString().slice(-4)}`,
        operator: "当前用户",
        updatedAt: currentTimestamp(),
        createdAt: currentTimestamp()
      });
      menuSheetDialog.currentPage = 1;
      mesStore.setToast(`${menuSheetDialog.title} 子菜单已新增。`);
      break;
    case "refresh":
      menuSheetDialog.sourceRows = buildMenuSheetRows(menuSheetDialog.title);
      menuSheetDialog.currentPage = 1;
      mesStore.setToast(`${menuSheetDialog.title} 子菜单已刷新。`);
      break;
    case "save":
      mesStore.setToast(`${menuSheetDialog.title} 菜单配置已保存。`);
      break;
    default:
      break;
  }
}

function handleMenuSheetRowAction(actionKey, row) {
  switch (actionKey) {
    case "edit":
      mesStore.setToast(`${row.name} 编辑窗口已打开。`);
      break;
    case "submenu":
      openSubmenuSheet(row);
      break;
    default:
      mesStore.setToast(`${row.name} 更多操作已打开。`);
      break;
  }
}

function previousMenuSheetPage() {
  menuSheetDialog.currentPage = Math.max(1, menuSheetDialog.currentPage - 1);
}

function nextMenuSheetPage() {
  menuSheetDialog.currentPage = Math.min(menuSheetPageCount.value, menuSheetDialog.currentPage + 1);
}

function buildApprovalFlowNodes(groupName) {
  return deepClone(
    APPROVAL_FLOW_TEMPLATES[groupName] || [
      { id: "flow-default-1", name: "审批人A(user-a)" },
      { id: "flow-default-2", name: "审批人B(user-b)" }
    ]
  );
}

function buildApprovalCcRows(groupName) {
  return deepClone(
    APPROVAL_CC_TEMPLATES[groupName] || [
      { id: "cc-default-1", name: "抄送人A(user-a)", operator: "当前用户", createdAt: currentTimestamp() }
    ]
  );
}

function openApprovalGroupDialog(mode, row) {
  approvalGroupDialog.visible = true;
  approvalGroupDialog.mode = mode;
  approvalGroupDialog.title = row.name || "审批小组";
  approvalGroupDialog.currentPage = 1;
  approvalGroupDialog.pageSize = 10;
  approvalGroupDialog.maximized = false;
  approvalGroupDialog.flowNodes = mode === "flow" ? buildApprovalFlowNodes(approvalGroupDialog.title) : [];
  approvalGroupDialog.sourceRows = mode === "table" ? buildApprovalCcRows(approvalGroupDialog.title) : [];
}

function closeApprovalGroupDialog() {
  approvalGroupDialog.visible = false;
  approvalGroupDialog.mode = "flow";
  approvalGroupDialog.title = "";
  approvalGroupDialog.currentPage = 1;
  approvalGroupDialog.pageSize = 10;
  approvalGroupDialog.maximized = false;
  approvalGroupDialog.flowNodes = [];
  approvalGroupDialog.sourceRows = [];
}

function toggleApprovalGroupMaximize() {
  approvalGroupDialog.maximized = !approvalGroupDialog.maximized;
}

function handleApprovalGroupToolbarAction(actionKey) {
  if (approvalGroupDialog.mode === "flow") {
    if (actionKey === "add") {
      approvalGroupDialog.flowNodes.push({
        id: `flow-${Date.now()}`,
        name: `新增审批人${approvalGroupDialog.flowNodes.length + 1}(new)`
      });
      mesStore.setToast(`${approvalGroupDialog.title} 审批节点已新增。`);
    }
    return;
  }

  switch (actionKey) {
    case "add":
      approvalGroupDialog.sourceRows.unshift({
        id: `cc-${Date.now()}`,
        name: `新增抄送人${approvalGroupDialog.sourceRows.length + 1}(new)`,
        operator: "当前用户",
        createdAt: currentTimestamp()
      });
      approvalGroupDialog.currentPage = 1;
      mesStore.setToast(`${approvalGroupDialog.title} 抄送人员已新增。`);
      break;
    case "refresh":
      approvalGroupDialog.sourceRows = buildApprovalCcRows(approvalGroupDialog.title);
      approvalGroupDialog.currentPage = 1;
      mesStore.setToast(`${approvalGroupDialog.title} 抄送人员已刷新。`);
      break;
    case "save":
      mesStore.setToast(`${approvalGroupDialog.title} 配置已保存。`);
      break;
    default:
      break;
  }
}

function deleteApprovalGroupRow(row) {
  approvalGroupDialog.sourceRows = approvalGroupDialog.sourceRows.filter((item) => item.id !== row.id);
  approvalGroupDialog.currentPage = Math.min(approvalGroupDialog.currentPage, approvalGroupPageCount.value);
  mesStore.setToast(`${row.name} 已删除。`);
}

function previousApprovalGroupPage() {
  approvalGroupDialog.currentPage = Math.max(1, approvalGroupDialog.currentPage - 1);
}

function nextApprovalGroupPage() {
  approvalGroupDialog.currentPage = Math.min(approvalGroupPageCount.value, approvalGroupDialog.currentPage + 1);
}

function buildLineDetailRows(workshopName) {
  const rowsForDialog = (submodulePageConfigs.productionConfigLine?.rows || [])
    .filter((item) => item.workshop === workshopName)
    .map((item) => ({
      id: item.id,
      lineCode: item.id,
      lineName: item.lineName,
      operator: item.operator,
      updatedAt: item.updatedAt,
      createdAt: item.createdAt
    }));

  return deepClone(rowsForDialog);
}

function buildCellDetailRows(lineName) {
  const rowsForDialog = CELL_DETAIL_ROWS_BY_LINE[lineName] || [];
  return deepClone(rowsForDialog);
}

function buildStationDetailRows(cellName) {
  return deepClone(STATION_DETAIL_ROWS_BY_CELL[cellName] || []);
}

function openHierarchyDetailDialog(title, columns, rowsForDialog) {
  hierarchyDetailDialog.visible = true;
  hierarchyDetailDialog.title = title;
  hierarchyDetailDialog.columns = columns;
  hierarchyDetailDialog.rows = deepClone(rowsForDialog);
  hierarchyDetailDialog.currentPage = 1;
  hierarchyDetailDialog.pageSize = 10;
}

function closeHierarchyDetailDialog() {
  hierarchyDetailDialog.visible = false;
  hierarchyDetailDialog.title = "";
  hierarchyDetailDialog.columns = [];
  hierarchyDetailDialog.rows = [];
  hierarchyDetailDialog.currentPage = 1;
  hierarchyDetailDialog.pageSize = 10;
}

function previousHierarchyDetailPage() {
  hierarchyDetailDialog.currentPage = Math.max(1, hierarchyDetailDialog.currentPage - 1);
}

function nextHierarchyDetailPage() {
  hierarchyDetailDialog.currentPage = Math.min(hierarchyDetailPageCount.value, hierarchyDetailDialog.currentPage + 1);
}

function openStationDetailDialog(row) {
  const sourceRows = buildStationDetailRows(row.cellName || row.name);
  stationDetailDialog.visible = true;
  stationDetailDialog.title = `${row.cellName || row.name}工位明细`;
  stationDetailDialog.stationCode = "";
  stationDetailDialog.stationName = "";
  stationDetailDialog.line = sourceRows[0]?.lineName || row.line || "all";
  stationDetailDialog.cell = sourceRows[0]?.cellName || row.cellName || row.name || "all";
  stationDetailDialog.sourceRows = sourceRows;
  stationDetailDialog.currentPage = 1;
  stationDetailDialog.pageSize = 10;
}

function closeStationDetailDialog() {
  stationDetailDialog.visible = false;
  stationDetailDialog.title = "";
  stationDetailDialog.stationCode = "";
  stationDetailDialog.stationName = "";
  stationDetailDialog.line = "";
  stationDetailDialog.cell = "";
  stationDetailDialog.sourceRows = [];
  stationDetailDialog.currentPage = 1;
  stationDetailDialog.pageSize = 10;
}

function queryStationDetailDialog() {
  stationDetailDialog.currentPage = 1;
}

function resetStationDetailDialog() {
  const firstRow = stationDetailDialog.sourceRows[0] || {};
  stationDetailDialog.stationCode = "";
  stationDetailDialog.stationName = "";
  stationDetailDialog.line = firstRow.lineName || "all";
  stationDetailDialog.cell = firstRow.cellName || "all";
  stationDetailDialog.currentPage = 1;
}

function refreshStationDetailDialog() {
  const cellName = stationDetailDialog.cell && stationDetailDialog.cell !== "all"
    ? stationDetailDialog.cell
    : stationDetailDialog.sourceRows[0]?.cellName;
  stationDetailDialog.sourceRows = buildStationDetailRows(cellName || "");
  stationDetailDialog.currentPage = 1;
  mesStore.setToast("工位明细已刷新。");
}

function saveStationDetailDialog() {
  mesStore.setToast("工位配置已保存。");
}

function previousStationDetailPage() {
  stationDetailDialog.currentPage = Math.max(1, stationDetailDialog.currentPage - 1);
}

function nextStationDetailPage() {
  stationDetailDialog.currentPage = Math.min(stationDetailPageCount.value, stationDetailDialog.currentPage + 1);
}

function getStableRowKey(row, index = 0) {
  return row[pageConfig.value.rowKey || "id"] || `${route.name}-${index}`;
}

function isRowSelected(row) {
  return selectedRowKeys.value.includes(getStableRowKey(row, 0));
}

function toggleRowSelection(row, checked) {
  const key = getStableRowKey(row, 0);
  if (checked) {
    if (!selectedRowKeys.value.includes(key)) {
      selectedRowKeys.value.push(key);
    }
    return;
  }

  selectedRowKeys.value = selectedRowKeys.value.filter((item) => item !== key);
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedRowKeys.value = filteredRows.value.map((row) => getStableRowKey(row, 0));
    return;
  }

  selectedRowKeys.value = [];
}

function isAllSelected() {
  return filteredRows.value.length > 0 && filteredRows.value.every((row) => selectedRowKeys.value.includes(getStableRowKey(row, 0)));
}

function toolbarButtonClass(action) {
  if (action.key === "deleteSelected" && selectedRowKeys.value.length) {
    return "btn-danger";
  }

  if (action.tone === "primary") {
    return "btn-primary";
  }

  if (action.tone === "secondary") {
    return "btn-secondary";
  }

  return "btn-ghost";
}

function isToolbarActionDisabled(action) {
  if (action.key === "deleteSelected") {
    return selectedRowKeys.value.length === 0;
  }

  return Boolean(action.disabled);
}

function buildProcedureBindingRows(processName) {
  return deepClone(PROCEDURE_BINDING_ROWS[processName] || []);
}

function openProcedureBindingDialog(row) {
  procedureBindingDialog.visible = true;
  procedureBindingDialog.processName = row.processName || row.name;
  procedureBindingDialog.title = `${procedureBindingDialog.processName}工序与工位绑定`;
  procedureBindingDialog.sourceRows = buildProcedureBindingRows(procedureBindingDialog.processName);
  procedureBindingDialog.currentPage = 1;
  procedureBindingDialog.pageSize = 10;
}

function closeProcedureBindingDialog() {
  procedureBindingDialog.visible = false;
  procedureBindingDialog.title = "";
  procedureBindingDialog.processName = "";
  procedureBindingDialog.sourceRows = [];
  procedureBindingDialog.currentPage = 1;
  procedureBindingDialog.pageSize = 10;
}

function previousProcedureBindingPage() {
  procedureBindingDialog.currentPage = Math.max(1, procedureBindingDialog.currentPage - 1);
}

function nextProcedureBindingPage() {
  procedureBindingDialog.currentPage = Math.min(procedureBindingPageCount.value, procedureBindingDialog.currentPage + 1);
}

function buildRouteProcessNodes(routeName, processCount = 0) {
  if (ROUTE_PROCESS_FLOW_TEMPLATES[routeName]) {
    return deepClone(ROUTE_PROCESS_FLOW_TEMPLATES[routeName]);
  }

  return Array.from({ length: Math.max(Number(processCount) || 0, 1) }, (_, index) => ({
    id: `RF-GEN-${index + 1}`,
    code: String(index + 1).padStart(2, "0"),
    name: `工序${index + 1}`,
    mode: "不读取设备数据",
    tone: index === 0 ? "primary" : "plain",
    tags: ["A"]
  }));
}

function openRouteProcessDialog(row) {
  routeProcessDialog.visible = true;
  routeProcessDialog.routeName = row.routeName || row.name;
  routeProcessDialog.title = `工艺路线明细-${routeProcessDialog.routeName}`;
  routeProcessDialog.maximized = false;
  routeProcessDialog.nodes = buildRouteProcessNodes(routeProcessDialog.routeName, row.processCount);
}

function closeRouteProcessDialog() {
  routeProcessDialog.visible = false;
  routeProcessDialog.routeName = "";
  routeProcessDialog.title = "";
  routeProcessDialog.maximized = false;
  routeProcessDialog.nodes = [];
}

function toggleRouteProcessMaximize() {
  routeProcessDialog.maximized = !routeProcessDialog.maximized;
}

function openFloatingActionDialog({ title, fields, initialValues = {}, keepOpenEnabled = false, submitLabel = "确定", onSubmit }) {
  floatingActionDialog.visible = true;
  floatingActionDialog.title = title;
  floatingActionDialog.fields = fields;
  floatingActionDialog.keepOpenEnabled = keepOpenEnabled;
  floatingActionDialog.keepOpen = false;
  floatingActionDialog.submitLabel = submitLabel;
  floatingActionDialog.values = {};
  fields.forEach((field) => {
    floatingActionDialog.values[field.key] =
      Object.prototype.hasOwnProperty.call(initialValues, field.key)
        ? initialValues[field.key]
        : field.defaultValue ?? (field.type === "select" ? field.options?.[0]?.value || "" : "");
  });
  floatingActionDialogHandler = onSubmit || null;
}

function closeFloatingActionDialog() {
  floatingActionDialog.visible = false;
  floatingActionDialog.title = "";
  floatingActionDialog.fields = [];
  floatingActionDialog.keepOpenEnabled = false;
  floatingActionDialog.keepOpen = false;
  floatingActionDialog.submitLabel = "确定";
  floatingActionDialog.values = {};
  floatingActionDialogHandler = null;
}

function submitFloatingActionDialog() {
  const requiredField = floatingActionDialog.fields.find((field) => field.required && !String(floatingActionDialog.values[field.key] ?? "").trim());
  if (requiredField) {
    mesStore.setToast(`请填写${requiredField.label}`);
    return;
  }

  if (floatingActionDialogHandler) {
    floatingActionDialogHandler(deepClone(floatingActionDialog.values), floatingActionDialog.keepOpen);
  }

  if (!floatingActionDialog.keepOpen) {
    closeFloatingActionDialog();
  }
}

function deleteSelectedRows() {
  if (!selectedRowKeys.value.length) {
    mesStore.setToast(`${pageConfig.value.title} 暂无选中数据。`);
    return;
  }

  openConfirmDialog({
    title: "批量删除",
    message: `你确定要删除已选中的 ${selectedRowKeys.value.length} 条数据吗？`,
    onConfirm: () => {
      rows.value = rows.value.filter((row) => !selectedRowKeys.value.includes(getStableRowKey(row, 0)));
      selectedRowKeys.value = [];
      currentPage.value = 1;
      mesStore.setToast(`${pageConfig.value.title} 已删除所选数据。`);
    }
  });
}

function openProcessBindStationForm() {
  openFloatingActionDialog({
    title: "工序与工位绑定",
    fields: [
      {
        key: "stationName",
        label: "工位",
        type: "select",
        required: true,
        options: [
          { label: "请选择", value: "" },
          ...PROCESS_BIND_STATION_OPTIONS.map((item) => ({ label: item, value: item }))
        ]
      }
    ],
    onSubmit: (values) => {
      const stationName = values.stationName;
      procedureBindingDialog.sourceRows.unshift({
        id: `PB-${Date.now()}`,
        cellName: "域控产线",
        stationName,
        operator: "当前用户",
        updatedAt: currentTimestamp(),
        createdAt: currentTimestamp()
      });
      procedureBindingDialog.currentPage = 1;
      mesStore.setToast(`${stationName} 已绑定到${procedureBindingDialog.processName}。`);
    }
  });
}

function openStepPrintDialog(row) {
  openFloatingActionDialog({
    title: "打印条码",
    fields: [
      {
        key: "printer",
        label: "打印机",
        type: "select",
        required: true,
        options: [
          { label: "请选择", value: "" },
          ...STEP_PRINT_PRINTER_OPTIONS.map((item) => ({ label: item, value: item }))
        ]
      }
    ],
    onSubmit: (values) => {
      mesStore.setToast(`${row.stepCode} 已提交到 ${values.printer}。`);
    }
  });
}

function openBindProcessDialog() {
  const routeName = routeProcessDialog.routeName;
  const previousOptions = routeProcessDialog.nodes.map((node) => ({ label: node.name, value: node.name }));

  openFloatingActionDialog({
    title: "绑定工序",
    fields: [
      {
        key: "processName",
        label: "工序名称",
        type: "select",
        required: true,
        options: [
          { label: "请选择", value: "" },
          ...ROUTE_PROCESS_OPTIONS.map((item) => ({ label: item, value: item }))
        ]
      },
      {
        key: "previousProcess",
        label: "前置工序",
        type: "select",
        required: true,
        options: previousOptions.length ? previousOptions : [{ label: "回流焊", value: "回流焊" }]
      },
      {
        key: "forcePass",
        label: "是否强制过站",
        type: "select",
        required: true,
        options: [
          { label: "是", value: "是" },
          { label: "否", value: "否" }
        ]
      },
      {
        key: "previousConfirm",
        label: "前置工序确认",
        type: "select",
        required: true,
        options: [
          { label: "仅上一道工序", value: "仅上一道工序" },
          { label: "全部前置工序", value: "全部前置工序" }
        ]
      },
      { key: "extensionName", label: "工序扩展名称", type: "text", placeholder: "请输入" },
      { key: "workSeconds", label: "工时(秒)", type: "text", required: true, defaultValue: "0" }
    ],
    onSubmit: (values) => {
      routeProcessDialog.nodes.push({
        id: `RF-${Date.now()}`,
        code: String(routeProcessDialog.nodes.length + 1).padStart(2, "0"),
        name: values.processName,
        mode: "不读取设备数据",
        tone: "plain",
        tags: ["A"]
      });
      mesStore.setToast(`${values.processName} 已绑定到${routeName}。`);
    }
  });
}

function openBomVersionDialog(row = null) {
  openFloatingActionDialog({
    title: "新增BOM版本信息",
    keepOpenEnabled: true,
    fields: [
      {
        key: "productName",
        label: "产品",
        type: row ? "readonly" : "select",
        required: true,
        options: [
          { label: "请选择", value: "" },
          ...rows.value.map((item) => ({ label: item.name, value: item.name }))
        ]
      },
      { key: "version", label: "版本号", type: "text", required: true, placeholder: "请输入" },
      { key: "enableDate", label: "启用日期", type: "date", required: true, placeholder: "请选择" },
      {
        key: "copyBom",
        label: "复制BOM",
        type: "select",
        options: BOM_COPY_OPTIONS.map((item) => ({ label: item, value: item }))
      }
    ],
    initialValues: {
      productName: row?.name || "",
      copyBom: BOM_COPY_OPTIONS[0]
    },
    onSubmit: (values, keepOpen) => {
      mesStore.setToast(`${values.productName || "BOM"} 版本 ${values.version} 已新增。`);
      if (keepOpen) {
        floatingActionDialog.values.version = "";
        floatingActionDialog.values.enableDate = "";
      }
    }
  });
}

function downloadBomTemplate() {
  const worksheet = xlsxUtils.aoa_to_sheet([
    ["产品", "版本号", "启用日期", "复制BOM"],
    ["P203-欧盟-线路板贴片完成组件", "V1.0", "2026-04-20", "不复制"]
  ]);
  const workbook = xlsxUtils.book_new();
  xlsxUtils.book_append_sheet(workbook, worksheet, "工序BOM模板");
  writeFileXLSX(workbook, "工序bom导入模板.xlsx");
}

function openBomImportDialog() {
  bomImportDialog.visible = true;
  bomImportDialog.fileName = "";
  bomImportDialog.keepOpen = false;
}

function closeBomImportDialog() {
  bomImportDialog.visible = false;
  bomImportDialog.fileName = "";
  bomImportDialog.keepOpen = false;
}

function downloadDeliveryPlanTemplate() {
  const worksheet = xlsxUtils.aoa_to_sheet([
    ["产品", "数量", "交期", "客户名称", "客户件号", "备注"],
    ["TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）", "780", "2026-04-30", "零跑#02", "", ""]
  ]);
  const workbook = xlsxUtils.book_new();
  xlsxUtils.book_append_sheet(workbook, worksheet, "发货计划模板");
  writeFileXLSX(workbook, "发货计划导入模板.xlsx");
}

function openDeliveryPlanImportDialog() {
  deliveryPlanImportDialog.visible = true;
  deliveryPlanImportDialog.fileName = "";
  deliveryPlanImportDialog.keepOpen = false;
}

function closeDeliveryPlanImportDialog() {
  deliveryPlanImportDialog.visible = false;
  deliveryPlanImportDialog.fileName = "";
  deliveryPlanImportDialog.keepOpen = false;
}

function triggerDeliveryPlanImportFileSelect() {
  document.getElementById("delivery-plan-import-input")?.click();
}

function handleDeliveryPlanImportFileChange(event) {
  const file = event.target.files?.[0];
  deliveryPlanImportDialog.fileName = file?.name || "";
}

function submitDeliveryPlanImportDialog() {
  if (!deliveryPlanImportDialog.fileName) {
    mesStore.setToast("请先选择导入文件");
    return;
  }

  mesStore.setToast(`${deliveryPlanImportDialog.fileName} 已开始导入。`);
  if (!deliveryPlanImportDialog.keepOpen) {
    closeDeliveryPlanImportDialog();
  }
}

function deliveryPlanProductCode(productName) {
  return {
    "TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）": "92323883002",
    "TC11纯电-26款-控制模块总成": "92324192001",
    "B11增程26款-控制模块总成": "92324231001",
    "阿维塔E516控制器总成": "12224287001"
  }[productName] || `DP-${String(Date.now()).slice(-8)}`;
}

function buildBarcodeRuleDetailRows(ruleName = "") {
  if (isLotBarcodeRoute()) {
    const lotRuleRows = {
      weilai: [
        {
          id: "lot-rule-001",
          rule: "自增长十进制数",
          digits: "6",
          value: "000001",
          increment: "1",
          sort: "0",
          operator: "崔常凯(dev)",
          updatedAt: "2025-03-15 11:25:28"
        }
      ],
      测试02: [
        {
          id: "lot-rule-002",
          rule: "年年月日",
          digits: "6",
          value: "250712",
          increment: "",
          sort: "0",
          operator: "易蓝科技(100000156)",
          updatedAt: "2024-07-12 10:38:08"
        },
        {
          id: "lot-rule-003",
          rule: "自增长十进制数",
          digits: "4",
          value: "0001",
          increment: "1",
          sort: "1",
          operator: "易蓝科技(100000156)",
          updatedAt: "2024-07-12 10:38:08"
        }
      ]
    };

    return deepClone(lotRuleRows[ruleName] || []);
  }

  const presetRows = [
    { id: "rule-fixed", rule: "固定值", digits: "3", value: "123", increment: "", sort: "1" },
    { id: "rule-serial", rule: "客户编码", digits: "10", value: "serialVal", increment: "", sort: "2" }
  ];

  if (String(ruleName || "").includes("6KW")) {
    return [presetRows[0]];
  }

  return presetRows;
}

function buildBarcodeProductDetailRows(ruleName = "") {
  if (isLotBarcodeRoute()) {
    const lotProductRows = {
      weilai: [
        { id: "LOT-P-001", code: "LOT20250315001", name: "威来热管理模组A", operator: "崔常凯(dev)", createdAt: "2025-03-15 11:26:12" },
        { id: "LOT-P-002", code: "LOT20250315002", name: "威来热管理模组B", operator: "崔常凯(dev)", createdAt: "2025-03-15 11:26:36" },
        { id: "LOT-P-003", code: "LOT20250315003", name: "威来热管理模组C", operator: "崔常凯(dev)", createdAt: "2025-03-15 11:27:02" }
      ],
      测试02: [
        { id: "LOT-P-101", code: "LOT20240712001", name: "测试02样件A", operator: "易蓝科技(100000156)", createdAt: "2024-07-12 10:38:30" },
        { id: "LOT-P-102", code: "LOT20240712002", name: "测试02样件B", operator: "易蓝科技(100000156)", createdAt: "2024-07-12 10:38:44" }
      ]
    };

    return deepClone(lotProductRows[ruleName] || []);
  }

  const rowsForDialog = [
    { id: "P-001", code: "23121010001", name: "6KW平台控制板-12V", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:09:50" },
    { id: "P-002", code: "1312101M001", name: "东风派恩-E-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:10:11" },
    { id: "P-003", code: "9312101M001", name: "东风派恩-E-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:10:22" },
    { id: "P-004", code: "13121023001", name: "SJR150金南风-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:10:42" },
    { id: "P-005", code: "93121023001", name: "SJR150金南风-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:10:47" },
    { id: "P-006", code: "93121991001", name: "SJR151上海大通-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:11:01" },
    { id: "P-007", code: "13121991001", name: "SJR151上海大通-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:11:07" },
    { id: "P-008", code: "1312101V001", name: "上海奉铂-D-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:11:25" },
    { id: "P-009", code: "9312101V001", name: "上海奉铂-D-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:11:36" },
    { id: "P-010", code: "1312101W001", name: "上海捷氢-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:12:00" },
    { id: "P-011", code: "9312101W001", name: "上海捷氢-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:12:13" },
    { id: "P-012", code: "1312101X001", name: "福田12V-PTC控制板", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:12:36" },
    { id: "P-013", code: "9312101X001", name: "福田12V-PTC控制板", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:12:49" },
    { id: "P-014", code: "1312101Y001", name: "上汽轻卡-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:13:12" },
    { id: "P-015", code: "9312101Y001", name: "上汽轻卡-PTC控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:13:28" },
    { id: "P-016", code: "1312101Z001", name: "J90A 热管理控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:13:42" },
    { id: "P-017", code: "9312101Z001", name: "b11 热管理控制器", operator: "易蓝(易蓝科技02)", createdAt: "2026-01-31 10:13:58" }
  ];

  if (String(ruleName || "").includes("6KW")) {
    return rowsForDialog.slice(0, 10);
  }

  return rowsForDialog;
}

function buildBarcodeTemplateDetailRows(ruleName = "") {
  if (!isLotBarcodeRoute()) {
    return [];
  }

  const lotTemplateRows = {
    weilai: [
      {
        id: "LOT-TPL-001",
        templateName: "weilai-lot-main.prn",
        previewTemplate: "预览模板",
        templateFileName: "weilai-lot-main.prn",
        templateProfile: {
          labelName: "weilai LOT标签",
          paperSize: "100 x 70 mm",
          printerModel: "ZT410-A 条码打印机",
          dpi: "300 DPI",
          commandType: "PRN",
          sampleValue: "LOT250315000001",
          displayText: "LOT250315000001",
          subText: "LOT批次标签"
        }
      }
    ],
    测试02: [
      {
        id: "LOT-TPL-002",
        templateName: "test02-lot.prn",
        previewTemplate: "预览模板",
        templateFileName: "test02-lot.prn",
        templateProfile: {
          labelName: "测试02 LOT标签",
          paperSize: "100 x 70 mm",
          printerModel: "ZT410-A 条码打印机",
          dpi: "300 DPI",
          commandType: "PRN",
          sampleValue: "LOT2407120001",
          displayText: "LOT2407120001",
          subText: "LOT批次标签"
        }
      }
    ]
  };

  return deepClone(lotTemplateRows[ruleName] || []);
}

function createBarcodeDetailDialogConfig(kind, sourceKey) {
  if (isLotBarcodeRoute()) {
    if (kind === "template") {
      return {
        title: `${sourceKey}-模板列表`,
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "templateName", label: "模板名称" },
          { key: "previewTemplate", label: "预览模板", type: "link" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: buildBarcodeTemplateDetailRows(sourceKey),
        rowActions: [{ key: "delete", label: "删除", tone: "danger" }]
      };
    }

    if (kind === "rule") {
      return {
        title: "LOT条码规则",
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "rule", label: "规则" },
          { key: "digits", label: "位数" },
          { key: "value", label: "值" },
          { key: "increment", label: "自增长间隔" },
          { key: "sort", label: "排序" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: buildBarcodeRuleDetailRows(sourceKey),
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      };
    }

    return {
      title: "产品明细",
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "code", label: "编号" },
        { key: "name", label: "名称" },
        { key: "operator", label: "操作人" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: buildBarcodeProductDetailRows(sourceKey),
      rowActions: [{ key: "delete", label: "删除", tone: "danger" }]
    };
  }

  if (kind === "rule") {
    return {
      title: "客户条码规则",
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "rule", label: "规则" },
        { key: "digits", label: "位数" },
        { key: "value", label: "值" },
        { key: "increment", label: "自增长间隔" },
        { key: "sort", label: "排序" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: buildBarcodeRuleDetailRows(sourceKey),
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    };
  }

  return {
    title: "产品明细",
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "code", label: "编号" },
      { key: "name", label: "名称" },
      { key: "operator", label: "操作人" },
      { key: "createdAt", label: "创建时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows: buildBarcodeProductDetailRows(sourceKey),
    rowActions: [{ key: "delete", label: "删除", tone: "danger" }]
  };
}

function openBarcodeDetailDialog(kind, row) {
  barcodeDetailDialog.visible = true;
  barcodeDetailDialog.maximized = false;
  barcodeDetailDialog.kind = kind;
  barcodeDetailDialog.sourceKey = row.ruleName || row.name || "";
  barcodeDetailDialog.currentPage = 1;
  barcodeDetailDialog.pageSize = 10;

  const detailConfig = createBarcodeDetailDialogConfig(kind, barcodeDetailDialog.sourceKey);
  barcodeDetailDialog.title = detailConfig.title;
  barcodeDetailDialog.columns = detailConfig.columns;
  barcodeDetailDialog.rows = detailConfig.rows;
  barcodeDetailDialog.rowActions = detailConfig.rowActions;
  barcodeDetailDialog.toolbarActions = [
    { key: "新增", label: "新增", tone: "primary" },
    { key: "refresh", label: "刷新", tone: "ghost" },
    { key: "save", label: "保存配置", tone: "ghost" }
  ];
  barcodeDetailDialog.toolbarActions[0].key = "add";
  return;

  if (kind === "rule") {
    barcodeDetailDialog.title = "客户条码规则";
    barcodeDetailDialog.columns = [
      { key: "__index", label: "序号", type: "index" },
      { key: "rule", label: "规则" },
      { key: "digits", label: "位数" },
      { key: "value", label: "值" },
      { key: "increment", label: "自增长间隔" },
      { key: "sort", label: "排序" },
      { key: "__actions", label: "操作", type: "actions" }
    ];
    barcodeDetailDialog.rows = buildBarcodeRuleDetailRows(barcodeDetailDialog.sourceKey);
    barcodeDetailDialog.rowActions = [
      { key: "edit", label: "修改", tone: "primary" },
      { key: "delete", label: "删除", tone: "danger" }
    ];
  } else {
    barcodeDetailDialog.title = "产品明细";
    barcodeDetailDialog.columns = [
      { key: "__index", label: "序号", type: "index" },
      { key: "code", label: "编号" },
      { key: "name", label: "名称" },
      { key: "operator", label: "操作人" },
      { key: "createdAt", label: "创建时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ];
    barcodeDetailDialog.rows = buildBarcodeProductDetailRows(barcodeDetailDialog.sourceKey);
    barcodeDetailDialog.rowActions = [{ key: "delete", label: "删除", tone: "danger" }];
  }

  barcodeDetailDialog.toolbarActions = [
    { key: "add", label: "新增", tone: "primary" },
    { key: "refresh", label: "刷新", tone: "ghost" },
    { key: "save", label: "保存配置", tone: "ghost" }
  ];
}

function closeBarcodeDetailDialog() {
  barcodeDetailDialog.visible = false;
  barcodeDetailDialog.maximized = false;
  barcodeDetailDialog.kind = "";
  barcodeDetailDialog.title = "";
  barcodeDetailDialog.sourceKey = "";
  barcodeDetailDialog.currentPage = 1;
  barcodeDetailDialog.pageSize = 10;
  barcodeDetailDialog.columns = [];
  barcodeDetailDialog.rows = [];
  barcodeDetailDialog.rowActions = [];
  barcodeDetailDialog.toolbarActions = [];
}

function toggleBarcodeDetailMaximize() {
  barcodeDetailDialog.maximized = !barcodeDetailDialog.maximized;
}

function refreshBarcodeDetailDialog() {
  const detailConfig = createBarcodeDetailDialogConfig(barcodeDetailDialog.kind, barcodeDetailDialog.sourceKey);
  barcodeDetailDialog.title = detailConfig.title;
  barcodeDetailDialog.columns = detailConfig.columns;
  barcodeDetailDialog.rows = detailConfig.rows;
  barcodeDetailDialog.rowActions = detailConfig.rowActions;
  barcodeDetailDialog.currentPage = 1;
  mesStore.setToast(`${barcodeDetailDialog.title} 已刷新。`);
  return;

  barcodeDetailDialog.rows =
    barcodeDetailDialog.kind === "rule"
      ? buildBarcodeRuleDetailRows(barcodeDetailDialog.sourceKey)
      : buildBarcodeProductDetailRows(barcodeDetailDialog.sourceKey);
  barcodeDetailDialog.currentPage = 1;
  mesStore.setToast(`${barcodeDetailDialog.title} 已刷新。`);
}

function previousBarcodeDetailPage() {
  barcodeDetailDialog.currentPage = Math.max(1, barcodeDetailDialog.currentPage - 1);
}

function nextBarcodeDetailPage() {
  barcodeDetailDialog.currentPage = Math.min(barcodeDetailPageCount.value, barcodeDetailDialog.currentPage + 1);
}

function handleBarcodeDetailToolbarAction(actionKey) {
  if (actionKey === "refresh") {
    refreshBarcodeDetailDialog();
    return;
  }

  if (actionKey === "save") {
    mesStore.setToast(`${barcodeDetailDialog.title} 已保存。`);
    return;
  }

  if (barcodeDetailDialog.kind === "template") {
    openFloatingActionDialog({
      title: "新增模板",
      fields: [
        { key: "templateName", label: "模板名称", type: "text", required: true, placeholder: "请输入" },
        { key: "templateFileName", label: "模板文件", type: "text", required: true, placeholder: "请输入 .prn 文件名" },
        { key: "sampleValue", label: "扫码内容", type: "text", required: true, placeholder: "请输入" }
      ],
      onSubmit: (values) => {
        barcodeDetailDialog.rows.unshift({
          id: `template-${Date.now()}`,
          templateName: values.templateName,
          previewTemplate: "预览模板",
          templateFileName: values.templateFileName,
          templateProfile: {
            labelName: values.templateName,
            paperSize: "100 x 70 mm",
            printerModel: "ZT410-A 条码打印机",
            dpi: "300 DPI",
            commandType: "PRN",
            sampleValue: values.sampleValue,
            displayText: values.sampleValue,
            subText: "LOT批次标签"
          }
        });
        barcodeDetailDialog.currentPage = 1;
        mesStore.setToast("模板已新增。");
      }
    });
    return;
  }

  if (barcodeDetailDialog.kind === "rule") {
    openFloatingActionDialog({
      title: actionKey === "add" ? "新增规则" : "修改规则",
      fields: [
        { key: "rule", label: "规则", type: "text", required: true, placeholder: "请输入" },
        { key: "digits", label: "位数", type: "text", required: true, placeholder: "请输入" },
        { key: "value", label: "值", type: "text", required: true, placeholder: "请输入" },
        { key: "increment", label: "自增长间隔", type: "text", placeholder: "请输入" },
        { key: "sort", label: "排序", type: "text", required: true, placeholder: "请输入" }
      ],
      initialValues: {
        rule: "",
        digits: "",
        value: "",
        increment: "",
        sort: String(barcodeDetailDialog.rows.length + 1)
      },
      onSubmit: (values) => {
        barcodeDetailDialog.rows.unshift({
          id: `rule-${Date.now()}`,
          rule: values.rule,
          digits: values.digits,
          value: values.value,
          increment: values.increment,
          sort: values.sort
        });
        barcodeDetailDialog.currentPage = 1;
        mesStore.setToast("规则已新增。");
      }
    });
    return;
  }

  openFloatingActionDialog({
    title: "新增产品",
    fields: [
      { key: "code", label: "编号", type: "text", required: true, placeholder: "请输入" },
      { key: "name", label: "名称", type: "text", required: true, placeholder: "请输入" }
    ],
    onSubmit: (values) => {
      barcodeDetailDialog.rows.unshift({
        id: `product-${Date.now()}`,
        code: values.code,
        name: values.name,
        operator: "当前用户",
        createdAt: currentTimestamp()
      });
      barcodeDetailDialog.currentPage = 1;
      mesStore.setToast("产品已新增。");
    }
  });
}

function handleBarcodeDetailRowActionLegacy(actionKey, row) {
  if (actionKey === "delete") {
    barcodeDetailDialog.rows = barcodeDetailDialog.rows.filter((item) => item.id !== row.id);
    barcodeDetailDialog.currentPage = Math.min(barcodeDetailDialog.currentPage, barcodeDetailPageCount.value);
    mesStore.setToast("明细已删除。");
    return;
  }

  openFloatingActionDialog({
    title: "修改规则",
    fields: [
      { key: "rule", label: "规则", type: "text", required: true, placeholder: "请输入" },
      { key: "digits", label: "位数", type: "text", required: true, placeholder: "请输入" },
      { key: "value", label: "值", type: "text", required: true, placeholder: "请输入" },
      { key: "increment", label: "自增长间隔", type: "text", placeholder: "请输入" },
      { key: "sort", label: "排序", type: "text", required: true, placeholder: "请输入" }
    ],
    initialValues: {
      rule: row.rule,
      digits: row.digits,
      value: row.value,
      increment: row.increment,
      sort: row.sort
    },
    onSubmit: (values) => {
      Object.assign(row, values);
      if (isLotBarcodeRoute()) {
        row.updatedAt = currentTimestamp();
        row.operator = "当前用户";
      }
      mesStore.setToast("规则已更新。");
    }
  });
}

function handleBarcodeDetailRowAction(actionKey, row) {
  if (actionKey === "delete") {
    barcodeDetailDialog.rows = barcodeDetailDialog.rows.filter((item) => item.id !== row.id);
    barcodeDetailDialog.currentPage = Math.min(barcodeDetailDialog.currentPage, barcodeDetailPageCount.value);
    mesStore.setToast("明细已删除。");
    return;
  }

  if (actionKey === "preview") {
    openBarcodeTemplateDialog("preview", {
      ...row,
      ruleName: barcodeDetailDialog.sourceKey
    });
    return;
  }

  openFloatingActionDialog({
    title: "修改规则",
    fields: [
      { key: "rule", label: "规则", type: "text", required: true, placeholder: "请输入" },
      { key: "digits", label: "位数", type: "text", required: true, placeholder: "请输入" },
      { key: "value", label: "值", type: "text", required: true, placeholder: "请输入" },
      { key: "increment", label: "自增长间隔", type: "text", placeholder: "请输入" },
      { key: "sort", label: "排序", type: "text", required: true, placeholder: "请输入" }
    ],
    initialValues: {
      rule: row.rule,
      digits: row.digits,
      value: row.value,
      increment: row.increment,
      sort: row.sort
    },
    onSubmit: (values) => {
      Object.assign(row, values);
      if (isLotBarcodeRoute()) {
        row.updatedAt = currentTimestamp();
        row.operator = "当前用户";
      }
      mesStore.setToast("规则已更新。");
    }
  });
}

function triggerDirectBarcodeTemplateUpload(row) {
  barcodeDirectUploadRowId.value = rowKey(row, 0);
  barcodeDirectUploadInput.value?.click();
}

function handleDirectBarcodeTemplateUploadChange(event) {
  const file = event.target.files?.[0];
  const targetRow = rows.value.find((item, index) => rowKey(item, index) === barcodeDirectUploadRowId.value);

  if (!file || !targetRow) {
    barcodeDirectUploadRowId.value = "";
    return;
  }

  if (!/\.prn$/i.test(file.name)) {
    mesStore.setToast("请选择 .prn 模板文件。");
    event.target.value = "";
    barcodeDirectUploadRowId.value = "";
    return;
  }

  const defaults = buildBarcodeTemplatePreset(targetRow);
  targetRow.hasTemplateAsset = true;
  targetRow.templateMode = "preview";
  targetRow.template = "预览模板";
  targetRow.templateFileName = file.name;
  targetRow.templateProfile = {
    ...defaults,
    ...(targetRow.templateProfile || {})
  };
  targetRow.updatedAt = currentTimestamp();
  targetRow.operator = "当前用户";

  mesStore.setToast(`${file.name} 已上传。`);
  event.target.value = "";
  barcodeDirectUploadRowId.value = "";
}

function openBarcodeTemplateDialog(mode, row) {
  const nextRow = enrichRowForPage(row || {});
  const profile = {
    ...buildBarcodeTemplatePreset(nextRow),
    ...(nextRow.templateProfile || {})
  };

  barcodeTemplateDialog.visible = true;
  barcodeTemplateDialog.mode = mode;
  barcodeTemplateDialog.rowId = rowKey(nextRow, 0);
  barcodeTemplateDialog.ruleName = nextRow.ruleName || pageConfig.value.title;
  barcodeTemplateDialog.templateName = profile.labelName || "条码模板";
  barcodeTemplateDialog.templateFileName = nextRow.templateFileName || `${slugifyTemplateName(nextRow.id || nextRow.ruleName)}.prn`;
  barcodeTemplateDialog.printerModel = profile.printerModel || "ZT410-A 条码打印机";
  barcodeTemplateDialog.paperSize = profile.paperSize || "100 x 70 mm";
  barcodeTemplateDialog.dpi = profile.dpi || "300 DPI";
  barcodeTemplateDialog.commandType = profile.commandType || "PRN";
  barcodeTemplateDialog.sampleValue = profile.sampleValue || "20serialVal";
  barcodeTemplateDialog.displayText = profile.displayText || profile.sampleValue || "20serialVal";
  barcodeTemplateDialog.subText = profile.subText || "条码预览";
  barcodeTemplateDialog.uploadedAt = nextRow.updatedAt || "";
  barcodeTemplateDialog.uploadedBy = nextRow.operator || "";
}

function closeBarcodeTemplateDialog() {
  barcodeTemplateDialog.visible = false;
  barcodeTemplateDialog.mode = "preview";
  barcodeTemplateDialog.rowId = "";
  barcodeTemplateDialog.ruleName = "";
  barcodeTemplateDialog.templateName = "";
  barcodeTemplateDialog.templateFileName = "";
  barcodeTemplateDialog.printerModel = "";
  barcodeTemplateDialog.paperSize = "";
  barcodeTemplateDialog.dpi = "";
  barcodeTemplateDialog.commandType = "PRN";
  barcodeTemplateDialog.sampleValue = "";
  barcodeTemplateDialog.displayText = "";
  barcodeTemplateDialog.subText = "";
  barcodeTemplateDialog.uploadedAt = "";
  barcodeTemplateDialog.uploadedBy = "";

  if (barcodeTemplateFileInput.value) {
    barcodeTemplateFileInput.value.value = "";
  }
}

function editCurrentBarcodeTemplate() {
  const currentRow = rows.value.find((item, index) => rowKey(item, index) === barcodeTemplateDialog.rowId);
  if (!currentRow) {
    closeBarcodeTemplateDialog();
    return;
  }

  openBarcodeTemplateDialog("edit", currentRow);
}

function triggerBarcodeTemplateFileSelect() {
  barcodeTemplateFileInput.value?.click();
}

function handleBarcodeTemplateFileChange(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!/\.prn$/i.test(file.name)) {
    mesStore.setToast("请选择 .prn 模板文件。");
    event.target.value = "";
    return;
  }

  barcodeTemplateDialog.templateFileName = file.name;
  mesStore.setToast(`${file.name} 已载入模板编辑区。`);
}

function saveBarcodeTemplateDialog() {
  const templateName = String(barcodeTemplateDialog.templateName || "").trim();
  const sampleValue = String(barcodeTemplateDialog.sampleValue || "").trim();
  const displayText = String(barcodeTemplateDialog.displayText || "").trim();

  if (!templateName) {
    mesStore.setToast("请填写模板名称。");
    return;
  }

  if (!sampleValue) {
    mesStore.setToast("请填写扫码内容。");
    return;
  }

  const targetRow = rows.value.find((item, index) => rowKey(item, index) === barcodeTemplateDialog.rowId);
  if (!targetRow) {
    closeBarcodeTemplateDialog();
    return;
  }

  targetRow.hasTemplateAsset = true;
  targetRow.templateMode = "preview";
  targetRow.template = "预览模板";
  targetRow.templateFileName = barcodeTemplateDialog.templateFileName || targetRow.templateFileName;
  targetRow.templateProfile = {
    labelName: templateName,
    paperSize: String(barcodeTemplateDialog.paperSize || "").trim() || "100 x 70 mm",
    printerModel: String(barcodeTemplateDialog.printerModel || "").trim() || "ZT410-A 条码打印机",
    dpi: String(barcodeTemplateDialog.dpi || "").trim() || "300 DPI",
    commandType: String(barcodeTemplateDialog.commandType || "").trim() || "PRN",
    sampleValue,
    displayText: displayText || sampleValue,
    subText: String(barcodeTemplateDialog.subText || "").trim() || "条码预览"
  };
  targetRow.updatedAt = currentTimestamp();
  targetRow.operator = "当前用户";

  mesStore.setToast(`${targetRow.ruleName || "模板"} 已更新。`);
  closeBarcodeTemplateDialog();
}

function triggerBomImportFileSelect() {
  document.getElementById("bom-import-input")?.click();
}

function handleBomImportFileChange(event) {
  const file = event.target.files?.[0];
  bomImportDialog.fileName = file?.name || "";
}

function submitBomImportDialog() {
  if (!bomImportDialog.fileName) {
    mesStore.setToast("请先选择导入文件");
    return;
  }

  mesStore.setToast(`${bomImportDialog.fileName} 已开始导入。`);
  if (!bomImportDialog.keepOpen) {
    closeBomImportDialog();
  }
}

function openBindRouteDialog(row) {
  const routeOptions = rows.value
    .filter((item) => item.routeName)
    .map((item) => item.routeName);

  openFloatingActionDialog({
    title: "绑定工艺路线",
    fields: [
      {
        key: "routeName",
        label: "工艺路线",
        type: "select",
        required: true,
        searchable: true,
        options: [
          { label: "请选择", value: "" },
          ...Array.from(new Set(routeOptions)).map((item) => ({ label: item, value: item }))
        ]
      }
    ],
    submitLabel: "确定",
    onSubmit: (values) => {
      row.route = values.routeName;
      mesStore.setToast(`${row.name} 已绑定到 ${values.routeName}。`);
    }
  });
}

function rowKey(row, index) {
  return getStableRowKey(row, index);
}

const effectiveFormFields = computed(() => {
  if (pageConfig.value.formFields?.length) {
    return pageConfig.value.formFields.map((field) => ({
      ...field,
      type: field.typeByMode?.[modalMode.value] || field.type
    }));
  }

  return (pageConfig.value.columns || [])
    .filter((column) => {
      return (
        !String(column.key).startsWith("__") &&
        !["operator", "updatedAt", "createdAt"].includes(column.key)
      );
    })
    .map((column) => {
      if (column.key === "status") {
        return {
          key: column.key,
          label: column.label,
          type: "select",
          options: [
            { label: "启用", value: "启用" },
            { label: "停用", value: "停用" }
          ]
        };
      }

      return {
        key: column.key,
        label: column.label,
        type: "text"
      };
    });
});

function defaultFieldValue(field) {
  if ("defaultValue" in field) {
    return typeof field.defaultValue === "function" ? field.defaultValue() : field.defaultValue;
  }

  if (field.type === "select") {
    return field.options?.[0]?.value || "";
  }

  if (field.type === "checkbox") {
    return false;
  }

  return "";
}

function fieldPlaceholder(field) {
  if (field.type === "readonly") {
    return "";
  }

  if (field.placeholder) {
    return field.placeholder;
  }

  if (field.type === "select") {
    return "请选择";
  }

  if (field.type === "time") {
    return "";
  }

  return "请输入";
}

function inputType(field) {
  if (["password", "email", "tel", "number", "date"].includes(field.type)) {
    return field.type;
  }

  return "text";
}

function isFieldRequired(field) {
  if (!field.required) {
    return false;
  }

  if (!field.requiredModes?.length) {
    return true;
  }

  return field.requiredModes.includes(modalMode.value);
}

function openModal(mode, row = null) {
  modalMode.value = mode;
  modalKeepOpen.value = false;
  editingRowId.value = row ? rowKey(row, 0) : "";

  Object.keys(modalForm).forEach((key) => {
    delete modalForm[key];
  });

  effectiveFormFields.value.forEach((field) => {
    modalForm[field.key] = defaultFieldValue(field);
  });

  if (row) {
    effectiveFormFields.value.forEach((field) => {
      if (field.key in row) {
        modalForm[field.key] = row[field.key];
      }
    });

    if ("startTime" in modalForm && "endTime" in modalForm && row.workTime) {
      const [start, end] = String(row.workTime).split("-");
      modalForm.startTime = start || "";
      modalForm.endTime = end || "";
    }
  }

  modalVisible.value = true;
}

function closeModal() {
  modalVisible.value = false;
  modalKeepOpen.value = false;
}

function openDictionaryEntryDialog(mode, row) {
  dictionaryEntryDialog.visible = true;
  dictionaryEntryDialog.mode = mode;
  dictionaryEntryDialog.sourceRowId = rowKey(row, 0);
  dictionaryEntryDialog.dictionaryType = row.name || "";
  dictionaryEntryDialog.dictionaryName = mode === "edit" ? row.name || "" : "";
  dictionaryEntryDialog.keepOpen = false;
}

function closeDictionaryEntryDialog() {
  dictionaryEntryDialog.visible = false;
  dictionaryEntryDialog.mode = "add";
  dictionaryEntryDialog.sourceRowId = "";
  dictionaryEntryDialog.dictionaryType = "";
  dictionaryEntryDialog.dictionaryName = "";
  dictionaryEntryDialog.keepOpen = false;
}

function submitDictionaryEntryDialog() {
  const name = String(dictionaryEntryDialog.dictionaryName || "").trim();
  if (!name) {
    mesStore.setToast("请填写字典名称");
    return;
  }

  const sourceRow = rows.value.find((item) => rowKey(item, 0) === dictionaryEntryDialog.sourceRowId);

  if (dictionaryEntryDialog.mode === "edit") {
    if (sourceRow) {
      sourceRow.name = name;
      sourceRow.updatedAt = currentTimestamp();
      sourceRow.operator = "当前用户";
    }
    mesStore.setToast("字典已更新。");
    closeDictionaryEntryDialog();
    return;
  }

  if (sourceRow) {
    sourceRow.updatedAt = currentTimestamp();
    sourceRow.operator = "当前用户";
  }

  mesStore.setToast(`${name} 已添加到${dictionaryEntryDialog.dictionaryType}。`);

  if (dictionaryEntryDialog.keepOpen) {
    dictionaryEntryDialog.dictionaryName = "";
    return;
  }

  closeDictionaryEntryDialog();
}

function openConfirmDialog({ title, message, confirmText = "确定", cancelText = "取消", onConfirm }) {
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.confirmText = confirmText;
  confirmDialog.cancelText = cancelText;
  confirmDialog.visible = true;
  confirmDialogHandler = onConfirm || null;
}

function closeConfirmDialog() {
  confirmDialog.visible = false;
  confirmDialog.title = "";
  confirmDialog.message = "";
  confirmDialog.confirmText = "确定";
  confirmDialog.cancelText = "取消";
  confirmDialogHandler = null;
}

function submitConfirmDialog() {
  const currentHandler = confirmDialogHandler;
  closeConfirmDialog();
  if (currentHandler) {
    currentHandler();
  }
}

function rowDisplayName(row) {
  return row.account || row.realName || row.name || pageConfig.value.modalEntity || pageConfig.value.title;
}

function currentTimestamp() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function normalizeExportValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeCsvCell(value) {
  const normalized = normalizeExportValue(value).replace(/"/g, "\"\"");
  return /[",\r\n]/.test(normalized) ? `"${normalized}"` : normalized;
}

function parseNumericSummaryValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "");

  if (!normalized || normalized.endsWith("%")) {
    return null;
  }

  if (/^-?\d+(\.\d+)?$/.test(normalized)) {
    return Number(normalized);
  }

  return null;
}

function getActiveFilterSummary() {
  const activeFilters = [];

  (pageConfig.value.filters || []).forEach((item) => {
    if (item.type === "daterange") {
      if (filters[item.startKey] || filters[item.endKey]) {
        activeFilters.push(`${item.label}: ${filters[item.startKey] || ""} ~ ${filters[item.endKey] || ""}`.trim());
      }
      return;
    }

    const value = filters[item.key];
    if (value && value !== "all") {
      activeFilters.push(`${item.label}: ${value}`);
    }
  });

  if (pageConfig.value.mode === "trace-tabs" && activeTraceTab.value) {
    activeFilters.push(`页签: ${activeTraceTab.value}`);
  }

  if (!activeFilters.length) {
    return "未筛选";
  }

  return activeFilters.join(" | ");
}

function getStatsSummary() {
  if (!pageConfig.value.stats?.length) {
    return "";
  }

  return pageConfig.value.stats.map((item) => `${item.label}: ${item.value}`).join(" | ");
}

function buildExportSummaryRow(headers, items) {
  if (!headers.length || !items.length) {
    return null;
  }

  const summaryRow = headers.map((header, index) => {
    if (index === 0) {
      return "汇总";
    }

    const numericValues = items
      .map((item) => parseNumericSummaryValue(item[header.key]))
      .filter((value) => value !== null);

    if (!numericValues.length) {
      return "";
    }

    const total = numericValues.reduce((sum, value) => sum + value, 0);
    return Number.isInteger(total) ? total : Number(total.toFixed(2));
  });

  return summaryRow.some((cell, index) => index === 0 || cell !== "") ? summaryRow : null;
}

function buildWorkbookSheet(headers, items) {
  const workbookRows = [
    [pageConfig.value.title],
    ["导出时间", currentTimestamp()],
    ["筛选条件", getActiveFilterSummary()]
  ];
  const statsSummary = getStatsSummary();

  if (statsSummary) {
    workbookRows.push(["统计摘要", statsSummary]);
  }

  workbookRows.push([]);
  workbookRows.push(headers.map((header) => header.label));
  items.forEach((item) => {
    workbookRows.push(headers.map((header) => normalizeExportValue(item[header.key])));
  });

  const summaryRow = buildExportSummaryRow(headers, items);
  if (summaryRow) {
    workbookRows.push(summaryRow);
  }

  const worksheet = xlsxUtils.aoa_to_sheet(workbookRows);
  const headerCount = Math.max(headers.length, 1);
  worksheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: headerCount - 1 }
    }
  ];

  worksheet["!cols"] = headers.map((header) => {
    const columnValues = items.map((item) => normalizeExportValue(item[header.key]));
    const longest = Math.max(header.label.length, ...columnValues.map((value) => String(value).length), 10);
    return {
      wch: Math.min(Math.max(longest + 2, 12), 28)
    };
  });

  return worksheet;
}

function downloadWorkbookFile(filename, headers, items) {
  const worksheet = buildWorkbookSheet(headers, items);
  const workbook = xlsxUtils.book_new();
  xlsxUtils.book_append_sheet(workbook, worksheet, sanitizeFilename(pageConfig.value.title).slice(0, 31) || "Sheet1");
  writeFileXLSX(workbook, filename);
}

function sanitizeFilename(value) {
  return String(value || "export")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

function getExportColumns() {
  if (pageConfig.value.columns?.length) {
    return pageConfig.value.columns
      .filter((column) => column.type !== "actions" && column.type !== "select" && column.type !== "expand")
      .map((column) => ({
        key: column.type === "index" ? "__index" : column.key,
        label: column.label
      }));
  }

  const firstRow = filteredRows.value[0] || rows.value[0];
  if (!firstRow) {
    return [];
  }

  return Object.keys(firstRow)
    .filter((key) => key !== "id")
    .map((key) => ({
      key,
      label: key
    }));
}

function getExportRows() {
  return filteredRows.value.map((row, index) => ({
    __index: index + 1,
    ...row
  }));
}

function exportCurrentView() {
  const exportColumns = getExportColumns();
  const exportRows = getExportRows();

  if (!exportColumns.length || !exportRows.length) {
    mesStore.setToast(`${pageConfig.value.title} 暂无可导出数据。`);
    return;
  }

  const headers = exportColumns;
  const filename = `${sanitizeFilename(pageConfig.value.title)}-${currentTimestamp().replace(/[: ]/g, "-")}.xlsx`;
  downloadWorkbookFile(filename, headers, exportRows);
  mesStore.setToast(`${pageConfig.value.title} 已导出，共 ${exportRows.length} 条。`);
}

function exportSingleRow(row) {
  const exportColumns = getExportColumns();
  if (!exportColumns.length) {
    mesStore.setToast(`${pageConfig.value.title} 当前行暂无可导出字段。`);
    return;
  }

  const filename = `${sanitizeFilename(row.reportName || row.name || pageConfig.value.title)}-${currentTimestamp().replace(/[: ]/g, "-")}.xlsx`;
  downloadWorkbookFile(filename, exportColumns, [row]);
  mesStore.setToast(`${row.reportName || row.name || pageConfig.value.title} 已导出。`);
}

function buildShareUrl() {
  const query = new URLSearchParams();

  (pageConfig.value.filters || []).forEach((item) => {
    if (item.type === "daterange") {
      if (filters[item.startKey]) {
        query.set(item.startKey, filters[item.startKey]);
      }
      if (filters[item.endKey]) {
        query.set(item.endKey, filters[item.endKey]);
      }
      return;
    }

    const value = filters[item.key];
    if (value && value !== "all") {
      query.set(item.key, value);
    }
  });

  if (pageConfig.value.mode === "trace-tabs" && activeTraceTab.value) {
    query.set("tab", activeTraceTab.value);
  }

  if (currentPage.value > 1) {
    query.set("page", String(currentPage.value));
  }

  if (pageSize.value !== pageSizeOptions[0]) {
    query.set("pageSize", String(pageSize.value));
  }

  const resolved = router.resolve({
    name: route.name,
    query: Object.fromEntries(query.entries())
  });

  return `${window.location.origin}${resolved.href}`;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

async function shareCurrentView() {
  const shareUrl = buildShareUrl();
  const copied = await copyTextToClipboard(shareUrl);

  if (copied) {
    mesStore.setClipboardNotice(shareUrl);
    mesStore.setToast("分享链接已复制到剪贴板，可直接粘贴到记事本。");
    return;
  }

  window.prompt("浏览器限制自动复制，请手动复制下面的链接：", shareUrl);
}

function openUserActionConfirm(action, row) {
  const name = rowDisplayName(row);

  if (action.key === "resetPassword") {
    openConfirmDialog({
      title: "重置密码",
      message: `你确定要将${name}的密码重置为123456吗？`,
      onConfirm: () => {
        mesStore.setToast(`${name} 密码已重置为 123456。`);
      }
    });
    return true;
  }

  if (action.key === "toggleStatus") {
    const isDisabling = row.status === "启用";
    openConfirmDialog({
      title: isDisabling ? "禁用用户" : "启用用户",
      message: `你确定要${isDisabling ? "禁用" : "启用"}${name}吗？`,
      onConfirm: () => {
        row.status = isDisabling ? "停用" : "启用";
        row.updatedAt = currentTimestamp();
        mesStore.setToast(`${name} 已${isDisabling ? "禁用" : "启用"}。`);
      }
    });
    return true;
  }

  if (action.key === "delete") {
    openConfirmDialog({
      title: name,
      message: "你确定要删除用户信息吗？",
      onConfirm: () => {
        rows.value = rows.value.filter((item) => rowKey(item, 0) !== rowKey(row, 0));
        selectedRowKeys.value = selectedRowKeys.value.filter((item) => item !== rowKey(row, 0));
        mesStore.setToast(`${name} 已删除。`);
      }
    });
    return true;
  }

  return false;
}

function openDeleteConfirm(row) {
  const entityName = pageConfig.value.modalEntity || pageConfig.value.title;
  if (route.name === "deliveryPlan") {
    const title = String(row.productName || entityName).includes("发货状态")
      ? String(row.productName || entityName)
      : `${row.productName || entityName}（发货状态成品）`;
    openConfirmDialog({
      title,
      message: "你确定要删除发货计划吗？",
      onConfirm: () => {
        rows.value = rows.value.filter((item) => rowKey(item, 0) !== rowKey(row, 0));
        selectedRowKeys.value = selectedRowKeys.value.filter((item) => item !== rowKey(row, 0));
        mesStore.setToast(`${row.productName || entityName} 已删除。`);
      }
    });
    return;
  }

  openConfirmDialog({
    title: `删除${entityName}`,
    message: `你确定要删除这条${entityName}信息吗？`,
    onConfirm: () => {
      rows.value = rows.value.filter((item) => rowKey(item, 0) !== rowKey(row, 0));
      selectedRowKeys.value = selectedRowKeys.value.filter((item) => item !== rowKey(row, 0));
      mesStore.setToast(`${pageConfig.value.title} 已删除。`);
    }
  });
}

function submitModal() {
  const requiredField = effectiveFormFields.value.find((field) => {
    if (!isFieldRequired(field)) {
      return false;
    }

    const value = modalForm[field.key];
    if (typeof value === "string") {
      return !value.trim();
    }

    return value === "" || value === null || value === undefined;
  });

  if (requiredField) {
    mesStore.setToast(`请填写${requiredField.label}`);
    return;
  }

  const payload = {};

  effectiveFormFields.value.forEach((field) => {
    payload[field.key] = modalForm[field.key];
  });

  if ("startTime" in modalForm && "endTime" in modalForm) {
    payload.workTime = `${modalForm.startTime || ""}-${modalForm.endTime || ""}`;
  }

  if (modalMode.value === "add") {
    const keyword =
      payload.name ||
      payload.realName ||
      payload.roleName ||
      payload.workshopName ||
      payload.lineName ||
      payload.cellName ||
      payload.stationName ||
      payload.shiftName ||
      payload.productName ||
      payload.programName ||
      payload.hardwareName ||
      payload.ruleName ||
      payload.customerName ||
      payload.materialName ||
      payload.routeName ||
      payload.processName ||
      payload.stepCode ||
      pageConfig.value.title;

    const base = pageConfig.value.addFactory
      ? pageConfig.value.addFactory({ keyword })
      : {
          id: `${route.name}-${Date.now()}`,
          code: `${String(route.name).slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`
        };

    const nextRow = {
      ...base,
      ...payload,
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
      createdAt: base.createdAt || new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (route.name === "deliveryPlan") {
      nextRow.productCode = deliveryPlanProductCode(nextRow.productName);
      nextRow.operator = "当前用户";
      nextRow.scheduled = "未排产";
    }

    rows.value.unshift(enrichRowForPage(nextRow));
    currentPage.value = 1;
    mesStore.setToast(`${pageConfig.value.title} 已新增。`);
  } else {
    const target = rows.value.find((item) => rowKey(item, 0) === editingRowId.value);
    if (target) {
      Object.assign(target, payload, {
        updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ")
      });
      if (route.name === "deliveryPlan") {
        target.operator = "当前用户";
      }
      mesStore.setToast(`${pageConfig.value.title} 已更新。`);
    }
  }

  if (modalKeepOpen.value) {
    if (modalMode.value === "add") {
      effectiveFormFields.value.forEach((field) => {
        modalForm[field.key] = defaultFieldValue(field);
      });
    }
    return;
  }

  closeModal();
}

function statusTone(label) {
  const mapping = {
    启用: "success",
    停用: "danger",
    进行中: "info",
    处理中: "warning",
    已完成: "success",
    待审批: "warning",
    已通过: "success",
    已驳回: "danger",
    已放行: "success",
    待复判: "warning",
    已闭环: "success",
    已阅: "info"
  };

  return mapping[label] || "info";
}

function handleSearch() {
  currentPage.value = 1;
  mesStore.setToast(`${pageConfig.value.title} 查询完成。`);
}

function handleReset() {
  (pageConfig.value.filters || []).forEach((item) => {
    if (item.type === "daterange") {
      filters[item.startKey] = "";
      filters[item.endKey] = "";
    } else {
      filters[item.key] = item.type === "select" ? "all" : "";
    }
  });
  currentPage.value = 1;
}

function handleToolbarAction(action) {
  if (action.key === "import" && route.name === "deliveryPlan") {
    openDeliveryPlanImportDialog();
    return;
  }

  switch (action.key) {
    case "add": {
      if (pageConfig.value.title === "工程BOM") {
        openBomVersionDialog();
        break;
      }
      openModal("add");
      break;
    }
    case "refresh":
      rows.value = deepClone(pageConfig.value.rows || []).map((row) => enrichRowForPage(row));
      selectedRowKeys.value = [];
      currentPage.value = 1;
      mesStore.setToast(`${pageConfig.value.title} 已刷新。`);
      break;
    case "save":
      mesStore.setToast(`${pageConfig.value.title} 配置已保存。`);
      break;
    case "export":
      exportCurrentView();
      break;
    case "menuSort":
      if (["菜单管理", "PDA菜单", "PAD菜单"].includes(pageConfig.value.title) && rows.value.length) {
        openSubmenuSheet(rows.value[0]);
      } else {
        mesStore.setToast("菜单排序窗口已打开。");
      }
      break;
    case "confirmPanel":
      mesStore.setToast(`${pageConfig.value.title} 已保存。`);
      break;
    case "sync":
      openConfirmDialog({
        title: "数据同步",
        message: "确认进行数据同步操作？同步过程较慢,请耐心等候",
        onConfirm: () => {
          mesStore.setToast(`${pageConfig.value.title} 数据同步成功。`);
        }
      });
      break;
    case "import":
      if (pageConfig.value.title === "工程BOM") {
        openBomImportDialog();
      } else {
        mesStore.setToast(`${pageConfig.value.title} 导入窗口已打开。`);
      }
      break;
    case "share":
      void shareCurrentView();
      break;
    case "reverse":
      rows.value = [...rows.value].reverse();
      mesStore.setToast(`${pageConfig.value.title} 已按倒序展示。`);
      break;
    case "deleteSelected":
      deleteSelectedRows();
      break;
    default:
      mesStore.setToast(`${action.label} 已执行。`);
      break;
  }
}

function handleGroupLink(item) {
  if (item.routeName) {
    router.push({ name: item.routeName });
    return;
  }
  mesStore.setToast(`${item.label} 功能入口已打开。`);
}

function handleRowAction(action, row) {
  if ((action.key === "view" || action.key === "modifyTemplate") && (isBarcodeTemplateRoute() || row.templateProfile)) {
    if (row.templateMode === "upload") {
      triggerDirectBarcodeTemplateUpload(row);
      return;
    }

    openBarcodeTemplateDialog(action.key === "view" ? "preview" : "edit", row);
    return;
  }

  if (action.key === "templateDetail" && isLotBarcodeRoute()) {
    openBarcodeDetailDialog("template", row);
    return;
  }

  if (action.key === "ruleDetail" && supportsBarcodeDetailDialog()) {
    openBarcodeDetailDialog("rule", row);
    return;
  }

  if (action.key === "productDetail" && supportsBarcodeDetailDialog()) {
    openBarcodeDetailDialog("product", row);
    return;
  }

  switch (action.key) {
    case "edit": {
      if (pageConfig.value.title === "字典管理") {
        openDictionaryEntryDialog("edit", row);
        break;
      }
      openModal("edit", row);
      break;
    }
    case "duplicate":
    case "copy": {
      const clone = deepClone(row);
      clone.id = `${rowKey(row, 0)}-${Date.now()}`;
      if (clone.code) {
        clone.code = `${clone.code}-COPY`;
      }
      if (clone.name) {
        clone.name = `${clone.name}-复制`;
      }
      if (clone.taskName) {
        clone.taskName = `${clone.taskName}-复制`;
      }
      clone.updatedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
      rows.value.unshift(clone);
      currentPage.value = 1;
      mesStore.setToast(`${pageConfig.value.title} 已复制。`);
      break;
    }
    case "delete": {
      if (pageConfig.value.title === "用户管理") {
        openUserActionConfirm(action, row);
      } else {
        openDeleteConfirm(row);
      }
      break;
    }
    case "toggleStatus": {
      if (pageConfig.value.title === "用户管理") {
        openUserActionConfirm(action, row);
      } else {
        row.status = row.status === "启用" ? "停用" : "启用";
        row.updatedAt = currentTimestamp();
        mesStore.setToast(`${pageConfig.value.title} 状态已切换。`);
      }
      break;
    }
    case "resetPassword":
      if (pageConfig.value.title === "用户管理") {
        openUserActionConfirm(action, row);
      } else {
        mesStore.setToast(`${rowDisplayName(row)} 密码已重置。`);
      }
      break;
    case "view":
      mesStore.setToast(`正在查看 ${row.name || row.taskName || row.traceCode || row.groupName || row.realName || pageConfig.value.title}。`);
      break;
    case "approve":
      row.status = "已通过";
      mesStore.setToast(`审批任务已通过。`);
      break;
    case "reject":
      row.status = "已驳回";
      mesStore.setToast(`审批任务已驳回。`);
      break;
    case "remind":
      mesStore.setToast(`已对 ${row.taskName || row.name} 发起催办。`);
      break;
    case "exportRow":
      exportSingleRow(row);
      break;
    case "submenu":
      openSubmenuSheet(row);
      break;
    case "menuPermission":
      openPermissionDialog({
        title: "菜单权限",
        nodes: MENU_PERMISSION_TEMPLATE,
        mode: "flat"
      });
      break;
    case "pdaPermission":
      openPermissionDialog({
        title: "PDA菜单权限",
        nodes: PDA_PERMISSION_TEMPLATE,
        mode: "tree",
        countMode: "top"
      });
      break;
    case "buttonPermission":
      openPermissionDialog({
        title: "设置操作权限",
        nodes: BUTTON_PERMISSION_TEMPLATE,
        mode: "tree"
      });
      break;
    case "approvalMembers":
      openApprovalGroupDialog("flow", row);
      break;
    case "ccMembers":
      openApprovalGroupDialog("table", row);
      break;
    case "addChild":
      if (pageConfig.value.title === "字典管理") {
        openDictionaryEntryDialog("add", row);
      } else {
        mesStore.setToast(`${row.name} 新增字典项窗口已打开。`);
      }
      break;
    case "detail":
      mesStore.setToast(`${row.lotId || row.name || pageConfig.value.title} 明细已打开。`);
      break;
    case "repairDetail":
      mesStore.setToast(`${row.pid} 维修详情已打开。`);
      break;
    case "bindRoute":
      openBindRouteDialog(row);
      break;
    case "stationDetail":
      if (pageConfig.value.title === "线体管理") {
        openStationDetailDialog(row);
      } else if (pageConfig.value.title === "工序管理") {
        openProcedureBindingDialog(row);
      } else {
        mesStore.setToast(`${row.processName} 工位绑定明细已打开。`);
      }
      break;
    case "lineDetail":
      openHierarchyDetailDialog(
        "产线明细",
        [
          { key: "__index", label: "序号" },
          { key: "lineCode", label: "产线编号" },
          { key: "lineName", label: "产线名称" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" }
        ],
        buildLineDetailRows(row.workshopName || row.name)
      );
      break;
    case "cellDetail":
      openHierarchyDetailDialog(
        "线体明细",
        [
          { key: "__index", label: "序号" },
          { key: "cellName", label: "线体名称" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" }
        ],
        buildCellDetailRows(row.lineName || row.name)
      );
      break;
    case "processDetail":
      openRouteProcessDialog(row);
      break;
    case "stepPrint":
      openStepPrintDialog(row);
      break;
    case "newBom":
      openBomVersionDialog(row);
      break;
    case "modifyTemplate":
      mesStore.setToast(`${row.ruleName} 模板编辑窗口已打开。`);
      break;
    case "ruleDetail":
      mesStore.setToast(`${row.ruleName || row.name} 规则明细已打开。`);
      break;
    case "productDetail":
      mesStore.setToast(`${row.ruleName || row.name} 产品明细已打开。`);
      break;
    case "templateDetail":
      mesStore.setToast(`${row.ruleName} 模板明细已打开。`);
      break;
    default:
      mesStore.setToast(`${action.label} 已执行。`);
      break;
  }
}

function visibleLabel(action, row) {
  if (action.key === "modifyTemplate" && isBarcodeTemplateRoute()) {
    return row.hasTemplateAsset ? "修改模板" : "上传模板";
  }

  if (action.key === "toggleStatus") {
    if (pageConfig.value.title === "用户管理") {
      return row.status === "启用" ? "禁用用户" : "启用用户";
    }

    return row.status === "启用" ? "禁用" : "启用";
  }

  return action.label;
}

function previousPage() {
  currentPage.value = Math.max(1, currentPage.value - 1);
}

function nextPage() {
  currentPage.value = Math.min(pageCount.value, currentPage.value + 1);
}

const activePanel = computed(
  () => pageConfig.value.panels?.find((panel) => panel.key === activePanelKey.value) || null
);

const calendarSelectedDay = ref(26);
const calendarStatusMap = reactive({});

const calendarWeeks = computed(() => {
  if (pageConfig.value.mode !== "calendar") {
    return [];
  }

  const year = Number(calendarYear.value);
  const month = Number(calendarMonth.value);
  const firstDay = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= lastDate; day += 1) {
    cells.push({
      day,
      label: calendarStatusMap[`${year}-${month}-${day}`] || "正常上班",
      active: day === calendarSelectedDay.value
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
});

watch(
  () => pageConfig.value.mode,
  (mode) => {
    if (mode === "calendar") {
      calendarSelectedDay.value = 26;
      Object.keys(calendarStatusMap).forEach((key) => {
        delete calendarStatusMap[key];
      });
      const year = Number(calendarYear.value);
      const month = Number(calendarMonth.value);
      for (let day = 1; day <= 31; day += 1) {
        calendarStatusMap[`${year}-${month}-${day}`] = "正常上班";
      }
    }
  },
  { immediate: true }
);

const modalTitle = computed(() =>
  `${modalMode.value === "add" ? "新增" : "修改"}${pageConfig.value.modalEntity || pageConfig.value.title}`
);
const dictionaryEntryDialogTitle = computed(() =>
  `${dictionaryEntryDialog.mode === "add" ? "新增" : "修改"}字典`
);
</script>

<template>
  <section class="page-grid">
    <div v-if="pageConfig.filters.length" class="card">
      <div class="card-body">
        <div class="template-filter-grid">
          <label v-for="filterItem in pageConfig.filters" :key="filterItem.key" class="input-group">
            <span class="input-label">{{ filterItem.label }}</span>
            <template v-if="filterItem.type === 'select'">
              <select v-model="filters[filterItem.key]" class="template-field">
                <option v-for="option in filterItem.options" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </template>
            <template v-else-if="filterItem.type === 'daterange'">
              <div class="template-date-range">
                <input v-model="filters[filterItem.startKey]" class="template-field" type="date" />
                <span class="template-range-sep">—</span>
                <input v-model="filters[filterItem.endKey]" class="template-field" type="date" />
              </div>
            </template>
            <template v-else>
              <input v-model="filters[filterItem.key]" class="template-field" :placeholder="filterItem.placeholder || '请输入'" />
            </template>
          </label>

          <div class="template-filter-actions">
            <button class="btn btn-primary btn-sm" type="button" @click="handleSearch">查询</button>
            <button class="btn btn-secondary btn-sm" type="button" @click="handleReset">重置</button>
          </div>
        </div>
        <label v-if="false" class="dictionary-entry-keep-open modal-keep-open">
          <input v-model="modalKeepOpen" type="checkbox" />
          <span>确定后不关闭</span>
        </label>
      </div>
    </div>

    <div v-if="pageConfig.mode === 'settings-panel'" class="card">
      <div class="card-body">
        <div class="panel-layout">
          <div class="panel-tabs">
            <button
              v-for="panel in pageConfig.panels"
              :key="panel.key"
              class="panel-tab"
              :class="{ active: panel.key === activePanelKey }"
              type="button"
              @click="activePanelKey = panel.key"
            >
              {{ panel.label }}
            </button>
          </div>

          <div class="panel-content">
            <template v-if="activePanel">
              <div v-for="field in activePanel.fields" :key="field.key" class="panel-form-row">
                <label class="panel-form-label">{{ field.label }}</label>
                <template v-if="field.type === 'upload'">
                  <div class="panel-upload-box">
                    <span>{{ panelForm[field.key] || "点击上传文件" }}</span>
                  </div>
                </template>
                <template v-else>
                  <input v-model="panelForm[field.key]" class="template-field" />
                </template>
              </div>
            </template>

            <div class="panel-actions">
              <button class="btn btn-primary" type="button" @click="handleToolbarAction({ key: 'confirmPanel' })">
                确定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="pageConfig.mode === 'calendar'" class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">{{ pageConfig.title }}</h3>
        </div>
        <div class="template-toolbar-actions">
          <select v-model="calendarYear" class="template-page-size">
            <option :value="2026">2026年</option>
            <option :value="2027">2027年</option>
          </select>
          <select v-model="calendarMonth" class="template-page-size">
            <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
          </select>
        </div>
      </div>

      <div class="card-body">
        <div class="calendar-weekdays">
          <span v-for="label in ['一', '二', '三', '四', '五', '六', '日']" :key="label">{{ label }}</span>
        </div>

        <div class="calendar-grid">
          <template v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
            <div
              v-for="(cell, cellIndex) in week"
              :key="`${weekIndex}-${cellIndex}`"
              class="calendar-cell"
              :class="{ active: cell?.active }"
              @click="cell && (calendarSelectedDay = cell.day)"
            >
              <template v-if="cell">
                <strong>{{ String(cell.day).padStart(2, '0') }}</strong>
                <template v-if="cell.active">
                  <select
                    class="calendar-status-select"
                    :value="cell.label"
                    @change="calendarStatusMap[`${calendarYear}-${calendarMonth}-${cell.day}`] = $event.target.value"
                  >
                    <option value="正常上班">正常上班</option>
                    <option value="夜班">夜班</option>
                    <option value="白班">白班</option>
                    <option value="休息">休息</option>
                  </select>
                </template>
                <span v-else>{{ cell.label }}</span>
              </template>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-else-if="pageConfig.mode === 'link-grid'" class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">{{ pageConfig.title }}</h3>
          <p class="card-subtitle">{{ pageConfig.description }}</p>
        </div>
      </div>
      <div class="card-body">
        <div class="link-grid-groups">
          <div v-for="group in pageConfig.groups" :key="group.key" class="link-grid-group">
            <div class="link-grid-title">{{ group.title }}</div>
            <div class="link-grid-items">
              <button
                v-for="item in group.items"
                :key="item.key"
                class="link-grid-item"
                type="button"
                @click="handleGroupLink(item)"
              >
                {{ item.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="pageConfig.mode === 'trace-tabs'" class="card">
      <div class="card-body">
        <div class="trace-tab-bar">
          <div class="trace-tab-list">
            <button
              v-for="tab in pageConfig.tabs"
              :key="tab"
              class="trace-tab-pill"
              :class="{ active: tab === activeTraceTab }"
              type="button"
              @click="activeTraceTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <div class="template-toolbar-actions">
            <button
              v-for="action in pageConfig.toolbarActions"
              :key="action.key"
              class="btn btn-sm"
              :class="toolbarButtonClass(action)"
              type="button"
              :disabled="isToolbarActionDisabled(action)"
              @click="handleToolbarAction(action)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <div class="trace-empty-wrap">
          <div class="empty-state">暂无数据</div>
        </div>
      </div>
    </div>

    <div v-else class="card table-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">{{ pageConfig.title }}</h3>
          <p class="card-subtitle">{{ pageConfig.description }}</p>
        </div>

        <div class="template-toolbar-actions">
          <button
            v-for="action in pageConfig.toolbarActions"
            :key="action.key"
            class="btn btn-sm"
            :class="toolbarButtonClass(action)"
            type="button"
            :disabled="isToolbarActionDisabled(action)"
            @click="handleToolbarAction(action)"
          >
            {{ action.label }}
          </button>
        </div>
      </div>

      <div v-if="pageConfig.stats?.length" class="card-body">
        <div class="report-stats-strip">
          <div v-for="stat in pageConfig.stats" :key="stat.label" class="report-stat-item">
            <strong>{{ stat.value }}</strong>
            <span>{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="card-body table-scroll">
        <table>
          <thead>
            <tr>
              <th v-for="column in pageConfig.columns" :key="column.key">
                <template v-if="column.type === 'select'">
                  <input :checked="isAllSelected()" type="checkbox" @change="toggleSelectAll($event.target.checked)" />
                </template>
                <template v-else>
                  {{ column.label }}
                </template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in pagedRows" :key="rowKey(row, index)">
              <td v-for="column in pageConfig.columns" :key="column.key">
                <template v-if="column.type === 'index'">
                  {{ (currentPage - 1) * pageSize + index + 1 }}
                </template>
                <template v-else-if="column.type === 'select'">
                  <input :checked="isRowSelected(row)" type="checkbox" @change="toggleRowSelection(row, $event.target.checked)" />
                </template>
                <template v-else-if="column.type === 'expand'">
                  <span class="table-expand-arrow">›</span>
                </template>
                <template v-else-if="column.type === 'status'">
                  <StatusPill :label="row[column.key]" :type="statusTone(row[column.key])" />
                </template>
                <template v-else-if="column.type === 'actions'">
                  <div class="table-actions">
                    <button
                      v-for="action in pageConfig.rowActions"
                      :key="action.key"
                      class="table-action"
                      :class="action.tone"
                      type="button"
                      @click="handleRowAction(action, row)"
                    >
                      {{ visibleLabel(action, row) }}
                    </button>
                  </div>
                </template>
                <template v-else-if="column.type === 'link'">
                  <button
                    v-if="row[column.key]"
                    class="table-action primary"
                    type="button"
                    @click="handleRowAction({ key: 'view' }, row)"
                  >
                    {{ row[column.key] }}
                  </button>
                </template>
                <template v-else>
                  {{ row[column.key] }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!pagedRows.length" class="empty-state">暂无数据</div>
      </div>

      <div class="template-footer">
        <span class="muted">共{{ filteredRows.length }}条数据</span>
        <div class="template-pagination">
          <button class="btn btn-ghost btn-sm" type="button" @click="previousPage">‹</button>
          <span class="template-page-number">{{ currentPage }}</span>
          <button class="btn btn-ghost btn-sm" type="button" @click="nextPage">›</button>
          <select v-model="pageSize" class="template-page-size">
            <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-if="barcodeDetailDialog.visible"
      class="barcode-detail-overlay"
      @click.self="closeBarcodeDetailDialog"
    >
      <div class="barcode-detail-card" :class="{ maximized: barcodeDetailDialog.maximized }" role="dialog" aria-modal="true">
        <div class="barcode-detail-window-actions">
          <button class="menu-sheet-window-btn" type="button" @click="toggleBarcodeDetailMaximize">
            {{ barcodeDetailDialog.maximized ? "❐" : "⤢" }}
          </button>
          <button class="menu-sheet-window-btn" type="button" @click="closeBarcodeDetailDialog">×</button>
        </div>

        <div class="barcode-detail-head">
          <div>
            <h3 class="barcode-detail-title">{{ barcodeDetailDialog.title }}</h3>
          </div>

          <div class="template-toolbar-actions">
            <button
              v-for="action in barcodeDetailDialog.toolbarActions"
              :key="action.key"
              class="btn btn-sm"
              :class="toolbarButtonClass(action)"
              type="button"
              @click="handleBarcodeDetailToolbarAction(action.key)"
            >
              {{ action.label }}
            </button>
          </div>
        </div>

        <div class="barcode-detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th v-for="column in barcodeDetailDialog.columns" :key="column.key">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in barcodeDetailPagedRows" :key="row.id">
                <td v-for="column in barcodeDetailDialog.columns" :key="column.key">
                  <template v-if="column.type === 'index'">
                    {{ (barcodeDetailDialog.currentPage - 1) * barcodeDetailDialog.pageSize + index + 1 }}
                  </template>
                  <template v-else-if="column.type === 'actions'">
                    <div class="table-actions">
                      <button
                        v-for="action in barcodeDetailDialog.rowActions"
                        :key="action.key"
                        class="table-action"
                        :class="action.tone"
                        type="button"
                        @click="handleBarcodeDetailRowAction(action.key, row)"
                      >
                        {{ action.label }}
                      </button>
                    </div>
                  </template>
                  <template v-else-if="column.type === 'link'">
                    <button class="table-action primary" type="button" @click="handleBarcodeDetailRowAction('preview', row)">
                      {{ row[column.key] }}
                    </button>
                  </template>
                  <template v-else>
                    {{ row[column.key] }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!barcodeDetailPagedRows.length" class="empty-state">暂无数据</div>
        </div>

        <div class="template-footer">
          <span class="muted">共{{ barcodeDetailDialog.rows.length }}条数据</span>
          <div class="template-pagination">
            <button class="btn btn-ghost btn-sm" type="button" @click="previousBarcodeDetailPage">‹</button>
            <span class="template-page-number">{{ barcodeDetailDialog.currentPage }}</span>
            <button class="btn btn-ghost btn-sm" type="button" @click="nextBarcodeDetailPage">›</button>
            <select v-model="barcodeDetailDialog.pageSize" class="template-page-size">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <input
      ref="barcodeDirectUploadInput"
      class="barcode-template-file-input"
      type="file"
      accept=".prn"
      @change="handleDirectBarcodeTemplateUploadChange"
    />

    <div
      v-if="barcodeTemplateDialog.visible"
      class="barcode-template-overlay"
      @click.self="closeBarcodeTemplateDialog"
    >
      <div class="barcode-template-card" role="dialog" aria-modal="true">
        <button class="barcode-template-close" type="button" @click="closeBarcodeTemplateDialog">×</button>

        <div class="barcode-template-head">
          <div>
            <span class="barcode-template-eyebrow">{{ pageConfig.title }}</span>
            <h3 class="barcode-template-title">
              {{ barcodeTemplateDialog.mode === 'edit' ? `${barcodeTemplateDialog.ruleName} 模板配置` : `${barcodeTemplateDialog.ruleName} 预览模板` }}
            </h3>
            <p class="barcode-template-subtitle">
              浏览器内展示的是示意预览，实际打印效果以 `.prn` 模板和打印机参数为准。
            </p>
          </div>

          <div class="barcode-template-head-actions">
            <button
              v-if="barcodeTemplateDialog.mode === 'preview'"
              class="btn btn-secondary btn-sm"
              type="button"
              @click="editCurrentBarcodeTemplate"
            >
              修改模板
            </button>
            <button
              v-else
              class="btn btn-secondary btn-sm"
              type="button"
              @click="triggerBarcodeTemplateFileSelect"
            >
              上传 PRN
            </button>
            <button class="btn btn-ghost btn-sm" type="button" @click="closeBarcodeTemplateDialog">关闭</button>
          </div>
        </div>

        <div class="barcode-template-layout">
          <section class="barcode-template-panel barcode-template-panel--form">
            <div class="barcode-template-chip-row">
              <span class="barcode-template-chip primary">{{ barcodeTemplateDialog.commandType }}</span>
              <span class="barcode-template-chip">{{ barcodeTemplateDialog.dpi }}</span>
              <span class="barcode-template-chip">{{ barcodeTemplateDialog.paperSize }}</span>
            </div>

            <div v-if="barcodeTemplateDialog.mode === 'edit'" class="barcode-template-form">
              <label class="barcode-template-field">
                <span class="barcode-template-field-label">PRN 文件</span>
                <div class="barcode-template-upload">
                  <div class="barcode-template-upload-copy">
                    <strong>{{ barcodeTemplateDialog.templateFileName || "未选择模板文件" }}</strong>
                    <span>仅支持 `.prn` 文件，选择后会更新当前规则模板。</span>
                  </div>
                  <button class="btn btn-primary btn-sm" type="button" @click="triggerBarcodeTemplateFileSelect">
                    选择文件
                  </button>
                </div>
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">模板名称</span>
                <input v-model="barcodeTemplateDialog.templateName" class="template-field" type="text" placeholder="请输入" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">扫码内容</span>
                <input v-model="barcodeTemplateDialog.sampleValue" class="template-field" type="text" placeholder="请输入" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">显示文本</span>
                <input v-model="barcodeTemplateDialog.displayText" class="template-field" type="text" placeholder="请输入" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">副标题</span>
                <input v-model="barcodeTemplateDialog.subText" class="template-field" type="text" placeholder="请输入" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">打印机</span>
                <input v-model="barcodeTemplateDialog.printerModel" class="template-field" type="text" placeholder="请输入" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">纸张尺寸</span>
                <input v-model="barcodeTemplateDialog.paperSize" class="template-field" type="text" placeholder="例如 100 x 70 mm" />
              </label>

              <label class="barcode-template-field">
                <span class="barcode-template-field-label">分辨率</span>
                <input v-model="barcodeTemplateDialog.dpi" class="template-field" type="text" placeholder="例如 300 DPI" />
              </label>
            </div>

            <div v-else class="barcode-template-summary">
              <div class="barcode-template-summary-item">
                <span>模板名称</span>
                <strong>{{ barcodeTemplateDialog.templateName }}</strong>
              </div>
              <div class="barcode-template-summary-item">
                <span>PRN 文件</span>
                <strong>{{ barcodeTemplateDialog.templateFileName }}</strong>
              </div>
              <div class="barcode-template-summary-item">
                <span>打印机</span>
                <strong>{{ barcodeTemplateDialog.printerModel }}</strong>
              </div>
              <div class="barcode-template-summary-item">
                <span>纸张尺寸</span>
                <strong>{{ barcodeTemplateDialog.paperSize }}</strong>
              </div>
              <div class="barcode-template-summary-item">
                <span>最后更新</span>
                <strong>{{ barcodeTemplateDialog.uploadedAt || "-" }}</strong>
              </div>
              <div class="barcode-template-summary-item">
                <span>操作人</span>
                <strong>{{ barcodeTemplateDialog.uploadedBy || "-" }}</strong>
              </div>
            </div>
          </section>

          <section class="barcode-template-panel barcode-template-panel--preview">
            <div class="barcode-preview-stage">
              <div class="barcode-preview-sheet" :style="barcodeTemplatePaperStyle">
                <div class="barcode-preview-caption">{{ barcodeTemplateDialog.templateName }}</div>

                <div class="barcode-preview-body">
                  <div class="barcode-template-code" aria-hidden="true">
                    <span
                      v-for="cell in barcodeTemplatePreviewCells"
                      :key="cell.key"
                      class="barcode-template-code-cell"
                      :class="{ dark: cell.dark }"
                    ></span>
                  </div>

                  <div class="barcode-preview-copy">
                    <div class="barcode-preview-main">
                      {{ barcodeTemplateDialog.displayText || barcodeTemplateDialog.sampleValue }}
                    </div>
                    <div class="barcode-preview-sub">{{ barcodeTemplateDialog.subText }}</div>
                  </div>
                </div>

                <div class="barcode-preview-footer">
                  扫码内容：{{ barcodeTemplateDialog.sampleValue }}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="barcode-template-footer">
          <span class="muted">模板预览会跟随“扫码内容 / 显示文本 / 纸张尺寸”实时更新。</span>
          <div class="barcode-template-footer-actions">
            <button class="btn btn-ghost btn-sm" type="button" @click="closeBarcodeTemplateDialog">关闭</button>
            <button
              v-if="barcodeTemplateDialog.mode === 'edit'"
              class="btn btn-primary btn-sm"
              type="button"
              @click="saveBarcodeTemplateDialog"
            >
              保存模板
            </button>
          </div>
        </div>

        <input
          ref="barcodeTemplateFileInput"
          class="barcode-template-file-input"
          type="file"
          accept=".prn"
          @change="handleBarcodeTemplateFileChange"
        />
      </div>
    </div>

    <div
      v-if="modalVisible"
      class="modal-overlay"
      :class="`modal-overlay--${modalVariant}`"
      @click.self="closeModal"
    >
      <div class="modal-card" :class="[`modal-card--${modalVariant}`, { 'modal-card--hide-cancel': hideModalCancel }]">
        <div v-if="modalVariant === 'floating-form'" class="modal-emblem" :class="{ edit: modalMode === 'edit' }" aria-hidden="true">
          <svg class="modal-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path
              d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path
              v-if="modalMode === 'add'"
              d="M32 27v13M25.5 33.5h13"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            />
            <path
              v-else
              d="m26 39 12.5-12.5 4 4L30 43H26v-4Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <button class="modal-close" type="button" @click="closeModal">×</button>
        <h3 class="modal-title">{{ modalTitle }}</h3>

        <div class="modal-form" :class="`modal-form--${modalVariant}`">
          <label v-for="field in effectiveFormFields" :key="field.key" class="modal-form-item">
            <span class="modal-form-label">
              <span v-if="isFieldRequired(field)" class="modal-required">*</span>
              {{ field.label }}
            </span>
            <template v-if="field.type === 'select'">
              <select
                v-model="modalForm[field.key]"
                class="template-field"
                :class="{ 'template-field--placeholder': !modalForm[field.key] }"
              >
                <option v-for="option in field.options || []" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </template>
            <template v-else-if="field.type === 'readonly'">
              <input
                :value="modalForm[field.key]"
                class="template-field dictionary-entry-input dictionary-entry-input-disabled"
                type="text"
                disabled
              />
            </template>
            <template v-else-if="field.type === 'textarea'">
              <textarea
                v-model="modalForm[field.key]"
                class="template-field modal-textarea"
                :placeholder="fieldPlaceholder(field)"
              ></textarea>
            </template>
            <template v-else-if="field.type === 'date'">
              <input
                v-model="modalForm[field.key]"
                class="template-field"
                type="date"
                :placeholder="fieldPlaceholder(field)"
              />
            </template>
            <template v-else-if="field.type === 'time'">
              <input
                v-model="modalForm[field.key]"
                class="template-field"
                type="time"
                :placeholder="fieldPlaceholder(field)"
              />
            </template>
            <template v-else>
              <input
                v-model="modalForm[field.key]"
                class="template-field"
                :type="inputType(field)"
                :placeholder="fieldPlaceholder(field)"
              />
            </template>
          </label>
        </div>

        <div class="modal-actions">
          <button class="btn btn-ghost" type="button" @click="closeModal">取消</button>
          <button class="btn btn-primary" type="button" @click="submitModal">确定</button>
        </div>
        <label v-if="modalKeepOpenEnabled" class="dictionary-entry-keep-open modal-keep-open">
          <input v-model="modalKeepOpen" type="checkbox" />
          <span>确定后不关闭</span>
        </label>
      </div>
    </div>

    <div v-if="hierarchyDetailDialog.visible" class="hierarchy-detail-overlay" @click.self="closeHierarchyDetailDialog">
      <div class="hierarchy-detail-card" role="dialog" aria-modal="true">
        <div class="hierarchy-detail-emblem" aria-hidden="true">
          <svg class="hierarchy-detail-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path
              d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="hierarchy-detail-close" type="button" @click="closeHierarchyDetailDialog">×</button>
        <h3 class="hierarchy-detail-title">{{ hierarchyDetailDialog.title }}</h3>

        <div class="hierarchy-detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th v-for="column in hierarchyDetailDialog.columns" :key="column.key">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in hierarchyDetailPagedRows" :key="row.id || index">
                <td v-for="column in hierarchyDetailDialog.columns" :key="column.key">
                  <template v-if="column.key === '__index'">
                    {{ (hierarchyDetailDialog.currentPage - 1) * hierarchyDetailDialog.pageSize + index + 1 }}
                  </template>
                  <template v-else>
                    {{ row[column.key] }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="!hierarchyDetailPagedRows.length" class="empty-state">暂无数据</div>
        </div>

        <div class="template-footer">
          <span class="muted">共{{ hierarchyDetailDialog.rows.length }}条数据</span>
          <div class="template-pagination">
            <button class="btn btn-ghost btn-sm" type="button" @click="previousHierarchyDetailPage">‹</button>
            <span class="template-page-number">{{ hierarchyDetailDialog.currentPage }}</span>
            <button class="btn btn-ghost btn-sm" type="button" @click="nextHierarchyDetailPage">›</button>
            <select v-model="hierarchyDetailDialog.pageSize" class="template-page-size">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="stationDetailDialog.visible" class="station-detail-overlay" @click.self="closeStationDetailDialog">
      <div class="station-detail-card" role="dialog" aria-modal="true">
        <div class="station-detail-emblem" aria-hidden="true">
          <svg class="station-detail-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path
              d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="station-detail-close" type="button" @click="closeStationDetailDialog">×</button>
        <div class="station-detail-head">
          <strong>{{ stationDetailDialog.title }}</strong>
        </div>

        <div class="menu-sheet-filter-card station-detail-filter-card">
          <div class="station-detail-filter-grid">
            <label class="input-group">
              <span class="input-label">工位编号</span>
              <input v-model="stationDetailDialog.stationCode" class="template-field" placeholder="请输入" />
            </label>
            <label class="input-group">
              <span class="input-label">工位名称</span>
              <input v-model="stationDetailDialog.stationName" class="template-field" placeholder="请输入" />
            </label>
            <label class="input-group">
              <span class="input-label">所属产线</span>
              <select v-model="stationDetailDialog.line" class="template-field">
                <option value="all">请选择</option>
                <option v-for="option in stationDetailLineOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>
            <label class="input-group">
              <span class="input-label">所属线体</span>
              <select v-model="stationDetailDialog.cell" class="template-field">
                <option value="all">请选择</option>
                <option v-for="option in stationDetailCellOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <div class="template-filter-actions">
              <button class="btn btn-primary btn-sm" type="button" @click="queryStationDetailDialog">查询</button>
              <button class="btn btn-secondary btn-sm" type="button" @click="resetStationDetailDialog">重置</button>
            </div>
          </div>
        </div>

        <div class="station-detail-section">
          <div class="station-detail-section-head">
            <h3 class="station-detail-section-title">工位管理</h3>
            <div class="template-toolbar-actions">
              <button class="btn btn-ghost btn-sm" type="button" @click="refreshStationDetailDialog">刷新</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="saveStationDetailDialog">保存配置</button>
            </div>
          </div>

          <div class="station-detail-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>所属产线</th>
                  <th>所属线体</th>
                  <th>工位名称</th>
                  <th>工位位置</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in stationDetailPagedRows" :key="row.id">
                  <td>{{ (stationDetailDialog.currentPage - 1) * stationDetailDialog.pageSize + index + 1 }}</td>
                  <td>{{ row.lineName }}</td>
                  <td>{{ row.cellName }}</td>
                  <td>{{ row.stationName }}</td>
                  <td>{{ row.stationLocation }}</td>
                </tr>
              </tbody>
            </table>

            <div v-if="!stationDetailPagedRows.length" class="empty-state">暂无数据</div>
          </div>

          <div class="template-footer">
            <span class="muted">共{{ stationDetailFilteredRows.length }}条数据</span>
            <div class="template-pagination">
              <button class="btn btn-ghost btn-sm" type="button" @click="previousStationDetailPage">‹</button>
              <span class="template-page-number">{{ stationDetailDialog.currentPage }}</span>
              <button class="btn btn-ghost btn-sm" type="button" @click="nextStationDetailPage">›</button>
              <select v-model="stationDetailDialog.pageSize" class="template-page-size">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="procedureBindingDialog.visible" class="procedure-binding-overlay" @click.self="closeProcedureBindingDialog">
      <div class="procedure-binding-card" role="dialog" aria-modal="true">
        <button class="station-detail-close" type="button" @click="closeProcedureBindingDialog">×</button>
        <div class="procedure-binding-head">
          <strong>{{ procedureBindingDialog.title }}</strong>
          <div class="template-toolbar-actions">
            <button class="btn btn-warning btn-sm" type="button" @click="openProcessBindStationForm">绑定工位</button>
            <button class="btn btn-ghost btn-sm" type="button" @click="procedureBindingDialog.sourceRows = buildProcedureBindingRows(procedureBindingDialog.processName)">刷新</button>
            <button class="btn btn-ghost btn-sm" type="button" @click="mesStore.setToast('工位绑定配置已保存。')">保存配置</button>
          </div>
        </div>

        <div class="station-detail-table-wrap">
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>所属线体</th>
                <th>工位名称</th>
                <th>操作人</th>
                <th>修改时间</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in procedureBindingPagedRows" :key="row.id">
                <td>{{ (procedureBindingDialog.currentPage - 1) * procedureBindingDialog.pageSize + index + 1 }}</td>
                <td>{{ row.cellName }}</td>
                <td>{{ row.stationName }}</td>
                <td>{{ row.operator }}</td>
                <td>{{ row.updatedAt }}</td>
                <td>{{ row.createdAt }}</td>
                <td><button class="table-action danger" type="button" @click="procedureBindingDialog.sourceRows = procedureBindingDialog.sourceRows.filter((item) => item.id !== row.id)">删除</button></td>
              </tr>
            </tbody>
          </table>
          <div v-if="!procedureBindingPagedRows.length" class="empty-state">暂无数据</div>
        </div>

        <div class="template-footer">
          <span class="muted">共{{ procedureBindingDialog.sourceRows.length }}条数据</span>
          <div class="template-pagination">
            <button class="btn btn-ghost btn-sm" type="button" @click="previousProcedureBindingPage">‹</button>
            <span class="template-page-number">{{ procedureBindingDialog.currentPage }}</span>
            <button class="btn btn-ghost btn-sm" type="button" @click="nextProcedureBindingPage">›</button>
            <select v-model="procedureBindingDialog.pageSize" class="template-page-size">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <div v-if="routeProcessDialog.visible" class="approval-group-overlay" @click.self="closeRouteProcessDialog">
      <div class="approval-group-card" :class="{ maximized: routeProcessDialog.maximized }" role="dialog" aria-modal="true">
        <div class="menu-sheet-topbar">
          <div></div>
          <div class="menu-sheet-window-actions">
            <button class="menu-sheet-window-btn" type="button" @click="toggleRouteProcessMaximize">
              {{ routeProcessDialog.maximized ? "❐" : "⤢" }}
            </button>
            <button class="menu-sheet-window-btn" type="button" @click="closeRouteProcessDialog">×</button>
          </div>
        </div>

        <div class="route-process-head">
          <h3 class="route-process-title">{{ routeProcessDialog.title }}</h3>
          <button class="btn btn-accent btn-sm" type="button" @click="openBindProcessDialog">绑定工序</button>
        </div>

        <div class="route-flow-canvas">
          <div class="route-flow-track">
            <template v-for="(node, index) in routeProcessDialog.nodes" :key="node.id">
              <div class="route-flow-node" :class="node.tone">
                <div class="route-flow-code">{{ node.code }}</div>
                <strong>{{ node.name }}</strong>
                <small>{{ node.mode }}</small>
                <div class="route-flow-tags">
                  <span
                    v-for="tag in node.tags"
                    :key="tag"
                    class="route-flow-tag"
                    :class="{ warning: tag === 'F' }"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <div v-if="index < routeProcessDialog.nodes.length - 1" class="route-flow-link" aria-hidden="true"></div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-if="floatingActionDialog.visible" class="dictionary-entry-overlay" @click.self="closeFloatingActionDialog">
      <div class="dictionary-entry-card" role="dialog" aria-modal="true">
        <div class="dictionary-entry-emblem" aria-hidden="true">
          <svg class="dictionary-entry-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="dictionary-entry-close" type="button" @click="closeFloatingActionDialog">×</button>
        <h3 class="dictionary-entry-title">{{ floatingActionDialog.title }}</h3>

        <div class="dictionary-entry-form">
          <div v-for="field in floatingActionDialog.fields" :key="field.key" class="dictionary-entry-row">
            <label class="dictionary-entry-label">
              <span v-if="field.required" class="modal-required">*</span>
              {{ field.label }}
            </label>
            <template v-if="field.type === 'select'">
              <div class="floating-select-shell" :class="{ searchable: field.searchable }">
                <select v-model="floatingActionDialog.values[field.key]" class="template-field dictionary-entry-input">
                  <option v-for="option in field.options || []" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <span v-if="field.searchable" class="floating-select-icon" aria-hidden="true">⌕</span>
              </div>
            </template>
            <template v-else-if="field.type === 'readonly'">
              <input :value="floatingActionDialog.values[field.key]" class="template-field dictionary-entry-input dictionary-entry-input-disabled" type="text" disabled />
            </template>
            <template v-else-if="field.type === 'date'">
              <input v-model="floatingActionDialog.values[field.key]" class="template-field dictionary-entry-input" type="date" />
            </template>
            <template v-else>
              <input v-model="floatingActionDialog.values[field.key]" class="template-field dictionary-entry-input" type="text" :placeholder="field.placeholder || '请输入'" />
            </template>
          </div>
        </div>

        <div class="dictionary-entry-footer">
          <button class="btn btn-primary dictionary-entry-submit" type="button" @click="submitFloatingActionDialog">{{ floatingActionDialog.submitLabel }}</button>
          <label v-if="floatingActionDialog.keepOpenEnabled" class="dictionary-entry-keep-open">
            <input v-model="floatingActionDialog.keepOpen" type="checkbox" />
            <span>确定后不关闭</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="deliveryPlanImportDialog.visible" class="dictionary-entry-overlay" @click.self="closeDeliveryPlanImportDialog">
      <div class="dictionary-entry-card bom-import-card" role="dialog" aria-modal="true">
        <div class="dictionary-entry-emblem" aria-hidden="true">
          <svg class="dictionary-entry-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="dictionary-entry-close" type="button" @click="closeDeliveryPlanImportDialog">×</button>
        <h3 class="dictionary-entry-title">发货计划导入</h3>

        <div class="dictionary-entry-form">
          <div class="dictionary-entry-row bom-import-row">
            <label class="dictionary-entry-label">模板</label>
            <button class="btn btn-ghost btn-sm" type="button" @click="downloadDeliveryPlanTemplate">下载</button>
          </div>
          <div class="dictionary-entry-row bom-import-row">
            <label class="dictionary-entry-label">
              <span class="modal-required">*</span>
              导入文件
            </label>
            <button class="btn btn-ghost btn-sm" type="button" @click="triggerDeliveryPlanImportFileSelect">
              {{ deliveryPlanImportDialog.fileName || "点击上传" }}
            </button>
            <input id="delivery-plan-import-input" type="file" accept=".xlsx,.xls,.csv" hidden @change="handleDeliveryPlanImportFileChange" />
          </div>
        </div>

        <div class="dictionary-entry-footer">
          <button class="btn btn-primary dictionary-entry-submit" type="button" @click="submitDeliveryPlanImportDialog">确定</button>
          <label class="dictionary-entry-keep-open">
            <input v-model="deliveryPlanImportDialog.keepOpen" type="checkbox" />
            <span>确定后不关闭</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="bomImportDialog.visible" class="dictionary-entry-overlay" @click.self="closeBomImportDialog">
      <div class="dictionary-entry-card bom-import-card" role="dialog" aria-modal="true">
        <div class="dictionary-entry-emblem" aria-hidden="true">
          <svg class="dictionary-entry-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="dictionary-entry-close" type="button" @click="closeBomImportDialog">×</button>
        <h3 class="dictionary-entry-title">工序bom导入</h3>

        <div class="dictionary-entry-form">
          <div class="dictionary-entry-row bom-import-row">
            <label class="dictionary-entry-label">模板</label>
            <button class="btn btn-ghost btn-sm" type="button" @click="downloadBomTemplate">下载</button>
          </div>
          <div class="dictionary-entry-row bom-import-row">
            <label class="dictionary-entry-label">
              <span class="modal-required">*</span>
              导入文件
            </label>
            <button class="btn btn-ghost btn-sm" type="button" @click="triggerBomImportFileSelect">
              {{ bomImportDialog.fileName || "点击上传" }}
            </button>
            <input id="bom-import-input" type="file" accept=".xlsx,.xls,.csv" hidden @change="handleBomImportFileChange" />
          </div>
        </div>

        <div class="dictionary-entry-footer">
          <button class="btn btn-primary dictionary-entry-submit" type="button" @click="submitBomImportDialog">确定</button>
          <label class="dictionary-entry-keep-open">
            <input v-model="bomImportDialog.keepOpen" type="checkbox" />
            <span>确定后不关闭</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="dictionaryEntryDialog.visible" class="dictionary-entry-overlay" @click.self="closeDictionaryEntryDialog">
      <div class="dictionary-entry-card" role="dialog" aria-modal="true">
        <div class="dictionary-entry-emblem" aria-hidden="true">
          <svg class="dictionary-entry-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path
              d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="dictionary-entry-close" type="button" @click="closeDictionaryEntryDialog">×</button>
        <h3 class="dictionary-entry-title">{{ dictionaryEntryDialogTitle }}</h3>

        <div class="dictionary-entry-form">
          <div class="dictionary-entry-row">
            <label class="dictionary-entry-label">字典类型</label>
            <input
              :value="dictionaryEntryDialog.dictionaryType"
              class="template-field dictionary-entry-input dictionary-entry-input-disabled"
              type="text"
              disabled
            />
          </div>

          <div class="dictionary-entry-row">
            <label class="dictionary-entry-label">
              <span class="modal-required">*</span>
              字典名称
            </label>
            <input
              v-model="dictionaryEntryDialog.dictionaryName"
              class="template-field dictionary-entry-input"
              type="text"
              placeholder="请输入"
            />
          </div>
        </div>

        <div class="dictionary-entry-footer">
          <button class="btn btn-primary dictionary-entry-submit" type="button" @click="submitDictionaryEntryDialog">确定</button>
          <label v-if="dictionaryEntryDialog.mode === 'add'" class="dictionary-entry-keep-open">
            <input v-model="dictionaryEntryDialog.keepOpen" type="checkbox" />
            <span>确定后不关闭</span>
          </label>
        </div>
      </div>
    </div>

    <div v-if="permissionDialog.visible" class="permission-overlay" @click.self="closePermissionDialog">
      <div class="permission-card" role="dialog" aria-modal="true">
        <div class="permission-emblem" aria-hidden="true">
          <svg class="permission-emblem-icon" viewBox="0 0 64 64" fill="none">
            <path
              d="M23 10h14l12 12v26a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6Z"
              stroke="currentColor"
              stroke-width="3"
              stroke-linejoin="round"
            />
            <path d="M37 10v13h12" stroke="currentColor" stroke-width="3" stroke-linejoin="round" />
            <path d="M32 27v13M25.5 33.5h13" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <button class="permission-close" type="button" @click="closePermissionDialog">×</button>
        <h3 class="permission-title">{{ permissionDialog.title }}</h3>

        <div class="permission-search-shell">
          <input v-model="permissionDialog.search" class="template-field permission-search-input" placeholder="请输入" />
          <span class="permission-search-icon" aria-hidden="true">⌕</span>
        </div>

        <div class="permission-list">
          <div
            v-for="row in permissionVisibleRows"
            :key="row.node.key"
            class="permission-row"
            :style="{ '--permission-indent': `${row.depth * 18}px` }"
          >
            <button
              v-if="permissionDialog.mode === 'tree'"
              class="permission-toggle"
              :class="{ placeholder: !row.hasChildren, expanded: row.node.expanded || row.forceExpanded }"
              type="button"
              @click="togglePermissionExpand(row.node)"
            >
              <span v-if="row.hasChildren">›</span>
            </button>
            <span v-else class="permission-toggle placeholder"></span>

            <label class="permission-check">
              <input
                :checked="row.node.checked"
                type="checkbox"
                @change="togglePermissionNode(row.node, $event.target.checked)"
              />
              <span>{{ row.node.label }}</span>
            </label>
          </div>

          <div v-if="!permissionVisibleRows.length" class="empty-state permission-empty">暂无匹配权限</div>
        </div>

        <div class="permission-actions">
          <button class="permission-pill permission-pill-secondary" type="button" @click="handlePermissionBulkAction">
            全选/反选
          </button>
          <span v-if="permissionDialog.countMode !== 'none'" class="permission-count">{{ permissionSelectedCount }}</span>
          <button class="permission-pill permission-pill-primary" type="button" @click="closePermissionDialog">确定</button>
        </div>
      </div>
    </div>

    <div v-if="menuSheetDialog.visible" class="menu-sheet-overlay" @click.self="closeMenuSheetDialog">
      <div class="menu-sheet-card" :class="{ maximized: menuSheetDialog.maximized }" role="dialog" aria-modal="true">
        <div class="menu-sheet-topbar">
          <div></div>
          <div class="menu-sheet-window-actions">
            <button class="menu-sheet-window-btn" type="button" @click="toggleMenuSheetMaximize">
              {{ menuSheetDialog.maximized ? "❐" : "⤢" }}
            </button>
            <button class="menu-sheet-window-btn" type="button" @click="closeMenuSheetDialog">×</button>
          </div>
        </div>

        <div class="menu-sheet-filter-card">
          <div class="menu-sheet-filter-grid">
            <label class="input-group">
              <span class="input-label">菜单名称</span>
              <input v-model="menuSheetDialog.keyword" class="template-field" placeholder="请输入" />
            </label>

            <div class="template-filter-actions">
              <button class="btn btn-primary btn-sm" type="button" @click="menuSheetDialog.currentPage = 1">查询</button>
              <button class="btn btn-secondary btn-sm" type="button" @click="resetMenuSheetSearch">重置</button>
            </div>
          </div>
        </div>

        <div class="menu-sheet-section">
          <div class="menu-sheet-section-head">
            <h3 class="menu-sheet-section-title">{{ menuSheetDialog.title }}</h3>

            <div class="template-toolbar-actions">
              <button class="btn btn-primary btn-sm" type="button" @click="handleMenuSheetToolbarAction('menuSort')">菜单排序</button>
              <button class="btn btn-primary btn-sm" type="button" @click="handleMenuSheetToolbarAction('add')">新增</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="handleMenuSheetToolbarAction('refresh')">刷新</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="handleMenuSheetToolbarAction('save')">保存配置</button>
            </div>
          </div>

          <div class="menu-sheet-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>菜单名称</th>
                  <th>菜单路径</th>
                  <th>操作人</th>
                  <th>修改时间</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in menuSheetPagedRows" :key="row.id">
                  <td>{{ (menuSheetDialog.currentPage - 1) * menuSheetDialog.pageSize + index + 1 }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.path }}</td>
                  <td>{{ row.operator }}</td>
                  <td>{{ row.updatedAt }}</td>
                  <td>{{ row.createdAt }}</td>
                  <td>
                    <div class="table-actions">
                      <button class="table-action primary" type="button" @click="handleMenuSheetRowAction('edit', row)">修改</button>
                      <button class="table-action primary" type="button" @click="handleMenuSheetRowAction('submenu', row)">子菜单</button>
                      <button class="table-action primary" type="button" @click="handleMenuSheetRowAction('more', row)">...</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!menuSheetPagedRows.length" class="empty-state">暂无数据</div>
          </div>

          <div class="template-footer">
            <span class="muted">共{{ menuSheetFilteredRows.length }}条数据</span>
            <div class="template-pagination">
              <button class="btn btn-ghost btn-sm" type="button" @click="previousMenuSheetPage">‹</button>
              <span class="template-page-number">{{ menuSheetDialog.currentPage }}</span>
              <button class="btn btn-ghost btn-sm" type="button" @click="nextMenuSheetPage">›</button>
              <select v-model="menuSheetDialog.pageSize" class="template-page-size">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="approvalGroupDialog.visible" class="approval-group-overlay" @click.self="closeApprovalGroupDialog">
      <div class="approval-group-card" :class="{ maximized: approvalGroupDialog.maximized }" role="dialog" aria-modal="true">
        <div class="menu-sheet-topbar">
          <div></div>
          <div class="menu-sheet-window-actions">
            <button class="menu-sheet-window-btn" type="button" @click="toggleApprovalGroupMaximize">
              {{ approvalGroupDialog.maximized ? "❐" : "⤢" }}
            </button>
            <button class="menu-sheet-window-btn" type="button" @click="closeApprovalGroupDialog">×</button>
          </div>
        </div>

        <template v-if="approvalGroupDialog.mode === 'flow'">
          <div class="approval-group-head">
            <h3 class="approval-group-title">{{ `${approvalGroupDialog.title}-审批小组` }}</h3>
            <button class="btn btn-primary btn-sm" type="button" @click="handleApprovalGroupToolbarAction('add')">新增</button>
          </div>

          <div class="approval-flow-canvas">
            <div class="approval-flow-column">
              <template v-for="(node, index) in approvalGroupDialog.flowNodes" :key="node.id">
                <div class="approval-flow-node">
                  <span>{{ node.name }}</span>
                </div>
                <div v-if="index < approvalGroupDialog.flowNodes.length - 1" class="approval-flow-link" aria-hidden="true"></div>
              </template>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="approval-group-head">
            <h3 class="approval-group-title">{{ `抄送人员明细-${approvalGroupDialog.title}` }}</h3>
            <div class="template-toolbar-actions">
              <button class="btn btn-primary btn-sm" type="button" @click="handleApprovalGroupToolbarAction('add')">新增</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="handleApprovalGroupToolbarAction('refresh')">刷新</button>
              <button class="btn btn-ghost btn-sm" type="button" @click="handleApprovalGroupToolbarAction('save')">保存配置</button>
            </div>
          </div>

          <div class="approval-group-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>抄送人</th>
                  <th>操作人</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in approvalGroupPagedRows" :key="row.id">
                  <td>{{ (approvalGroupDialog.currentPage - 1) * approvalGroupDialog.pageSize + index + 1 }}</td>
                  <td>{{ row.name }}</td>
                  <td>{{ row.operator }}</td>
                  <td>{{ row.createdAt }}</td>
                  <td>
                    <button class="table-action danger" type="button" @click="deleteApprovalGroupRow(row)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <div v-if="!approvalGroupPagedRows.length" class="empty-state">暂无数据</div>
          </div>

          <div class="template-footer">
            <span class="muted">共{{ approvalGroupDialog.sourceRows.length }}条数据</span>
            <div class="template-pagination">
              <button class="btn btn-ghost btn-sm" type="button" @click="previousApprovalGroupPage">‹</button>
              <span class="template-page-number">{{ approvalGroupDialog.currentPage }}</span>
              <button class="btn btn-ghost btn-sm" type="button" @click="nextApprovalGroupPage">›</button>
              <select v-model="approvalGroupDialog.pageSize" class="template-page-size">
                <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} 条/页</option>
              </select>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div v-if="confirmDialog.visible" class="confirm-overlay">
      <div class="confirm-card" role="dialog" aria-modal="true">
        <div class="confirm-main">
          <div class="confirm-icon" aria-hidden="true">!</div>
          <div class="confirm-copy">
            <h4 class="confirm-title">{{ confirmDialog.title }}</h4>
            <p class="confirm-message">{{ confirmDialog.message }}</p>
          </div>
        </div>

        <div class="confirm-actions">
          <button class="confirm-btn confirm-btn-secondary" type="button" @click="closeConfirmDialog">
            {{ confirmDialog.cancelText }}
          </button>
          <button class="confirm-btn confirm-btn-primary" type="button" @click="submitConfirmDialog">
            {{ confirmDialog.confirmText }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
