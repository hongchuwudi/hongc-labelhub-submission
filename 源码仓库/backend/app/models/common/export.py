"""导出任务表——异步导出 + 下载历史"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class ExportJob(Base):
    __tablename__ = "export_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False,
        comment="所属任务"
    )
    requested_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="发起导出的 Owner ID"
    )

    format: Mapped[str] = mapped_column(
        String(10), nullable=False, comment="json / jsonl / csv / xlsx"
    )
    status: Mapped[str] = mapped_column(
        String(20), default="pending", comment="pending / processing / done / failed"
    )
    file_path: Mapped[str | None] = mapped_column(
        String(500), nullable=True, comment="导出文件路径"
    )
    file_name: Mapped[str | None] = mapped_column(
        String(200), nullable=True, comment="下载显示文件名"
    )
    field_mapping: Mapped[str | None] = mapped_column(
        Text, nullable=True,
        comment="JSON 字符串: {fields:[...], rename:{...}}，为空则全量导出"
    )
    error_message: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="失败原因"
    )
    item_count: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="导出的记录数"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
