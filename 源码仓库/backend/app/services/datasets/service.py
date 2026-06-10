"""数据集 Service——CRUD + 分页"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.models.tasks.task import LabelTask
from app.infra.exceptions import NotFoundException, ConflictException


class DatasetService:
    """每个请求创建新实例，db 由路由层 Depends(get_db) 注入"""

    def __init__(self, db: Session):
        self.db = db

    def list_datasets(self, owner_id: int | None = None, page: int = 1, page_size: int = 20) -> tuple[list[Dataset], int]:
        """分页查询——按更新时间倒序，可选按创建者筛选"""
        q = self.db.query(Dataset)
        if owner_id is not None:
            q = q.filter(Dataset.owner_id == owner_id)
        total = q.count()
        items = (
            q.order_by(Dataset.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, dataset_id: int, owner_id: int | None = None) -> Dataset:
        """单条查询——不存在抛 NotFoundException，提供 owner_id 时校验归属"""
        q = self.db.query(Dataset).filter(Dataset.id == dataset_id)
        if owner_id is not None:
            q = q.filter(Dataset.owner_id == owner_id)
        ds = q.first()
        if not ds:
            raise NotFoundException("数据集")
        return ds

    def create(self, **kwargs) -> Dataset:
        """创建——add + commit + refresh 三步标准流程"""
        ds = Dataset(**kwargs)
        self.db.add(ds)
        self.db.commit()
        self.db.refresh(ds)
        return ds

    def update(self, dataset_id: int, owner_id: int | None = None, **kwargs) -> Dataset:
        """更新——None 值跳过，只改传了内容的字段"""
        ds = self.get(dataset_id, owner_id=owner_id)
        for key, val in kwargs.items():
            if val is not None:
                setattr(ds, key, val)
        self.db.commit()
        self.db.refresh(ds)
        return ds

    def delete(self, dataset_id: int, owner_id: int | None = None) -> None:
        """删除——检查关联数据后级联删除"""
        ds = self.get(dataset_id, owner_id=owner_id)

        refs: list[str] = []
        if self.db.query(DatasetItem).filter(DatasetItem.dataset_id == dataset_id).first():
            refs.append("数据条目")
        if self.db.query(LabelTask).filter(LabelTask.dataset_id == dataset_id).first():
            refs.append("标注任务")

        if refs:
            raise ConflictException(f"数据集已关联{'、'.join(refs)}，请先删除关联数据后再删除数据集")

        try:
            self.db.delete(ds)
            self.db.commit()
        except IntegrityError as e:
            self.db.rollback()
            raise ConflictException(f"数据集存在外部引用，无法删除：{e.orig}")
