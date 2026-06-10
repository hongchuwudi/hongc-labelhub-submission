"""AI Agent 模型——合并账户信息 + 审核配置"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.config.database import Base


class AiAgent(Base):
    __tablename__ = "ai_agents"

    # 账户
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="Agent 名称")
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True, comment="邮箱")
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False, comment="密码哈希")

    # 审核配置
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, comment="System Prompt 模板")
    scoring_dimensions: Mapped[dict] = mapped_column(JSON, nullable=False, comment="评分维度")
    llm_model: Mapped[str] = mapped_column(String(100), default="gpt-4o", comment="LLM 模型")

    # 元信息
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
