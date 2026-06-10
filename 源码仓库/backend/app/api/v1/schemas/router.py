"""Schema API——标注模板 CRUD + 数据隔离 + owner_id JWT 注入"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse, PageResult
from app.schemas.label_schema import LabelSchemaCreate, LabelSchemaUpdate, LabelSchemaResponse
from app.services.schemas.service import SchemaService

router = APIRouter()


@router.get("/")
def list_schemas(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = SchemaService(db)
    # Owner 只看自己的，Labeler/Reviewer 看全部
    owner_id = user.id if user.role == "owner" else None
    items, total = svc.list_schemas(owner_id, page, page_size)
    return APIResponse.ok(
        PageResult(total=total, page=page, page_size=page_size, items=items).model_dump()
    )


@router.get("/{schema_id}")
def get_schema(
    schema_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = SchemaService(db)
    owner_id = user.id if user.role == "owner" else None
    schema = svc.get(schema_id, owner_id=owner_id)
    return APIResponse.ok(LabelSchemaResponse.model_validate(schema).model_dump(by_alias=True))


@router.post("/", status_code=201)
def create_schema(
    body: LabelSchemaCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = SchemaService(db)
    data = body.model_dump(by_alias=True)
    data["owner_id"] = user.id
    schema = svc.create(**data)
    return APIResponse.ok(LabelSchemaResponse.model_validate(schema).model_dump(), message="创建成功")


@router.put("/{schema_id}")
def update_schema(
    schema_id: int,
    body: LabelSchemaUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = SchemaService(db)
    schema = svc.update(schema_id, owner_id=user.id, **body.model_dump(by_alias=True, exclude_unset=True))
    return APIResponse.ok(LabelSchemaResponse.model_validate(schema).model_dump(), message="更新成功")


@router.delete("/{schema_id}")
def delete_schema(
    schema_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """删除 Schema——仅 owner 可操作，被任务引用时拒绝"""
    svc = SchemaService(db)
    svc.delete(schema_id, owner_id=user.id)
    return APIResponse.ok(message="删除成功")
