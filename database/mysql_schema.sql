CREATE DATABASE IF NOT EXISTS `mes_core`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE `mes_core`;

CREATE TABLE IF NOT EXISTS `mes_factories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `factory_code` VARCHAR(32) NOT NULL,
  `factory_name` VARCHAR(128) NOT NULL,
  `shift_pattern` VARCHAR(64) DEFAULT NULL,
  `line_count` INT NOT NULL DEFAULT 0,
  `station_count` INT NOT NULL DEFAULT 0,
  `capacity_per_day` VARCHAR(64) DEFAULT NULL,
  `oee` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `efficiency` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `online_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_factories_code` (`factory_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_departments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `dept_code` VARCHAR(32) NOT NULL,
  `dept_name` VARCHAR(128) NOT NULL,
  `factory_id` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_departments_code` (`dept_code`),
  KEY `idx_mes_departments_factory_id` (`factory_id`),
  CONSTRAINT `fk_mes_departments_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_code` VARCHAR(64) NOT NULL,
  `role_name` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_roles_code` (`role_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `permission_code` VARCHAR(64) NOT NULL,
  `permission_name` VARCHAR(128) NOT NULL,
  `module_key` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_permissions_code` (`permission_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_role_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` BIGINT UNSIGNED NOT NULL,
  `permission_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_role_permission` (`role_id`, `permission_id`),
  KEY `idx_mes_role_permissions_permission_id` (`permission_id`),
  CONSTRAINT `fk_mes_role_permissions_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `mes_roles` (`id`),
  CONSTRAINT `fk_mes_role_permissions_permission_id`
    FOREIGN KEY (`permission_id`) REFERENCES `mes_permissions` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_code` VARCHAR(32) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(128) NOT NULL,
  `factory_id` BIGINT UNSIGNED DEFAULT NULL,
  `department_id` BIGINT UNSIGNED DEFAULT NULL,
  `status` ENUM('active', 'disabled', 'locked') NOT NULL DEFAULT 'active',
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_users_code` (`user_code`),
  UNIQUE KEY `uk_mes_users_username` (`username`),
  KEY `idx_mes_users_factory_id` (`factory_id`),
  KEY `idx_mes_users_department_id` (`department_id`),
  CONSTRAINT `fk_mes_users_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`),
  CONSTRAINT `fk_mes_users_department_id`
    FOREIGN KEY (`department_id`) REFERENCES `mes_departments` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_user_roles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `role_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_user_role` (`user_id`, `role_id`),
  KEY `idx_mes_user_roles_role_id` (`role_id`),
  CONSTRAINT `fk_mes_user_roles_user_id`
    FOREIGN KEY (`user_id`) REFERENCES `mes_users` (`id`),
  CONSTRAINT `fk_mes_user_roles_role_id`
    FOREIGN KEY (`role_id`) REFERENCES `mes_roles` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_lines` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `line_code` VARCHAR(32) NOT NULL,
  `line_name` VARCHAR(128) NOT NULL,
  `factory_id` BIGINT UNSIGNED NOT NULL,
  `line_type` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('online', 'offline', 'maintenance') NOT NULL DEFAULT 'online',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_lines_code` (`line_code`),
  KEY `idx_mes_lines_factory_id` (`factory_id`),
  CONSTRAINT `fk_mes_lines_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_stations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `station_code` VARCHAR(32) NOT NULL,
  `station_name` VARCHAR(128) NOT NULL,
  `line_id` BIGINT UNSIGNED NOT NULL,
  `station_type` VARCHAR(64) DEFAULT NULL,
  `sequence_no` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_stations_code` (`station_code`),
  KEY `idx_mes_stations_line_id` (`line_id`),
  CONSTRAINT `fk_mes_stations_line_id`
    FOREIGN KEY (`line_id`) REFERENCES `mes_lines` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_code` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_version` VARCHAR(64) DEFAULT NULL,
  `uom` VARCHAR(32) NOT NULL DEFAULT 'PCS',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_products_code` (`product_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_process_routes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_code` VARCHAR(64) NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `route_version` VARCHAR(64) NOT NULL,
  `standard_cycle_seconds` INT DEFAULT NULL,
  `status` ENUM('draft', 'released', 'archived') NOT NULL DEFAULT 'released',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_process_routes_code` (`route_code`),
  KEY `idx_mes_process_routes_product_id` (`product_id`),
  CONSTRAINT `fk_mes_process_routes_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `mes_products` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_process_route_steps` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `route_id` BIGINT UNSIGNED NOT NULL,
  `step_code` VARCHAR(32) NOT NULL,
  `step_name` VARCHAR(128) NOT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `sequence_no` INT NOT NULL,
  `is_quality_gate` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_route_step` (`route_id`, `step_code`),
  KEY `idx_mes_process_route_steps_station_id` (`station_id`),
  CONSTRAINT `fk_mes_process_route_steps_route_id`
    FOREIGN KEY (`route_id`) REFERENCES `mes_process_routes` (`id`),
  CONSTRAINT `fk_mes_process_route_steps_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_customers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_code` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_level` VARCHAR(8) DEFAULT NULL,
  `region_name` VARCHAR(64) DEFAULT NULL,
  `owner_name` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_customers_code` (`customer_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_work_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `work_order_code` VARCHAR(64) NOT NULL,
  `factory_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` BIGINT UNSIGNED DEFAULT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `route_id` BIGINT UNSIGNED DEFAULT NULL,
  `line_id` BIGINT UNSIGNED DEFAULT NULL,
  `planned_qty` INT NOT NULL,
  `produced_qty` INT NOT NULL DEFAULT 0,
  `pass_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `priority_level` ENUM('low', 'medium', 'high', 'urgent') NOT NULL DEFAULT 'medium',
  `status` ENUM('planned', 'released', 'running', 'finishing', 'completed', 'abnormal', 'closed') NOT NULL DEFAULT 'planned',
  `manager_name` VARCHAR(64) DEFAULT NULL,
  `scheduled_start_at` DATETIME DEFAULT NULL,
  `scheduled_end_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_work_orders_code` (`work_order_code`),
  KEY `idx_mes_work_orders_factory_id` (`factory_id`),
  KEY `idx_mes_work_orders_customer_id` (`customer_id`),
  KEY `idx_mes_work_orders_product_id` (`product_id`),
  KEY `idx_mes_work_orders_route_id` (`route_id`),
  KEY `idx_mes_work_orders_line_id` (`line_id`),
  CONSTRAINT `fk_mes_work_orders_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`),
  CONSTRAINT `fk_mes_work_orders_customer_id`
    FOREIGN KEY (`customer_id`) REFERENCES `mes_customers` (`id`),
  CONSTRAINT `fk_mes_work_orders_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `mes_products` (`id`),
  CONSTRAINT `fk_mes_work_orders_route_id`
    FOREIGN KEY (`route_id`) REFERENCES `mes_process_routes` (`id`),
  CONSTRAINT `fk_mes_work_orders_line_id`
    FOREIGN KEY (`line_id`) REFERENCES `mes_lines` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_work_order_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `work_order_id` BIGINT UNSIGNED NOT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `operator_id` BIGINT UNSIGNED DEFAULT NULL,
  `event_type` VARCHAR(64) NOT NULL,
  `event_result` VARCHAR(64) DEFAULT NULL,
  `payload_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mes_work_order_logs_order_id` (`work_order_id`),
  KEY `idx_mes_work_order_logs_station_id` (`station_id`),
  KEY `idx_mes_work_order_logs_operator_id` (`operator_id`),
  CONSTRAINT `fk_mes_work_order_logs_order_id`
    FOREIGN KEY (`work_order_id`) REFERENCES `mes_work_orders` (`id`),
  CONSTRAINT `fk_mes_work_order_logs_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`),
  CONSTRAINT `fk_mes_work_order_logs_operator_id`
    FOREIGN KEY (`operator_id`) REFERENCES `mes_users` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_barcode_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rule_code` VARCHAR(64) NOT NULL,
  `rule_name` VARCHAR(128) NOT NULL,
  `template_pattern` VARCHAR(255) NOT NULL,
  `printer_name` VARCHAR(128) DEFAULT NULL,
  `queue_size` INT NOT NULL DEFAULT 0,
  `success_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `last_sync_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_barcode_rules_code` (`rule_code`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_barcode_serials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `barcode_value` VARCHAR(128) NOT NULL,
  `rule_id` BIGINT UNSIGNED NOT NULL,
  `work_order_id` BIGINT UNSIGNED DEFAULT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `operator_id` BIGINT UNSIGNED DEFAULT NULL,
  `barcode_type` ENUM('sn', 'lot', 'box', 'station') NOT NULL DEFAULT 'sn',
  `status` ENUM('issued', 'printed', 'bound', 'closed') NOT NULL DEFAULT 'issued',
  `issued_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_barcode_serials_value` (`barcode_value`),
  KEY `idx_mes_barcode_serials_rule_id` (`rule_id`),
  KEY `idx_mes_barcode_serials_order_id` (`work_order_id`),
  KEY `idx_mes_barcode_serials_station_id` (`station_id`),
  KEY `idx_mes_barcode_serials_operator_id` (`operator_id`),
  CONSTRAINT `fk_mes_barcode_serials_rule_id`
    FOREIGN KEY (`rule_id`) REFERENCES `mes_barcode_rules` (`id`),
  CONSTRAINT `fk_mes_barcode_serials_order_id`
    FOREIGN KEY (`work_order_id`) REFERENCES `mes_work_orders` (`id`),
  CONSTRAINT `fk_mes_barcode_serials_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`),
  CONSTRAINT `fk_mes_barcode_serials_operator_id`
    FOREIGN KEY (`operator_id`) REFERENCES `mes_users` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_trace_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trace_code` VARCHAR(128) NOT NULL,
  `barcode_serial_id` BIGINT UNSIGNED DEFAULT NULL,
  `work_order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `current_station_id` BIGINT UNSIGNED DEFAULT NULL,
  `trace_result` VARCHAR(64) DEFAULT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `operator_name` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_trace_records_code` (`trace_code`),
  KEY `idx_mes_trace_records_barcode_serial_id` (`barcode_serial_id`),
  KEY `idx_mes_trace_records_order_id` (`work_order_id`),
  KEY `idx_mes_trace_records_product_id` (`product_id`),
  KEY `idx_mes_trace_records_station_id` (`current_station_id`),
  CONSTRAINT `fk_mes_trace_records_barcode_serial_id`
    FOREIGN KEY (`barcode_serial_id`) REFERENCES `mes_barcode_serials` (`id`),
  CONSTRAINT `fk_mes_trace_records_order_id`
    FOREIGN KEY (`work_order_id`) REFERENCES `mes_work_orders` (`id`),
  CONSTRAINT `fk_mes_trace_records_product_id`
    FOREIGN KEY (`product_id`) REFERENCES `mes_products` (`id`),
  CONSTRAINT `fk_mes_trace_records_station_id`
    FOREIGN KEY (`current_station_id`) REFERENCES `mes_stations` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_trace_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trace_record_id` BIGINT UNSIGNED NOT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `event_title` VARCHAR(128) NOT NULL,
  `event_detail` VARCHAR(255) DEFAULT NULL,
  `event_result` VARCHAR(64) DEFAULT NULL,
  `operator_name` VARCHAR(64) DEFAULT NULL,
  `event_time` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_mes_trace_events_record_id` (`trace_record_id`),
  KEY `idx_mes_trace_events_station_id` (`station_id`),
  CONSTRAINT `fk_mes_trace_events_record_id`
    FOREIGN KEY (`trace_record_id`) REFERENCES `mes_trace_records` (`id`),
  CONSTRAINT `fk_mes_trace_events_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_equipment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `equipment_code` VARCHAR(64) NOT NULL,
  `equipment_name` VARCHAR(255) NOT NULL,
  `factory_id` BIGINT UNSIGNED DEFAULT NULL,
  `line_id` BIGINT UNSIGNED DEFAULT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `maintainer_name` VARCHAR(64) DEFAULT NULL,
  `runtime_hours` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `oee` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `alarm_count` INT NOT NULL DEFAULT 0,
  `status` ENUM('running', 'warning', 'maintenance', 'offline', 'changeover') NOT NULL DEFAULT 'running',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_equipment_code` (`equipment_code`),
  KEY `idx_mes_equipment_factory_id` (`factory_id`),
  KEY `idx_mes_equipment_line_id` (`line_id`),
  KEY `idx_mes_equipment_station_id` (`station_id`),
  CONSTRAINT `fk_mes_equipment_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`),
  CONSTRAINT `fk_mes_equipment_line_id`
    FOREIGN KEY (`line_id`) REFERENCES `mes_lines` (`id`),
  CONSTRAINT `fk_mes_equipment_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_exception_tickets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `exception_code` VARCHAR(64) NOT NULL,
  `work_order_id` BIGINT UNSIGNED DEFAULT NULL,
  `station_id` BIGINT UNSIGNED DEFAULT NULL,
  `exception_type` VARCHAR(64) NOT NULL,
  `owner_name` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('new', 'assigned', 'processing', 'closed') NOT NULL DEFAULT 'new',
  `description` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_exception_tickets_code` (`exception_code`),
  KEY `idx_mes_exception_tickets_order_id` (`work_order_id`),
  KEY `idx_mes_exception_tickets_station_id` (`station_id`),
  CONSTRAINT `fk_mes_exception_tickets_order_id`
    FOREIGN KEY (`work_order_id`) REFERENCES `mes_work_orders` (`id`),
  CONSTRAINT `fk_mes_exception_tickets_station_id`
    FOREIGN KEY (`station_id`) REFERENCES `mes_stations` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_inventory_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `material_code` VARCHAR(64) NOT NULL,
  `material_name` VARCHAR(255) NOT NULL,
  `factory_id` BIGINT UNSIGNED DEFAULT NULL,
  `location_code` VARCHAR(64) DEFAULT NULL,
  `on_hand_qty` INT NOT NULL DEFAULT 0,
  `safety_qty` INT NOT NULL DEFAULT 0,
  `turnover_days` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('safe', 'warning', 'critical') NOT NULL DEFAULT 'safe',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_inventory_items_code` (`material_code`),
  KEY `idx_mes_inventory_items_factory_id` (`factory_id`),
  CONSTRAINT `fk_mes_inventory_items_factory_id`
    FOREIGN KEY (`factory_id`) REFERENCES `mes_factories` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_approval_requests` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `approval_code` VARCHAR(64) NOT NULL,
  `approval_type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `reason` VARCHAR(500) NOT NULL,
  `entity_code` VARCHAR(64) DEFAULT NULL,
  `applicant_id` BIGINT UNSIGNED DEFAULT NULL,
  `department_id` BIGINT UNSIGNED DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  `approver_id` BIGINT UNSIGNED DEFAULT NULL,
  `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_approval_requests_code` (`approval_code`),
  KEY `idx_mes_approval_requests_applicant_id` (`applicant_id`),
  KEY `idx_mes_approval_requests_department_id` (`department_id`),
  KEY `idx_mes_approval_requests_approver_id` (`approver_id`),
  CONSTRAINT `fk_mes_approval_requests_applicant_id`
    FOREIGN KEY (`applicant_id`) REFERENCES `mes_users` (`id`),
  CONSTRAINT `fk_mes_approval_requests_department_id`
    FOREIGN KEY (`department_id`) REFERENCES `mes_departments` (`id`),
  CONSTRAINT `fk_mes_approval_requests_approver_id`
    FOREIGN KEY (`approver_id`) REFERENCES `mes_users` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(64) NOT NULL,
  `setting_name` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `setting_value` JSON NOT NULL,
  `updated_by` BIGINT UNSIGNED DEFAULT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mes_system_settings_key` (`setting_key`),
  KEY `idx_mes_system_settings_updated_by` (`updated_by`),
  CONSTRAINT `fk_mes_system_settings_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `mes_users` (`id`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `mes_audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `action_code` VARCHAR(64) NOT NULL,
  `actor_id` BIGINT UNSIGNED DEFAULT NULL,
  `target_code` VARCHAR(64) DEFAULT NULL,
  `detail_json` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mes_audit_logs_actor_id` (`actor_id`),
  CONSTRAINT `fk_mes_audit_logs_actor_id`
    FOREIGN KEY (`actor_id`) REFERENCES `mes_users` (`id`)
) ENGINE=InnoDB;
