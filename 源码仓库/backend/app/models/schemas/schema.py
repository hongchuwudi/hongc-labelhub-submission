"""
标注 Schema 表——定义标注表单的 JSON Schema

存储的是 JSON Schema 格式的标注字段定义，由 Schema Designer 生成。
版本号每次更新自动 +1，不做历史表（简化设计——只保留最新版本）。

schema 字段示例:
  {
    "type": "object",
    "properties": {
      "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
      "keywords": {"type": "array", "items": {"type": "string"}}
    }
  }
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class LabelSchema(Base):
    __tablename__ = "label_schemas"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="Schema 名称")
    version: Mapped[int] = mapped_column(Integer, default=1, comment="版本号，每次修改 +1")
    schema: Mapped[dict] = mapped_column(JSON, nullable=False, comment="JSON Schema 定义内容")
    version_history: Mapped[list | None] = mapped_column(
        JSON, nullable=True, comment="历史版本 [{version, schema, updated_at}]"
    )
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="创建者 ID"
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="最近更新时间"
    )
