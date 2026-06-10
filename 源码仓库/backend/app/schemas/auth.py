"""
认证相关 Schema——入参校验 + 出参序列化

Post/Register/Login: 前端请求体校验（Pydantic 自动 422）
Response: ORM → JSON 序列化（from_attributes=True 自动从 SQLAlchemy 对象取值）
"""
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    """注册请求——默认角色 labeler，Owner 需要手动指定"""
    name: str
    email: str
    password: str
    role: str = "labeler"

    model_config = {"json_schema_extra": {"examples": [{"name": "张三", "email": "zhangsan@test.com", "password": "123456", "role": "labeler"}]}}


class LoginRequest(BaseModel):
    """登录请求——只需邮箱和密码"""
    email: str
    password: str

    model_config = {"json_schema_extra": {"examples": [{"email": "admin@labelhub.com", "password": "admin123"}]}}


class TokenResponse(BaseModel):
    """双 JWT 令牌对——前端存 refresh_token，access_token 每次请求带 Header"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """刷新令牌请求——传 refresh_token 换新令牌对"""
    refresh_token: str

    model_config = {"json_schema_extra": {"examples": [{"refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}]}}


class UserResponse(BaseModel):
    """用户信息——/auth/me 返回，avatar 默认空"""
    id: int
    name: str
    email: str
    role: str
    avatar: str = ""

    model_config = {"from_attributes": True}   # 允许从 SQLAlchemy ORM 对象直接转换

class CreateAgentRequest(BaseModel):
    """创建 AI Agent 账户请求"""
    name: str
    email: str
    password: str
