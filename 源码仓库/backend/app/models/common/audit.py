"""
审计日志表——PDF 4.5 节"状态机所有迁移记录可追溯"

记录所有状态变更: 谁(who) + 何时(when) + 什么实体(entity) + 从哪(from) + 到哪(to) + 原因(reason)
"""
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # 操作者
    actor_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="操作者用户 ID")
    actor_name: Mapped[str] = mapped_column(String(100), nullable=False, comment="操作者姓名（冗余，方便查询）")
    actor_role: Mapped[str] = mapped_column(String(20), nullable=False, comment="操作者角色")

    # 被操作的实体
    entity_type: Mapped[str] = mapped_column(
        String(30), nullable=False, comment="实体类型: LabelResult / TaskItem / LabelTask"
    )
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False, comment="实体 ID")
    task_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False, comment="所属任务——级联删除"
    )

    # 状态变更
    action: Mapped[str] = mapped_column(
        String(30), nullable=False,
        comment="动作: submit / skip / approve / reject / publish / pause / end"
    )
    from_status: Mapped[str] = mapped_column(String(20), nullable=False, comment="变更前状态")
    to_status: Mapped[str] = mapped_column(String(20), nullable=False, comment="变更后状态")

    # 备注
    detail: Mapped[str] = mapped_column(Text, default="", comment="备注: 驳回理由 / AI 评分摘要等")

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, comment="记录时间"
    )
