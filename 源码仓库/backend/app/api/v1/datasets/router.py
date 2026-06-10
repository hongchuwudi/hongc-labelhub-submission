"""数据集 API——CRUD + 分页，owner_id 由 JWT 注入"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse, PageResult
from app.schemas.dataset import DatasetCreate, DatasetUpdate, DatasetResponse
from app.services.datasets.service import DatasetService

router = APIRouter()


@router.get("/")
def list_datasets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = DatasetService(db)
    owner_id = user.id if user.role == "owner" else None
    items, total = svc.list_datasets(owner_id, page, page_size)
    return APIResponse.ok(
        PageResult(total=total, page=page, page_size=page_size, items=items).model_dump()
    )


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = DatasetService(db)
    owner_id = user.id if user.role == "owner" else None
    ds = svc.get(dataset_id, owner_id=owner_id)
    return APIResponse.ok(DatasetResponse.model_validate(ds).model_dump())


@router.post("/", status_code=201)
def create_dataset(
    body: DatasetCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = DatasetService(db)
    data = body.model_dump()
    data["owner_id"] = user.id
    ds = svc.create(**data)
    return APIResponse.ok(DatasetResponse.model_validate(ds).model_dump(), message="创建成功")


@router.patch("/{dataset_id}")
def update_dataset(
    dataset_id: int,
    body: DatasetUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = DatasetService(db)
    ds = svc.update(dataset_id, owner_id=user.id, **body.model_dump(exclude_unset=True))
    return APIResponse.ok(DatasetResponse.model_validate(ds).model_dump(), message="更新成功")


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = DatasetService(db)
    svc.delete(dataset_id, owner_id=user.id)
    return APIResponse.ok(message="删除成功")
