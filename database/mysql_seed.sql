USE `mes_core`;

INSERT INTO `mes_factories`
  (`factory_code`, `factory_name`, `shift_pattern`, `line_count`, `station_count`, `capacity_per_day`, `oee`, `efficiency`, `online_rate`)
VALUES
  ('FAC-001', '易蓝工厂', '白班/夜班', 6, 48, '11600 PCS/日', 92.40, 95.10, 98.20),
  ('FAC-002', '二号装配厂', '白班', 4, 31, '7800 PCS/日', 88.60, 91.70, 96.30),
  ('FAC-003', '质量中心', '柔性排班', 2, 10, '1300 PCS/日', 84.80, 89.50, 94.10);

INSERT INTO `mes_departments` (`dept_code`, `dept_name`, `factory_id`)
SELECT 'IT', '信息化中心', id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'
UNION ALL
SELECT 'PLAN', '生产计划部', id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'
UNION ALL
SELECT 'QUALITY', '质量工程部', id FROM `mes_factories` WHERE `factory_code` = 'FAC-003'
UNION ALL
SELECT 'ASSY', '装配车间', id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'
UNION ALL
SELECT 'PROD', '生产部', id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'
UNION ALL
SELECT 'EQUIP', '设备部', id FROM `mes_factories` WHERE `factory_code` = 'FAC-001';

INSERT INTO `mes_roles` (`role_code`, `role_name`, `description`) VALUES
  ('super_admin', '系统管理员', '拥有全部菜单与流程权限'),
  ('planner', '生产计划员', '负责工单排产、下发、进度监控'),
  ('quality_engineer', '质量工程师', '负责质量、追溯、审批闭环'),
  ('shop_floor_operator', '现场操作员', '负责工位报工、扫描与条码执行');

INSERT INTO `mes_permissions` (`permission_code`, `permission_name`, `module_key`) VALUES
  ('dashboard:view', '查看首页看板', 'dashboard'),
  ('production_config:view', '查看生产配置', 'productionConfig'),
  ('customer:view', '查看客户管理', 'customer'),
  ('process:view', '查看工艺管理', 'process'),
  ('barcode:view', '查看条码规则', 'barcode'),
  ('barcode:issue', '签发条码', 'barcode'),
  ('work_order:view', '查看工单', 'production'),
  ('work_order:update', '更新工单状态', 'production'),
  ('equipment:view', '查看设备', 'equipment'),
  ('warehouse:view', '查看仓库', 'warehouse'),
  ('trace:view', '查看追溯', 'traceability'),
  ('report:view', '查看报表', 'reports'),
  ('approval:view', '查看审批', 'approval'),
  ('approval:decision', '处理审批', 'approval'),
  ('settings:view', '查看系统设置', 'settings'),
  ('settings:update', '修改系统设置', 'settings'),
  ('user:view', '查看用户权限', 'settings');

INSERT INTO `mes_role_permissions` (`role_id`, `permission_id`)
SELECT r.id, p.id
FROM `mes_roles` r
JOIN `mes_permissions` p
WHERE r.role_code = 'super_admin'
UNION ALL
SELECT r.id, p.id
FROM `mes_roles` r
JOIN `mes_permissions` p ON p.permission_code IN (
  'dashboard:view',
  'production_config:view',
  'customer:view',
  'process:view',
  'barcode:view',
  'work_order:view',
  'work_order:update',
  'equipment:view',
  'warehouse:view',
  'trace:view',
  'report:view',
  'approval:view'
)
WHERE r.role_code = 'planner'
UNION ALL
SELECT r.id, p.id
FROM `mes_roles` r
JOIN `mes_permissions` p ON p.permission_code IN (
  'dashboard:view',
  'customer:view',
  'process:view',
  'barcode:view',
  'work_order:view',
  'equipment:view',
  'trace:view',
  'report:view',
  'approval:view',
  'approval:decision'
)
WHERE r.role_code = 'quality_engineer'
UNION ALL
SELECT r.id, p.id
FROM `mes_roles` r
JOIN `mes_permissions` p ON p.permission_code IN (
  'dashboard:view',
  'barcode:view',
  'barcode:issue',
  'work_order:view',
  'trace:view'
)
WHERE r.role_code = 'shop_floor_operator';

INSERT INTO `mes_users`
  (`user_code`, `username`, `password_hash`, `display_name`, `factory_id`, `department_id`, `status`)
VALUES
  (
    'USR-001',
    'admin',
    'scrypt$mes-demo-salt-1$7def7fda0ddff52b31b078ebb2a1af196ba49b601192940e9a10738dcc151119774544b64dceb1c1121aa80d0322210a28a37d3b3392826d67694bea30041960',
    '易蓝',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'IT'),
    'active'
  ),
  (
    'USR-002',
    'planner',
    'scrypt$mes-demo-salt-2$2978e7d81ba49a5ed83994e7473e01309f54514a9b99fae0853dfe09aa31d3842350aeb49b4668cc859294bae21a2da2cddd3f1f5006347e7b7d22b7549cf7e6',
    '陈计划',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'PLAN'),
    'active'
  ),
  (
    'USR-003',
    'quality',
    'scrypt$mes-demo-salt-3$cd5e64fd94c2b51c1cfdfc4cccf56c565b73a047d67cf97bb0ec940f67236171bf5f00ed5813f395c4b527c93ed17a7b216ad49297f218f023e379ecc899949b',
    '李质控',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-003'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'QUALITY'),
    'active'
  ),
  (
    'USR-004',
    'operator',
    'scrypt$mes-demo-salt-4$be5fb68613ffc9f4c1b537d51f4507ba8263e715deaba74d623b185abe37aa9c840c2ea1d18e8c848f180eb224aed64e5380a6f080bc07a49bf6b8606cb9e821',
    '周婷',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'ASSY'),
    'active'
  ),
  (
    'USR-005',
    'zhangqiang',
    'scrypt$mes-demo-salt-1$7def7fda0ddff52b31b078ebb2a1af196ba49b601192940e9a10738dcc151119774544b64dceb1c1121aa80d0322210a28a37d3b3392826d67694bea30041960',
    '张强',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'PROD'),
    'active'
  ),
  (
    'USR-006',
    'majun',
    'scrypt$mes-demo-salt-1$7def7fda0ddff52b31b078ebb2a1af196ba49b601192940e9a10738dcc151119774544b64dceb1c1121aa80d0322210a28a37d3b3392826d67694bea30041960',
    '马俊',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'EQUIP'),
    'active'
  ),
  (
    'USR-007',
    'hanmei',
    'scrypt$mes-demo-salt-1$7def7fda0ddff52b31b078ebb2a1af196ba49b601192940e9a10738dcc151119774544b64dceb1c1121aa80d0322210a28a37d3b3392826d67694bea30041960',
    '韩梅',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-003'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'QUALITY'),
    'active'
  );

INSERT INTO `mes_user_roles` (`user_id`, `role_id`)
SELECT u.id, r.id
FROM `mes_users` u
JOIN `mes_roles` r
WHERE u.username = 'admin' AND r.role_code = 'super_admin'
UNION ALL
SELECT u.id, r.id
FROM `mes_users` u
JOIN `mes_roles` r
WHERE u.username = 'planner' AND r.role_code = 'planner'
UNION ALL
SELECT u.id, r.id
FROM `mes_users` u
JOIN `mes_roles` r
WHERE u.username = 'quality' AND r.role_code = 'quality_engineer'
UNION ALL
SELECT u.id, r.id
FROM `mes_users` u
JOIN `mes_roles` r
WHERE u.username = 'operator' AND r.role_code = 'shop_floor_operator';

INSERT INTO `mes_customers` (`customer_code`, `customer_name`, `customer_level`, `region_name`, `owner_name`) VALUES
  ('CUS-001', '海岳电子', 'A', '华东', '王晨'),
  ('CUS-002', '正芯智能', 'A', '华南', '赵楠'),
  ('CUS-003', '奥维装备', 'B', '华北', '刘远');

INSERT INTO `mes_products` (`product_code`, `product_name`, `product_version`, `uom`) VALUES
  ('PROD-001', '烧录-FCT 控制板', 'V3.2', 'PCS'),
  ('PROD-002', '逆变器主板', 'V2.5', 'PCS'),
  ('PROD-003', '控制柜总装', 'V1.9', 'PCS'),
  ('PROD-004', '储能采集板', 'V1.0', 'PCS'),
  ('PROD-005', '智能终端外壳装配', 'V1.0', 'PCS');

INSERT INTO `mes_lines` (`line_code`, `line_name`, `factory_id`, `line_type`, `status`) VALUES
  ('LINE-SMT-01', 'SMT-01', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'SMT', 'online'),
  ('LINE-SMT-02', 'SMT-02', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'SMT', 'online'),
  ('LINE-ASSY-03', 'ASSY-03', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'), 'ASSEMBLY', 'online'),
  ('LINE-SMT-05', 'SMT-05', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'SMT', 'online'),
  ('LINE-ASSY-01', 'ASSY-01', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'), 'ASSEMBLY', 'online'),
  ('LINE-QC-01', 'IQC-电子料', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-003'), 'QUALITY', 'online');

INSERT INTO `mes_stations` (`station_code`, `station_name`, `line_id`, `station_type`, `sequence_no`) VALUES
  ('FCT-01', 'FCT-01', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'), 'TEST', 1),
  ('AOI-02', 'AOI-02', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-02'), 'INSPECTION', 1),
  ('SMT-M2', '贴片机 2', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'), 'EQUIPMENT', 2),
  ('ASSY-WIRE', '接线', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-03'), 'WORKSTATION', 2),
  ('IQC-EL', 'IQC-电子料', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-QC-01'), 'QUALITY', 1),
  ('AGING', 'AGING', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-03'), 'AGING', 3),
  ('PACK-01', 'PACK-01', (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-01'), 'PACK', 4);

INSERT INTO `mes_process_routes` (`route_code`, `product_id`, `route_version`, `standard_cycle_seconds`, `status`) VALUES
  ('ROUTE-FCT-01', (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-001'), 'V3.2', 92, 'released'),
  ('ROUTE-PCBA-03', (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-002'), 'V2.5', 74, 'released'),
  ('ROUTE-ASSY-08', (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-003'), 'V1.9', 1560, 'released');

INSERT INTO `mes_process_route_steps` (`route_id`, `step_code`, `step_name`, `station_id`, `sequence_no`, `is_quality_gate`) VALUES
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'), 'STEP-001', '上料', NULL, 1, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'), 'STEP-002', '烧录', NULL, 2, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'), 'STEP-003', 'ICT', NULL, 3, 1),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'), 'STEP-004', 'FCT', (SELECT id FROM `mes_stations` WHERE `station_code` = 'FCT-01'), 4, 1),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'), 'STEP-005', '包装', NULL, 5, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'), 'STEP-101', '印刷', NULL, 1, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'), 'STEP-102', '贴片', NULL, 2, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'), 'STEP-103', '回流焊', NULL, 3, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'), 'STEP-104', 'AOI', (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'), 4, 1),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'), 'STEP-105', '分板', NULL, 5, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'), 'STEP-201', '备料', NULL, 1, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'), 'STEP-202', '装配', NULL, 2, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'), 'STEP-203', '接线', NULL, 3, 0),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'), 'STEP-204', '通电', NULL, 4, 1),
  ((SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'), 'STEP-205', '老化', NULL, 5, 0);

INSERT INTO `mes_barcode_rules` (`rule_code`, `rule_name`, `template_pattern`, `printer_name`, `queue_size`, `success_rate`, `last_sync_at`) VALUES
  ('barcode-sn', '整机 SN 规则', 'SN-YYMMDD-LINE-XXXX', 'ZT410-A', 126, 99.60, '2026-04-18 12:48:00'),
  ('barcode-box', '半成品箱码', 'BX-LOT-SEQ', 'CL4NX', 84, 99.10, '2026-04-18 12:36:00'),
  ('barcode-station', '工位追溯码', 'ST-ORDER-STEP', 'ZT230', 216, 98.80, '2026-04-18 12:41:00');

INSERT INTO `mes_printers`
  (`printer_code`, `printer_name`, `factory_id`, `ip_address`, `driver_name`, `status`, `last_seen_at`)
VALUES
  (
    'PRN-001',
    'ZT410-A',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    '192.168.0.102:9100',
    'Zebra ZPL',
    'online',
    '2026-04-24 09:30:00'
  ),
  (
    'PRN-002',
    'CL4NX',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    '192.168.0.103:9100',
    'SATO CL4NX',
    'online',
    '2026-04-24 09:31:00'
  ),
  (
    'PRN-003',
    'ZT230',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    '192.168.12.58:9100',
    'Zebra ZPL',
    'warning',
    '2026-04-24 09:32:00'
  );

INSERT INTO `mes_equipment`
  (`equipment_code`, `equipment_name`, `factory_id`, `line_id`, `station_id`, `maintainer_name`, `runtime_hours`, `oee`, `alarm_count`, `status`)
VALUES
  (
    'EQ-1001',
    '西门子 SMT 贴片机',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'),
    NULL,
    '马俊',
    17.2,
    93.10,
    1,
    'running'
  ),
  (
    'EQ-1002',
    '回流焊炉',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'),
    NULL,
    '韩雷',
    14.8,
    89.60,
    0,
    'maintenance'
  ),
  (
    'EQ-1003',
    'AOI 检测仪',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-02'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'),
    '陈飞',
    18.5,
    95.40,
    0,
    'running'
  ),
  (
    'EQ-2008',
    'FCT 测试台',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'FCT-01'),
    '王广',
    11.1,
    86.30,
    2,
    'warning'
  ),
  (
    'EQ-3012',
    '老化架',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-03'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AGING'),
    '邵峰',
    19.6,
    91.80,
    0,
    'running'
  ),
  (
    'EQ-4015',
    '激光打标机',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-01'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'PACK-01'),
    '秦宇',
    13.2,
    88.10,
    1,
    'changeover'
  );

INSERT INTO `mes_inventory_items`
  (`material_code`, `material_name`, `factory_id`, `location_code`, `on_hand_qty`, `safety_qty`, `turnover_days`, `status`)
VALUES
  ('MAT-001', 'STM32 控制芯片', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'A-01-03', 8200, 6500, 11.0, 'safe'),
  ('MAT-017', '铝电解电容 470uF', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'A-03-08', 2300, 3000, 5.0, 'warning'),
  ('MAT-091', '逆变器外壳', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'), 'B-01-02', 780, 1000, 8.0, 'warning'),
  ('MAT-112', '连接线束 A12', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'), 'C-02-04', 1560, 900, 15.0, 'safe'),
  ('MAT-210', '成品包装箱', (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'), 'F-01-01', 410, 380, 18.0, 'safe');

INSERT INTO `mes_work_orders`
  (`work_order_code`, `factory_id`, `customer_id`, `product_id`, `route_id`, `line_id`, `planned_qty`, `produced_qty`, `pass_rate`, `priority_level`, `status`, `manager_name`, `scheduled_start_at`, `scheduled_end_at`)
VALUES
  (
    'WO-260418-001',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_customers` WHERE `customer_code` = 'CUS-001'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-001'),
    (SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-FCT-01'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-01'),
    1200,
    860,
    98.60,
    'high',
    'running',
    '张强',
    '2026-04-18 08:00:00',
    '2026-04-18 18:00:00'
  ),
  (
    'WO-260418-002',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_customers` WHERE `customer_code` = 'CUS-002'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-002'),
    (SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-02'),
    2400,
    2140,
    99.20,
    'medium',
    'finishing',
    '刘涛',
    '2026-04-18 08:00:00',
    '2026-04-18 20:30:00'
  ),
  (
    'WO-260418-003',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_customers` WHERE `customer_code` = 'CUS-003'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-003'),
    (SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-03'),
    180,
    108,
    97.10,
    'high',
    'running',
    '杨杰',
    '2026-04-18 08:00:00',
    '2026-04-19 16:00:00'
  ),
  (
    'WO-260418-004',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_customers` WHERE `customer_code` = 'CUS-001'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-004'),
    (SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-PCBA-03'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-SMT-05'),
    900,
    900,
    99.60,
    'low',
    'completed',
    '沈琳',
    '2026-04-18 07:00:00',
    '2026-04-18 11:20:00'
  ),
  (
    'WO-260418-005',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_customers` WHERE `customer_code` = 'CUS-003'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-005'),
    (SELECT id FROM `mes_process_routes` WHERE `route_code` = 'ROUTE-ASSY-08'),
    (SELECT id FROM `mes_lines` WHERE `line_code` = 'LINE-ASSY-01'),
    460,
    260,
    96.80,
    'high',
    'abnormal',
    '林峰',
    '2026-04-18 08:00:00',
    '2026-04-18 19:00:00'
  );

INSERT INTO `mes_exception_tickets`
  (`exception_code`, `work_order_id`, `station_id`, `exception_type`, `owner_name`, `status`, `description`, `created_at`, `closed_at`)
VALUES
  (
    'EX-001',
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'SMT-M2'),
    '设备停机',
    '设备部-马俊',
    'new',
    '贴片机 2 短停，需排查吸嘴与供料器。',
    '2026-04-18 12:42:00',
    NULL
  ),
  (
    'EX-002',
    NULL,
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'IQC-EL'),
    '来料不良',
    '质量部-韩梅',
    'processing',
    '电子料外观异常，正在做来料复判。',
    '2026-04-18 11:58:00',
    NULL
  ),
  (
    'EX-003',
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'ASSY-WIRE'),
    '工艺偏差',
    '工艺部-吴涛',
    'closed',
    '接线扭矩偏差已修正并闭环。',
    '2026-04-18 10:16:00',
    '2026-04-18 11:05:00'
  );

INSERT INTO `mes_work_order_logs`
  (`work_order_id`, `station_id`, `operator_id`, `event_type`, `event_result`, `payload_json`, `created_at`)
VALUES
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'SMT-M2'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'defect',
    'ng',
    JSON_OBJECT('defectType', '虚焊', 'count', 31),
    '2026-04-18 09:15:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-002'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-003'),
    'defect',
    'ng',
    JSON_OBJECT('defectType', '划伤', 'count', 22),
    '2026-04-18 10:02:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-002'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-003'),
    'defect',
    'ng',
    JSON_OBJECT('defectType', '贴偏', 'count', 18),
    '2026-04-18 10:12:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'ASSY-WIRE'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'defect',
    'ng',
    JSON_OBJECT('defectType', '漏件', 'count', 14),
    '2026-04-18 13:20:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-005'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'PACK-01'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'defect',
    'ng',
    JSON_OBJECT('defectType', '其他', 'count', 9),
    '2026-04-18 15:10:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 516000, 'passQty', 501552),
    '2025-05-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 344000, 'passQty', 334368),
    '2025-05-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 552000, 'passQty', 539856),
    '2025-06-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 368000, 'passQty', 359904),
    '2025-06-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 570000, 'passQty', 559170),
    '2025-07-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 380000, 'passQty', 372780),
    '2025-07-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 606000, 'passQty', 595698),
    '2025-08-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 404000, 'passQty', 397132),
    '2025-08-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 636000, 'passQty', 626460),
    '2025-09-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 424000, 'passQty', 417640),
    '2025-09-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 660000, 'passQty', 649440),
    '2025-10-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 440000, 'passQty', 432960),
    '2025-10-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 708000, 'passQty', 700212),
    '2025-11-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 472000, 'passQty', 466808),
    '2025-11-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 738000, 'passQty', 731358),
    '2025-12-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 492000, 'passQty', 487572),
    '2025-12-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 672000, 'passQty', 662592),
    '2026-01-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 448000, 'passQty', 441728),
    '2026-01-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 648000, 'passQty', 636336),
    '2026-02-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 432000, 'passQty', 424224),
    '2026-02-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 756000, 'passQty', 749952),
    '2026-03-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 504000, 'passQty', 499968),
    '2026-03-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 432600, 'passQty', 430004),
    '2026-04-01 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 288400, 'passQty', 286670),
    '2026-04-01 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 49800, 'passQty', 49501),
    '2026-04-13 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 33200, 'passQty', 33001),
    '2026-04-13 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 53400, 'passQty', 53080),
    '2026-04-14 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 35600, 'passQty', 35386),
    '2026-04-14 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 58200, 'passQty', 57851),
    '2026-04-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 38800, 'passQty', 38567),
    '2026-04-15 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 55800, 'passQty', 55465),
    '2026-04-16 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 37200, 'passQty', 36977),
    '2026-04-16 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 60600, 'passQty', 60236),
    '2026-04-17 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 40400, 'passQty', 40158),
    '2026-04-17 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 38400, 'passQty', 38170),
    '2026-04-18 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 25600, 'passQty', 25446),
    '2026-04-18 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 25200, 'passQty', 25049),
    '2026-04-19 12:00:00'
  ),
  (
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-003'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-002'),
    'production_report',
    'ok',
    JSON_OBJECT('outputQty', 16800, 'passQty', 16699),
    '2026-04-19 12:00:00'
  );

INSERT INTO `mes_trace_records`
  (`trace_code`, `work_order_id`, `product_id`, `current_station_id`, `trace_result`, `qty`, `operator_name`)
VALUES
  (
    'LOT-240418-03',
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-001'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'FCT-01'),
    '已放行',
    320,
    '周婷'
  ),
  (
    'SN-260418-SMT01-0086',
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-002'),
    (SELECT id FROM `mes_products` WHERE `product_code` = 'PROD-002'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'),
    '待复判',
    1,
    '李雪'
  );

INSERT INTO `mes_barcode_serials`
  (`barcode_value`, `rule_id`, `work_order_id`, `station_id`, `operator_id`, `barcode_type`, `status`, `issued_at`)
VALUES
  (
    'SN-260418-SMT01-0086',
    (SELECT id FROM `mes_barcode_rules` WHERE `rule_code` = 'barcode-sn'),
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-002'),
    (SELECT id FROM `mes_stations` WHERE `station_code` = 'AOI-02'),
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-003'),
    'sn',
    'issued',
    '2026-04-18 09:46:00'
  ),
  (
    'BX-20260418-031',
    (SELECT id FROM `mes_barcode_rules` WHERE `rule_code` = 'barcode-box'),
    (SELECT id FROM `mes_work_orders` WHERE `work_order_code` = 'WO-260418-001'),
    NULL,
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-004'),
    'box',
    'issued',
    '2026-04-18 11:26:00'
  );

INSERT INTO `mes_trace_events` (`trace_record_id`, `station_id`, `event_title`, `event_detail`, `event_result`, `operator_name`, `event_time`)
SELECT tr.id, st.id, 'SMT 首件确认通过', 'AOI 首件 OK，程序版本 SMT-V2.5。', 'ok', '周婷', '2026-04-18 08:11:00'
FROM `mes_trace_records` tr
LEFT JOIN `mes_stations` st ON st.station_code = 'FCT-01'
WHERE tr.trace_code = 'LOT-240418-03'
UNION ALL
SELECT tr.id, st.id, '烧录站程序下发', '版本 FW-3.8.12，校验结果一致。', 'ok', '周婷', '2026-04-18 09:34:00'
FROM `mes_trace_records` tr
LEFT JOIN `mes_stations` st ON st.station_code = 'FCT-01'
WHERE tr.trace_code = 'LOT-240418-03'
UNION ALL
SELECT tr.id, st.id, 'FCT 测试通过', '一次通过率 98.9%，返修 3 件。', 'ok', '周婷', '2026-04-18 10:52:00'
FROM `mes_trace_records` tr
LEFT JOIN `mes_stations` st ON st.station_code = 'FCT-01'
WHERE tr.trace_code = 'LOT-240418-03'
UNION ALL
SELECT tr.id, NULL, '包装入库', '箱码 BX-20260418-031，入成品仓 F01。', 'ok', '周婷', '2026-04-18 11:26:00'
FROM `mes_trace_records` tr
WHERE tr.trace_code = 'LOT-240418-03'
UNION ALL
SELECT tr.id, NULL, '钢网印刷', '锡膏批次 SP-0418-02，温湿度正常。', 'ok', '李雪', '2026-04-18 09:20:00'
FROM `mes_trace_records` tr
WHERE tr.trace_code = 'SN-260418-SMT01-0086'
UNION ALL
SELECT tr.id, NULL, '贴片完成', 'CPK 1.72，关键元件贴装 OK。', 'ok', '李雪', '2026-04-18 09:46:00'
FROM `mes_trace_records` tr
WHERE tr.trace_code = 'SN-260418-SMT01-0086'
UNION ALL
SELECT tr.id, st.id, 'AOI 报警', 'U12 位置疑似偏移，已转人工复判。', 'warning', '李雪', '2026-04-18 10:02:00'
FROM `mes_trace_records` tr
LEFT JOIN `mes_stations` st ON st.station_code = 'AOI-02'
WHERE tr.trace_code = 'SN-260418-SMT01-0086';

INSERT INTO `mes_approval_requests`
  (`approval_code`, `approval_type`, `title`, `reason`, `entity_code`, `applicant_id`, `department_id`, `status`, `approver_id`, `submitted_at`, `approved_at`)
VALUES
  (
    'AP-1001',
    'work_order_change',
    '工单变更申请',
    '客户追加 200 台，申请将 WO-260418-001 计划数调整至 1400。',
    'WO-260418-001',
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-005'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'PROD'),
    'pending',
    NULL,
    '2026-04-18 11:42:00',
    NULL
  ),
  (
    'AP-1002',
    'maintenance_delay',
    '设备保养延期',
    '回流焊炉当前满载运行，申请保养延期至 4 月 20 日夜班。',
    'EQ-1002',
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-006'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'EQUIP'),
    'pending',
    NULL,
    '2026-04-18 10:26:00',
    NULL
  ),
  (
    'AP-1003',
    'quality_acceptance',
    '来料让步接收',
    '连接器外观轻微色差，经客户确认不影响功能，申请让步接收。',
    'MAT-112',
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-007'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'QUALITY'),
    'approved',
    (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-001'),
    '2026-04-18 09:10:00',
    '2026-04-18 09:32:00'
  );

INSERT INTO `mes_system_settings` (`setting_key`, `setting_name`, `description`, `setting_value`, `updated_by`) VALUES
  ('autoDispatch', '异常自动派工', '当设备停机或质量异常触发时，自动推送到责任部门值班人。', JSON_OBJECT('enabled', true), (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-001')),
  ('reportPush', '日报自动推送', '每天 18:30 推送产量、良率、异常闭环日报到管理群。', JSON_OBJECT('enabled', true), (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-001')),
  ('traceLock', '追溯记录防篡改', '条码履历写入后锁定，审批通过后方可补录。', JSON_OBJECT('enabled', true), (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-001')),
  ('energyMonitor', '能耗监控联动', '设备运行与能耗数据打通，用于 OEE 和能源报表联动分析。', JSON_OBJECT('enabled', false), (SELECT id FROM `mes_users` WHERE `user_code` = 'USR-001'));
