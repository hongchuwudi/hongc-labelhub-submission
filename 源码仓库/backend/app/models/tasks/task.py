"""
标注任务表——Owner 创建标注项目，绑定数据集 + Schema

任务生命周期:
  draft → published（发布到任务广场）→ paused（暂停）→ ended（结束）

分发策略:
  first_come → 先到先得: 标注员在任务广场抢单，assignee_id 初始为 NULL
  assigned   → 指派: Owner 指定执行者

进度: total_items 和 completed_items 由 Service 层维护，
     progress 是计算属性（不做数据库列），前端进度条直接绑定
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config.database import Base


class LabelTask(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")

    # ── 任务基础信息 ──
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="任务标题")
    description: Mapped[str] = mapped_column(Text, default="", comment="任务描述 / 富文本说明")
    tags: Mapped[str] = mapped_column(String(500), default="", comment="标签，逗号分隔")

    # ── 关联资源 ──
    dataset_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("datasets.id"), nullable=False, comment="所属数据集 ID"
    )
    schema_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("label_schemas.id"), nullable=False, comment="使用的标注 Schema ID"
    )
    schema_snapshot: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="任务发布时冻结的 Schema 副本"
    )
    schema_version: Mapped[int] = mapped_column(
        Integer, default=1, comment="发布时使用的 Schema 版本号"
    )
    ai_agent_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("ai_agents.id"), nullable=True,
        comment="AI Agent ID——为空则不触发 AI 预审",
    )

    # ── 责任人 ──
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, comment="任务创建者 ID"
    )
    assignee_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True,
        comment="执行者 ID: 指派模式指定用户，抢单模式初始为 NULL"
    )
    assignee_type: Mapped[str] = mapped_column(
        String(20), default="labeler",
        comment="执行者类型: labeler=人工标注, ai_agent=AI 自动标注"
    )

    # ── 任务策略 ──
    deadline: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, comment="截止时间，为空则不限")
    quota: Mapped[int] = mapped_column(Integer, default=0, comment="需要标注的条目配额")
    reward_per_item: Mapped[float | None] = mapped_column(nullable=True, comment="每条奖励金额（元）")
    reward_cap: Mapped[float | None] = mapped_column(nullable=True, comment="月度奖励封顶（元）")
    distribution_strategy: Mapped[str] = mapped_column(
        String(20), default="first_come",
        comment="分发策略: first_come=抢单, assigned=指派, quota_grab=配额抢单"
    )
    grab_limit: Mapped[int | None] = mapped_column(
        Integer, nullable=True, comment="配额抢单时每人最大可领条数，NULL=无限制"
    )

    # ── 状态机 ──
    status: Mapped[str] = mapped_column(
        String(20), default="draft",
        comment="draft=草稿, published=已发布, paused=已暂停, ended=已结束"
    )

    # ── 进度 ──
    total_items: Mapped[int] = mapped_column(Integer, default=0, comment="任务分配的总条目数")
    completed_items: Mapped[int] = mapped_column(Integer, default=0, comment="已完成标注的条目数")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="创建时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="最近更新时间"
    )

    task_items: Mapped[list["TaskItem"]] = relationship(back_populates="task", cascade="all, delete-orphan")  # noqa: F821

    @property
    def progress(self) -> float:
        if self.total_items == 0:
            return 0.0
        return round(self.completed_items / self.total_items * 100, 1)

    @property
    def claimed_items(self) -> int:
        """配额抢单已认领条数——避免 lazy-load 全量 task_items（性能杀手）"""
        return getattr(self, '_claimed_items', 0)
