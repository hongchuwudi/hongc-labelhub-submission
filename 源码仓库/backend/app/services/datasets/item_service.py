"""
数据集条目 Service——单条 CRUD + 批量导入 + item_count 同步

批量导入流程:
  前端上传 CSV/JSONL → 后端解析为 dict 列表 → batch_create 一次写入
  写入后自动 sync_item_count 更新 datasets.item_count
"""
from sqlalchemy.orm import Session

from app.models.datasets.item import DatasetItem
from app.models.datasets.dataset import Dataset
from app.infra.exceptions import NotFoundException


class DatasetItemService:

    def __init__(self, db: Session):
        self.db = db

    def list_items(self, dataset_id: int, page: int = 1, page_size: int = 50) -> tuple[list[DatasetItem], int]:
        """分页——按 index 升序"""
        q = self.db.query(DatasetItem).filter(DatasetItem.dataset_id == dataset_id)
        total = q.count()
        items = (
            q.order_by(DatasetItem.index.asc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, item_id: int, dataset_id: int) -> DatasetItem:
        item = self.db.query(DatasetItem).filter(DatasetItem.id == item_id, DatasetItem.dataset_id == dataset_id).first()
        if not item:
            raise NotFoundException("数据条目")
        return item

    def create(self, dataset_id: int, **kwargs) -> DatasetItem:
        """创建单条——自动同步计数"""
        item = DatasetItem(dataset_id=dataset_id, **kwargs)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        self._sync_item_count(dataset_id)
        return item

    def batch_create(self, dataset_id: int, items_data: list[dict]) -> list[DatasetItem]:
        """批量导入——一次性 add_all，比逐条 create 快 N 倍"""
        items = [
            DatasetItem(dataset_id=dataset_id, index=i, data=d["data"])
            for i, d in enumerate(items_data)
        ]
        self.db.add_all(items)
        self.db.commit()
        for it in items:
            self.db.refresh(it)
        self._sync_item_count(dataset_id)
        return items

    def update(self, item_id: int, dataset_id: int, **kwargs) -> DatasetItem:
        item = self.get(item_id, dataset_id)
        for key, val in kwargs.items():
            if val is not None:
                setattr(item, key, val)
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item_id: int, dataset_id: int) -> None:
        """删除——同时更新数据集的 item_count"""
        item = self.get(item_id, dataset_id)
        self.db.delete(item)
        self.db.commit()
        self._sync_item_count(dataset_id)

    def batch_delete(self, dataset_id: int, ids: list[int]) -> int:
        """批量删除——一次性 DELETE WHERE id IN (...)，只 sync 一次"""
        if not ids:
            return 0
        count = (
            self.db.query(DatasetItem)
            .filter(DatasetItem.id.in_(ids), DatasetItem.dataset_id == dataset_id)
            .delete(synchronize_session=False)
        )
        self.db.commit()
        self._sync_item_count(dataset_id)
        return count

    def _sync_item_count(self, dataset_id: int) -> None:
        """同步 datasets.item_count = COUNT(dataset_items WHERE dataset_id=?)
        插入/删除后调用，保证计数准确"""
        ds = self.db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if ds:
            ds.item_count = (
                self.db.query(DatasetItem)
                .filter(DatasetItem.dataset_id == dataset_id)
                .count()
            )
            self.db.commit()
