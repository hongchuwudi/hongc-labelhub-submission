"""AI Agent API — CRUD"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.ai.agent import AiAgent
from app.models.auth.user import User
from app.infra.security import require_role
from app.services.auth.service import hash_password
from app.schemas.common import APIResponse
from app.schemas.ai import AiAgentCreate, AiAgentUpdate

router = APIRouter()


def _reload_pool():
    """Agent 变更后同步到运行中的 Agent 池"""
    try:
        from app.agents.pool import pool
        pool.reload()
    except Exception:
        pass  # 池未启动时忽略


@router.get("/")
def list_agents(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    q = db.query(AiAgent)
    total = q.count()
    items = q.order_by(AiAgent.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return APIResponse.ok({
        "total": total, "page": page, "page_size": page_size,
        "items": [{"id": a.id, "name": a.name, "email": a.email,
                    "system_prompt": a.system_prompt, "scoring_dimensions": a.scoring_dimensions,
                    "llm_model": a.llm_model, "created_by": a.created_by,
                    "created_at": a.created_at.isoformat(), "updated_at": a.updated_at.isoformat()}
                   for a in items]
    })


@router.post("/", status_code=201)
def create_agent(
    body: AiAgentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    existing = db.query(AiAgent).filter(AiAgent.email == body.email).first()
    if existing:
        return APIResponse.error("邮箱已被使用")
    agent_user = User(name=body.name, email=body.email, password_hash=hash_password(body.password), role="ai_agent")
    db.add(agent_user)
    db.flush()
    agent = AiAgent(name=body.name, email=body.email, password_hash=hash_password(body.password),
                    system_prompt=body.system_prompt, scoring_dimensions=body.scoring_dimensions,
                    llm_model=body.llm_model, created_by=user.id)
    db.add(agent)
    db.commit()
    db.refresh(agent)
    _reload_pool()
    return APIResponse.ok({"id": agent.id, "name": agent.name}, message="Agent 创建成功")


@router.put("/{agent_id}")
def update_agent(
    agent_id: int, body: AiAgentUpdate,
    db: Session = Depends(get_db), _user: User = Depends(require_role("owner")),
):
    agent = db.query(AiAgent).filter(AiAgent.id == agent_id).first()
    if not agent:
        return APIResponse.error("Agent 不存在")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(agent, k, v)
    db.commit()
    _reload_pool()
    return APIResponse.ok(message="更新成功")


@router.delete("/{agent_id}")
def delete_agent(
    agent_id: int, db: Session = Depends(get_db), _user: User = Depends(require_role("owner")),
):
    agent = db.query(AiAgent).filter(AiAgent.id == agent_id).first()
    if not agent:
        return APIResponse.error("Agent 不存在")
    db.query(User).filter(User.email == agent.email, User.role == "ai_agent").delete()
    db.delete(agent)
    db.commit()
    _reload_pool()
    return APIResponse.ok(message="已删除")


@router.get("/status")
def get_agents_status(_user: User = Depends(require_role("owner"))):
    """获取 Agent 池运行状态（Agent 列表 + 池统计）"""
    try:
        from app.agents.pool import pool
        return APIResponse.ok(pool.get_status())
    except Exception:
        return APIResponse.ok({"agents": [], "pool_size": 0, "busy_count": 0, "pending_count": 0},
                              message="Agent 池未启动")
