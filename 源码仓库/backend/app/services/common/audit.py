"""审计日志 Service——写日志 + 查询"""

from sqlalchemy.orm import Session

from app.models.common.audit import AuditLog


class AuditService:
    """审计日志——记录所有状态变更"""

    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        *,
        actor_id: int,
        actor_name: str,
        actor_role: str,
        entity_type: str,
        entity_id: int,
        task_id: int,
        action: str,
        from_status: str,
        to_status: str,
        detail: str = "",
    ) -> AuditLog:
        """写入一条审计日志"""
        entry = AuditLog(
            actor_id=actor_id,
            actor_name=actor_name,
            actor_role=actor_role,
            entity_type=entity_type,
            entity_id=entity_id,
            task_id=task_id,
            action=action,
            from_status=from_status,
            to_status=to_status,
            detail=detail,
        )
        self.db.add(entry)
        self.db.commit()
        return entry

    def list_by_task(self, task_id: int, limit: int = 50) -> list[AuditLog]:
        """查询某任务的所有审计日志，按时间倒序"""
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.task_id == task_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )
