"""AI 审核结果表——独立存储，与人工审核分离"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.config.database import Base


# AiReview — 每条 AI 审核结果独立一行
class AiReview(Base):
    __tablename__ = "ai_reviews"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=False, index=True)
    item_id: Mapped[int] = mapped_column(Integer, ForeignKey("dataset_items.id"), nullable=False)
    result_id: Mapped[int] = mapped_column(Integer, ForeignKey("results.id"), nullable=False, unique=True)
    agent_id: Mapped[int] = mapped_column(Integer, ForeignKey("ai_agents.id"), nullable=False, index=True)

    verdict: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="pass/reject/human_review/error")
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    dimensions: Mapped[dict | None] = mapped_column(JSON, nullable=True, comment="各维度评分 [{name,score,reason}]")
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True, comment="综合分 0-100")

    model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    prompt_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    prompt_vars: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="pending", comment="pending/processing/done/failed")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="执行耗时(毫秒)")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
