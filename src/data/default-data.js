export const defaultData = {
  factories: [
    { id: "FAC-001", code: "FAC-001", name: "易蓝工厂", lines: 6, stations: 48, shift: "白班/夜班", capacity: "11,600 PCS/日", oee: 92.4, efficiency: 95.1, onlineRate: 98.2 },
    { id: "FAC-002", code: "FAC-002", name: "二号装配厂", lines: 4, stations: 31, shift: "白班", capacity: "7,800 PCS/日", oee: 88.6, efficiency: 91.7, onlineRate: 96.3 },
    { id: "FAC-003", code: "FAC-003", name: "质量中心", lines: 2, stations: 10, shift: "柔性排班", capacity: "1,300 PCS/日", oee: 84.8, efficiency: 89.5, onlineRate: 94.1 }
  ],
  customers: [
    { id: "CUS-001", name: "海岳电子", code: "CUS-001", level: "A", region: "华东", owner: "王晨", activeOrders: 12, satisfaction: 98 },
    { id: "CUS-002", name: "正芯智能", code: "CUS-002", level: "A", region: "华南", owner: "赵楠", activeOrders: 8, satisfaction: 96 },
    { id: "CUS-003", name: "奥维装备", code: "CUS-003", level: "B", region: "华北", owner: "刘远", activeOrders: 6, satisfaction: 94 },
    { id: "CUS-004", name: "启衡自动化", code: "CUS-004", level: "B", region: "西南", owner: "周宁", activeOrders: 3, satisfaction: 91 },
    { id: "CUS-005", name: "科锐机电", code: "CUS-005", level: "C", region: "华中", owner: "孙杰", activeOrders: 4, satisfaction: 89 }
  ],
  processRoutes: [
    { id: "ROUTE-001", code: "ROUTE-FCT-01", product: "烧录-FCT 整机检测", version: "V3.2", steps: ["上料", "烧录", "ICT", "FCT", "包装"], passRate: 98.8, cycle: "92 秒" },
    { id: "ROUTE-002", code: "ROUTE-PCBA-03", product: "SMT 主板贴装", version: "V2.5", steps: ["印刷", "贴片", "回流焊", "AOI", "分板"], passRate: 99.1, cycle: "74 秒" },
    { id: "ROUTE-003", code: "ROUTE-ASSY-08", product: "控制柜总装", version: "V1.9", steps: ["备料", "装配", "接线", "通电", "老化"], passRate: 97.4, cycle: "26 分钟" }
  ],
  barcodeRules: [
    { id: "BAR-RULE-001", ruleCode: "barcode-sn", rule: "整机 SN 规则", sample: "SN-YYMMDD-LINE-XXXX", printer: "ZT410-A", queue: 126, success: "99.6%", lastSync: "2026-04-18 12:48" },
    { id: "BAR-RULE-002", ruleCode: "barcode-box", rule: "半成品箱码", sample: "BX-LOT-SEQ", printer: "CL4NX", queue: 84, success: "99.1%", lastSync: "2026-04-18 12:36" },
    { id: "BAR-RULE-003", ruleCode: "barcode-station", rule: "工位追溯码", sample: "ST-ORDER-STEP", printer: "ZT230", queue: 216, success: "98.8%", lastSync: "2026-04-18 12:41" }
  ],
  workOrders: [
    { id: "WO-260418-001", product: "烧录-FCT 控制板", productCode: "PROD-001", line: "SMT-01", planned: 1200, produced: 860, passRate: 98.6, status: "进行中", priority: "高", due: "2026-04-18 18:00", manager: "张强" },
    { id: "WO-260418-002", product: "逆变器主板", productCode: "PROD-002", line: "SMT-02", planned: 2400, produced: 2140, passRate: 99.2, status: "收尾中", priority: "中", due: "2026-04-18 20:30", manager: "刘涛" },
    { id: "WO-260418-003", product: "控制柜总装", productCode: "PROD-003", line: "ASSY-03", planned: 180, produced: 108, passRate: 97.1, status: "进行中", priority: "高", due: "2026-04-19 16:00", manager: "杨杰" },
    { id: "WO-260418-004", product: "储能采集板", productCode: "PROD-004", line: "SMT-05", planned: 900, produced: 900, passRate: 99.6, status: "已完成", priority: "低", due: "2026-04-18 11:20", manager: "沈琳" },
    { id: "WO-260418-005", product: "智能终端外壳装配", productCode: "PROD-005", line: "ASSY-01", planned: 460, produced: 260, passRate: 96.8, status: "异常中", priority: "高", due: "2026-04-18 19:00", manager: "林峰" }
  ],
  defectTop: [
    { name: "虚焊", value: 31, color: "#2f80ff" },
    { name: "划伤", value: 22, color: "#22c2c8" },
    { name: "贴偏", value: 18, color: "#ff9d37" },
    { name: "漏件", value: 14, color: "#eb5f5f" },
    { name: "其他", value: 9, color: "#7b8ba3" }
  ],
  exceptions: [
    { id: "EX-001", type: "设备停机", station: "SMT-01/贴片机 2", owner: "设备部-马俊", status: "待指派", time: "2026-04-18 12:42" },
    { id: "EX-002", type: "来料不良", station: "IQC-电子料", owner: "质量部-韩梅", status: "处理中", time: "2026-04-18 11:58" },
    { id: "EX-003", type: "工艺偏差", station: "ASSY-03/接线", owner: "工艺部-吴涛", status: "已闭环", time: "2026-04-18 10:16" }
  ],
  equipment: [
    { id: "EQ-1001", name: "西门子 SMT 贴片机", code: "EQ-1001", area: "SMT-01", oee: 93.1, runtime: "17.2 h", alarm: 1, status: "运行中", maintainer: "马俊" },
    { id: "EQ-1002", name: "回流焊炉", code: "EQ-1002", area: "SMT-01", oee: 89.6, runtime: "14.8 h", alarm: 0, status: "待保养", maintainer: "韩雷" },
    { id: "EQ-1003", name: "AOI 检测仪", code: "EQ-1003", area: "SMT-02", oee: 95.4, runtime: "18.5 h", alarm: 0, status: "运行中", maintainer: "陈飞" },
    { id: "EQ-2008", name: "FCT 测试台", code: "EQ-2008", area: "FCT-01", oee: 86.3, runtime: "11.1 h", alarm: 2, status: "告警中", maintainer: "王广" },
    { id: "EQ-3012", name: "老化架", code: "EQ-3012", area: "AGING", oee: 91.8, runtime: "19.6 h", alarm: 0, status: "运行中", maintainer: "邵峰" },
    { id: "EQ-4015", name: "激光打标机", code: "EQ-4015", area: "PACK-01", oee: 88.1, runtime: "13.2 h", alarm: 1, status: "换料中", maintainer: "秦宇" }
  ],
  inventory: [
    { id: "MAT-001", material: "STM32 控制芯片", code: "MAT-001", onHand: 8200, safety: 6500, location: "A-01-03", turnover: "11 天", status: "安全" },
    { id: "MAT-017", material: "铝电解电容 470uF", code: "MAT-017", onHand: 2300, safety: 3000, location: "A-03-08", turnover: "5 天", status: "预警" },
    { id: "MAT-091", material: "逆变器外壳", code: "MAT-091", onHand: 780, safety: 1000, location: "B-01-02", turnover: "8 天", status: "预警" },
    { id: "MAT-112", material: "连接线束 A12", code: "MAT-112", onHand: 1560, safety: 900, location: "C-02-04", turnover: "15 天", status: "安全" },
    { id: "MAT-210", material: "成品包装箱", code: "MAT-210", onHand: 410, safety: 380, location: "F-01-01", turnover: "18 天", status: "安全" }
  ],
  traceLots: [
    {
      id: "TRACE-001",
      keyword: "LOT-240418-03",
      product: "烧录-FCT 控制板",
      orderId: "WO-260418-001",
      qty: 320,
      station: "FCT-01",
      result: "已放行",
      operator: "周婷",
      timeline: [
        { time: "2026-04-18 08:11", title: "SMT 首件确认通过", detail: "AOI 首件 OK，程序版本 SMT-V2.5。" },
        { time: "2026-04-18 09:34", title: "烧录站程序下发", detail: "版本 FW-3.8.12，校验结果一致。" },
        { time: "2026-04-18 10:52", title: "FCT 测试通过", detail: "一次通过率 98.9%，返修 3 件。" },
        { time: "2026-04-18 11:26", title: "包装入库", detail: "箱码 BX-20260418-031，入成品仓 F01。" }
      ]
    },
    {
      id: "TRACE-002",
      keyword: "SN-260418-SMT01-0086",
      product: "逆变器主板",
      orderId: "WO-260418-002",
      qty: 1,
      station: "AOI-02",
      result: "待复判",
      operator: "李雪",
      timeline: [
        { time: "2026-04-18 09:20", title: "钢网印刷", detail: "锡膏批次 SP-0418-02，温湿度正常。" },
        { time: "2026-04-18 09:46", title: "贴片完成", detail: "CPK 1.72，关键元件贴装 OK。" },
        { time: "2026-04-18 10:02", title: "AOI 报警", detail: "U12 位置疑似偏移，已转人工复判。" }
      ]
    }
  ],
  approvals: [
    { id: "AP-1001", title: "工单变更申请", applicant: "张强", dept: "生产部", reason: "客户追加 200 台，申请将 WO-260418-001 计划数调整至 1400。", status: "待审批", time: "2026-04-18 11:42" },
    { id: "AP-1002", title: "设备保养延期", applicant: "马俊", dept: "设备部", reason: "回流焊炉当前满载运行，申请保养延期至 4 月 20 日夜班。", status: "待审批", time: "2026-04-18 10:26" },
    { id: "AP-1003", title: "来料让步接收", applicant: "韩梅", dept: "质量部", reason: "连接器外观轻微色差，经客户确认不影响功能，申请让步接收。", status: "已通过", time: "2026-04-18 09:10" }
  ],
  weeklyOutput: [
    { day: "周一", value: 8.3 },
    { day: "周二", value: 8.9 },
    { day: "周三", value: 9.7 },
    { day: "周四", value: 9.3 },
    { day: "周五", value: 10.1 },
    { day: "周六", value: 6.4 },
    { day: "周日", value: 4.2 }
  ],
  monthlyTrend: [
    { month: "05月", output: 86, quality: 97.2 },
    { month: "06月", output: 92, quality: 97.8 },
    { month: "07月", output: 95, quality: 98.1 },
    { month: "08月", output: 101, quality: 98.3 },
    { month: "09月", output: 106, quality: 98.5 },
    { month: "10月", output: 110, quality: 98.4 },
    { month: "11月", output: 118, quality: 98.9 },
    { month: "12月", output: 123, quality: 99.1 },
    { month: "01月", output: 112, quality: 98.6 },
    { month: "02月", output: 108, quality: 98.2 },
    { month: "03月", output: 126, quality: 99.2 },
    { month: "04月", output: 129, quality: 99.4 }
  ],
  settings: [
    { key: "autoDispatch", title: "异常自动派工", desc: "当设备停机或质量异常触发时，自动推送到责任部门值班人。", enabled: true },
    { key: "reportPush", title: "日报自动推送", desc: "每天 18:30 推送产量、良率、异常闭环日报到管理群。", enabled: true },
    { key: "traceLock", title: "追溯记录防篡改", desc: "条码履历写入后锁定，审批通过后方可补录。", enabled: true },
    { key: "energyMonitor", title: "能耗监控联动", desc: "设备运行与能耗数据打通，用于 OEE 和能源报表联动分析。", enabled: false }
  ]
};
