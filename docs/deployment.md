# 部署说明

## 本机部署

1. 复制环境变量文件
   `Copy-Item .env.example .env`
2. 填写 `.env`
3. 初始化数据库
   `npm run db:init`
4. 启动生产构建
   `npm run start:prod`

## 生产环境变量

推荐从 `.env.production.example` 开始：

```powershell
Copy-Item .env.production.example .env
```

至少需要确认：

- `MES_JWT_SECRET`
- `MES_COOKIE_SECURE`
- `MES_ACCESS_TOKEN_TTL_SECONDS`
- `MES_REFRESH_TOKEN_TTL_SECONDS`
- `MES_SESSION_IDLE_TIMEOUT_SECONDS`
- `MES_MAX_ACTIVE_SESSIONS`

## Docker 部署

前提：

- Docker Desktop 已启动
- `MES_JWT_SECRET` 已替换为强随机值
- 可以从 `.env.docker.example` 复制出自己的容器环境文件

启动：

```powershell
docker compose up --build -d
```

查看状态：

```powershell
docker compose ps
docker compose logs -f
```

停止：

```powershell
docker compose down
```

## 健康检查

- `GET /api/health`
  用于基础存活检查
- `GET /api/health/ready`
  用于数据库就绪检查

## 会话策略

- Access Token 通过 `HttpOnly Cookie` 下发
- Refresh Token 通过单独 `HttpOnly Cookie` 下发
- 支持 `POST /api/auth/refresh` 进行轮换
- 支持 `POST /api/auth/logout-all` 撤销当前账号全部活跃会话

## 备份恢复

导出备份：

```powershell
npm run db:backup
```

导入备份：

```powershell
npm run db:restore -- --input=backups/mes_core-20260422-120000.sql
```

## CI

仓库已包含：

- 基础静态校验 + 单元测试
- MySQL 服务初始化 + 冒烟验证

工作流文件：

- `.github/workflows/ci.yml`
