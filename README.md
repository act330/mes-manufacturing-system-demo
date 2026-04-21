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

## 演示账号

- `admin / 123456 / FAC-001`
- `planner / 123456 / FAC-002`
- `quality / 123456 / FAC-003`
- `operator / 123456 / FAC-001`

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
