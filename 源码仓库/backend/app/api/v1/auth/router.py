"""
认证 API——注册/登录/刷新/个人信息

所有端点均不校验角色（公开），/me 需要登录态（Bearer Token）
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.schemas.common import APIResponse
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    UserResponse,
)
from app.services.auth.service import AuthService
from app.infra.security import get_current_user
from app.models.auth.user import User

router = APIRouter()


@router.post("/register", status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """注册——默认角色 labeler，注册成功直接返回令牌对"""
    svc = AuthService(db)
    tokens = svc.register(**body.model_dump())
    return APIResponse.ok(tokens, message="注册成功")


@router.post("/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """登录——返回双 JWT，前端存 refresh_token 用于无感刷新"""
    svc = AuthService(db)
    tokens = svc.login(**body.model_dump())
    return APIResponse.ok(tokens, message="登录成功")


@router.post("/refresh")
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    """刷新令牌——用 Refresh JWT 换新令牌对，旧 Refresh Token 立即失效"""
    svc = AuthService(db)
    tokens = svc.refresh(body.refresh_token)
    return APIResponse.ok(tokens, message="令牌已刷新")


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """当前用户信息——需 Bearer Token，可用于前端判断角色渲染不同页面"""
    return APIResponse.ok(UserResponse.model_validate(user).model_dump())
