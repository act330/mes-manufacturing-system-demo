# MES API 草案

当前项目内置了一个无第三方依赖的 REST API，用于把前端原型推进成正式 MES 的基础骨架。

## 认证

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

登录成功后返回 `token`，前端通过 `Authorization: Bearer <token>` 传递会话。

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

## 核心业务接口

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
