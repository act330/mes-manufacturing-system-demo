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
SELECT 'ASSY', '装配车间', id FROM `mes_factories` WHERE `factory_code` = 'FAC-001';

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

INSERT INTO `mes_users`
  (`user_code`, `username`, `password_hash`, `display_name`, `factory_id`, `department_id`, `status`)
VALUES
  (
    'USR-001',
    'admin',
    '$2b$12$replace.with.real.hash',
    '易蓝',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-001'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'IT'),
    'active'
  ),
  (
    'USR-002',
    'planner',
    '$2b$12$replace.with.real.hash',
    '陈计划',
    (SELECT id FROM `mes_factories` WHERE `factory_code` = 'FAC-002'),
    (SELECT id FROM `mes_departments` WHERE `dept_code` = 'PLAN'),
    'active'
  ),
  (
    'USR-003',
    'quality',
    '$2b$12$replace.with.real.hash',
    '李质控',
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
WHERE u.username = 'quality' AND r.role_code = 'quality_engineer';
