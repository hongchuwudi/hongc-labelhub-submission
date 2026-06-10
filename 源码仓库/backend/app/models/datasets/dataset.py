"""
数据集表——Owner 上传的待标注原始数据

一个数据集包含多条 dataset_items，绑定一个 label_schema。
状态流转: pending → labeling（标注开始）→ reviewing（审核中）→ completed（已完成）
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="数据集名称")
    description: Mapped[str] = mapped_column(Text, default="", comment="数据集描述说明")
    format: Mapped[str] = mapped_column(
        SAEnum("json", "jsonl", "csv", "excel", "xlsx"), nullable=False,
        comment="数据文件格式"
    )
    item_count: Mapped[int] = mapped_column(Integer, default=0, comment="数据条目总数")
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="创建者 ID"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="最近更新时间"
    )

    # 级联删除: 删除数据集时自动删除所有关联条目
    items: Mapped[list["DatasetItem"]] = relationship(back_populates="dataset", cascade="all, delete-orphan")  # noqa: F821
