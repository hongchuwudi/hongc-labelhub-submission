"""
标注结果表——每条数据条目的标注记录

关键设计:
  round: 标注轮次，驳回后修正时 +1，同一 item 可有多条记录（追溯修改历史）
  labeler_type: human=人工 / ai=AI Agent（区分标注来源）
  ai_scores: AI Agent 打分的维度评分，如 {"relevance":0.9,"accuracy":0.8}
  reviewer_id + reviewed_at: 人工审核追溯

状态流转:
  submitted → ai_reviewing → final_review → warehouse（归档）
  任一环节可被驳回 → rejected → 标注员修改后重新提交（round+1, 新记录）
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class LabelResult(Base):
    __tablename__ = "results"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")

    # ── 关联 ──
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False,
        comment="所属标注任务——删除任务时级联删除结果"
    )
    item_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dataset_items.id"), nullable=False, comment="对应的数据条目 ID"
    )

    # ── 标注者 ──
    labeler_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="标注者 ID: 用户 ID 或 AI Agent 标识")
    labeler_type: Mapped[str] = mapped_column(
        String(10), default="human", comment="human=人工标注, ai=AI 标注"
    )

    # ── 标注内容 ──
    data: Mapped[dict] = mapped_column(JSON, nullable=False, comment="标注结果数据，结构由 Schema 定义")
    round: Mapped[int] = mapped_column(Integer, default=1, comment="标注轮次: 1=初次, 2=驳回修正, 3=再次修正...")

    # ── 审核状态 ──
    status: Mapped[str] = mapped_column(
        String(30), default="submitted",
        comment="6态: submitted/ai_reviewing/review/final_review/warehouse/rejected"
    )
    comment: Mapped[str] = mapped_column(
        String(500), default="", comment="审核驳回时填写的驳回原因"
    )
    reviewer_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True, comment="审核人 ID"
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="审核时间")

    # ── AI 评分 ──
    ai_scores: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment="AI 按维度打分，如 {\"relevance\":0.9,\"accuracy\":0.8,\"format\":1.0}"
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="提交时间")
