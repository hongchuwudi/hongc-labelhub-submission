"""用户 API——列表查询 + 创建 AI Agent"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.services.auth.service import hash_password
from app.schemas.common import APIResponse
from app.schemas.auth import CreateAgentRequest

router = APIRouter()

@router.post("/")
def create_agent(
    body: CreateAgentRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """创建 AI Agent 账户——Owner 专用"""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        return APIResponse.error("邮箱已被使用")

    agent = User(
        name=body.name,
        email=body.email,
        password_hash=hash_password(body.password),
        role="ai_agent",
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return APIResponse.ok({"id": agent.id, "name": agent.name, "role": agent.role, "email": agent.email}, message="Agent 创建成功")


@router.get("/")
def list_users(
    role: str | None = Query(None, description="按角色筛选: labeler / reviewer / ai_agent"),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.id.asc()).all()
    return APIResponse.ok([
        {"id": u.id, "name": u.name, "role": u.role, "email": u.email} for u in users
    ])
