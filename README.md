# MES 制造执行系统工程化演示项目

一个面向离散制造场景的 MES 前后端演示项目，覆盖登录认证、工单执行、质量追溯、审批协同、设备与库存看板等典型业务模块。

项目当前同时提供两种运行方式：

- 本地全栈模式：`Vue 3 + Vite` 前端，配合 `Node.js` API 使用
- GitHub Pages 演示模式：自动构建为纯静态站点，使用前端内置的静态演示数据

## 在线预览

- GitHub Pages：`https://act330.github.io/mes-manufacturing-system-demo/`
- 自动部署：推送到 `main` 分支后，GitHub Actions 会自动构建并发布 Pages

说明：GitHub Pages 版本为静态演示模式，适合展示界面与交互流程；本地运行时可以连接仓库内的 Node API，体验完整登录态与接口流程。

## 项目截图

### 登录页

![MES 登录页](docs/screenshots/login.jpg)

### 首页看板

![MES 首页看板](docs/screenshots/dashboard.jpg)

### 履历追溯

![MES 履历追溯](docs/screenshots/traceability.jpg)

### 审批协同

![MES 审批协同](docs/screenshots/approval.jpg)

## 核心能力

- 登录认证、登录态恢复、权限菜单过滤
- 首页经营看板与核心生产指标展示
- 生产配置、客户、工艺、条码、设备、仓储等业务视图
- 工单执行进度、优先级、良率与状态追踪
- 批次号、SN、工单号多维履历追溯
- 审批流处理与系统开关配置
- GitHub Pages 静态演示模式与本地全栈模式双运行形态

## 技术栈

- 前端：`Vue 3`、`Vite`、`Vue Router`、`Pinia`、`Axios`
- 后端：`Node.js HTTP API`
- 数据：本地种子数据 + 运行时 JSON 持久化
- 数据库设计：提供 `MySQL` 建表与种子脚本
- 部署：`GitHub Actions` + `GitHub Pages`

## 目录结构

```text
.
├─ src/                    前端源码
├─ server/                 Node API 与运行时数据
├─ database/               MySQL 表结构与种子脚本
├─ docs/                   文档与项目截图
├─ .github/workflows/      GitHub Actions 自动部署
├─ index.html
├─ vite.config.mjs
└─ package.json
```

## 本地启动

安装依赖：

```powershell
npm install
```

同时启动前端与后端：

```powershell
npm run dev
```

默认访问地址：

- 前端：`http://localhost:5188`
- 后端：`http://localhost:3001`

生产构建：

```powershell
npm run build
```

生产模式启动：

```powershell
npm start
```

环境变量示例：

```powershell
Copy-Item .env.example .env
```

生产环境模板：

```powershell
Copy-Item .env.production.example .env
```

认证会话说明：

- 登录后默认使用 `HttpOnly Cookie`
- 支持 `access + refresh` 双会话
- 支持 `logout-all`
- 已预留 SSO 接口和环境变量

正式启动：

```powershell
npm run start:prod
```

自动化测试：

```powershell
npm test
```

## 演示账号

- `admin / 123456 / FAC-001`
- `planner / 123456 / FAC-002`
- `quality / 123456 / FAC-003`
- `operator / 123456 / FAC-001`

## P0 进展

当前仓库已经补上以下企业化基础能力：

- 后端接口返回的数据会按角色权限和工厂范围收口，不再对普通账号返回全量业务数据
- 审计日志会持久化到本地运行时数据；启用 MySQL 后可同步写入 `mes_audit_logs`
- 后端新增 MySQL 背板开关，可用于接管账号、角色、权限和审计链路
- `workOrders`、`traceLots`、`approvals`、`settings` 已支持从 MySQL 真实读取；对应审批和系统开关操作也可直接回写数据库
- `customers`、`processRoutes`、`barcodeRules` 已支持从 MySQL 读取；条码签发可直接写入 `mes_barcode_serials`
- `equipment`、`inventory`、`exceptions` 已支持从 MySQL 读取；`defectTop` 已改为基于 `mes_work_order_logs` 聚合输出
- `weeklyOutput`、`monthlyTrend` 已改为基于 `mes_work_order_logs(event_type=production_report)` 聚合输出，不再依赖静态数组或工单表临时推导

启用 MySQL 模式时：

1. 先执行 [`database/mysql_schema.sql`](database/mysql_schema.sql)
2. 再执行 [`database/mysql_seed.sql`](database/mysql_seed.sql)
3. 将 `.env` 中的 `MES_DATA_DRIVER` 设置为 `mysql`
4. 配置 `MES_MYSQL_URL` 或 `MES_MYSQL_HOST`/`MES_MYSQL_DATABASE`/`MES_MYSQL_USER`

常用命令：

```powershell
# 初始化数据库（库已存在时会跳过重复 seed）
npm run db:init

# 重建数据库并重新导入 schema + seed
npm run db:reset

# 启动临时服务并做 MySQL 冒烟验证
npm run smoke:mysql

# 一键初始化并做冒烟验证
npm run setup:mysql

# 一键重建数据库并做冒烟验证
npm run setup:mysql:reset

# 导出数据库备份
npm run db:backup

# 导入数据库备份
npm run db:restore -- --input=backups/your-backup.sql
```

说明：当前阶段已经完成看板与核心业务数据的 MySQL 化；后续可以继续把 ERP、WMS、设备采集与更多执行明细逐步替换到真实 DAO 层。

## Docker

仓库已提供 [`Dockerfile`](Dockerfile) 和 [`docker-compose.yml`](docker-compose.yml)。

启动方式：

```powershell
docker compose up --build
```

默认行为：

- `mysql` 服务会自动初始化 `mes_core`
- 会自动执行 [`database/mysql_schema.sql`](database/mysql_schema.sql)
- 会自动执行 [`database/mysql_seed.sql`](database/mysql_seed.sql)
- `app` 服务会以 `MES_DATA_DRIVER=mysql` 连接容器内 MySQL

默认访问地址：

- Web/API：`http://localhost:3000`
- MySQL（宿主机调试端口）：`127.0.0.1:3307`

## 文档

- [部署说明](docs/deployment.md)
- [上线检查清单](docs/go-live-checklist.md)
- [外部集成说明](docs/integrations.md)

## GitHub Pages 部署说明

仓库中已包含 [deploy-pages.yml](.github/workflows/deploy-pages.yml) 工作流，默认行为如下：

- 监听 `main` 分支推送
- 使用 `npm ci` 安装依赖
- 以仓库名作为 `base` 路径执行 Vite 构建
- 开启 `VITE_STATIC_DEMO=true`，生成适合 Pages 的静态演示版本
- 自动补充 `404.html` 以支持 Vue Router 刷新
- 发布到 GitHub Pages

## 后续可扩展方向

1. 将 `server/backend/store.js` 替换为真实 MySQL DAO 层
2. 增加 JWT 刷新、统一鉴权中间件与更完整的审计日志
3. 将演示数据逐步替换为真实 ERP、WMS、设备采集接口
4. 增加工单报工、过站、异常闭环、设备保养等高频业务能力
