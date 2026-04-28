# 外部集成说明

当前仓库已预留外部系统配置位，并提供 `GET /api/integrations/status` 查看配置状态。

## 已预留环境变量

- `MES_ERP_BASE_URL`
- `MES_ERP_SNAPSHOT_PATH`
- `MES_ERP_API_TOKEN`
- `MES_ERP_API_KEY`
- `MES_ERP_API_KEY_HEADER`
- `MES_ERP_TIMEOUT_MS`
- `MES_WMS_BASE_URL`
- `MES_DEVICE_GATEWAY_URL`
- `MES_PRINTER_SERVICE_URL`

## 用途

- ERP / APS
  销售订单、主数据、BOM、工艺路线、排产计划
- WMS
  发料、入库、库存同步
- 设备采集网关
  设备状态、工艺参数、停机事件
- 打印服务
  标签打印、模板下发、打印回执

## 建议落地顺序

1. ERP 工单/主数据同步
2. 打印服务
3. WMS 出入库
4. 设备采集

## 打印服务当前能力

已提供接口：

- `POST /api/integrations/printer/preview`
- `POST /api/integrations/printer/submit`
- `GET /api/integrations/printer/jobs`
- `GET /api/integrations/printer/runtime`

说明：

- `preview` 支持：
  - `source=sample` 读取示例打印请求
  - `payload` 直接传入打印请求
  - `workOrderId + ruleCode + quantity` 从数据库取待打印条码
- `submit` 支持：
  - `mode=sample` 本地模拟打印成功
  - `mode=remote` 调用远程打印服务
- 成功提交后会写入：
  - `mes_print_jobs`
  - `mes_print_job_items`
- 对应条码状态会从 `issued` 更新为 `printed`
- `runtime` 会返回打印服务配置、打印机列表和最新打印任务

相关环境变量：

- `MES_PRINTER_SERVICE_URL`
- `MES_PRINTER_SERVICE_SUBMIT_PATH`
- `MES_PRINTER_SERVICE_STATUS_PATH`
- `MES_PRINTER_SERVICE_AUTH_MODE`
- `MES_PRINTER_SERVICE_API_TOKEN`
- `MES_PRINTER_SERVICE_API_KEY`
- `MES_PRINTER_SERVICE_API_KEY_HEADER`
- `MES_PRINTER_SERVICE_USERNAME`
- `MES_PRINTER_SERVICE_PASSWORD`
- `MES_PRINTER_SERVICE_TIMEOUT_MS`
- `MES_PRINTER_SERVICE_DEFAULT_COPIES`

示例请求文件：

- [`docs/examples/printer-print-request.json`](examples/printer-print-request.json)

## ERP / APS 当前能力

已提供接口：

- `POST /api/integrations/erp/preview`
- `POST /api/integrations/erp/sync`
- `GET /api/integrations/erp/logs`
- `GET /api/integrations/erp/runtime`

说明：

- `preview` 支持两种方式：
  - `source=sample` 读取仓库内示例快照
  - `payload` 直接传入 ERP/APS snapshot
  - 默认 `source=remote` 时会从 `MES_ERP_BASE_URL + MES_ERP_SNAPSHOT_PATH` 拉取
- `preview` 会先做字段标准化和引用校验
- `sync` 会把 snapshot 导入 MySQL 的客户、产品、工艺路线、工艺步骤、工单等主表
- `logs` 会返回同步日志与结果摘要
- `runtime` 会返回 ERP 配置摘要、最近一次成功同步和调度状态

## ERP 第二阶段

已支持：

- Bearer / API Key / Basic 三种远程鉴权模式
- `source=remote` 的远程拉取
- `mode=full` / `mode=incremental`
- `since` 增量游标
- 定时调度器（按环境变量开启）

相关环境变量：

- `MES_ERP_BASE_URL`
- `MES_ERP_SNAPSHOT_PATH`
- `MES_ERP_DELTA_PATH`
- `MES_ERP_AUTH_MODE`
- `MES_ERP_API_TOKEN`
- `MES_ERP_API_KEY`
- `MES_ERP_API_KEY_HEADER`
- `MES_ERP_USERNAME`
- `MES_ERP_PASSWORD`
- `MES_ERP_TIMEOUT_MS`
- `MES_ERP_MODE_PARAM`
- `MES_ERP_SINCE_PARAM`
- `MES_ERP_FULL_MODE_VALUE`
- `MES_ERP_INCREMENTAL_MODE_VALUE`
- `MES_ERP_SYNC_ENABLED`
- `MES_ERP_SYNC_INTERVAL_SECONDS`
- `MES_ERP_SYNC_DEFAULT_MODE`
- `MES_ERP_SYNC_ACTOR_USER_CODE`

示例 snapshot 文件：

- [`docs/examples/erp-aps-snapshot.json`](examples/erp-aps-snapshot.json)

## WMS 当前能力

已提供接口：

- `POST /api/integrations/wms/preview`
- `POST /api/integrations/wms/sync`
- `GET /api/integrations/wms/logs`
- `GET /api/integrations/wms/runtime`

说明：

- `preview` 支持三种方式：
  - `source=sample` 读取仓库内示例快照
  - `payload` 直接传入 WMS snapshot
  - 默认 `source=remote` 时会从 `MES_WMS_BASE_URL + MES_WMS_SNAPSHOT_PATH` 拉取
- `sync` 会把库存快照导入 `mes_inventory_items`
- 同步时会把出入库流水导入 `mes_inventory_transactions`
- `logs` 会返回同步日志与结果摘要
- `runtime` 会返回 WMS 配置摘要、最近一次成功同步和调度状态

## WMS 第二阶段

已支持：

- Bearer / API Key / Basic 三种远程鉴权模式
- `source=remote` 的远程拉取
- `mode=full` / `mode=incremental`
- `since` 增量游标
- 定时调度器（按环境变量开启）

相关环境变量：

- `MES_WMS_BASE_URL`
- `MES_WMS_SNAPSHOT_PATH`
- `MES_WMS_DELTA_PATH`
- `MES_WMS_AUTH_MODE`
- `MES_WMS_API_TOKEN`
- `MES_WMS_API_KEY`
- `MES_WMS_API_KEY_HEADER`
- `MES_WMS_USERNAME`
- `MES_WMS_PASSWORD`
- `MES_WMS_TIMEOUT_MS`
- `MES_WMS_MODE_PARAM`
- `MES_WMS_SINCE_PARAM`
- `MES_WMS_FULL_MODE_VALUE`
- `MES_WMS_INCREMENTAL_MODE_VALUE`
- `MES_WMS_SYNC_ENABLED`
- `MES_WMS_SYNC_INTERVAL_SECONDS`
- `MES_WMS_SYNC_DEFAULT_MODE`
- `MES_WMS_SYNC_ACTOR_USER_CODE`

示例 snapshot 文件：

- [`docs/examples/wms-snapshot.json`](examples/wms-snapshot.json)
