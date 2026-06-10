"""
flow.py — 条目流转历史写入
Author: hongchuwudi
Description: task_items.flow_history 追加工具函数
# Function: append_flow — 给 task_item 追加一条流转记录
"""
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.tasks.item import TaskItem


# append_flow — 往 task_item.flow_history 追加一条状态记录
def append_flow(
    db: Session,
    task_id: int,
    dataset_item_id: int,
    status,
    actor: str,         # "labeler" | "ai" | "reviewer" | "system"
    actor_name: str = "",
    round_num: int = 0,
    detail: str = "",
) -> None:
    ti = db.query(TaskItem).filter(
        TaskItem.task_id == task_id,
        TaskItem.dataset_item_id == dataset_item_id,
    ).first()
    if not ti:
        return
    from enum import Enum
    status_val = status.value if isinstance(status, Enum) else status
    entry = {
        "status": status_val,
        "time": datetime.utcnow().isoformat(),
        "actor": actor,
        "actor_name": actor_name,
        "round": round_num,
        "detail": detail,
    }
    history = list(ti.flow_history) if ti.flow_history else []
    history.append(entry)
    ti.flow_history = history
