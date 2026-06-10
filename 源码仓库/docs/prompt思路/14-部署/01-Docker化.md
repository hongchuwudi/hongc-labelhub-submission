# 容器化与服务化部署

## 提示词

```
需要为 LabelHub 设计生产环境的部署架构：

1. 中间件容器化 — MySQL/Redis/RabbitMQ 用 Docker 运行，数据持久化到宿主机
2. 应用服务化 — FastAPI 后端用 systemd + gunicorn 管理，宿主机直接运行
3. 前端静态化 — React SPA build 产物由 Nginx 直接托管
4. SSL 终端 — Nginx 容器统一处理 HTTPS，Let's Encrypt 免费证书

请设计部署架构并输出部署文档。
```

---

## 实际方案：混合部署架构

### 架构概览

```
┌─────────────────────────────────────────────────────┐
│  Nginx Docker (nginx-https)                         │
│  :443 → 静态文件 + /api/ → 宿主机:8000               │
│  SSL 终端 (Let's Encrypt)                            │
└──────────────┬──────────────┬───────────────────────┘
               │              │
               ▼              ▼
┌──────────────────────┐  ┌──────────────────────────┐
│ /home/hongchu/       │  │ systemd: labelhub.service │
│   labelhub-web/      │  │ gunicorn -w 2             │
│ 前端静态文件 (SPA)    │  │ /opt/labelhub/backend     │
└──────────────────────┘  └──────────┬───────────────┘
                                     │
                          ┌──────────┼──────────┐
                          ▼          ▼          ▼
                    ┌─────────┐ ┌────────┐ ┌──────────┐
                    │ MySQL   │ │ Redis  │ │ RabbitMQ │
                    │ Docker  │ │ Docker │ │ Docker   │
                    │ :10010  │ │ :10001 │ │ :10030   │
                    └─────────┘ └────────┘ └──────────┘
```

### 为什么不用 docker-compose 全容器化？

| 考量 | 决策 | 理由 |
|------|------|------|
| 应用容器化 | **不容器化**，宿主机直接跑 | 频繁更新代码时 systemd restart 比 docker build + up 快得多 |
| 中间件 | **Docker 运行** | MySQL/Redis/RabbitMQ 配置稳定不常变，Docker 管理省心 |
| 前端 | **Nginx 静态托管** | Vite build 产物是纯静态文件，不需要 Node 运行时 |
| 进程管理 | **systemd** | Linux 原生进程管理，重启/日志/自启动开箱即用 |

### 后端部署：systemd + Gunicorn

**systemd unit** (`/etc/systemd/system/labelhub.service`)：

```ini
[Unit]
Description=LabelHub FastAPI Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/labelhub/backend
ExecStart=/usr/bin/python3 -m gunicorn app.main:app -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**部署流程** (`scripts/deploy-backend.sh`)：

```bash
# 1. 打包后端代码（排除 __pycache__/.env）
tar czf /tmp/labelhub-backend.tar.gz --exclude='__pycache__' --exclude='.env' backend/

# 2. SCP 上传到服务器 /opt/labelhub/
scp /tmp/labelhub-backend.tar.gz root@server:/tmp/

# 3. 解压 + 安装依赖
ssh root@server "rm -rf /opt/labelhub/backend && cd /opt/labelhub && tar xzf /tmp/labelhub-backend.tar.gz"
ssh root@server "cd /opt/labelhub/backend && pip3 install -r requirements.txt -q"

# 4. 同步 .env 配置（数据库密码/LLM Key 等不打包在 tar 里）
scp .env root@server:/opt/labelhub/.env

# 5. 重启服务
ssh root@server "systemctl restart labelhub"
```

### 前端部署：Nginx 静态托管

**Nginx 配置** (`/home/hongchu/nginx-https/conf.d/labelhub.conf`)：

```nginx
server {
    listen 443 ssl;
    server_name labelhub.hongchu.xyz;

    ssl_certificate /etc/nginx/certs/fullchain.crt;
    ssl_certificate_key /etc/nginx/certs/private.pem;

    root /home/hongchu/labelhub-web;
    index index.html;

    # SPA 路由：所有非文件路径 fallback 到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到宿主机 FastAPI
    location /api/ {
        proxy_pass http://172.17.0.1:8000;   # 172.17.0.1 = Docker 宿主机 IP
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 100m;
    }
}

server {
    listen 80;
    server_name labelhub.hongchu.xyz;
    return 301 https://$host$request_uri;
}
```

**部署流程** (`scripts/deploy-frontend.sh`)：

```bash
# 1. Vite 构建
cd frontend && npm run build

# 2. SCP 上传 dist/ 到服务器
scp -r frontend/dist/* root@server:/home/hongchu/labelhub-web/

# 3. 更新 Nginx 配置 + reload
ssh root@server "docker exec nginx-https nginx -t && docker exec nginx-https nginx -s reload"
```

### SSL 证书

Let's Encrypt 免费证书，通过 certbot 独立模式申请：

```bash
certbot certonly --standalone -d labelhub.hongchu.xyz
```

证书路径映射到 Nginx 容器内 `/etc/nginx/certs/`。证书 90 天有效，需定期续期：

```bash
certbot renew --quiet
```

### 中间件容器

```bash
# MySQL 8.0 — 端口 10010
docker run -d --name mysql80-10010 \
  -p 10010:3306 \
  -v /data/mysql:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=<password> \
  mysql:8.0

# Redis — 端口 10001 (缓存) + 10000 (队列)
docker run -d --name redis-10001 \
  -p 10001:6379 \
  -v /data/redis:/data \
  redis:7-alpine --requirepass <password>

# RabbitMQ — 端口 10030 (AMQP) + 15672 (管理面板)
docker run -d --name rabbitmq-10030 \
  -p 10030:5672 -p 15672:15672 \
  -v /data/rabbitmq:/var/lib/rabbitmq \
  rabbitmq:3-management
```

### 环境变量 (.env)

```ini
# 数据库 (Docker 容器，宿主机 IP)
DB_HOST=49.232.16.204
DB_PORT=10010
DB_USER=root
DB_PASSWORD=<password>
DB_NAME=labelhub

# Redis (Docker 容器)
REDIS_HOST=49.232.16.204
REDIS_PORT=10001
REDIS_PASSWORD=<password>
REDIS_DB=11

# RabbitMQ (Docker 容器)
MQ_HOST=49.232.16.204
MQ_PORT=10030
MQ_USER=admin
MQ_PASSWORD=<password>
MQ_VHOST=/

# LLM
LLM_API_KEY=<key>
LLM_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
LLM_MODEL=ep-20260514105718-jthdm
AGENT_POOL_SIZE=7

# 阿里云 OSS
OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
OSS_ACCESS_KEY_ID=<key>
OSS_ACCESS_KEY_SECRET=<secret>
OSS_BUCKET_NAME=hc-base

# JWT
JWT_SECRET=<random_32_chars>
```
