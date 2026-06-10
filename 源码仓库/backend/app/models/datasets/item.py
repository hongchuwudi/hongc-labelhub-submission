"""
数据集条目表——数据集中的每一条待标注原始数据

data 存储自由 JSON，如:
  {"text": "这部电影很棒", "image_url": "https://..."}
  {"sentence": "I love this movie", "language": "en"}

标注状态由 task_items 表管理，不在此维护全局状态。
"""
from datetime import datetime
from sqlalchemy import Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class DatasetItem(Base):
    __tablename__ = "dataset_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")
    dataset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False,
        comment="所属数据集 ID——删除数据集时级联删除"
    )
    index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="在数据集中的序号（从 0 开始）")
    data: Mapped[dict] = mapped_column(JSON, nullable=False, comment="原始数据内容（自由 JSON）")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="导入时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="最近更新时间"
    )

    dataset: Mapped["Dataset"] = relationship(back_populates="items")  # noqa: F821
