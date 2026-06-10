"""任务-条目关系表——每个任务独立持有数据集条目的标注状态

同一 dataset_item 可出现在多个 task_item（不同任务），各自独立状态。
加唯一约束防止同任务内重复分配。
"""
from datetime import datetime
from typing import Any
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class TaskItem(Base):
    __tablename__ = "task_items"
    __table_args__ = (
        UniqueConstraint("task_id", "dataset_item_id", name="uq_task_item"),
        Index("idx_task_items_claim", "task_id", "labeler_id", "status"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False
    )
    dataset_item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dataset_items.id"), nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", comment="pending/labeled/skipped"
    )
    flow_history: Mapped[list[dict[str, Any]] | None] = mapped_column(
        JSON, nullable=True, comment="条目完整流转历史 [{status, time, actor, actor_name, round}]"
    )
    labeler_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, comment="完成标注的用户 ID"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    task: Mapped["LabelTask"] = relationship(back_populates="task_items")  # noqa: F821
    item: Mapped["DatasetItem"] = relationship()  # noqa: F821
