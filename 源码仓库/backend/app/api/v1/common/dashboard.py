"""
dashboard.py — 数据看板统计 API
Author: hongchuwudi
Description: Owner 查看全局标注/审核汇总 + 按任务进度
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.config.database import get_db
from app.models.tasks.task import LabelTask
from app.models.tasks.result import LabelResult
from app.models.tasks.item import TaskItem
from app.models.tasks.ai_review import AiReview
from app.models.auth.user import User
from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.infra.security import require_role
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """全局总览——聚合查询"""
    total_tasks = db.query(func.count(LabelTask.id)).scalar() or 0
    total_items = db.query(func.count(TaskItem.id)).scalar() or 0
    labeled = db.query(func.count(TaskItem.id)).filter(TaskItem.status == "labeled").scalar() or 0
    pending = db.query(func.count(TaskItem.id)).filter(TaskItem.status == "pending").scalar() or 0
    approved = db.query(func.count(LabelResult.id)).filter(LabelResult.status == "warehouse").scalar() or 0
    rejected = db.query(func.count(LabelResult.id)).filter(LabelResult.status == "rejected").scalar() or 0
    ai_total = db.query(func.count(AiReview.id)).scalar() or 0
    ai_done = db.query(func.count(AiReview.id)).filter(AiReview.status == "done").scalar() or 0

    return APIResponse.ok({
        "total_tasks": total_tasks, "total_items": total_items,
        "labeled": labeled, "pending": pending,
        "label_rate": round(labeled / total_items * 100, 1) if total_items > 0 else 0,
        "approved": approved, "rejected": rejected,
        "pass_rate": round(approved / max(approved + rejected, 1) * 100, 1),
        "ai_total": ai_total, "ai_done": ai_done,
    })


@router.get("/tasks-progress")
def get_tasks_progress(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """按任务标注进度——batch 聚合避免 N+1"""
    tasks = db.query(LabelTask).order_by(LabelTask.updated_at.desc()).limit(20).all()
    if not tasks:
        return APIResponse.ok([])

    task_ids = [t.id for t in tasks]

    # 批量: 每个任务的 labeled/pending
    item_rows = (
        db.query(TaskItem.task_id, TaskItem.status, func.count(TaskItem.id))
        .filter(TaskItem.task_id.in_(task_ids))
        .group_by(TaskItem.task_id, TaskItem.status)
        .all()
    )
    item_map: dict[int, dict] = {}
    for tid, status, cnt in item_rows:
        if tid not in item_map:
            item_map[tid] = {"total": 0, "labeled": 0}
        item_map[tid][status] = cnt
        item_map[tid]["total"] += cnt

    # 批量: 每个任务的 warehouse/rejected 结果数
    result_rows = (
        db.query(LabelResult.task_id, LabelResult.status, func.count(LabelResult.id))
        .filter(LabelResult.task_id.in_(task_ids), LabelResult.status.in_(["warehouse", "rejected"]))
        .group_by(LabelResult.task_id, LabelResult.status)
        .all()
    )
    result_map: dict[int, dict] = {}
    for tid, status, cnt in result_rows:
        if tid not in result_map:
            result_map[tid] = {}
        result_map[tid][status] = cnt

    # 批量: 每个任务的 AI 审核数
    ai_rows = (
        db.query(AiReview.task_id, AiReview.status, func.count(AiReview.id))
        .filter(AiReview.task_id.in_(task_ids))
        .group_by(AiReview.task_id, AiReview.status)
        .all()
    )
    ai_map: dict[int, dict] = {}
    for tid, status, cnt in ai_rows:
        if tid not in ai_map:
            ai_map[tid] = {}
        ai_map[tid][status] = cnt

    result = []
    for t in tasks:
        im = item_map.get(t.id, {})
        rm = result_map.get(t.id, {})
        am = ai_map.get(t.id, {})
        total = im.get("total", 0)
        labeled = im.get("labeled", 0)
        result.append({
            "id": t.id, "title": t.title, "status": t.status,
            "total_items": total, "labeled": labeled,
            "progress": round(labeled / total * 100, 1) if total > 0 else 0,
            "warehouse": rm.get("warehouse", 0), "rejected": rm.get("rejected", 0),
            "ai_done": am.get("done", 0), "ai_total": sum(am.values()),
        })
    return APIResponse.ok(result)


@router.get("/datasets-stats")
def get_datasets_stats(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """数据集统计——全局"""
    total_datasets = db.query(func.count(Dataset.id)).scalar() or 0
    total_items = db.query(func.count(DatasetItem.id)).scalar() or 0
    # 已被任务引用的数据集数
    used_datasets = db.query(func.count(func.distinct(LabelTask.dataset_id))).scalar() or 0
    return APIResponse.ok({
        "total_datasets": total_datasets,
        "total_items": total_items,
        "used_datasets": used_datasets,
    })


@router.get("/my-datasets-stats")
def get_my_datasets_stats(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """数据集统计——仅当前用户（owner 个人数据）"""
    total_datasets = db.query(func.count(Dataset.id)).filter(Dataset.owner_id == user.id).scalar() or 0
    # 当前用户数据集下的条目总数（子查询）
    my_dataset_ids = db.query(Dataset.id).filter(Dataset.owner_id == user.id).subquery()
    total_items = db.query(func.count(DatasetItem.id)).filter(DatasetItem.dataset_id.in_(my_dataset_ids)).scalar() or 0
    # 当前用户数据集中已被任务引用的数量
    used_datasets = (
        db.query(func.count(func.distinct(LabelTask.dataset_id)))
        .filter(LabelTask.dataset_id.in_(my_dataset_ids))
        .scalar()
    ) or 0
    return APIResponse.ok({
        "total_datasets": total_datasets,
        "total_items": total_items,
        "used_datasets": used_datasets,
    })
