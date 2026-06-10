#!/bin/bash
# ============================================
# LabelHub 前端部署脚本
# 流程: 构建 → 上传 → Nginx 配置 → 重载
# Usage: bash scripts/deploy-frontend.sh
# ============================================
set -e

SERVER="root@49.232.16.204"
SSH_KEY="D:/02_SFdate/腾讯云SSH秘钥/hongchu_1.pem"
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER"
SCP="scp -i $SSH_KEY -o StrictHostKeyChecking=no -r"

REMOTE_DIR="/home/hongchu/labelhub-web"
NGINX_DIR="/home/hongchu/nginx-https/conf.d"
DOMAIN="labelhub.hongchu.xyz"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ── 1. 构建 ──
echo "[1/4] 构建前端..."
cd "$PROJECT_ROOT/frontend"
npm run build

# ── 2. 上传 ──
echo "[2/4] 上传到服务器..."
$SSH "mkdir -p $REMOTE_DIR && rm -rf $REMOTE_DIR/*"
$SCP "$PROJECT_ROOT/frontend/dist/"* $SERVER:$REMOTE_DIR/

# ── 3. Nginx 配置 ──
echo "[3/4] 更新 Nginx 配置..."
$SSH "tee $NGINX_DIR/labelhub.conf" << 'NGINX_EOF'
# LabelHub - AI 数据标注平台
server {
    listen 443 ssl;
    server_name labelhub.hongchu.xyz;

    ssl_certificate /etc/nginx/certs/fullchain.crt;
    ssl_certificate_key /etc/nginx/certs/private.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/labelhub_access.log;
    error_log /var/log/nginx/labelhub_error.log;

    root /home/hongchu/labelhub-web;
    index index.html;

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理 → FastAPI 后端 (8000)
    location /api/ {
        proxy_pass http://172.17.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100m;
    }
}

# HTTP → HTTPS
server {
    listen 80;
    server_name labelhub.hongchu.xyz;
    return 301 https://$host$request_uri;
}
NGINX_EOF

# ── 4. 重载 ──
echo "[4/4] 重载 Nginx..."
$SSH "docker exec nginx-https nginx -t && docker exec nginx-https nginx -s reload"

echo ""
echo " 前端部署完成: https://$DOMAIN"
