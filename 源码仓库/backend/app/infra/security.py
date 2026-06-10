"""
认证安全模块——双 JWT 方案

Access Token:  短命 JWT (30min)，每次请求带在 Header，只验签名不过 Redis
Refresh Token: 长命 JWT (7day)，签发时 jti 写 Redis 白名单，刷新时删旧发新（一次性）
               每次刷新 = 旧令牌立即失效，防泄露后长期有效

依赖注入链: require_role → get_current_user → decode_access_token → Header Bearer
路由里只需 Depends(require_role("owner")) 一行完成认证+授权
"""
from datetime import datetime, timedelta, timezone
import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.config.database import get_db
from app.models.auth.user import User
from app.infra.exceptions import AppException

# auto_error=False: 允许未登录访问公开端点（如 /health），登录校验由 get_current_user 显式抛出
security_scheme = HTTPBearer(auto_error=False)

ALGORITHM = "HS256"


# ──── Access Token ────

def create_access_token(user_id: int, role: str) -> str:
    """签发 Access Token，含用户标识 + 角色，30min 过期"""
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": "access",                                          # 防止与 refresh token 混用
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": uuid.uuid4().hex,                                   # 唯一 ID，预留做撤销（当前短命不查库）
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """验证 Access Token 签名 + 过期 + 类型，纯 CPU 运算不查 Redis"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "access":
            raise AppException(401, "令牌类型错误")
        return payload
    except jwt.ExpiredSignatureError:
        raise AppException(401, "令牌已过期，请刷新")
    except jwt.InvalidTokenError:
        raise AppException(401, "无效令牌")


# ──── Refresh Token ────

def create_refresh_token(user_id: int) -> str:
    """签发 Refresh Token，7 天过期，jti 用于 Redis 白名单撤销"""
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "jti": uuid.uuid4().hex,                                   # 白名单 key，刷新时删除实现一次性
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_refresh_token(token: str) -> dict:
    """验证 Refresh Token 签名 + 过期 + 类型，查 Redis 撤销由 AuthService 负责"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise AppException(401, "令牌类型错误")
        return payload
    except jwt.ExpiredSignatureError:
        raise AppException(401, "刷新令牌已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise AppException(401, "无效刷新令牌")


# ──── 依赖注入 ────

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """从 Header 解 Access Token → 查用户表 → 注入 User 对象
    所有需要登录的端点都通过此依赖获取当前用户"""
    if not credentials:
        raise AppException(401, "请先登录")
    payload = decode_access_token(credentials.credentials)
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise AppException(401, "用户不存在")
    return user


def require_role(*roles: str):
    """角色校验依赖工厂——Spring Boot @PreAuthorize 的 FastAPI 等价物
    用法: Depends(require_role("owner")) 或 Depends(require_role("owner","reviewer"))"""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise AppException(403, f"需要 {', '.join(roles)} 权限")
        return user

    return checker
