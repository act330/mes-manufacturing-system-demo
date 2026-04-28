# MES API 草案

当前项目内置了一个无第三方依赖的 REST API，用于把前端原型推进成正式 MES 的基础骨架。

## 认证

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sso/providers`
- `GET /api/auth/sso/start`
- `GET /api/auth/sso/callback`

登录成功后会下发 `HttpOnly Cookie`，默认包含短期 `access` 会话和长期 `refresh` 会话。
`/api/auth/me` 与 `/api/bootstrap` 返回的业务数据会按账号权限和工厂范围过滤，不再返回全量演示数据。
`/api/auth/refresh` 用于轮换刷新登录态，`/api/auth/logout-all` 用于撤销当前账号的全部活跃会话。

### 登录请求

```json
{
  "username": "admin",
  "password": "123456",
  "factory": "易蓝工厂"
}
```

### 登录响应

```json
{
  "token": "session-token",
  "version": "1.1.0",
  "user": {
    "id": "USR-001",
    "username": "admin",
    "name": "易蓝",
    "role": "系统管理员",
    "roleCode": "super_admin",
    "dept": "信息化中心",
    "factory": "易蓝工厂",
    "factoryCode": "FAC-001",
    "permissions": ["dashboard:view", "work_order:view"],
    "modules": ["dashboard", "production"]
  },
  "data": {
    "factories": [],
    "workOrders": []
  }
}
```

### SSO 说明

当前已预留 SSO 接口与环境变量：

- `MES_SSO_ENABLED`
- `MES_SSO_PROVIDER_KEY`
- `MES_SSO_PROVIDER_LABEL`
- `MES_SSO_AUTH_URL`
- `MES_SSO_CLIENT_ID`
- `MES_SSO_SCOPE`
- `MES_SSO_CALLBACK_URL`

在未配置完成前：

- `GET /api/auth/sso/providers` 会返回预留提供方状态
- `GET /api/auth/sso/start` 会返回 `sso_not_configured`
- `GET /api/auth/sso/callback` 会返回 `sso_not_implemented`

## 核心业务接口

当 `MES_DATA_DRIVER=mysql` 时，以下接口会直接读取或更新 MySQL 中的真实业务数据：客户、工艺路线、条码规则、工单、设备、库存、异常、追溯、审批、系统设置；`GET /api/dashboard` 的不良 TOP 和趋势数据会基于 `mes_work_order_logs` 聚合，`POST /api/barcodes/issue` 会写入 `mes_barcode_serials`。

- `GET /api/bootstrap`
  返回前端首页和模块所需的全部基础数据。

- `GET /api/dashboard`
  返回经营总览、产量趋势、不良 TOP、工单与异常摘要。

- `GET /api/work-orders?status=进行中`
  按状态获取工单列表。

- `GET /api/work-orders/:id`
  获取单个工单详情。

- `GET /api/traceability/search?q=LOT-240418-03`
  按 SN、批次号或工单号执行追溯查询。

- `GET /api/barcodes/rules`
  获取条码规则。

- `POST /api/barcodes/issue`
  按规则批量签发条码。

  请求体示例：

```json
{
  "ruleCode": "barcode-sn",
  "workOrderId": "WO-260418-001",
  "quantity": 5
}
```

- `GET /api/approvals`
  获取审批单列表。

- `POST /api/approvals/:id/decision`
  审批通过或驳回。

  请求体示例：

```json
{
  "decision": "approved"
}
```

- `GET /api/settings`
  获取系统开关。

- `PATCH /api/settings/:key/toggle`
  切换系统开关。

## 权限设计

接口按权限码做控制，例如：

- `dashboard:view`
- `work_order:view`
- `work_order:update`
- `barcode:issue`
- `trace:view`
- `approval:decision`
- `settings:update`

前端菜单和后端接口都基于同一套权限码控制，方便后续接企业统一身份认证或细粒度菜单授权。
