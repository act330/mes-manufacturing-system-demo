# MES 制造执行系统工程化项目

这个项目已经从单页原型升级成标准工程结构：

- 前端：`Vue 3 + Vite + Vue Router + Pinia + Axios`
- 后端：`Node.js HTTP API`
- 数据层：当前为本地种子数据 + 运行时 JSON 持久化
- 数据库设计：提供完整 `MySQL` 建表与种子脚本

## 目录结构

```text
.
├─ src/                    前端源码
│  ├─ App.vue
│  ├─ main.js
│  ├─ components/
│  ├─ layouts/
│  ├─ router/
│  ├─ services/
│  ├─ stores/
│  ├─ views/
│  └─ styles/
├─ server/                 后端服务
│  ├─ index.js
│  ├─ backend/
│  └─ data/                运行时数据
├─ database/               MySQL 表结构与种子脚本
├─ docs/                   API 与业务流程文档
├─ index.html              Vite 入口页
├─ vite.config.mjs         Vite 配置
└─ package.json
```

## 开发方式

安装依赖：

```powershell
npm install
```

启动前后端开发环境：

```powershell
npm run dev
```

启动后：

- 前端开发地址：`http://localhost:5188`
- 后端 API 地址：`http://localhost:3001`
- 前端通过 Vite 代理访问 `/api`

## 生产构建

构建前端：

```powershell
npm run build
```

构建产物输出到：

```text
dist/
```

启动生产服务：

```powershell
npm start
```

启动后访问：

```text
http://localhost:3000
```

## 常用脚本

- `npm run dev`
  同时启动前端开发服务器和后端 API

- `npm run build`
  打包前端工程

- `npm start`
  启动生产服务并托管 `dist`

- `npm run preview`
  预览前端构建结果

- `npm run check`
  执行 Node 语法检查

## 演示账号

- `admin / 123456 / FAC-001`
- `planner / 123456 / FAC-002`
- `quality / 123456 / FAC-003`
- `operator / 123456 / FAC-001`

工厂代码对应：

- `FAC-001`：易蓝工厂
- `FAC-002`：二号装配厂
- `FAC-003`：质量中心

## 当前保留的业务能力

- 登录认证与登录态恢复
- 首页看板
- 生产配置、客户、工艺、条码、设备、仓库等业务视图
- 工单列表与状态筛选
- 条码规则与条码签发接口
- 履历追溯查询
- 审批处理
- 系统设置开关
- 基于 Vue Router 的页面路由控制
- 基于 Pinia 的全局状态管理
- 基于 Axios 的统一 API 请求层
- MySQL 表结构设计稿

## 下一步建议

1. 把 `server/backend/store.js` 替换成真实 MySQL DAO 层。
2. 增加密码加密、JWT 或企业统一登录。
3. 增加路由懒加载、权限菜单缓存、统一错误页和 401/403 拦截。
4. 增加工单报工、过站、设备采集、异常闭环接口。
5. 如你需要，我可以下一步继续把这个 Vue 版本补成 `Element Plus/Naive UI + Axios 拦截器 + 路由守卫 + Pinia 模块拆分` 的企业级前端架构。
