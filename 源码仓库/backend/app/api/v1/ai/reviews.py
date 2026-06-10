"""
reviews.py — AI 审核结果查询 API
Author: hongchuwudi
Description: AiReview 列表/详情/重跑端点
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.auth.user import User
from app.infra.security import require_role
from app.services.ai.review_service import AiReviewService
from app.schemas.common import APIResponse

router = APIRouter()


@router.get("/")
def list_reviews(
    task_id: int | None = None,
    agent_id: int | None = None,
    verdict: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    result = AiReviewService.list_reviews(db, task_id=task_id, agent_id=agent_id,
                                           verdict=verdict, status=status, page=page, page_size=page_size)
    return APIResponse.ok(result)


# 静态路由必须在动态路由 {review_id} 之前，防止被吞
@router.get("/agents-stats")
def all_agent_stats(
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    """获取所有 Agent 的审核统计"""
    stats = AiReviewService.get_all_agent_stats(db)
    return APIResponse.ok(stats)


@router.get("/agent/{agent_id}/stats")
def agent_stats(
    agent_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    """获取单个 Agent 的审核统计"""
    stats = AiReviewService.get_agent_stats(db, agent_id)
    return APIResponse.ok(stats)


@router.get("/{review_id}")
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    data = AiReviewService.get_review(db, review_id)
    if not data:
        return APIResponse.error(404, "AI 审核记录不存在")
    return APIResponse.ok(data)


@router.post("/{review_id}/rerun")
def rerun_review(
    review_id: int,
    db: Session = Depends(get_db),
    _user: User = Depends(require_role("owner", "reviewer")),
):
    """失败重跑——重新投递 MQ 消息"""
    from app.models.tasks.ai_review import AiReview

    review = db.query(AiReview).filter(AiReview.id == review_id).first()
    if not review:
        return APIResponse.error(404, "AI 审核记录不存在")
    if review.status != "failed":
        return APIResponse.error(400, "只能重跑失败的审核")

    try:
        from app.infra.mq_client import publish, AI_REVIEW_QUEUE
        publish(AI_REVIEW_QUEUE, {
            "task_id": review.task_id,
            "result_id": review.result_id,
            "item_id": review.item_id,
        })
        return APIResponse.ok(message="已重新投递审核任务")
    except Exception as e:
        return APIResponse.error(500, f"MQ 投递失败: {e}")
