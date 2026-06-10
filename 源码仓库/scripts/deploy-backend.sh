#!/bin/bash
# ============================================
# LabelHub 后端部署脚本
# 流程: 上传代码 → 安装依赖 → 重启服务
# Usage: bash scripts/deploy-backend.sh
# ============================================
set -e

SERVER="root@49.232.16.204"
SSH_KEY="D:/02_SFdate/腾讯云SSH秘钥/hongchu_1.pem"
SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no $SERVER"
SCP="scp -i $SSH_KEY -o StrictHostKeyChecking=no"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

REMOTE_APP="/opt/labelhub/backend"
SERVICE_NAME="labelhub"

# ── 1. 打包上传 ──
echo "[1/4] 打包并上传后端代码..."
cd "$PROJECT_ROOT"
tar czf /tmp/labelhub-backend.tar.gz \
    --exclude='__pycache__' \
    --exclude='.pytest_cache' \
    --exclude='*.pyc' \
    --exclude='.env' \
    backend/

$SCP /tmp/labelhub-backend.tar.gz $SERVER:/tmp/
$SSH "rm -rf $REMOTE_APP && mkdir -p /opt/labelhub && cd /opt/labelhub && tar xzf /tmp/labelhub-backend.tar.gz"

# ── 2. 同步 .env ──
echo "[2/4] 同步 .env 配置..."
$SCP "$PROJECT_ROOT/.env" $SERVER:/opt/labelhub/.env

# ── 3. 安装依赖 ──
echo "[3/4] 安装 Python 依赖..."
$SSH "cd $REMOTE_APP && pip3 install -r requirements.txt -q"

# ── 4. 重启服务 ──
echo "[4/4] 重启服务..."
$SSH "systemctl restart $SERVICE_NAME && sleep 3 && systemctl status $SERVICE_NAME --no-pager | head -5"

echo ""
echo " 后端部署完成: http://49.232.16.204:8000/docs"
echo " API 地址:      http://49.232.16.204:8000"
echo " 服务状态:      ssh root@49.232.16.204 systemctl status labelhub"
