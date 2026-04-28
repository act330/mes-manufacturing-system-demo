# 上线检查清单

## 安全

- 已替换 `MES_JWT_SECRET`
- `MES_COOKIE_SECURE` 在 HTTPS 环境下设为 `true`
- 已确认 `MES_LOGIN_MAX_FAILURES` 与 `MES_LOGIN_LOCKOUT_MINUTES`
- 已验证 `admin / planner / quality / operator` 权限边界

## 数据

- 已执行 `npm run db:init` 或 `npm run db:reset`
- 已确认 `mes_core` 中关键表有数据
- 已执行一次 `npm run db:backup`
- 已验证恢复脚本可用

## 应用

- 已执行 `npm run check`
- 已执行 `npm test`
- 已执行 `npm run build`
- 已执行 `npm run smoke:mysql`

## 容器

- 已执行 `docker compose up --build -d`
- 已确认 `mes-mysql` 为 `healthy`
- 已确认 `mes-app` 正常启动
- 已从宿主机访问 `http://localhost:3000`

## 业务冒烟

- 登录成功
- `bootstrap` 返回工单、设备、库存、异常、追溯、审批、设置
- 条码签发成功并写入数据库
- 看板周趋势和月趋势正常展示
