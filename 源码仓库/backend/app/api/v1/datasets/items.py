"""
数据条目 API——CRUD + 批量导入

权限:
  查询: 所有登录角色
  创建/更新/删除: owner
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse, PageResult
from app.schemas.dataset_item import (
    DatasetItemCreate,
    DatasetItemBatchCreate,
    DatasetItemUpdate,
    DatasetItemResponse,
)
from app.services.datasets.item_service import DatasetItemService

router = APIRouter()


@router.get("/datasets/{dataset_id}/items")
def list_items(
    dataset_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = DatasetItemService(db)
    items, total = svc.list_items(dataset_id, page, page_size)
    return APIResponse.ok(
        PageResult(
            total=total, page=page, page_size=page_size,
            items=[DatasetItemResponse.model_validate(i).model_dump() for i in items],
        ).model_dump()
    )


@router.get("/datasets/{dataset_id}/items/{item_id}")
def get_item(
    dataset_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = DatasetItemService(db)
    item = svc.get(item_id, dataset_id)
    return APIResponse.ok(DatasetItemResponse.model_validate(item).model_dump())


@router.post("/datasets/{dataset_id}/items", status_code=201)
def create_item(
    dataset_id: int,
    body: DatasetItemCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    from app.services.datasets.service import DatasetService
    DatasetService(db).get(dataset_id, owner_id=user.id)
    svc = DatasetItemService(db)
    item = svc.create(dataset_id, **body.model_dump())
    return APIResponse.ok(DatasetItemResponse.model_validate(item).model_dump(), message="创建成功")


@router.post("/datasets/{dataset_id}/items/batch", status_code=201)
def batch_create_items(
    dataset_id: int,
    body: DatasetItemBatchCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    from app.services.datasets.service import DatasetService
    DatasetService(db).get(dataset_id, owner_id=user.id)
    svc = DatasetItemService(db)
    items = svc.batch_create(dataset_id, [it.model_dump() for it in body.items])
    return APIResponse.ok(
        [DatasetItemResponse.model_validate(i).model_dump() for i in items],
        message=f"成功导入 {len(items)} 条数据",
    )


@router.post("/datasets/{dataset_id}/items/batch-delete")
def batch_delete_items(
    dataset_id: int,
    body: dict,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """批量删除条目——传入 {"ids": [1,2,3]}"""
    from app.services.datasets.service import DatasetService
    DatasetService(db).get(dataset_id, owner_id=user.id)
    ids = body.get("ids", [])
    if not ids or not isinstance(ids, list):
        return APIResponse.ok(message="没有需要删除的条目")
    svc = DatasetItemService(db)
    deleted = svc.batch_delete(dataset_id, ids)
    return APIResponse.ok(message=f"成功删除 {deleted} 条数据")


@router.patch("/datasets/{dataset_id}/items/{item_id}")
def update_item(
    dataset_id: int,
    item_id: int,
    body: DatasetItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    from app.services.datasets.service import DatasetService
    DatasetService(db).get(dataset_id, owner_id=user.id)
    svc = DatasetItemService(db)
    item = svc.update(item_id, dataset_id, **body.model_dump(exclude_unset=True))
    return APIResponse.ok(DatasetItemResponse.model_validate(item).model_dump(), message="更新成功")


@router.delete("/datasets/{dataset_id}/items/{item_id}")
def delete_item(
    dataset_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    from app.services.datasets.service import DatasetService
    DatasetService(db).get(dataset_id, owner_id=user.id)
    svc = DatasetItemService(db)
    svc.delete(item_id, dataset_id)
    return APIResponse.ok(message="删除成功")
