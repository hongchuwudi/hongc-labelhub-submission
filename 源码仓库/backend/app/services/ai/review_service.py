"""
review_service.py — AI 审核结果查询服务
Author: hongchuwudi
Description: AiReview 表的列表/详情查询
# Class: AiReviewService — AiReview 查询
"""
import logging
from sqlalchemy.orm import Session
from app.models.tasks.ai_review import AiReview
from app.models.ai.agent import AiAgent
from app.models.tasks.task import LabelTask
from app.models.tasks.result import LabelResult
from app.models.datasets.item import DatasetItem

logger = logging.getLogger("ai_review_service")


# AiReviewService — 查询 AiReview 表并提供关联数据
class AiReviewService:

    # list_reviews — 分页列表，支持 task_id/agent_id/verdict/status 过滤
    @staticmethod
    def list_reviews(
        db: Session,
        task_id: int | None = None,
        agent_id: int | None = None,
        verdict: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ):
        q = db.query(AiReview)

        if task_id is not None:
            q = q.filter(AiReview.task_id == task_id)
        if agent_id is not None:
            q = q.filter(AiReview.agent_id == agent_id)
        if verdict is not None:
            q = q.filter(AiReview.verdict == verdict)
        if status is not None:
            q = q.filter(AiReview.status == status)

        total = q.count()
        rows = q.order_by(AiReview.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()

        # 批量取关联数据，避免 N+1
        agent_ids = {r.agent_id for r in rows}
        task_ids = {r.task_id for r in rows}
        item_ids = {r.item_id for r in rows}
        agents = {a.id: a for a in db.query(AiAgent).filter(AiAgent.id.in_(agent_ids)).all()}
        tasks = {t.id: t for t in db.query(LabelTask).filter(LabelTask.id.in_(task_ids)).all()}
        items_map = {i.id: i for i in db.query(DatasetItem).filter(DatasetItem.id.in_(item_ids)).all()}

        items = []
        for r in rows:
            agent = agents.get(r.agent_id)
            task = tasks.get(r.task_id)
            item = items_map.get(r.item_id)
            items.append({
                "id": r.id,
                "task_id": r.task_id,
                "item_id": r.item_id,
                "result_id": r.result_id,
                "agent_name": agent.name if agent else "-",
                "verdict": r.verdict,
                "overall_score": r.overall_score,
                "status": r.status,
                "duration_ms": r.duration_ms,
                "error_message": r.error_message,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "task_title": task.title if task else None,
                "item_summary": str(item.data)[:120] if item and item.data else None,
            })
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    # get_review — 单条详情，含完整关联数据
    @staticmethod
    def get_review(db: Session, review_id: int):
        r = db.query(AiReview).filter(AiReview.id == review_id).first()
        if not r:
            return None
        agent = db.query(AiAgent).filter(AiAgent.id == r.agent_id).first()
        task = db.query(LabelTask).filter(LabelTask.id == r.task_id).first()
        result = db.query(LabelResult).filter(LabelResult.id == r.result_id).first()
        item = db.query(DatasetItem).filter(DatasetItem.id == r.item_id).first()
        return {
            "id": r.id,
            "task_id": r.task_id,
            "item_id": r.item_id,
            "result_id": r.result_id,
            "agent_id": r.agent_id,
            "agent_name": agent.name if agent else "-",
            "agent_model": agent.llm_model if agent else None,
            "verdict": r.verdict,
            "summary": r.summary,
            "dimensions": r.dimensions,
            "overall_score": r.overall_score,
            "model": r.model,
            "prompt_template": r.prompt_template,
            "prompt_vars": r.prompt_vars,
            "status": r.status,
            "error_message": r.error_message,
            "duration_ms": r.duration_ms,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            "task_title": task.title if task else None,
            "result_data": result.data if result else None,
            "item_data": item.data if item else None,
        }

    # get_stats — Agent 审核统计
    @staticmethod
    def get_agent_stats(db: Session, agent_id: int):
        total = db.query(AiReview).filter(AiReview.agent_id == agent_id, AiReview.status == "done").count()
        passed = db.query(AiReview).filter(AiReview.agent_id == agent_id, AiReview.verdict == "pass", AiReview.status == "done").count()
        failed = db.query(AiReview).filter(AiReview.agent_id == agent_id, AiReview.status == "failed").count()
        avg_duration = db.query(AiReview).filter(AiReview.agent_id == agent_id, AiReview.status == "done").with_entities(
            AiReview.duration_ms
        ).all()
        avg_ms = round(sum(d[0] or 0 for d in avg_duration) / len(avg_duration)) if avg_duration else 0
        return {
            "total": total,
            "passed": passed,
            "rejected": total - passed,
            "failed": failed,
            "avg_duration_ms": avg_ms,
            "pass_rate": round(passed / total * 100, 1) if total > 0 else 0,
        }

    # get_all_agent_stats — 批量获取所有 Agent 的审核统计
    @staticmethod
    def get_all_agent_stats(db: Session):
        from sqlalchemy import func
        agent_ids = db.query(AiReview.agent_id).distinct().all()
        result: dict[int, dict] = {}
        for (agent_id,) in agent_ids:
            result[agent_id] = AiReviewService.get_agent_stats(db, agent_id)
        return result
