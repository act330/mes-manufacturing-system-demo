import { defaultModuleRegistry } from "./modules";

const timestamps = [
  "2026-04-18 15:48:01",
  "2026-04-18 14:36:25",
  "2026-04-18 11:15:42",
  "2026-04-17 19:08:33",
  "2026-04-16 09:26:18"
];

function createConfig({
  title,
  description,
  filters,
  columns,
  rows,
  mode = "table",
  stats = [],
  panels = [],
  tabs = [],
  groups = [],
  calendar = null,
  formFields = [],
  modalEntity = "",
  modalVariant = "default",
  modalKeepOpenEnabled = false,
  hideModalCancel = false,
  toolbarActions = [
    { key: "add", label: "新增", tone: "primary" },
    { key: "refresh", label: "刷新", tone: "ghost" },
    { key: "save", label: "保存配置", tone: "ghost" }
  ],
  rowActions = [
    { key: "edit", label: "修改", tone: "primary" },
    { key: "duplicate", label: "复制", tone: "primary" },
    { key: "delete", label: "删除", tone: "danger" }
  ],
  addFactory,
  rowKey = "id"
}) {
  return {
    title,
    description,
    filters,
    columns,
    rows,
    mode,
    stats,
    panels,
    tabs,
    groups,
    calendar,
    formFields,
    modalEntity,
    modalVariant,
    modalKeepOpenEnabled,
    hideModalCancel,
    toolbarActions,
    rowActions,
    addFactory,
    rowKey
  };
}

function buildSoftwareVersionConfig() {
  return createConfig({
    title: "软件版本",
    description: "维护软件版本、产品版本与客户适配关系",
    filters: [
      {
        key: "product",
        label: "产品",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部产品", value: "all" },
          { label: "E38控制器-线路...", value: "E38控制器-线路..." },
          { label: "D21域控制器", value: "D21域控制器" }
        ],
        matchField: "productName"
      },
      { key: "programName", label: "程序名称", type: "text", placeholder: "请输入", matchFields: ["programName"] },
      { key: "programVersion", label: "程序版本", type: "text", placeholder: "请输入", matchFields: ["programVersion"] },
      {
        key: "customerName",
        label: "客户名称",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部客户", value: "all" },
          { label: "科博达", value: "科博达" },
          { label: "威灵", value: "威灵" },
          { label: "零跑#02", value: "零跑#02" }
        ],
        matchField: "customerName"
      }
    ],
    toolbarActions: [
      { key: "deleteSelected", label: "删除", tone: "ghost", disabled: true },
      { key: "add", label: "新增", tone: "primary" },
      { key: "refresh", label: "刷新", tone: "ghost" },
      { key: "save", label: "保存配置", tone: "ghost" }
    ],
    columns: [
      { key: "__select", label: "□", type: "select" },
      { key: "__index", label: "序号", type: "index" },
      { key: "productName", label: "产品名称" },
      { key: "programName", label: "程序名称" },
      { key: "programVersion", label: "程序版本" },
      { key: "productCode", label: "产品编号" },
      { key: "customerName", label: "客户名称" },
      { key: "status", label: "状态", type: "status" },
      { key: "operator", label: "操作人" },
      { key: "updatedAt", label: "修改时间" },
      { key: "createdAt", label: "创建时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows: [
      { id: "SW-001", productName: "E38控制器-线路...", programName: "低压应用层程序", programVersion: "93225101001-SW.V0.34-HW.V0.1-E38...", productCode: "23225101001", customerName: "科博达", status: "启用", operator: "易蓝(易蓝科技02)", updatedAt: "2025-06-18 11:14:37", createdAt: "2025-06-18 11:14:37" },
      { id: "SW-002", productName: "E38控制器-线路...", programName: "高压应用层程序", programVersion: "93225101001-SW.V0.151-HW.V0.1-E3...", productCode: "23225101001", customerName: "科博达", status: "启用", operator: "易蓝(易蓝科技02)", updatedAt: "2025-05-09 12:18:33", createdAt: "2025-05-09 12:18:33" },
      { id: "SW-003", productName: "D21域控制器", programName: "底层程序", programVersion: "SDA-ITMC-BSLv1.04.00", productCode: "12225071001", customerName: "威灵", status: "启用", operator: "崔常凯(dev)", updatedAt: "2025-03-12 14:45:41", createdAt: "2025-03-12 14:45:41" }
    ],
    formFields: [
      { key: "productName", label: "产品名称", type: "text" },
      { key: "programName", label: "程序名称", type: "text" },
      { key: "programVersion", label: "程序版本", type: "text" },
      { key: "productCode", label: "产品编号", type: "text" },
      {
        key: "customerName",
        label: "客户名称",
        type: "select",
        options: [
          { label: "科博达", value: "科博达" },
          { label: "威灵", value: "威灵" },
          { label: "零跑#02", value: "零跑#02" }
        ]
      },
      {
        key: "status",
        label: "状态",
        type: "select",
        options: [
          { label: "启用", value: "启用" },
          { label: "停用", value: "停用" }
        ]
      }
    ],
    rowActions: [
      { key: "edit", label: "修改", tone: "primary" },
      { key: "toggleStatus", label: "禁用", tone: "danger" },
      { key: "delete", label: "删除", tone: "danger" }
    ]
  });
}

function buildHardwareVersionConfig() {
  return createConfig({
    title: "硬件版本",
    description: "维护硬件版本、硬件编号与启停状态",
    filters: [
      {
        key: "hardware",
        label: "硬件",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部硬件", value: "all" },
          { label: "蔚来Fy-PTC控制器", value: "蔚来Fy-PTC控制器" },
          { label: "B11增程式（出口）", value: "B11增程式（出口）" }
        ],
        matchField: "hardwareName"
      },
      { key: "hardwareVersion", label: "硬件版本", type: "text", placeholder: "请输入", matchFields: ["hardwareVersion"] }
    ],
    toolbarActions: [
      { key: "add", label: "新增", tone: "primary" },
      { key: "refresh", label: "刷新", tone: "ghost" },
      { key: "save", label: "保存配置", tone: "ghost" }
    ],
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "hardwareVersion", label: "硬件版本" },
      { key: "hardwareCode", label: "硬件编号" },
      { key: "hardwareName", label: "硬件名称" },
      { key: "status", label: "状态", type: "status" },
      { key: "operator", label: "操作人" },
      { key: "updatedAt", label: "修改时间" },
      { key: "createdAt", label: "创建时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows: [
      { id: "HW-001", hardwareVersion: "93122044001-H...", hardwareCode: "93122044001", hardwareName: "S11L-500V膜加热...", status: "启用", operator: "马晓峰(mxz)", updatedAt: "2025-06-18 11:14:37", createdAt: "2025-06-18 11:14:37" },
      { id: "HW-002", hardwareVersion: "9231918G001-H...", hardwareCode: "9231918G001", hardwareName: "B11增程式（出口）...", status: "启用", operator: "马晓峰(mxz)", updatedAt: "2025-05-09 12:18:33", createdAt: "2025-05-09 12:18:33" },
      { id: "HW-003", hardwareVersion: "V01", hardwareCode: "93122081001", hardwareName: "蔚来Fy-PTC控制器", status: "启用", operator: "崔常凯(dev)", updatedAt: "2025-03-12 14:45:41", createdAt: "2025-03-12 14:45:41" }
    ],
    formFields: [
      { key: "hardwareVersion", label: "硬件版本", type: "text" },
      { key: "hardwareCode", label: "硬件编号", type: "text" },
      { key: "hardwareName", label: "硬件名称", type: "text" },
      {
        key: "status",
        label: "状态",
        type: "select",
        options: [
          { label: "启用", value: "启用" },
          { label: "停用", value: "停用" }
        ]
      }
    ],
    rowActions: [
      { key: "toggleStatus", label: "禁用", tone: "danger" }
    ]
  });
}

function buildExtraFeatureConfig(routeName) {
  if (routeName === "deliveryPlan") {
    return createConfig({
      title: "发货计划",
      description: "查看客户发货计划、交期与排产状态",
      filters: [
        {
          key: "productName",
          label: "产品名称",
          type: "select",
          options: [
            { label: "请选择", value: "all" },
            { label: "TC11纯电双温区2024款控制模块", value: "TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）" },
            { label: "B11增程26款-控制模块", value: "B11增程26款-控制模块总成" },
            { label: "阿维塔E516控制器总成", value: "阿维塔E516控制器总成" }
          ],
          matchField: "productName"
        },
        {
          key: "deliveryDate",
          label: "交期",
          type: "daterange",
          startKey: "deliveryStart",
          endKey: "deliveryEnd",
          matchField: "deliveryDate"
        },
        {
          key: "customerName",
          label: "客户名称",
          type: "select",
          options: [
            { label: "请选择", value: "all" },
            { label: "零跑#02", value: "零跑#02" },
            { label: "华鲲", value: "华鲲" },
            { label: "长安", value: "长安" },
            { label: "吉利", value: "吉利" }
          ],
          matchField: "customerName"
        },
        {
          key: "scheduled",
          label: "是否排产",
          type: "select",
          options: [
            { label: "请选择", value: "all" },
            { label: "已排产", value: "已排产" },
            { label: "未排产", value: "未排产" }
          ],
          matchField: "scheduled"
        }
      ],
      toolbarActions: [
        { key: "analysis", label: "齐套分析", tone: "ghost", disabled: true },
        { key: "import", label: "导入", tone: "ghost" },
        { key: "add", label: "新增", tone: "primary" },
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ],
      columns: [
        { key: "__select", label: "", type: "select" },
        { key: "__index", label: "序号", type: "index" },
        { key: "productCode", label: "产品编号" },
        { key: "productName", label: "产品名称" },
        { key: "customerPartNo", label: "客户件号" },
        { key: "quantity", label: "数量" },
        { key: "deliveryDate", label: "交期" },
        { key: "customerName", label: "客户名称" },
        { key: "remark", label: "备注" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "DP-001", productCode: "92323883002", productName: "TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）", customerPartNo: "", quantity: "780", deliveryDate: "2026-04-30", customerName: "零跑#02", remark: "", operator: "姜计飞(jia)", scheduled: "已排产" },
        { id: "DP-002", productCode: "92324192001", productName: "TC11纯电-26款-控制模块总成", customerPartNo: "", quantity: "780", deliveryDate: "2026-04-30", customerName: "零跑#02", remark: "", operator: "姜计飞(jia)", scheduled: "已排产" },
        { id: "DP-003", productCode: "92324231001", productName: "B11增程26款-控制模块总成", customerPartNo: "", quantity: "480", deliveryDate: "2026-04-30", customerName: "零跑#02", remark: "", operator: "姜计飞(jia)", scheduled: "已排产" },
        { id: "DP-004", productCode: "9231918G001", productName: "B11增程式（出口）-控制模块总成", customerPartNo: "4001423-BJ01", quantity: "270", deliveryDate: "2026-04-30", customerName: "零跑#02", remark: "", operator: "姜计飞(jia)", scheduled: "已排产" },
        { id: "DP-005", productCode: "92324241001", productName: "B13增程26款-控制模块总成", customerPartNo: "4001420-BF01", quantity: "300", deliveryDate: "2026-04-30", customerName: "零跑#02", remark: "", operator: "姜计飞(jia)", scheduled: "已排产" },
        { id: "DP-006", productCode: "2121813D002", productName: "AH43-D-线路板贴片完成组件", customerPartNo: "", quantity: "1500", deliveryDate: "2026-04-26", customerName: "华鲲", remark: "", operator: "黄磊(HL)", scheduled: "未排产" },
        { id: "DP-007", productCode: "12224287001", productName: "阿维塔E516控制器总成", customerPartNo: "", quantity: "24", deliveryDate: "2026-04-30", customerName: "长安", remark: "", operator: "易蓝(易蓝)", scheduled: "已排产" },
        { id: "DP-008", productCode: "21324152002", productName: "T81-线路板贴片完成组件", customerPartNo: "", quantity: "1300", deliveryDate: "2026-04-24", customerName: "吉利", remark: "", operator: "黄磊(HL)", scheduled: "未排产" },
        { id: "DP-009", productCode: "23123863002", productName: "长安马自达J90A贴片完成组件", customerPartNo: "", quantity: "500", deliveryDate: "2026-04-24", customerName: "华鲲", remark: "", operator: "黄磊(HL)", scheduled: "未排产" },
        { id: "DP-010", productCode: "23122081001", productName: "蔚来Fy控制板线路板贴片完成组件", customerPartNo: "", quantity: "680", deliveryDate: "2026-04-24", customerName: "华鲲", remark: "", operator: "黄磊(HL)", scheduled: "未排产" }
      ],
      formFields: [
        {
          key: "productName",
          label: "产品",
          type: "select",
          typeByMode: { add: "select", edit: "readonly" },
          required: true,
          options: [
            { label: "请选择", value: "" },
            { label: "TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）", value: "TC11纯电双温区2024款控制模块（S32K芯片）（发货状态成品）" },
            { label: "TC11纯电-26款-控制模块总成", value: "TC11纯电-26款-控制模块总成" },
            { label: "B11增程26款-控制模块总成", value: "B11增程26款-控制模块总成" },
            { label: "阿维塔E516控制器总成", value: "阿维塔E516控制器总成" }
          ]
        },
        { key: "quantity", label: "数量", type: "number", required: true, defaultValue: "1" },
        { key: "deliveryDate", label: "交期", type: "date", required: true },
        {
          key: "customerName",
          label: "客户名称",
          type: "select",
          required: true,
          options: [
            { label: "请选择", value: "" },
            { label: "零跑#02", value: "零跑#02" },
            { label: "华鲲", value: "华鲲" },
            { label: "长安", value: "长安" },
            { label: "吉利", value: "吉利" }
          ]
        },
        { key: "customerPartNo", label: "客户件号", type: "text", placeholder: "请输入" },
        { key: "remark", label: "备注", type: "textarea", placeholder: "请输入" }
      ],
      modalVariant: "floating-form",
      modalKeepOpenEnabled: true,
      hideModalCancel: true,
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    });
  }

  const configMap = {
    deliveryPlan: createConfig({
      title: "发货计划",
      description: "查看客户交付计划与发货排程",
      filters: [
        { key: "planNo", label: "计划单号", type: "text", placeholder: "请输入", matchFields: ["planNo"] },
        { key: "customerName", label: "客户名称", type: "text", placeholder: "请输入", matchFields: ["customerName"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "planNo", label: "计划单号" },
        { key: "customerName", label: "客户名称" },
        { key: "deliveryDate", label: "交付日期" },
        { key: "quantity", label: "数量" },
        { key: "operator", label: "操作人" }
      ],
      rows: [
        { id: "DP-001", planNo: "FH-20260419-001", customerName: "威灵", deliveryDate: "2026-04-20", quantity: "1200", operator: "张强" },
        { id: "DP-002", planNo: "FH-20260419-002", customerName: "科博达", deliveryDate: "2026-04-21", quantity: "860", operator: "刘涛" }
      ]
    }),
    productionPlanDetail: createConfig({
      title: "生产计划",
      description: "查看生产计划、达成情况与排程结果",
      filters: [
        { key: "product", label: "产品名称", type: "text", placeholder: "请输入", matchFields: ["productName"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "planNo", label: "计划单号" },
        { key: "productName", label: "产品名称" },
        { key: "line", label: "产线" },
        { key: "plannedQty", label: "计划数量" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [
        { id: "PP-001", planNo: "SC-001", productName: "B11增程式（出口）", line: "SMT A线", plannedQty: "2500", status: "进行中" },
        { id: "PP-002", planNo: "SC-002", productName: "TC11增程式双温控器", line: "组装A线", plannedQty: "300", status: "已完成" }
      ]
    }),
    productionPlanChangeDetail: createConfig({
      title: "计划变更明细",
      description: "查看计划变更记录与调整明细",
      filters: [
        { key: "changeNo", label: "变更单号", type: "text", placeholder: "请输入", matchFields: ["changeNo"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "changeNo", label: "变更单号" },
        { key: "planNo", label: "计划单号" },
        { key: "reason", label: "变更原因" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "变更时间" }
      ],
      rows: [
        { id: "CH-001", changeNo: "BG-001", planNo: "SC-001", reason: "客户数量追加", operator: "陈计划", updatedAt: "2026-04-19 10:20:11" }
      ]
    }),
    dispatchWork: createConfig({
      title: "生产派工",
      description: "查看派工记录、派工单与责任人分配",
      filters: [
        { key: "dispatchNo", label: "派工单号", type: "text", placeholder: "请输入", matchFields: ["dispatchNo"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "dispatchNo", label: "派工单号" },
        { key: "workOrder", label: "工单" },
        { key: "owner", label: "责任人" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [
        { id: "DW-001", dispatchNo: "PG-001", workOrder: "WO-260418-001", owner: "张强", status: "已完成" }
      ]
    }),
    executionView: createConfig({
      title: "执行现况",
      description: "查看工单执行状态、进度与现场反馈",
      filters: [{ key: "orderNo", label: "工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "工单号" },
        { key: "line", label: "产线" },
        { key: "status", label: "状态", type: "status" },
        { key: "progress", label: "完成率" }
      ],
      rows: [{ id: "EXE-001", orderNo: "WO-260418-001", line: "SMT A线", status: "进行中", progress: "72%" }]
    }),
    reportManage: createConfig({
      title: "报工管理",
      description: "查看报工记录、工时与工单产出汇总",
      filters: [{ key: "reportNo", label: "报工单号", type: "text", placeholder: "请输入", matchFields: ["reportNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "reportNo", label: "报工单号" },
        { key: "workOrder", label: "工单号" },
        { key: "reportQty", label: "报工数量" },
        { key: "operator", label: "报工人" }
      ],
      rows: [{ id: "REP-001", reportNo: "BG-001", workOrder: "WO-260418-001", reportQty: "860", operator: "张强" }]
    }),
    pidList: createConfig({
      title: "PID列表",
      description: "查看PID清单、序列号与绑定记录",
      filters: [{ key: "pid", label: "PID", type: "text", placeholder: "请输入", matchFields: ["pid"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "pid", label: "PID" },
        { key: "productName", label: "产品名称" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [{ id: "PID-001", pid: "PID20260419001", productName: "B11增程式（出口）", status: "启用" }]
    }),
    pidPrint: createConfig({
      title: "PID打印",
      description: "查看PID打印任务、打印日志与模板配置",
      filters: [{ key: "taskNo", label: "打印任务号", type: "text", placeholder: "请输入", matchFields: ["taskNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "taskNo", label: "打印任务号" },
        { key: "template", label: "模板" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "时间" }
      ],
      rows: [{ id: "PIDP-001", taskNo: "PIDPRINT-001", template: "PID模板", operator: "张强", updatedAt: "2026-04-19 10:30:00" }]
    }),
    stationPass: createConfig({
      title: "过站管理",
      description: "查看过站记录、锁站状态和过站结果",
      filters: [{ key: "orderNo", label: "工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "工单号" },
        { key: "station", label: "工位" },
        { key: "result", label: "结果", type: "status" },
        { key: "updatedAt", label: "过站时间" }
      ],
      rows: [{ id: "PASS-001", orderNo: "WO-260418-001", station: "FCT工位", result: "已通过", updatedAt: "2026-04-19 10:35:00" }]
    }),
    lotCompose: createConfig({
      title: "LOT构成",
      description: "查看LOT构成明细、批次关系和关联物料",
      filters: [{ key: "lotNo", label: "LOT ID", type: "text", placeholder: "请输入", matchFields: ["lotNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "lotNo", label: "LOT ID" },
        { key: "materialCode", label: "物料编号" },
        { key: "qty", label: "数量" }
      ],
      rows: [{ id: "LOTC-001", lotNo: "LOT20260419001", materialCode: "MAT-001", qty: "1200" }]
    }),
    mappingCompose: createConfig({
      title: "Mapping",
      description: "查看Mapping记录、映射关系和半成品关联",
      filters: [{ key: "mappingId", label: "MAPPING ID", type: "text", placeholder: "请输入", matchFields: ["mappingId"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "mappingId", label: "MAPPING ID" },
        { key: "pid", label: "PID" },
        { key: "semiProductName", label: "半成品名称" }
      ],
      rows: [{ id: "MAPC-001", mappingId: "MAP-001", pid: "PID20260419001", semiProductName: "B90线路板贴片组件" }]
    }),
    exceptionReport: createConfig({
      title: "异常上报",
      description: "查看异常上报记录、提报人和异常明细",
      filters: [{ key: "orderNo", label: "工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "工单号" },
        { key: "type", label: "异常类型" },
        { key: "reporter", label: "提报人" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [{ id: "ER-001", orderNo: "WO-260418-001", type: "质量", reporter: "韩梅", status: "待审批" }]
    }),
    exceptionAssign: createConfig({
      title: "异常指派",
      description: "查看异常指派记录、责任人和指派状态",
      filters: [{ key: "owner", label: "责任人", type: "text", placeholder: "请输入", matchFields: ["owner"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "exceptionNo", label: "异常单号" },
        { key: "owner", label: "责任人" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [{ id: "EA-001", exceptionNo: "EX-001", owner: "马俊", status: "处理中" }]
    }),
    exceptionHandle: createConfig({
      title: "异常处理",
      description: "查看异常处理过程、处置结果和闭环情况",
      filters: [{ key: "exceptionNo", label: "异常单号", type: "text", placeholder: "请输入", matchFields: ["exceptionNo"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "exceptionNo", label: "异常单号" },
        { key: "processNote", label: "处理描述" },
        { key: "status", label: "状态", type: "status" }
      ],
      rows: [{ id: "EH-001", exceptionNo: "EX-001", processNote: "已调整参数并复测通过", status: "已完成" }]
    }),
    exceptionOwner: createConfig({
      title: "责任人管理",
      description: "维护异常责任人、责任部门和处理时效",
      filters: [{ key: "owner", label: "责任人", type: "text", placeholder: "请输入", matchFields: ["owner"] }],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "owner", label: "责任人" },
        { key: "department", label: "责任部门" },
        { key: "phone", label: "联系方式" }
      ],
      rows: [{ id: "EO-001", owner: "马俊", department: "设备部", phone: "13800000000" }]
    })
  };

  return configMap[routeName];
}

function standardFilters(label) {
  return [
    {
      key: "keyword",
      label,
      type: "text",
      placeholder: "请输入",
      matchFields: ["code", "name", "type", "owner", "account", "taskName", "realName", "operator", "roleName"]
    },
    {
      key: "status",
      label: "状态",
      type: "select",
      placeholder: "请选择",
      options: [
        { label: "全部", value: "all" },
        { label: "启用", value: "启用" },
        { label: "停用", value: "停用" },
        { label: "处理中", value: "处理中" },
        { label: "待审批", value: "待审批" },
        { label: "已通过", value: "已通过" },
        { label: "已驳回", value: "已驳回" }
      ],
      matchField: "status"
    }
  ];
}

function buildMasterRows(prefix, label, categoryLabel, categories) {
  return categories.map((category, index) => ({
    id: `${prefix}-${index + 1}`,
    code: `${prefix}-${String(index + 1).padStart(3, "0")}`,
    name: `${label}${index + 1}`,
    category,
    categoryLabel,
    status: index === categories.length - 1 ? "停用" : "启用",
    operator: ["黄磊(HL)", "罗柳(luo)", "朱义鹏(zyp)", "徐朝辉(xu)", "胡永洁(hubj)"][index % 5],
    updatedAt: timestamps[index % timestamps.length]
  }));
}

function buildMasterConfig(child, categoryLabel, categories) {
  const rows = buildMasterRows(child.routeName.toUpperCase().slice(-6), child.label, categoryLabel, categories);
  return createConfig({
    title: child.label,
    description: child.description,
    filters: standardFilters(`${child.label}`),
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "code", label: "编号" },
      { key: "name", label: "名称" },
      { key: "category", label: categoryLabel },
      { key: "status", label: "状态", type: "status" },
      { key: "operator", label: "操作人" },
      { key: "updatedAt", label: "修改时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows,
    addFactory: ({ keyword }) => ({
      id: `${child.routeName}-${Date.now()}`,
      code: `${child.routeName.slice(0, 3).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      name: keyword || `新${child.label}`,
      category: categories[0],
      status: "启用",
      operator: "当前用户",
      updatedAt: timestamps[0]
    })
  });
}

function buildExecutionConfig(child) {
  const rows = [
    { id: `${child.routeName}-1`, orderNo: "WO-260418-001", name: `${child.label}任务`, line: "SMT-01", owner: "张强", status: "进行中", qty: 1200, updatedAt: timestamps[0] },
    { id: `${child.routeName}-2`, orderNo: "WO-260418-002", name: `${child.label}任务`, line: "SMT-02", owner: "刘涛", status: "已完成", qty: 2400, updatedAt: timestamps[1] },
    { id: `${child.routeName}-3`, orderNo: "WO-260418-003", name: `${child.label}任务`, line: "ASSY-03", owner: "杨杰", status: "处理中", qty: 180, updatedAt: timestamps[2] }
  ];

  return createConfig({
    title: child.label,
    description: child.description,
    filters: [
      {
        key: "keyword",
        label: `${child.label}`,
        type: "text",
        placeholder: "请输入",
        matchFields: ["orderNo", "name", "line", "owner"]
      },
      {
        key: "status",
        label: "状态",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部", value: "all" },
          { label: "进行中", value: "进行中" },
          { label: "处理中", value: "处理中" },
          { label: "已完成", value: "已完成" }
        ],
        matchField: "status"
      }
    ],
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "orderNo", label: "单号" },
      { key: "name", label: "任务名称" },
      { key: "line", label: "产线/工位" },
      { key: "qty", label: "数量" },
      { key: "owner", label: "责任人" },
      { key: "status", label: "状态", type: "status" },
      { key: "updatedAt", label: "更新时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows,
    rowActions: [
      { key: "view", label: "查看", tone: "primary" },
      { key: "edit", label: "修改", tone: "primary" },
      { key: "delete", label: "删除", tone: "danger" }
    ],
    addFactory: ({ keyword }) => ({
      id: `${child.routeName}-${Date.now()}`,
      orderNo: `WO-${String(Date.now()).slice(-9)}`,
      name: keyword || `新${child.label}`,
      line: "SMT-01",
      qty: 100,
      owner: "当前用户",
      status: "进行中",
      updatedAt: timestamps[0]
    })
  });
}

function buildEquipmentConfig(child) {
  if (child.key === "equipmentEffect") {
    return createConfig({
      title: "FCT",
      description: child.description,
      filters: [
        {
          key: "product",
          label: "产品",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部产品", value: "all" },
            { label: "B11增程式（出口）", value: "B11增程式（出口）" },
            { label: "TC11增程式双温控器", value: "TC11增程式双温控器" }
          ],
          matchField: "product"
        },
        {
          key: "testDate",
          label: "检测时间",
          type: "daterange",
          startKey: "testStart",
          endKey: "testEnd",
          matchFieldStart: "testDate",
          matchFieldEnd: "testDate"
        },
        { key: "barcode", label: "条码", type: "text", placeholder: "请输入", matchFields: ["barcode"] },
        {
          key: "line",
          label: "线体",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部线体", value: "all" },
            { label: "SMT A线", value: "SMT A线" },
            { label: "组装A线", value: "组装A线" }
          ],
          matchField: "line"
        },
        {
          key: "station",
          label: "工位",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部工位", value: "all" },
            { label: "FCT", value: "FCT" },
            { label: "ICT", value: "ICT" }
          ],
          matchField: "station"
        },
        { key: "workOrder", label: "工单", type: "text", placeholder: "请输入", matchFields: ["workOrder"] },
        { key: "productModel", label: "产品型号", type: "text", placeholder: "请输入", matchFields: ["productModel"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "equipment", label: "设备" },
        { key: "station", label: "工位" },
        { key: "line", label: "线体" },
        { key: "workOrder", label: "工单" }
      ],
      rows: [],
      toolbarActions: [
        { key: "export", label: "导出", tone: "secondary" },
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ]
    });
  }

  return createConfig({
    title: child.label,
    description: child.description,
    filters: standardFilters("设备名称"),
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "code", label: "设备编号" },
      { key: "name", label: "设备名称" },
      { key: "area", label: "区域" },
      { key: "owner", label: "责任人" },
      { key: "updatedAt", label: "更新时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows: [
      { id: `${child.routeName}-1`, code: "EQ-1001", name: "西门子贴片机", area: "SMT-01", owner: "马俊", updatedAt: timestamps[0] },
      { id: `${child.routeName}-2`, code: "EQ-2008", name: "FCT测试台", area: "FCT-01", owner: "王广", updatedAt: timestamps[1] },
      { id: `${child.routeName}-3`, code: "EQ-4015", name: "激光打标机", area: "PACK-01", owner: "秦宇", updatedAt: timestamps[2] }
    ]
  });
}

function buildWarehouseConfig(child) {
  if (child.key === "warehouseManage") {
    return createConfig({
      title: "仓库管理",
      description: child.description,
      filters: [
        { key: "codeKeyword", label: "仓库编号", type: "text", placeholder: "请输入", matchFields: ["warehouseCode"] },
        { key: "nameKeyword", label: "仓库名称", type: "text", placeholder: "请输入", matchFields: ["warehouseName"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "warehouseCode", label: "仓库编号" },
        { key: "warehouseName", label: "仓库名称" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" }
      ],
      rows: [
        { id: "CK-001", warehouseCode: "CK001", warehouseName: "PCB仓", operator: "易蓝科技(100000156)", updatedAt: "2024-09-20 15:13:23", createdAt: "2024-09-20 15:13:23" },
        { id: "CK-002", warehouseCode: "CK002", warehouseName: "SMT物料仓", operator: "易蓝科技(100000156)", updatedAt: "2024-09-20 15:13:23", createdAt: "2024-09-20 15:13:23" },
        { id: "CK-003", warehouseCode: "CK003", warehouseName: "SMT成品仓", operator: "易蓝科技(100000156)", updatedAt: "2024-09-20 15:13:23", createdAt: "2024-09-20 15:13:23" },
        { id: "CK-004", warehouseCode: "CK004", warehouseName: "DIP物料仓", operator: "易蓝科技(100000156)", updatedAt: "2024-09-20 15:13:23", createdAt: "2024-09-20 15:13:23" }
      ],
      toolbarActions: [
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ]
    });
  }

  if (child.key === "locationManage") {
    return createConfig({
      title: "库位管理",
      description: child.description,
      filters: [
        { key: "locationCode", label: "库位编号", type: "text", placeholder: "请输入", matchFields: ["locationCode"] },
        { key: "locationName", label: "库位名称", type: "text", placeholder: "请输入", matchFields: ["locationName"] },
        {
          key: "warehouseName",
          label: "所属仓库",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部仓库", value: "all" },
            { label: "SMT专用物料仓", value: "SMT专用物料仓" },
            { label: "原料仓", value: "原料仓" },
            { label: "其他仓", value: "其他仓" }
          ],
          matchField: "warehouseName"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "locationCode", label: "库位编号" },
        { key: "locationName", label: "库位名称" },
        { key: "warehouseName", label: "所属仓库" },
        { key: "warehouseCode", label: "仓库编码" },
        { key: "operator", label: "操作人" },
        { key: "createdAt", label: "创建时间" }
      ],
      rows: [
        { id: "KW-001", locationCode: "22A1", locationName: "22A1", warehouseName: "SMT专用物料仓", warehouseCode: "CK105", operator: "易蓝科技(100000156)", createdAt: "2024-09-20 15:13:23" },
        { id: "KW-002", locationCode: "21A1", locationName: "21A1", warehouseName: "原料仓", warehouseCode: "CK007", operator: "易蓝科技(100000156)", createdAt: "2024-09-20 15:13:23" },
        { id: "KW-003", locationCode: "21C区", locationName: "21C区", warehouseName: "其他仓", warehouseCode: "CK014", operator: "易蓝科技(100000156)", createdAt: "2024-09-20 15:13:23" },
        { id: "KW-004", locationCode: "24A区", locationName: "24A区", warehouseName: "包材仓", warehouseCode: "CK012", operator: "易蓝科技(100000156)", createdAt: "2024-09-20 15:13:23" }
      ],
      toolbarActions: [
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ]
    });
  }

  return createConfig({
    title: "库存明细",
    description: child.description,
    filters: [
      {
        key: "materialName",
        label: "物料",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部物料", value: "all" },
          { label: "多路开关", value: "多路开关" },
          { label: "贴片电阻", value: "贴片电阻" }
        ],
        matchField: "materialName"
      },
      {
        key: "warehouseName",
        label: "仓库",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部仓库", value: "all" },
          { label: "SMT物料仓", value: "SMT物料仓" },
          { label: "PCB仓", value: "PCB仓" }
        ],
        matchField: "warehouseName"
      },
      {
        key: "locationName",
        label: "库位",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部库位", value: "all" },
          { label: "22B1", value: "22B1" },
          { label: "22A1", value: "22A1" }
        ],
        matchField: "locationName"
      }
    ],
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "warehouseCode", label: "仓库编号" },
      { key: "warehouseName", label: "仓库名称" },
      { key: "materialCode", label: "物料编号" },
      { key: "materialName", label: "物料名称" },
      { key: "locationCode", label: "库位编号" },
      { key: "locationName", label: "库位名称" },
      { key: "quantity", label: "数量" }
    ],
    rows: [
      { id: "KC-001", warehouseCode: "CK002", warehouseName: "SMT物料仓", materialCode: "160348", materialName: "多路开关", locationCode: "22B1", locationName: "22B1", quantity: "4,000" },
      { id: "KC-002", warehouseCode: "CK003", warehouseName: "SMT成品仓", materialCode: "2231902R002", materialName: "J6V远程-美标-黑盒子-线路...", locationCode: "", locationName: "", quantity: "0" },
      { id: "KC-003", warehouseCode: "CK019", warehouseName: "不良品仓", materialCode: "31214216037", materialName: "扩散膜-BB83", locationCode: "", locationName: "", quantity: "0" },
      { id: "KC-004", warehouseCode: "CK002", warehouseName: "SMT物料仓", materialCode: "110646", materialName: "贴片电阻", locationCode: "22B1", locationName: "22B1", quantity: "5,100" }
    ],
    toolbarActions: [
      { key: "sync", label: "同步", tone: "primary" },
      { key: "refresh", label: "刷新", tone: "ghost" },
      { key: "save", label: "保存配置", tone: "ghost" }
    ]
  });
}

function buildTraceConfig(child) {
  if (child.key === "materialTrace") {
    return createConfig({
      title: "物料追溯",
      description: child.description,
      mode: "trace-tabs",
      filters: [
        { key: "mid", label: "MID", type: "text", placeholder: "请输入", matchFields: ["mid"] },
        {
          key: "timeRange",
          label: "开始时间",
          type: "daterange",
          startKey: "startTime",
          endKey: "endTime",
          matchFieldStart: "updatedAt",
          matchFieldEnd: "updatedAt"
        }
      ],
      tabs: ["生产履历", "生产上料", "使用记录"],
      toolbarActions: [
        { key: "reverse", label: "倒序", tone: "ghost" },
        { key: "refresh", label: "刷新", tone: "ghost" }
      ],
      columns: [],
      rows: []
    });
  }

  if (child.key === "productTrace") {
    return createConfig({
      title: "产品追溯",
      description: child.description,
      mode: "trace-tabs",
      filters: [
        { key: "pid", label: "PID", type: "text", placeholder: "请输入", matchFields: ["pid"] },
        {
          key: "timeRange",
          label: "开始时间",
          type: "daterange",
          startKey: "startTime",
          endKey: "endTime",
          matchFieldStart: "updatedAt",
          matchFieldEnd: "updatedAt"
        }
      ],
      tabs: ["生产履历", "生产上料", "产品维修", "LOT记录", "过站记录", "报废履历"],
      toolbarActions: [
        { key: "share", label: "分享", tone: "ghost" },
        { key: "reverse", label: "倒序", tone: "ghost" },
        { key: "refresh", label: "刷新", tone: "ghost" }
      ],
      columns: [],
      rows: []
    });
  }

  if (child.key === "lotHistory") {
    return createConfig({
      title: "LOT履历",
      description: child.description,
      filters: [
        { key: "lotId", label: "LOT ID", type: "text", placeholder: "请输入", matchFields: ["lotId"] }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "lotId", label: "LOT ID" },
        { key: "productCode", label: "产品编号" },
        { key: "productName", label: "产品名称" },
        { key: "composeType", label: "构成类型" },
        { key: "quantity", label: "数量" },
        { key: "date", label: "日期" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "LOT-001", lotId: "9231918E001LOT250514...", productCode: "9231918E001", productName: "B13增程式-控制模块（发...", composeType: "有码", quantity: "2", date: "2025-05-14 19:58:51" },
        { id: "LOT-002", lotId: "9231918E001LOT250514...", productCode: "9231918E001", productName: "B13增程式-控制模块（发...", composeType: "有码", quantity: "1", date: "2025-05-14 19:57:34" },
        { id: "LOT-003", lotId: "9231918G001LOT25050...", productCode: "9231918G001", productName: "B11增程式（出口）-控制...", composeType: "有码", quantity: "1", date: "2025-05-09 14:31:07" }
      ],
      rowActions: [
        { key: "detail", label: "明细", tone: "primary" }
      ],
      toolbarActions: [
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ]
    });
  }

  if (child.key === "mappingHistory") {
    return createConfig({
      title: "MAPPING履历",
      description: child.description,
      filters: [
        { key: "mappingId", label: "MAPPING ID", type: "text", placeholder: "请输入", matchFields: ["mappingId"] },
        { key: "pid", label: "PID", type: "text", placeholder: "请输入", matchFields: ["pid"] },
        {
          key: "semiProduct",
          label: "半成品",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部", value: "all" },
            { label: "B90线路板贴片组件", value: "B90线路板贴片组件" }
          ],
          matchField: "semiProductName"
        },
        {
          key: "createdDate",
          label: "创建时间",
          type: "daterange",
          startKey: "createdStart",
          endKey: "createdEnd",
          matchFieldStart: "operateDate",
          matchFieldEnd: "operateDate"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "mappingId", label: "MAPPING ID" },
        { key: "pid", label: "PID" },
        { key: "semiProductCode", label: "半成品编号" },
        { key: "semiProductName", label: "半成品名称" },
        { key: "operateDate", label: "操作日期" }
      ],
      rows: [
        { id: "MAP-001", mappingId: "EDIJ2024030501173", pid: "EDIJ2024030400987", semiProductCode: "21213211005", semiProductName: "B90线路板贴片组件", operateDate: "2024-03-05 10:09:03" },
        { id: "MAP-002", mappingId: "EDIJ2024030501173", pid: "EDIJ2024030400985", semiProductCode: "21213211005", semiProductName: "B90线路板贴片组件", operateDate: "2024-03-05 10:09:03" },
        { id: "MAP-003", mappingId: "EDIJ2024030501173", pid: "EDIJ2024030400983", semiProductCode: "21213211005", semiProductName: "B90线路板贴片组件", operateDate: "2024-03-05 10:09:03" }
      ],
      toolbarActions: [
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ]
    });
  }

  return createConfig({
    title: "维修履历",
    description: child.description,
    filters: [
      { key: "pid", label: "PID", type: "text", placeholder: "请输入", matchFields: ["pid"] },
      {
        key: "workOrder",
        label: "工单号",
        type: "select",
        placeholder: "请选择",
        options: [
          { label: "全部工单", value: "all" },
          { label: "GD2508141543224497", value: "GD2508141543224497" },
          { label: "GD2506301846027736", value: "GD2506301846027736" }
        ],
        matchField: "workOrder"
      },
      { key: "stationName", label: "工位名称", type: "text", placeholder: "请输入", matchFields: ["stationName"] },
      {
        key: "timeRange",
        label: "时间",
        type: "daterange",
        startKey: "repairStart",
        endKey: "repairEnd",
        matchFieldStart: "updatedAt",
        matchFieldEnd: "updatedAt"
      }
    ],
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "pid", label: "PID" },
      { key: "productCode", label: "产品编号" },
      { key: "productName", label: "产品名称" },
      { key: "workOrder", label: "工单编号" },
      { key: "lineName", label: "线体名称" },
      { key: "procedureName", label: "工序名称" },
      { key: "stationName", label: "工位名称" },
      { key: "operator", label: "操作人" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows: [
      { id: "RP-001", pid: "33122081013-250815-...", productCode: "23122081001", productName: "蔚来Fy控制板线...", workOrder: "GD2508141543224497", lineName: "SMT A线", procedureName: "SMT-炉后AOI", stationName: "SMT炉后AOI工位", operator: "ZX(ZX)" },
      { id: "RP-002", pid: "31324151052-250701-...", productCode: "21324151002", productName: "N72线路板贴片...", workOrder: "GD2506301846027736", lineName: "SMT A线", procedureName: "SPI检测", stationName: "SPI工位", operator: "罗柳(luo)" },
      { id: "RP-003", pid: "33122061018-250622-...", productCode: "23122061001", productName: "X02控制板线路...", workOrder: "GD2506211606583386", lineName: "SMT A线", procedureName: "SMT-炉后AOI", stationName: "SMT炉后AOI工位", operator: "罗柳(luo)" }
    ],
    rowActions: [
      { key: "repairDetail", label: "维修详情", tone: "primary" }
    ],
    toolbarActions: [
      { key: "refresh", label: "刷新", tone: "ghost" },
      { key: "save", label: "保存配置", tone: "ghost" }
    ]
  });
}

function buildReportConfig(child) {
  const toolbarActions = [
    { key: "export", label: "导出", tone: "secondary" },
    { key: "refresh", label: "刷新", tone: "ghost" },
    { key: "save", label: "保存配置", tone: "ghost" }
  ];

  const reportMap = {
    reportsProgress: createConfig({
      title: "生产进度统计",
      description: child.description,
      stats: [
        { label: "计划产量", value: "2194245" },
        { label: "实际产量", value: "691556" },
        { label: "在制品数量", value: "67600" },
        { label: "合格率", value: "8.18%" },
        { label: "完成率", value: "31.52%" }
      ],
      filters: [
        { key: "orderNo", label: "生产工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] },
        {
          key: "product",
          label: "产品名称",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部产品", value: "all" },
            { label: "B11增程式（出口）", value: "B11增程式（出口）" },
            { label: "TC11增程式双温控器", value: "TC11增程式双温控器" }
          ],
          matchField: "productName"
        },
        {
          key: "planDate",
          label: "计划开始日期",
          type: "daterange",
          startKey: "planDateStart",
          endKey: "planDateEnd",
          matchFieldStart: "planStart",
          matchFieldEnd: "planDelivery"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "生产工单号" },
        { key: "productCode", label: "产品编号" },
        { key: "productName", label: "产品名称" },
        { key: "line", label: "所属线体" },
        { key: "planQty", label: "计划数量" },
        { key: "actualQty", label: "实际产量" },
        { key: "passRate", label: "合格率" },
        { key: "planStart", label: "计划开始" },
        { key: "actualStart", label: "实际开始" },
        { key: "planDelivery", label: "计划交期" }
      ],
      rows: [
        { id: "PG-001", orderNo: "GD2604171025017566", productCode: "2231918G002", productName: "B11增程式（出口）", line: "SMT A线", planQty: "2,500", actualQty: "0", passRate: "0%", planStart: "2026-04-17", actualStart: "2026-04-17", planDelivery: "2026-04-24" },
        { id: "PG-002", orderNo: "GD26041617300125543", productCode: "12323881002", productName: "TC11增程式双温控器", line: "组装A线-控制模组", planQty: "300", actualQty: "1,549", passRate: "78.67%", planStart: "2026-04-30", actualStart: "2026-04-16", planDelivery: "2026-04-30" },
        { id: "PG-003", orderNo: "GD2604161730033824", productCode: "2231918G001", productName: "B11增程式（出口）", line: "DIP A线", planQty: "300", actualQty: "2,032", passRate: "0%", planStart: "2026-04-30", actualStart: "2026-04-16", planDelivery: "2026-04-30" }
      ],
      toolbarActions
    }),
    reportsStatus: createConfig({
      title: "生产状态统计",
      description: child.description,
      stats: [
        { label: "总工单数量", value: "2319" },
        { label: "已完成", value: "2135" },
        { label: "进行中", value: "149" },
        { label: "未开始", value: "4" }
      ],
      filters: [
        { key: "orderNo", label: "生产工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] },
        {
          key: "deliveryDate",
          label: "计划交期",
          type: "daterange",
          startKey: "deliveryStart",
          endKey: "deliveryEnd",
          matchFieldStart: "planDelivery",
          matchFieldEnd: "planDelivery"
        },
        {
          key: "status",
          label: "生产状态",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部状态", value: "all" },
            { label: "已完成", value: "已完成" },
            { label: "进行中", value: "进行中" },
            { label: "未开始", value: "未开始" }
          ],
          matchField: "status"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "生产工单号" },
        { key: "productCode", label: "产品编号" },
        { key: "productName", label: "产品名称" },
        { key: "line", label: "所属线体" },
        { key: "planQty", label: "计划数量" },
        { key: "actualQty", label: "实际产量" },
        { key: "planStart", label: "计划开始" },
        { key: "actualStart", label: "实际开始" },
        { key: "planDelivery", label: "计划交期" },
        { key: "status", label: "实际状态" }
      ],
      rows: [
        { id: "PS-001", orderNo: "GD2604171025017566", productCode: "2231918G002", productName: "B11增程式（出口）", line: "SMT A线", planQty: "2,500", actualQty: "0", planStart: "2026-04-17", actualStart: "2026-04-17", planDelivery: "2026-04-24", status: "进行中" },
        { id: "PS-002", orderNo: "GD26041617300125543", productCode: "12323881002", productName: "TC11增程式双温控器", line: "组装A线-控制模组", planQty: "300", actualQty: "1,549", planStart: "2026-04-30", actualStart: "2026-04-16", planDelivery: "2026-04-30", status: "已完成" },
        { id: "PS-003", orderNo: "GD2604161730033824", productCode: "2231918G001", productName: "B11增程式（出口）", line: "DIP A线", planQty: "300", actualQty: "0", planStart: "2026-04-30", actualStart: "2026-04-16", planDelivery: "2026-04-30", status: "未开始" }
      ],
      toolbarActions
    }),
    reportsException: createConfig({
      title: "异常提报统计",
      description: child.description,
      stats: [
        { label: "异常数量", value: "3" },
        { label: "已处理", value: "3" },
        { label: "待处理", value: "0" },
        { label: "已延期", value: "0" }
      ],
      filters: [
        { key: "orderNo", label: "生产工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] },
        {
          key: "createdDate",
          label: "创建时间",
          type: "daterange",
          startKey: "createdStart",
          endKey: "createdEnd",
          matchFieldStart: "createdAt",
          matchFieldEnd: "createdAt"
        },
        {
          key: "exceptionType",
          label: "异常类型",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部类型", value: "all" },
            { label: "质量", value: "质量" },
            { label: "设备", value: "设备" }
          ],
          matchField: "exceptionType"
        },
        {
          key: "exceptionStatus",
          label: "异常状态",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部状态", value: "all" },
            { label: "已处理", value: "已处理" },
            { label: "待处理", value: "待处理" },
            { label: "已延期", value: "已延期" }
          ],
          matchField: "status"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "orderNo", label: "生产工单号" },
        { key: "exceptionType", label: "异常类型" },
        { key: "line", label: "所属线体" },
        { key: "station", label: "工位" },
        { key: "description", label: "异常描述" },
        { key: "image", label: "异常图片", type: "link" },
        { key: "owner", label: "责任人" },
        { key: "processNote", label: "处理描述" },
        { key: "reporter", label: "提报人" },
        { key: "createdAt", label: "创建时间" }
      ],
      rows: [
        { id: "RE-001", orderNo: "GD26041617300125543", exceptionType: "质量", line: "SMT A线", station: "上板工位", description: "贴装位置偏移", image: "查看图片", owner: "马晓峰,汉鑫-胡...", processNote: "已调整程序参数", reporter: "汉鑫-胡永洁(hubj)", status: "已处理", createdAt: "2024-09-21 11:09:12" },
        { id: "RE-002", orderNo: "GD2604161730033824", exceptionType: "质量", line: "SMT A线", station: "贴片02工位", description: "元件少件", image: "查看图片", owner: "马晓峰,汉鑫-胡...", processNote: "补料完成", reporter: "汉鑫-胡永洁(hubj)", status: "已处理", createdAt: "2024-07-16 11:21:37" },
        { id: "RE-003", orderNo: "GD2604161730033824", exceptionType: "质量", line: "组装A线", station: "锡膏管理柜工位", description: "锡膏状态异常", image: "查看图片", owner: "朱义鹏,马晓峰...", processNote: "已闭环", reporter: "汉鑫-胡永洁(hubj)", status: "已处理", createdAt: "2024-06-07 09:57:17" }
      ],
      toolbarActions
    }),
    reportsProductQuantity: createConfig({
      title: "生产产品数量",
      description: child.description,
      filters: [
        {
          key: "productName",
          label: "产品名称",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部产品", value: "all" },
            { label: "骏乐6KW-PTC控制器", value: "骏乐6KW-PTC控制器" },
            { label: "D16域控制器", value: "D16域控制器" }
          ],
          matchField: "productName"
        },
        {
          key: "actualStart",
          label: "实际开始时间",
          type: "daterange",
          startKey: "actualStartBegin",
          endKey: "actualStartEnd",
          matchFieldStart: "actualStart",
          matchFieldEnd: "actualStart"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "productCode", label: "产品编号" },
        { key: "productName", label: "产品名称" },
        { key: "quantity", label: "数量" }
      ],
      rows: [
        { id: "PQ-001", productCode: "1312101K001", productName: "骏乐6KW-PTC控制器", quantity: "12", actualStart: "2026-04-17" },
        { id: "PQ-002", productCode: "12225072001", productName: "D16域控制器", quantity: "21", actualStart: "2026-04-16" },
        { id: "PQ-003", productCode: "21315026002", productName: "M4轻卡电动24V-线路板贴片完成组件", quantity: "1,920", actualStart: "2026-04-16" },
        { id: "PQ-004", productCode: "21115023002", productName: "M4轻卡/中卡手动24V线路板贴片完成组件", quantity: "600", actualStart: "2026-04-16" },
        { id: "PQ-005", productCode: "21115021006", productName: "M4轻卡手动12V线路板贴片完成组件", quantity: "300", actualStart: "2026-04-16" }
      ],
      toolbarActions
    })
  };

  return reportMap[child.routeName];
}

function buildApprovalConfig(child) {
  if (child.key === "approvalGroup") {
    return createConfig({
      title: child.label,
      description: child.description,
      filters: [
        {
          key: "approvalType",
          label: "审批类型",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部类型", value: "all" },
            { label: "生产计划审批", value: "生产计划审批" },
            { label: "质量异常审批", value: "质量异常审批" }
          ],
          matchField: "approvalType"
        },
        {
          key: "keyword",
          label: "名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["name"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "名称" },
        { key: "approvalMode", label: "审批模式" },
        { key: "approvalType", label: "审批类型" },
        { key: "operator", label: "操作人" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "AG-001", name: "计划审批A组", approvalMode: "逐级审批", approvalType: "生产计划审批", operator: "汉鑫-胡永洁(hubj)", createdAt: "2024-09-19 17:26:51" }
      ],
      rowActions: [
        { key: "approvalMembers", label: "审批人详情", tone: "primary" },
        { key: "ccMembers", label: "抄送人详情", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    });
  }

  const statusOptions =
    child.key === "approvalStarted"
      ? [
          { label: "全部", value: "all" },
          { label: "待审批", value: "待审批" },
          { label: "已通过", value: "已通过" },
          { label: "已驳回", value: "已驳回" }
        ]
      : [
          { label: "全部", value: "all" },
          { label: "待审批", value: "待审批" },
          { label: "已处理", value: "已处理" },
          { label: "已阅", value: "已阅" }
        ];

  const rows = [
    { id: `${child.routeName}-1`, approvalType: "工单变更", taskName: "WO-260418-001 数量调整", submitter: "张强", status: "待审批", updatedAt: timestamps[0] },
    { id: `${child.routeName}-2`, approvalType: "设备延期", taskName: "回流焊炉保养延期", submitter: "马俊", status: child.key === "approvalCopied" ? "已阅" : "已通过", updatedAt: timestamps[1] },
    { id: `${child.routeName}-3`, approvalType: "让步接收", taskName: "连接器色差让步接收", submitter: "韩梅", status: child.key === "approvalReceived" ? "待审批" : "已驳回", updatedAt: timestamps[2] }
  ];

  return createConfig({
    title: child.label,
    description: child.description,
    filters: [
      {
        key: "keyword",
        label: "审批任务名称",
        type: "text",
        placeholder: "请输入",
        matchFields: ["approvalType", "taskName", "submitter"]
      },
      {
        key: "status",
        label: "状态",
        type: "select",
        placeholder: "请选择",
        options: statusOptions,
        matchField: "status"
      }
    ],
    columns: [
      { key: "__index", label: "序号", type: "index" },
      { key: "approvalType", label: "审批类型" },
      { key: "taskName", label: "审批任务名称" },
      { key: "submitter", label: "提交人" },
      { key: "status", label: "审批状态", type: "status" },
      { key: "updatedAt", label: "提交时间" },
      { key: "__actions", label: "操作", type: "actions" }
    ],
    rows,
    rowActions:
      child.key === "approvalReceived"
        ? [
            { key: "approve", label: "通过", tone: "primary" },
            { key: "reject", label: "驳回", tone: "danger" },
            { key: "view", label: "查看", tone: "primary" }
          ]
        : [
            { key: "view", label: "查看", tone: "primary" },
            { key: "remind", label: "催办", tone: "primary" },
            { key: "delete", label: "删除", tone: "danger" }
          ]
  });
}

function buildSettingsConfig(child) {
  const commonFilters = standardFilters("名称");

  const settingsMap = {
    settingsUser: createConfig({
      title: "用户管理",
      description: child.description,
      modalEntity: "用户",
      modalVariant: "floating-form",
      filters: [
        {
          key: "keyword",
          label: "用户名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["realName", "phone", "account", "roleName", "operator"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "realName", label: "真实姓名" },
        { key: "phone", label: "手机号" },
        { key: "account", label: "登录账户" },
        { key: "roleName", label: "角色名称" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "U-001", realName: "ZX", phone: "15005555893", account: "ZX", roleName: "系统管理员", operator: "黄磊(HL)", updatedAt: timestamps[0], status: "启用" },
        { id: "U-002", realName: "黄磊", phone: "18694557053", account: "HL", roleName: "系统管理员", operator: "罗柳(luo)", updatedAt: timestamps[1], status: "启用" },
        { id: "U-003", realName: "SMT", phone: "13312312311", account: "SMT01", roleName: "操作员", operator: "罗柳(luo)", updatedAt: timestamps[2], status: "停用" },
        { id: "U-004", realName: "刘晓华", phone: "19118558698", account: "liuxh", roleName: "计划员", operator: "朱义鹏(zyp)", updatedAt: timestamps[3], status: "启用" },
        { id: "U-005", realName: "张磊", phone: "15106565889", account: "zl", roleName: "质量工程师", operator: "胡永洁(hubj)", updatedAt: timestamps[4], status: "启用" }
      ],
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "resetPassword", label: "重置密码", tone: "primary" },
        { key: "toggleStatus", label: "禁用用户", tone: "danger" },
        { key: "delete", label: "删除", tone: "danger" }
      ],
      formFields: [
        { key: "account", label: "账号", type: "text", placeholder: "请输入", required: true },
        {
          key: "password",
          label: "密码",
          type: "password",
          placeholder: "请输入",
          required: true,
          requiredModes: ["add"]
        },
        { key: "phone", label: "手机号", type: "text", placeholder: "请输入", required: true },
        {
          key: "roleName",
          label: "角色名称",
          type: "select",
          placeholder: "请选择",
          required: true,
          options: [
            { label: "请选择", value: "" },
            { label: "系统管理员", value: "系统管理员" },
            { label: "计划员", value: "计划员" },
            { label: "质量工程师", value: "质量工程师" },
            { label: "操作员", value: "操作员" },
            { label: "普通用户", value: "普通用户" }
          ]
        },
        { key: "realName", label: "真实姓名", type: "text", placeholder: "请输入", required: true }
      ],
      addFactory: ({ keyword }) => ({
        id: `U-${String(Date.now()).slice(-4)}`,
        realName: keyword || "新用户",
        phone: "13800000000",
        account: `user${String(Date.now()).slice(-4)}`,
        roleName: "普通用户",
        operator: "当前用户",
        updatedAt: timestamps[0],
        status: "启用"
      })
    }),
    settingsRole: createConfig({
      title: "角色管理",
      description: child.description,
      filters: [
        {
          key: "keyword",
          label: "角色名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["roleName"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "roleName", label: "角色名称" },
        { key: "isSuperAdmin", label: "超级管理员" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "R-001", roleName: "超级管理员", isSuperAdmin: "是", operator: "易蓝(易蓝科技02)", updatedAt: "2026-03-19 11:13:48", createdAt: "2024-07-04 17:16:06" },
        { id: "R-002", roleName: "用户角色", isSuperAdmin: "否", operator: "朱义鹏(zyp)", updatedAt: "2026-03-19 11:13:48", createdAt: "2024-09-19 16:22:00" }
      ],
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "menuPermission", label: "菜单权限", tone: "primary" },
        { key: "pdaPermission", label: "PDA菜单权限", tone: "primary" },
        { key: "buttonPermission", label: "菜单操作权限", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    }),
    settingsMenu: createConfig({
      title: "菜单管理",
      description: child.description,
      filters: [
        {
          key: "keyword",
          label: "菜单名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["name"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "菜单名称" },
        { key: "icon", label: "图标" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "M-001", name: "生产配置", icon: "🏭", operator: "肖永辉(100000003)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:34:45" },
        { id: "M-002", name: "客户管理", icon: "📁", operator: "肖永辉(100000003)", updatedAt: "2026-03-19 11:18:37", createdAt: "2024-04-16 15:33:28" },
        { id: "M-003", name: "工艺管理", icon: "📷", operator: "肖永辉(100000003)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:39:54" },
        { id: "M-004", name: "条码管理", icon: "▥", operator: "肖永辉(100000003)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:52:23" },
        { id: "M-005", name: "生产管理", icon: "💻", operator: "肖永辉(100000003)", updatedAt: "2026-03-19 11:18:36", createdAt: "2024-03-29 16:44:14" }
      ],
      toolbarActions: [
        { key: "menuSort", label: "菜单排序", tone: "primary" },
        { key: "add", label: "新增", tone: "primary" },
        { key: "refresh", label: "刷新", tone: "ghost" },
        { key: "save", label: "保存配置", tone: "ghost" }
      ],
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "submenu", label: "子菜单", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    }),
    settingsPdaMenu: createConfig({
      title: "PDA菜单",
      description: child.description,
      filters: [
        {
          key: "keyword",
          label: "菜单名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["name", "path"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "菜单名称" },
        { key: "path", label: "菜单路径" },
        { key: "sort", label: "菜单排序" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "PDA-001", name: "生产管理", path: ".", sort: "0", operator: "H。(100000006)", updatedAt: "2024-03-02 08:37:25", createdAt: "2018-01-01 08:00:00" },
        { id: "PDA-002", name: "仓库管理", path: ".", sort: "0", operator: "H。(100000006)", updatedAt: "2024-03-01 16:28:33", createdAt: "2024-03-01 16:28:33" },
        { id: "PDA-003", name: "生产配置", path: ".", sort: "1", operator: "肖永辉(100000003)", updatedAt: "2024-01-16 15:41:49", createdAt: "2018-01-01 08:00:00" },
        { id: "PDA-004", name: "工艺管理", path: ".", sort: "2", operator: "肖永辉(100000003)", updatedAt: "2024-01-10 09:13:26", createdAt: "2018-01-01 08:00:00" }
      ],
      rowActions: [
        { key: "submenu", label: "子菜单", tone: "primary" }
      ]
    }),
    settingsPadMenu: createConfig({
      title: "PAD菜单",
      description: child.description,
      filters: [
        {
          key: "keyword",
          label: "菜单名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["name", "path"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "菜单名称" },
        { key: "path", label: "菜单路径" },
        { key: "sort", label: "菜单排序" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "PAD-001", name: "生产管理", path: "", sort: "0", operator: "王伟利(100000005)", updatedAt: "", createdAt: "2024-05-18 01:14:44" },
        { id: "PAD-002", name: "工艺管理", path: "", sort: "0", operator: "王伟利(100000005)", updatedAt: "2024-05-22 07:19:08", createdAt: "2024-05-22 07:18:50" },
        { id: "PAD-003", name: "文档管理", path: "", sort: "0", operator: "王伟利(100000005)", updatedAt: "", createdAt: "2024-05-22 09:33:48" },
        { id: "PAD-004", name: "设备管理", path: "", sort: "0", operator: "王伟利(100000005)", updatedAt: "", createdAt: "2024-06-20 10:53:55" }
      ],
      rowActions: [
        { key: "submenu", label: "子菜单", tone: "primary" }
      ]
    }),
    settingsDictionary: createConfig({
      title: "字典管理",
      description: child.description,
      filters: [
        {
          key: "type",
          label: "类型",
          type: "select",
          placeholder: "请选择",
          options: [
            { label: "全部类型", value: "all" },
            { label: "报废类型", value: "报废类型" },
            { label: "异常提报统计-异常类型", value: "异常提报统计-异常类型" },
            { label: "线体类型", value: "线体类型" }
          ],
          matchField: "name"
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "名称" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "D-001", name: "报废类型", operator: "朱义鹏(zyp)", updatedAt: "2024-09-21 11:09:12", createdAt: "2024-09-21 11:09:12" },
        { id: "D-002", name: "异常提报统计-异常类型", operator: "员工A(100000004)", updatedAt: "", createdAt: "2024-07-16 11:21:37" },
        { id: "D-003", name: "线体类型", operator: "员工A(100000004)", updatedAt: "", createdAt: "2024-07-16 11:21:37" },
        { id: "D-004", name: "待定", operator: "员工A(100000004)", updatedAt: "2024-06-07 09:57:17", createdAt: "2024-06-07 09:56:32" }
      ],
      rowActions: [
        { key: "addChild", label: "新增", tone: "primary" },
        { key: "edit", label: "修改", tone: "primary" }
      ]
    }),
    settingsPrinter: createConfig({
      title: "打印机管理",
      description: child.description,
      filters: [
        {
          key: "keyword",
          label: "打印机名称",
          type: "text",
          placeholder: "请输入",
          matchFields: ["name"]
        },
        {
          key: "ipKeyword",
          label: "打印机IP",
          type: "text",
          placeholder: "请输入",
          matchFields: ["ip"]
        }
      ],
      columns: [
        { key: "__index", label: "序号", type: "index" },
        { key: "name", label: "打印机名称" },
        { key: "ip", label: "IP地址" },
        { key: "operator", label: "操作人" },
        { key: "updatedAt", label: "修改时间" },
        { key: "createdAt", label: "创建时间" },
        { key: "__actions", label: "操作", type: "actions" }
      ],
      rows: [
        { id: "PR-001", name: "打印机1", ip: "192.168.0.102:9100", operator: "易蓝科技(易蓝3)", updatedAt: "2024-09-11 10:13:01", createdAt: "2024-09-11 10:11:36" },
        { id: "PR-002", name: "域控组装打印机", ip: "192.168.12.153:9100", operator: "易蓝(易蓝科技02)", updatedAt: "2026-03-12 19:46:29", createdAt: "2024-09-19 11:06:03" },
        { id: "PR-003", name: "烧录", ip: "192.168.12.58:9100", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2025-04-29 14:47:56", createdAt: "2024-11-06 14:09:15" },
        { id: "PR-004", name: "锁螺丝", ip: "192.168.12.56:9100", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2025-04-28 16:09:32", createdAt: "2024-11-06 18:09:26" }
      ],
      rowActions: [
        { key: "edit", label: "修改", tone: "primary" },
        { key: "delete", label: "删除", tone: "danger" }
      ]
    }),
    settingsGlobal: createConfig({
      title: "全局设置",
      description: child.description,
      mode: "settings-panel",
      filters: [],
      columns: [],
      panels: [
        {
          key: "upload",
          label: "文件上传",
          fields: [
            { key: "logo", label: "系统Logo", type: "upload", value: "logo.png" }
          ]
        },
        {
          key: "project",
          label: "项目设置",
          fields: [
            { key: "slogan", label: "Slogan", type: "text", value: "一站式数字化工厂解决方案" }
          ]
        },
        {
          key: "broadcast",
          label: "播报设置",
          fields: [
            { key: "voiceMode", label: "播报模式", type: "text", value: "实时播报" }
          ]
        }
      ],
      rows: [],
      toolbarActions: [
        { key: "confirmPanel", label: "确定", tone: "primary" }
      ]
    })
  };

  return settingsMap[child.routeName];
}

function getConfigForChild(child, parent) {
  switch (child.routeName) {
    case "productionConfigWorkshop":
      return createConfig({
        title: "车间管理",
        description: child.description,
        filters: [
          { key: "workshopName", label: "车间名称", type: "text", placeholder: "请输入", matchFields: ["workshopName"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "workshopName", label: "车间名称" },
          { key: "location", label: "车间位置" },
          { key: "descriptionText", label: "车间描述" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "WS-001", workshopName: "组装车间", location: "二楼", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:44:09", createdAt: "2024-09-19 14:44:09" },
          { id: "WS-002", workshopName: "焊接车间", location: "二号楼一楼", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:48:56", createdAt: "2024-09-19 14:48:56" },
          { id: "WS-003", workshopName: "SMT车间", location: "二号楼一楼", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:48:30", createdAt: "2024-09-19 14:48:30" }
        ],
        formFields: [
          { key: "workshopName", label: "车间名称", type: "text" },
          { key: "location", label: "车间位置", type: "text" },
          { key: "descriptionText", label: "车间描述", type: "textarea" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "lineDetail", label: "产线明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "productionConfigLine":
      return createConfig({
        title: "产线管理",
        description: child.description,
        filters: [
          {
            key: "workshop",
            label: "所属车间",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "全部车间", value: "all" },
              { label: "组装车间", value: "组装车间" },
              { label: "焊接车间", value: "焊接车间" },
              { label: "SMT车间", value: "SMT车间" }
            ],
            matchField: "workshop"
          },
          { key: "lineName", label: "产线名称", type: "text", placeholder: "请输入", matchFields: ["lineName"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "lineName", label: "产线名称" },
          { key: "workshop", label: "所属车间" },
          { key: "descriptionText", label: "产线描述" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "LINE-001", lineName: "组装产线", workshop: "组装车间", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:47:29", createdAt: "2024-09-19 14:47:29" },
          { id: "LINE-002", lineName: "波峰焊产线", workshop: "焊接车间", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:50:25", createdAt: "2024-09-19 14:50:25" },
          { id: "LINE-003", lineName: "SMT产线", workshop: "SMT车间", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 14:47:20", createdAt: "2024-09-19 14:47:20" }
        ],
        formFields: [
          { key: "lineName", label: "产线名称", type: "text" },
          {
            key: "workshop",
            label: "所属车间",
            type: "select",
            options: [
              { label: "组装车间", value: "组装车间" },
              { label: "焊接车间", value: "焊接车间" },
              { label: "SMT车间", value: "SMT车间" }
            ]
          },
          { key: "descriptionText", label: "产线描述", type: "textarea" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "cellDetail", label: "线体明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "productionConfigCell":
      return createConfig({
        title: "线体管理",
        description: child.description,
        filters: [
          {
            key: "line",
            label: "所属产线",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "全部产线", value: "all" },
              { label: "组装产线", value: "组装产线" },
              { label: "SMT产线", value: "SMT产线" },
              { label: "波峰焊产线", value: "波峰焊产线" }
            ],
            matchField: "line"
          },
          { key: "cellName", label: "线体名称", type: "text", placeholder: "请输入", matchFields: ["cellName"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "cellName", label: "线体名称" },
          { key: "line", label: "所属产线" },
          { key: "descriptionText", label: "线体描述" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "CELL-001", cellName: "域控产线", line: "组装产线", descriptionText: "", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-15 20:16:24", createdAt: "2026-01-15 20:16:24" },
          { id: "CELL-002", cellName: "组装A线-控制模...", line: "组装产线", descriptionText: "", operator: "马晓峰(mxz)", updatedAt: "2024-11-11 08:31:37", createdAt: "2024-11-11 08:31:37" },
          { id: "CELL-003", cellName: "SMT A线", line: "SMT产线", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 15:12:37", createdAt: "2024-09-19 15:12:37" }
        ],
        formFields: [
          { key: "cellName", label: "线体名称", type: "text" },
          {
            key: "line",
            label: "所属产线",
            type: "select",
            options: [
              { label: "组装产线", value: "组装产线" },
              { label: "SMT产线", value: "SMT产线" },
              { label: "波峰焊产线", value: "波峰焊产线" }
            ]
          },
          { key: "descriptionText", label: "线体描述", type: "textarea" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "stationDetail", label: "工位明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "productionConfigStation":
      return createConfig({
        title: "工位管理",
        description: child.description,
        filters: [
          {
            key: "cell",
            label: "所属线体",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "全部线体", value: "all" },
              { label: "域控产线", value: "域控产线" },
              { label: "SMT A线", value: "SMT A线" }
            ],
            matchField: "cell"
          },
          { key: "stationName", label: "工位名称", type: "text", placeholder: "请输入", matchFields: ["stationName"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "stationName", label: "工位名称" },
          { key: "cell", label: "所属线体" },
          { key: "descriptionText", label: "工位描述" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "ST-001", stationName: "FCT工位", cell: "域控产线", descriptionText: "", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-15 20:16:24", createdAt: "2026-01-15 20:16:24" },
          { id: "ST-002", stationName: "锡膏印刷 / 印刷机工位", cell: "SMT A线", descriptionText: "", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-19 15:12:37", createdAt: "2024-09-19 15:12:37" }
        ],
        formFields: [
          { key: "stationName", label: "工位名称", type: "text" },
          {
            key: "cell",
            label: "所属线体",
            type: "select",
            options: [
              { label: "域控产线", value: "域控产线" },
              { label: "SMT A线", value: "SMT A线" }
            ]
          },
          { key: "descriptionText", label: "工位描述", type: "textarea" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "productionConfigShift":
      return createConfig({
        title: "班别管理",
        description: child.description,
        filters: [
          { key: "shiftName", label: "班别名称", type: "text", placeholder: "请输入", matchFields: ["shiftName"] }
        ],
        toolbarActions: [
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "shiftName", label: "班别名称" },
          { key: "workTime", label: "工作时间" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "SHIFT-001", shiftName: "夜班", workTime: "16:00-00:00", operator: "易蓝科技(易蓝3)", updatedAt: "2024-09-20 09:05:57", createdAt: "2024-07-19 15:19:44" },
          { id: "SHIFT-002", shiftName: "白班", workTime: "08:00-16:00", operator: "易蓝科技(100000156)", updatedAt: "2024-09-20 09:05:05", createdAt: "2024-07-02 14:37:51" }
        ],
        formFields: [
          { key: "shiftName", label: "班别名称", type: "text" },
          { key: "startTime", label: "上班时间", type: "time" },
          { key: "endTime", label: "下班时间", type: "time" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" }
        ]
      });
    case "productionConfigCalendar":
      return createConfig({
        title: "工作日历",
        description: child.description,
        mode: "calendar",
        filters: [],
        columns: [],
        rows: [],
        calendar: {
          year: 2026,
          month: 4
        }
      });
    case "productionPlan":
      return createConfig({
        title: "计划管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "plan",
            title: "计划管理",
            items: [
              { key: "deliveryPlan", routeName: "deliveryPlan", label: "发货计划" },
              { key: "productionPlanInner", routeName: "productionPlanDetail", label: "生产计划" },
              { key: "planChange", routeName: "productionPlanChangeDetail", label: "计划变更明细" }
            ]
          }
        ]
      });
    case "productionWorkOrder":
      return createConfig({
        title: "工单管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "work-order",
            title: "工单管理",
            items: [
              { key: "dispatchWork", routeName: "dispatchWork", label: "生产派工" },
              { key: "executionView", routeName: "executionView", label: "执行现况" },
              { key: "reportManage", routeName: "reportManage", label: "报工管理" }
            ]
          }
        ]
      });
    case "productionPid":
      return createConfig({
        title: "PID管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "pid",
            title: "PID管理",
            items: [
              { key: "pidList", routeName: "pidList", label: "PID列表" },
              { key: "pidPrint", routeName: "pidPrint", label: "PID打印" }
            ]
          }
        ]
      });
    case "productionEngineering":
      return createConfig({
        title: "工程管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "engineering",
            title: "工程管理",
            items: [
              { key: "stationPass", routeName: "stationPass", label: "过站管理" },
              { key: "lotCompose", routeName: "lotCompose", label: "LOT构成" },
              { key: "mappingCompose", routeName: "mappingCompose", label: "Mapping" }
            ]
          }
        ]
      });
    case "productionException":
      return createConfig({
        title: "异常管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "exception",
            title: "异常管理",
            items: [
              { key: "exceptionReport", routeName: "exceptionReport", label: "异常上报" },
              { key: "exceptionAssign", routeName: "exceptionAssign", label: "异常指派" },
              { key: "exceptionHandle", routeName: "exceptionHandle", label: "异常处理" },
              { key: "exceptionOwner", routeName: "exceptionOwner", label: "责任人管理" }
            ]
          }
        ]
      });
    case "productionRepair":
      return createConfig({
        title: "产品维修",
        description: child.description,
        filters: [
          {
            key: "defectType",
            label: "不良类型",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "全部类型", value: "all" },
              { label: "焊接不良", value: "焊接不良" },
              { label: "功能异常", value: "功能异常" }
            ],
            matchField: "defectType"
          },
          { key: "pid", label: "PID", type: "text", placeholder: "请输入", matchFields: ["pid"] }
        ],
        columns: [
          { key: "productCode", label: "产品编号" },
          { key: "productName", label: "产品名称" },
          { key: "procedureName", label: "工序名称" },
          { key: "stationName", label: "所属工位" },
          { key: "defectType", label: "不良类型" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [],
        toolbarActions: [
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ]
      });
    case "productionInventory":
      return createConfig({
        title: "生产库存",
        description: child.description,
        filters: [
          { key: "orderNo", label: "工单号", type: "text", placeholder: "请输入", matchFields: ["orderNo"] },
          {
            key: "inventoryStatus",
            label: "库存状态",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "全部状态", value: "all" },
              { label: "在库", value: "在库" },
              { label: "冻结", value: "冻结" }
            ],
            matchField: "status"
          }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "orderNo", label: "工单号" },
          { key: "materialCode", label: "物料编码" },
          { key: "materialName", label: "物料名称" },
          { key: "quantity", label: "库存数量" },
          { key: "status", label: "状态", type: "status" }
        ],
        rows: [
          { id: "PI-001", orderNo: "WO-260418-001", materialCode: "MAT-001", materialName: "STM32控制芯片", quantity: "8200", status: "在库" },
          { id: "PI-002", orderNo: "WO-260418-002", materialCode: "MAT-017", materialName: "铝电解电容470uF", quantity: "2300", status: "冻结" }
        ]
      });
    case "processMaterial":
      return createConfig({
        title: "物料管理",
        description: child.description,
        filters: [
          { key: "code", label: "编号", type: "text", placeholder: "请输入", matchFields: ["code"] },
          { key: "name", label: "名称", type: "text", placeholder: "请输入", matchFields: ["name"] }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "编号" },
          { key: "name", label: "名称" },
          { key: "category", label: "分类" },
          { key: "minPack", label: "最小包装数" },
          { key: "boardCount", label: "拼板数量" },
          { key: "model", label: "规格型号" },
          { key: "status", label: "状态", type: "status" },
          { key: "operator", label: "操作人" }
        ],
        rows: [
          { id: "MAT-001", code: "32325111007", name: "G117-线路板", category: "原材料", minPack: "1", boardCount: "1", model: "V0.03", status: "启用", operator: "易蓝科技(100000156)" },
          { id: "MAT-002", code: "160349", name: "单片机", category: "原材料", minPack: "1", boardCount: "1", model: "LQFP64 YTM32...", status: "启用", operator: "易蓝科技(100000156)" },
          { id: "MAT-003", code: "160351", name: "贴片集成块", category: "原材料", minPack: "1", boardCount: "1", model: "S0-8 NSD12416...", status: "启用", operator: "易蓝科技(100000156)" }
        ]
      });
    case "processProduct":
      return createConfig({
        title: "产品管理",
        description: child.description,
        filters: [
          { key: "code", label: "编号", type: "text", placeholder: "请输入", matchFields: ["code"] },
          { key: "name", label: "名称", type: "text", placeholder: "请输入", matchFields: ["name"] }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "编号" },
          { key: "name", label: "名称" },
          { key: "category", label: "分类" },
          { key: "minPack", label: "最小包装数" },
          { key: "boardCount", label: "拼板数量" },
          { key: "model", label: "规格型号" },
          { key: "route", label: "工艺路线" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "PROD-001", code: "2121811M002", name: "P203-欧盟-线路板贴片完成组件", category: "自制半成品", minPack: "1", boardCount: "1", model: "", route: "", },
          { id: "PROD-002", code: "21224186002", name: "AJ70-线路板贴片完成组件", category: "自制半成品", minPack: "1", boardCount: "1", model: "", route: "" },
          { id: "PROD-003", code: "3132001D001", name: "E5000-右舱-CK-后盖", category: "自制半成品", minPack: "1", boardCount: "1", model: "", route: "" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "bindRoute", label: "绑定工艺路线", tone: "primary" }
        ]
      });
    case "processProcedure":
      return createConfig({
        title: "工序管理",
        description: child.description,
        filters: [
          { key: "processCode", label: "工序编号", type: "text", placeholder: "请输入", matchFields: ["processCode"] },
          { key: "processName", label: "工序名称", type: "text", placeholder: "请输入", matchFields: ["processName"] }
        ],
        toolbarActions: [
          { key: "deleteSelected", label: "删除", tone: "ghost", disabled: true },
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__select", label: "□", type: "select" },
          { key: "__index", label: "序号", type: "index" },
          { key: "processName", label: "工序名称" },
          { key: "passMode", label: "过站方式" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "PROC-001", processName: "镭雕", passMode: "不读设备数据", operator: "马晓峰(mxz)", updatedAt: "2026-03-30 08:58:08", createdAt: "2026-03-30 08:58:08" },
          { id: "PROC-002", processName: "硅胶垫热贴", passMode: "不读设备数据", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 08:57:31", createdAt: "2026-01-16 08:57:31" },
          { id: "PROC-003", processName: "壳体打胶", passMode: "不读设备数据", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 08:56:47", createdAt: "2026-01-16 08:56:47" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "stationDetail", label: "工位绑定明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "processStep":
      return createConfig({
        title: "工步管理",
        description: child.description,
        filters: [
          {
            key: "station",
            label: "工位",
            type: "select",
            placeholder: "请选择",
            options: [
              { label: "锡膏印刷 / 印刷机工位", value: "锡膏印刷 / 印刷机工位" },
              { label: "FCT工位", value: "FCT工位" }
            ],
            matchField: "station"
          }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "stepCode", label: "工步编号" },
          { key: "keyStep", label: "关键工步" },
          { key: "description", label: "工步描述" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "STEP-001", stepCode: "9021", keyStep: "否", description: "", station: "锡膏印刷 / 印刷机工位", operator: "汉鑫-胡永洁(hubj)", updatedAt: "2024-09-21 08:49:10", createdAt: "2024-09-21 08:49:10" }
        ],
        rowActions: [
          { key: "stepPrint", label: "工步打印", tone: "primary" },
          { key: "edit", label: "修改", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "processRoute":
      return createConfig({
        title: "工艺路线",
        description: child.description,
        filters: [
          { key: "routeName", label: "工艺路线名称", type: "text", placeholder: "请输入", matchFields: ["routeName"] }
        ],
        toolbarActions: [
          { key: "deleteSelected", label: "删除", tone: "ghost", disabled: true },
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__select", label: "□", type: "select" },
          { key: "__index", label: "序号", type: "index" },
          { key: "routeName", label: "工艺路线名称" },
          { key: "line", label: "线体" },
          { key: "lineType", label: "线体类型" },
          { key: "processCount", label: "工序数量" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "ROUTE-001", routeName: "SMT虚拟路线", line: "SMT A线", lineType: "SMT", processCount: "4", operator: "马晓峰(mxz)", updatedAt: "2026-04-02 14:26" },
          { id: "ROUTE-002", routeName: "长安域控组装", line: "域控产线", lineType: "组装", processCount: "10", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 08:22" },
          { id: "ROUTE-003", routeName: "威灵域控组装", line: "域控产线", lineType: "组装", processCount: "8", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-16 08:22" }
        ],
        rowActions: [
          { key: "duplicate", label: "复制", tone: "primary" },
          { key: "edit", label: "修改", tone: "primary" },
          { key: "processDetail", label: "工序明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "processEngineeringBom":
      return createConfig({
        title: "工程BOM",
        description: child.description,
        filters: [
          { key: "code", label: "编号", type: "text", placeholder: "请输入", matchFields: ["code"] },
          { key: "name", label: "名称", type: "text", placeholder: "请输入", matchFields: ["name"] },
          { key: "version", label: "版本号", type: "text", placeholder: "请输入", matchFields: ["version"] }
        ],
        toolbarActions: [
          { key: "import", label: "导入", tone: "primary" },
          { key: "sync", label: "同步", tone: "primary" },
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__expand", label: "›", type: "expand" },
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "编号" },
          { key: "name", label: "名称" },
          { key: "category", label: "分类" },
          { key: "version", label: "版本号" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "BOM-001", code: "2121811M002", name: "P203-欧盟-线路板贴片完成组件", category: "自制半成品", version: "V1.0" },
          { id: "BOM-002", code: "21224186002", name: "AJ70-线路板贴片完成组件", category: "自制半成品", version: "V1.0" },
          { id: "BOM-003", code: "3132001D001", name: "E5000-右舱-CK-后盖", category: "自制半成品", version: "V1.0" }
        ],
        rowActions: [
          { key: "newBom", label: "新增BOM", tone: "primary" }
        ]
      });
    case "processManufacturingBom":
      return createConfig({
        title: "制造BOM（导入料表）",
        description: child.description,
        filters: [
          { key: "code", label: "编号", type: "text", placeholder: "请输入", matchFields: ["code"] },
          { key: "name", label: "名称", type: "text", placeholder: "请输入", matchFields: ["name"] }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "编号" },
          { key: "name", label: "名称" },
          { key: "category", label: "分类" },
          { key: "version", label: "版本号" },
          { key: "operator", label: "操作人" }
        ],
        rows: [
          { id: "MBOM-001", code: "MBOM-001", name: "P203制造BOM", category: "自制半成品", version: "V1.0", operator: "易蓝(易蓝科技02)" },
          { id: "MBOM-002", code: "MBOM-002", name: "AJ70制造BOM", category: "自制半成品", version: "V1.0", operator: "易蓝(易蓝科技02)" }
        ]
      });
    case "processBurning":
      return createConfig({
        title: "烧录管理",
        description: child.description,
        mode: "link-grid",
        filters: [],
        columns: [],
        rows: [],
        groups: [
          {
            key: "burning",
            title: "烧录管理",
            items: [
              { key: "softwareVersion", routeName: "softwareVersion", label: "软件版本" },
              { key: "hardwareVersion", routeName: "hardwareVersion", label: "硬件版本" }
            ]
          }
        ]
      });
    case "processSubstitute":
      return createConfig({
        title: "替代品",
        description: child.description,
        filters: [
          { key: "materialCode", label: "物料编号", type: "text", placeholder: "请输入", matchFields: ["materialCode"] },
          { key: "materialName", label: "物料名称", type: "text", placeholder: "请输入", matchFields: ["materialName"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "materialCode", label: "物料编号" },
          { key: "materialName", label: "物料名称" },
          { key: "substituteCode", label: "替代物料编号" },
          { key: "substituteName", label: "替代物料名称" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "SUB-001", materialCode: "160348", materialName: "多路开关", substituteCode: "160349", substituteName: "备用多路开关", operator: "易蓝(易蓝科技02)", updatedAt: "2025-04-18 11:20:00" },
          { id: "SUB-002", materialCode: "110646", materialName: "贴片电阻", substituteCode: "110647", substituteName: "贴片电阻-备件", operator: "易蓝(易蓝科技02)", updatedAt: "2025-04-18 11:30:00" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "barcodeMaterialRule":
      return createConfig({
        title: "物料条码规则",
        description: child.description,
        filters: [],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "rule", label: "规则" },
          { key: "digits", label: "位数" },
          { key: "value", label: "值" },
          { key: "increment", label: "自增长间隔" },
          { key: "sort", label: "排序" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" }
        ],
        rows: [
          { id: "BMR-001", rule: "年月日", digits: "6", value: "240710", increment: "", sort: "0", operator: "易蓝科技(100000156)", updatedAt: "2024-07-10 09:13:05", createdAt: "2024-07-10 09:13:05" },
          { id: "BMR-002", rule: "产品编号", digits: "12", value: "materialCode", increment: "", sort: "1", operator: "易蓝科技(100000156)", updatedAt: "2024-07-10 09:13:17", createdAt: "2024-07-10 09:13:17" },
          { id: "BMR-003", rule: "自增长十进制数", digits: "3", value: "1", increment: "1", sort: "2", operator: "易蓝科技(100000156)", updatedAt: "2024-07-10 09:14:13", createdAt: "2024-07-10 09:14:13" }
        ],
        toolbarActions: [
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ]
      });
    case "barcodeCustomerRule":
    case "barcodeFinishedRule":
      return createConfig({
        title: child.label,
        description: child.description,
        filters: [],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "ruleName", label: "规则名称" },
          { key: "template", label: "预览模板", type: "link" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: `${child.routeName}-1`, ruleName: child.routeName === "barcodeCustomerRule" ? "6KW平台控制板-..." : "23122081002", template: "预览模板", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-31 10:08:20", createdAt: "2026-01-31 10:08:04" },
          { id: `${child.routeName}-2`, ruleName: child.routeName === "barcodeCustomerRule" ? "福田12V-PTC控..." : "704", template: "预览模板", operator: "易蓝(易蓝科技02)", updatedAt: "2026-01-31 09:57:45", createdAt: "2026-01-31 09:57:30" }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        rowActions: [
          { key: "modifyTemplate", label: "修改模板", tone: "primary" },
          { key: "edit", label: "修改", tone: "primary" },
          { key: "ruleDetail", label: "规则明细", tone: "primary" },
          { key: "productDetail", label: "产品明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "barcodeLotRule":
      return createConfig({
        title: "LOT条码规则",
        description: child.description,
        filters: [],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "ruleName", label: "规则名称" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "LOT-RULE-001", ruleName: "weilai", operator: "崔常凯(dev)", updatedAt: "2025-03-15 11:29:30", createdAt: "2025-03-15 11:25:17" },
          { id: "LOT-RULE-002", ruleName: "测试02", operator: "易蓝科技(100000156)", updatedAt: "2024-07-12 10:38:08", createdAt: "2024-07-12 10:38:08" }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        rowActions: [
          { key: "templateDetail", label: "模板明细", tone: "primary" },
          { key: "edit", label: "修改", tone: "primary" },
          { key: "ruleDetail", label: "规则明细", tone: "primary" },
          { key: "productDetail", label: "产品明细", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
  }

  switch (parent.key) {
    case "productionConfig":
      return buildMasterConfig(child, "归属工厂", ["易蓝工厂", "二号装配厂", "质量中心"]);
    case "customer":
      return createConfig({
        title: "客户定义",
        description: child.description,
        filters: [
          { key: "customerCode", label: "客户编号", type: "text", placeholder: "请输入", matchFields: ["code"] },
          { key: "customerName", label: "客户名称", type: "text", placeholder: "请输入", matchFields: ["name"] }
        ],
        toolbarActions: [
          { key: "add", label: "新增", tone: "primary" },
          { key: "refresh", label: "刷新", tone: "ghost" },
          { key: "save", label: "保存配置", tone: "ghost" }
        ],
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "客户编号" },
          { key: "name", label: "客户名称" },
          { key: "operator", label: "操作人" },
          { key: "updatedAt", label: "修改时间" },
          { key: "createdAt", label: "创建时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: "CUS-001", code: "WL", name: "威灵", operator: "黄磊(HL)", updatedAt: "2025-11-21 18:24:47", createdAt: "2025-11-21 18:24:47" },
          { id: "CUS-002", code: "KBD", name: "科博达", operator: "黄磊(HL)", updatedAt: "2025-09-23 16:11:49", createdAt: "2025-09-23 16:11:49" },
          { id: "CUS-003", code: "吉利", name: "吉利", operator: "姜计飞(jiang)", updatedAt: "2025-08-13 08:54:48", createdAt: "2025-08-13 08:54:48" },
          { id: "CUS-004", code: "华智", name: "华智", operator: "姜计飞(jiang)", updatedAt: "2025-03-21 17:18:43", createdAt: "2025-03-21 17:18:43" }
        ],
        formFields: [
          { key: "code", label: "客户编号", type: "text" },
          { key: "name", label: "客户名称", type: "text" }
        ],
        rowActions: [
          { key: "edit", label: "修改", tone: "primary" },
          { key: "delete", label: "删除", tone: "danger" }
        ]
      });
    case "process":
      return buildMasterConfig(child, "工艺分类", ["电子装联", "总装测试", "包装出货"]);
    case "barcode":
      return createConfig({
        title: child.label,
        description: child.description,
        filters: standardFilters("规则名称"),
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "规则编号" },
          { key: "name", label: "规则名称" },
          { key: "prefix", label: "前缀/模板" },
          { key: "length", label: "长度" },
          { key: "status", label: "状态", type: "status" },
          { key: "updatedAt", label: "修改时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: `${child.routeName}-1`, code: "RULE-001", name: child.label, prefix: "SN-YYMMDD", length: 18, status: "启用", updatedAt: timestamps[0] },
          { id: `${child.routeName}-2`, code: "RULE-002", name: `${child.label}备份`, prefix: "BX-LOT", length: 16, status: "启用", updatedAt: timestamps[1] },
          { id: `${child.routeName}-3`, code: "RULE-003", name: `${child.label}历史`, prefix: "LOT-", length: 14, status: "停用", updatedAt: timestamps[2] }
        ]
      });
    case "production":
      return buildExecutionConfig(child);
    case "equipment":
      return buildEquipmentConfig(child);
    case "warehouse":
      return buildWarehouseConfig(child);
    case "traceability":
      return buildTraceConfig(child);
    case "reports":
      return buildReportConfig(child);
    case "approval":
      return buildApprovalConfig(child);
    case "settings":
      return buildSettingsConfig(child);
    default:
      return createConfig({
        title: child.label,
        description: child.description,
        filters: standardFilters(child.label),
        columns: [
          { key: "__index", label: "序号", type: "index" },
          { key: "code", label: "编号" },
          { key: "name", label: "名称" },
          { key: "status", label: "状态", type: "status" },
          { key: "updatedAt", label: "更新时间" },
          { key: "__actions", label: "操作", type: "actions" }
        ],
        rows: [
          { id: `${child.routeName}-1`, code: "ITEM-001", name: child.label, status: "启用", updatedAt: timestamps[0] }
        ]
      });
  }
}

export const submodulePageConfigs = Object.fromEntries(
  [
    ...defaultModuleRegistry.flatMap((parent) =>
      (parent.children || []).map((child) => [child.routeName, getConfigForChild(child, parent)])
    ),
    ["deliveryPlan", buildExtraFeatureConfig("deliveryPlan")],
    ["productionPlanDetail", buildExtraFeatureConfig("productionPlanDetail")],
    ["productionPlanChangeDetail", buildExtraFeatureConfig("productionPlanChangeDetail")],
    ["dispatchWork", buildExtraFeatureConfig("dispatchWork")],
    ["executionView", buildExtraFeatureConfig("executionView")],
    ["reportManage", buildExtraFeatureConfig("reportManage")],
    ["pidList", buildExtraFeatureConfig("pidList")],
    ["pidPrint", buildExtraFeatureConfig("pidPrint")],
    ["stationPass", buildExtraFeatureConfig("stationPass")],
    ["lotCompose", buildExtraFeatureConfig("lotCompose")],
    ["mappingCompose", buildExtraFeatureConfig("mappingCompose")],
    ["exceptionReport", buildExtraFeatureConfig("exceptionReport")],
    ["exceptionAssign", buildExtraFeatureConfig("exceptionAssign")],
    ["exceptionHandle", buildExtraFeatureConfig("exceptionHandle")],
    ["exceptionOwner", buildExtraFeatureConfig("exceptionOwner")],
    ["softwareVersion", buildSoftwareVersionConfig()],
    ["hardwareVersion", buildHardwareVersionConfig()]
  ]
);
