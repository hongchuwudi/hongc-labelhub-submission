"""
AI Agent 配置 API——Prompt 模板 + 评分维度管理（基于 AiAgent 模型）

权限:
  读: owner / reviewer（审核时需要查看评分标准）
  写: owner 仅限
"""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse, PageResult
from app.models.ai.agent import AiAgent
from app.infra.exceptions import NotFoundException


class AiAgentConfigService:
    """AI Agent 配置 CRUD（内联至 API，原独立服务已删除）"""
    def __init__(self, db: Session):
        self.db = db

    def list(self, page: int = 1, page_size: int = 20) -> tuple[list[AiAgent], int]:
        total = self.db.query(AiAgent).count()
        items = (
            self.db.query(AiAgent)
            .order_by(AiAgent.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, config_id: int) -> AiAgent:
        config = self.db.query(AiAgent).filter(AiAgent.id == config_id).first()
        if not config:
            raise NotFoundException("AI Agent")
        return config

    def create(self, **kwargs) -> AiAgent:
        config = AiAgent(**kwargs)
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config

    def update(self, config_id: int, **kwargs) -> AiAgent:
        config = self.get(config_id)
        for key, val in kwargs.items():
            if val is not None:
                setattr(config, key, val)
        self.db.commit()
        self.db.refresh(config)
        return config

    def delete(self, config_id: int) -> None:
        config = self.get(config_id)
        self.db.delete(config)
        self.db.commit()

router = APIRouter()


class AiAgentConfigResponse(BaseModel):
    """返回给前端的 AI 配置（基于 AiAgent 模型）"""
    id: int
    name: str
    system_prompt: str
    scoring_dimensions: list
    llm_model: str
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


@router.get("/")
def list_configs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    svc = AiAgentConfigService(db)
    items, total = svc.list(page, page_size)
    return APIResponse.ok(
        PageResult(
            total=total, page=page, page_size=page_size,
            items=[AiAgentConfigResponse.model_validate(i).model_dump() for i in items],
        ).model_dump()
    )


@router.get("/{config_id}")
def get_config(
    config_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    svc = AiAgentConfigService(db)
    config = svc.get(config_id)
    return APIResponse.ok(AiAgentConfigResponse.model_validate(config).model_dump())


@router.post("/", status_code=201)
def create_config(
    body: dict,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    svc = AiAgentConfigService(db)
    config = svc.create(**body)
    return APIResponse.ok(AiAgentConfigResponse.model_validate(config).model_dump(), message="创建成功")


@router.put("/{config_id}")
def update_config(
    config_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    svc = AiAgentConfigService(db)
    config = svc.update(config_id, **body)
    return APIResponse.ok(AiAgentConfigResponse.model_validate(config).model_dump(), message="更新成功")


@router.delete("/{config_id}")
def delete_config(
    config_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    svc = AiAgentConfigService(db)
    svc.delete(config_id)
    return APIResponse.ok(message="删除成功")
