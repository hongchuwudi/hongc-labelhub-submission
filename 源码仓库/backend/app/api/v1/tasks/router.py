"""
任务 API——CRUD + 认领 + 结果提交

权限:
  Owner:   创建/更新/查看所有结果
  Labeler: 认领/提交结果
  Reviewer: 查看结果
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.schemas.common import APIResponse, PageResult
from app.schemas.task import (
    LabelTaskCreate,
    LabelTaskUpdate,
    LabelTaskResponse,
    LabelResultCreate,
    LabelResultResponse,
)
from app.services.tasks.service import TaskService

router = APIRouter()


# ── 任务 CRUD ──

@router.get("/")
def list_tasks(
    dataset_id: int | None = Query(None),
    assignee_id: int | None = Query(None),
    status: str | None = Query(None),
    tags: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    """分页查询——Owner 只看自己的，Labeler/Reviewer 看全部"""
    svc = TaskService(db)
    owner_id = user.id if user.role == "owner" else None
    items, total = svc.list_tasks(dataset_id, assignee_id, status, tags, owner_id, page, page_size)

    # 批量计算 claimed_items 避免 N+1 查询
    task_ids = [t.id for t in items]
    if task_ids:
        from app.models.tasks.item import TaskItem
        counts = (
            db.query(TaskItem.task_id, func.count(TaskItem.id))
            .filter(TaskItem.task_id.in_(task_ids), TaskItem.labeler_id.isnot(None))
            .group_by(TaskItem.task_id)
            .all()
        )
        claimed_map = {tid: cnt for tid, cnt in counts}
    else:
        claimed_map = {}

    result = []
    for t in items:
        d = LabelTaskResponse.model_validate(t).model_dump()
        d["claimed_items"] = claimed_map.get(t.id, 0)
        result.append(d)

    return APIResponse.ok(
        PageResult(total=total, page=page, page_size=page_size, items=result).model_dump()
    )


@router.get("/{task_id}")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "labeler", "reviewer")),
):
    svc = TaskService(db)
    owner_id = user.id if user.role == "owner" else None
    task = svc.get(task_id, owner_id=owner_id)
    return APIResponse.ok(LabelTaskResponse.model_validate(task).model_dump())


@router.post("/", status_code=201)
def create_task(
    body: LabelTaskCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    svc = TaskService(db)
    data = body.model_dump()
    data["owner_id"] = user.id
    task = svc.create(**data)
    return APIResponse.ok(LabelTaskResponse.model_validate(task).model_dump(), message="创建成功")


@router.patch("/{task_id}")
def update_task(
    task_id: int,
    body: LabelTaskUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """更新任务——发布/暂停/结束/修改配置"""
    svc = TaskService(db)
    task = svc.update(task_id, owner_id=user.id, **body.model_dump(exclude_unset=True))
    return APIResponse.ok(LabelTaskResponse.model_validate(task).model_dump(), message="更新成功")


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """删除任务——仅草稿和已结束可删除"""
    from app.services.tasks.service import TaskService
    svc = TaskService(db)
    svc.delete(task_id, owner_id=user.id)
    return APIResponse.ok(message="删除成功")


# ── 认领 ──

@router.post("/{task_id}/claim")
def claim_task(
    task_id: int,
    count: int | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler")),
):
    """标注员认领任务——quota_grab 可指定条数"""
    svc = TaskService(db)
    task = svc.claim(task_id, user.id, count)
    return APIResponse.ok(LabelTaskResponse.model_validate(task).model_dump(), message="认领成功")


# ── 标注工作台：条目列表（task_items JOIN dataset_items）──

@router.get("/{task_id}/items")
def list_task_items(
    task_id: int,
    status: str | None = Query(None, description="按状态筛选: pending / labeled / skipped"),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler", "owner")),
):
    """返回任务的全量条目——左侧任务队列。

    Owner 只能看自己的任务，Labeler 只能看已认领的任务。
    不做分页——条目数上限由任务配额控制，典型值 ≤ 200。
    """
    svc = TaskService(db)
    svc.check_task_access(task_id, user.id, user.role)
    items = svc.list_task_items(task_id, status=status, labeler_id=user.id)
    return APIResponse.ok(items)


@router.get("/{task_id}/items/{item_id}")
def get_task_item(
    task_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler", "owner")),
):
    """单条详情——原始数据 + 该标注员最近一次提交结果"""
    svc = TaskService(db)
    svc.check_task_access(task_id, user.id, user.role)
    item = svc.get_task_item(task_id, item_id, user.id)
    return APIResponse.ok(item)


@router.post("/{task_id}/items/{item_id}/skip")
def skip_task_item(
    task_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler")),
):
    """跳过当前条目——状态变为 skipped，随时可回头继续标注"""
    svc = TaskService(db)
    svc.check_task_access(task_id, user.id, user.role)
    svc.skip_item(task_id, item_id, user.id)
    return APIResponse.ok(message="已跳过")


# ── 标注工作台：我的结果 & 统计 ──

@router.get("/{task_id}/my-results")
def list_my_results(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler")),
):
    """当前标注员的任务提交记录——右侧时间轴 + 修正页使用"""
    svc = TaskService(db)
    svc.check_task_access(task_id, user.id, user.role)
    results = svc.list_my_results(task_id, user.id)
    return APIResponse.ok(
        [LabelResultResponse.model_validate(r).model_dump() for r in results]
    )


@router.get("/{task_id}/my-stats")
def get_my_stats(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler", "reviewer", "owner")),
):
    """当前标注员在该任务的统计——右侧卡片"""
    svc = TaskService(db)
    svc.check_task_access(task_id, user.id, user.role)
    stats = svc.get_my_stats(task_id, user.id)
    return APIResponse.ok(stats)


# ── 标注结果 & 审核流转 ──

@router.get("/{task_id}/results")
def list_results(
    task_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner", "reviewer")),
):
    """查询任务的所有标注结果——审核员/Owner 用"""
    svc = TaskService(db)
    owner_id = user.id if user.role == "owner" else None
    results = svc.list_results(task_id, owner_id=owner_id)
    return APIResponse.ok(
        [LabelResultResponse.model_validate(r).model_dump() for r in results]
    )


@router.post("/{task_id}/results", status_code=201)
def create_result(
    task_id: int,
    body: LabelResultCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("labeler")),
):
    """提交一条标注结果——labeler_id/labeler_type 从 JWT 获取"""
    svc = TaskService(db)
    data = body.model_dump()
    data["labeler_id"] = user.id
    data["labeler_type"] = "human"
    result = svc.create_result(task_id, **data)
    return APIResponse.ok(LabelResultResponse.model_validate(result).model_dump(), message="提交成功")


@router.patch("/{task_id}/results/{result_id}")
def review_result(
    task_id: int,
    result_id: int,
    target_status: str = Query(..., description="final_review(初审通过) / warehouse(终审通过) / rejected(打回)"),
    comment: str = Query("", description="驳回时必填理由"),
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_role("reviewer")),
):
    """审核标注结果——初审→终审/打回, 终审→入库/打回"""
    svc = TaskService(db)
    result = svc.review_result(
        task_id=task_id,
        result_id=result_id,
        reviewer_id=reviewer.id,
        reviewer_name=reviewer.name,
        reviewer_role=reviewer.role,
        target_status=target_status,
        comment=comment,
    )
    label_map = {"final_review": "初审通过→终审", "warehouse": "终审通过→入库", "rejected": "已打回"}
    return APIResponse.ok(
        LabelResultResponse.model_validate(result).model_dump(),
        message=label_map.get(target_status, target_status),
    )


@router.post("/{task_id}/results/batch-review")
def batch_review(
    task_id: int,
    result_ids: list[int] = Query(..., description="要审核的结果 ID 列表"),
    target_status: str = Query(..., description="final_review / warehouse / rejected"),
    comment: str = Query("", description="驳回时必填理由"),
    db: Session = Depends(get_db),
    reviewer: User = Depends(require_role("reviewer")),
):
    """批量审核——对多条结果执行相同的审核操作"""
    from app.schemas.task import LabelResultResponse

    svc = TaskService(db)
    results = []
    errors = []
    for rid in result_ids:
        try:
            r = svc.review_result(
                task_id=task_id, result_id=rid,
                reviewer_id=reviewer.id, reviewer_name=reviewer.name,
                reviewer_role=reviewer.role, target_status=target_status, comment=comment,
            )
            results.append(LabelResultResponse.model_validate(r).model_dump())
        except Exception as e:
            errors.append({"result_id": rid, "error": str(e)})
    return APIResponse.ok(
        {"reviewed": len(results), "errors": errors},
        message=f"已处理 {len(results)} 条" + (f"，{len(errors)} 条失败" if errors else ""),
    )


# ── 审计日志 ──

@router.get("/{task_id}/audit-logs")
def list_audit_logs(
    task_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer", "labeler")),
):
    """查询任务的所有审计日志——按时间倒序"""
    from app.services.common.audit import AuditService
    svc = AuditService(db)
    logs = svc.list_by_task(task_id, limit)
    return APIResponse.ok([
        {
            "id": log.id,
            "actor_id": log.actor_id,
            "actor_name": log.actor_name,
            "actor_role": log.actor_role,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "task_id": log.task_id,
            "action": log.action,
            "from_status": log.from_status,
            "to_status": log.to_status,
            "detail": log.detail,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ])


# ── 数据导出 ──

@router.post("/{task_id}/exports", status_code=201)
def create_export(
    task_id: int,
    format: str = Query("json", description="json / jsonl / csv / xlsx"),
    field_mapping: str = Query("", description="JSON: {fields:[...], rename:{...}, include_review:bool}"),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("owner")),
):
    """创建导出任务——入 MQ 异步处理"""
    from app.services.common.export import ExportService
    from app.infra.mq_client import publish, EXPORT_QUEUE
    import json as _json

    svc = ExportService(db)
    mapping = None
    if field_mapping.strip():
        try:
            mapping = _json.loads(field_mapping)
        except _json.JSONDecodeError:
            pass

    job = svc.create_job(task_id, user.id, format, mapping)

    try:
        publish(EXPORT_QUEUE, {"job_id": job.id})
    except Exception:
        svc.process_job(job.id)
        return APIResponse.ok(_job_to_dict(job), message="导出完成（同步）")

    return APIResponse.ok(_job_to_dict(job), message="导出任务已创建")


@router.get("/{task_id}/exports")
def list_exports(
    task_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """查询导出历史"""
    from app.services.common.export import ExportService
    svc = ExportService(db)
    jobs = svc.list_jobs(task_id)
    return APIResponse.ok([_job_to_dict(j) for j in jobs])


@router.get("/exports/{job_id}")
def get_export(
    job_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """查询单个导出任务状态"""
    from app.services.common.export import ExportService
    svc = ExportService(db)
    job = svc.get_job(job_id)
    if not job:
        from app.infra.exceptions import NotFoundException
        raise NotFoundException("导出任务")
    return APIResponse.ok(_job_to_dict(job))


@router.get("/exports/{job_id}/download")
def download_export(
    job_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner")),
):
    """生成 OSS 签名下载链接"""
    from app.services.common.export import ExportService
    svc = ExportService(db)
    job = svc.get_job(job_id)
    if not job or job.status != "done":
        from app.infra.exceptions import NotFoundException
        raise NotFoundException("导出文件")
    url = svc.generate_download_url(job_id)
    return APIResponse.ok({"url": url})


def _job_to_dict(job) -> dict:
    return {
        "id": job.id,
        "task_id": job.task_id,
        "format": job.format,
        "status": job.status,
        "file_name": job.file_name,
        "item_count": job.item_count,
        "field_mapping": job.field_mapping,
        "error_message": job.error_message,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "finished_at": job.finished_at.isoformat() if job.finished_at else None,
    }
