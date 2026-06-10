"""任务 Service——任务 CRUD + 标注结果提交 + 工作台条目查询"""
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.tasks.task import LabelTask
from app.models.tasks.result import LabelResult
from app.models.tasks.item import TaskItem
from app.models.datasets.item import DatasetItem
from app.infra.exceptions import NotFoundException, BadRequestException, ForbiddenException
from app.state_machine import (
    ItemStatus,
    ResultStatus,
    TaskStatus,
    transit,
    validate_transition,
)
from app.services.common.audit import AuditService


class TaskService:

    def __init__(self, db: Session):
        self.db = db

    def list_tasks(
        self,
        dataset_id: int | None = None,
        assignee_id: int | None = None,
        status: str | None = None,
        tags: str | None = None,
        owner_id: int | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[LabelTask], int]:
        """分页——支持按数据集/标注员/状态/标签/创建者筛选"""
        q = self.db.query(LabelTask)
        if dataset_id is not None:
            q = q.filter(LabelTask.dataset_id == dataset_id)
        if assignee_id is not None:
            from sqlalchemy import or_
            claimed_ids = (
                self.db.query(TaskItem.task_id)
                .filter(TaskItem.labeler_id == assignee_id)
                .distinct()
                .subquery()
            )
            q = q.filter(or_(
                LabelTask.assignee_id == assignee_id,
                LabelTask.id.in_(claimed_ids)
            ))
        if status is not None:
            q = q.filter(LabelTask.status == status)
        if tags is not None:
            q = q.filter(LabelTask.tags.contains(tags))
        if owner_id is not None:
            q = q.filter(LabelTask.owner_id == owner_id)
        total = q.count()
        items = (
            q.order_by(LabelTask.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, task_id: int, owner_id: int | None = None) -> LabelTask:
        q = self.db.query(LabelTask).filter(LabelTask.id == task_id)
        if owner_id is not None:
            q = q.filter(LabelTask.owner_id == owner_id)
        task = q.first()
        if not task:
            raise NotFoundException("任务")
        return task

    def claim(self, task_id: int, user_id: int, count: int | None = None) -> LabelTask:
        """标注员认领任务——两阶段防并发竞态

        first_come:      Redis 分布式锁（整个任务只有一个赢家）
        quota_grab:      TaskItem 行锁 + SKIP LOCKED（真正并行抢不同条目）
        """
        task = self.db.query(LabelTask).filter(LabelTask.id == task_id).first()
        if not task:
            raise NotFoundException("任务")
        if task.status != "published":
            raise BadRequestException("任务未发布，无法认领")
        if task.deadline:
            from datetime import datetime
            now = datetime.utcnow()
            dl = task.deadline.replace(tzinfo=None) if task.deadline.tzinfo else task.deadline
            if dl < now:
                raise BadRequestException("任务已过截止时间，无法认领")

        if task.distribution_strategy == "first_come":
            from app.infra.redis_client import RedisLock
            lock = RedisLock(f"task:claim:{task_id}", ttl=30)
            if not lock.acquire(token=str(user_id)):
                raise BadRequestException("系统繁忙，请稍后重试")
            try:
                self.db.refresh(task)  # 锁内重读，防竞态
                if task.assignee_id is not None:
                    raise BadRequestException("任务已被认领")
                task.assignee_id = user_id
                self.db.commit()
                self.db.refresh(task)
                return task
            finally:
                lock.release()

        elif task.distribution_strategy == "quota_grab":
            grab = count or (task.grab_limit or 10)
            already = 0
            if task.grab_limit:
                already = (
                    self.db.query(TaskItem)
                    .filter(TaskItem.task_id == task.id, TaskItem.labeler_id == user_id)
                    .count()
                )
                remaining_quota = task.grab_limit - already
                if remaining_quota <= 0:
                    raise BadRequestException(f"你已认领 {already} 条，已达上限 {task.grab_limit} 条")
                grab = min(grab, remaining_quota)
            unassigned = (
                self.db.query(TaskItem)
                .filter(TaskItem.task_id == task.id, TaskItem.labeler_id.is_(None), TaskItem.status == "pending")
                .limit(grab)
                .with_for_update(skip_locked=True)
                .all()
            )
            if len(unassigned) == 0:
                raise BadRequestException("任务已无剩余条目")
            for item in unassigned:
                item.labeler_id = user_id
            self.db.commit()
            self.db.refresh(task)
            task._claimed_items = already + len(unassigned)
            return task

        else:
            raise BadRequestException("指派任务无需认领，请在我的任务中查看")

    def delete(self, task_id: int, owner_id: int | None = None) -> None:
        """删除任务——任务下的 TaskItem 级联删除，数据集条目原样保留"""
        task = self.get(task_id, owner_id=owner_id)
        self.db.delete(task)
        self.db.commit()

    def update(self, task_id: int, owner_id: int | None = None, **kwargs) -> LabelTask:
        """更新任务——状态变更经过状态机校验"""
        task = self.get(task_id, owner_id=owner_id)
        new_status = kwargs.pop("status", None)
        for key, val in kwargs.items():
            if val is not None:
                setattr(task, key, val)
        if new_status is not None:
            transit(task, "status", new_status, "LabelTask.status")
        self.db.commit()
        self.db.refresh(task)
        return task

    def create(self, **kwargs) -> LabelTask:
        """创建任务——校验配额不超过数据集条目数，生成 TaskItem，total_items 跟随配额"""
        dataset_id = kwargs.get("dataset_id")
        quota = kwargs.get("quota", 0)
        if not dataset_id:
            raise BadRequestException("缺少关联数据集")

        total_in_ds = (
            self.db.query(DatasetItem)
            .filter(DatasetItem.dataset_id == dataset_id)
            .count()
        )
        if quota < 1:
            raise BadRequestException("配额至少为 1")
        if quota > total_in_ds:
            raise BadRequestException(f"配额({quota})超过数据集条目总数({total_in_ds})")

        kwargs["total_items"] = quota
        task = LabelTask(**kwargs)
        self.db.add(task)
        self.db.flush()  # 让 task.id 生成

        # 取前 quota 条数据集条目，生成 TaskItem
        items = (
            self.db.query(DatasetItem)
            .filter(DatasetItem.dataset_id == dataset_id)
            .order_by(DatasetItem.index.asc())
            .limit(quota)
            .all()
        )
        for it in items:
            self.db.add(TaskItem(task_id=task.id, dataset_item_id=it.id))

        # 冻结 Schema 快照
        schema_id = kwargs.get("schema_id")
        if schema_id:
            from app.models.schemas.schema import LabelSchema
            s = self.db.query(LabelSchema).filter(LabelSchema.id == schema_id).first()
            if s:
                task.schema_snapshot = s.schema
                task.schema_version = s.version

        self.db.commit()
        self.db.refresh(task)
        return task

    def list_results(self, task_id: int, owner_id: int | None = None) -> list[LabelResult]:
        """查询任务的所有标注结果——审核用"""
        self.get(task_id, owner_id=owner_id)
        return (
            self.db.query(LabelResult)
            .filter(LabelResult.task_id == task_id)
            .order_by(LabelResult.created_at.desc())
            .all()
        )

    def review_result(
        self,
        task_id: int,
        result_id: int,
        reviewer_id: int,
        reviewer_name: str = "",
        reviewer_role: str = "reviewer",
        target_status: str = ResultStatus.SUBMITTED,
        comment: str = "",
    ) -> LabelResult:
        """审核标注结果——状态机: final_review→warehouse/rejected（人工终审）

        驳回必须填写驳回理由（PDF 4.5 节"打回需附理由"）。
        """
        from datetime import datetime

        result = (
            self.db.query(LabelResult)
            .filter(LabelResult.id == result_id, LabelResult.task_id == task_id)
            .first()
        )
        if not result:
            raise NotFoundException("标注结果")

        if target_status == ResultStatus.REJECTED and not comment.strip():
            raise BadRequestException("驳回必须填写理由")

        old_status = result.status
        transit(result, "status", target_status, "LabelResult.status")
        result.reviewer_id = reviewer_id
        result.reviewed_at = datetime.utcnow()
        if comment:
            result.comment = comment

        # 审计日志 — 根据目标状态生成 action
        action_map = {
            ResultStatus.FINAL_REVIEW: "final_approve",
            ResultStatus.WAREHOUSE: "final_approve",
            ResultStatus.REJECTED: "reject",
        }
        action = action_map.get(target_status, target_status)

        self._log_audit(
            actor_id=reviewer_id,
            actor_name=reviewer_name or f"reviewer#{reviewer_id}",
            actor_role=reviewer_role,
            entity_type="LabelResult",
            entity_id=result_id,
            task_id=task_id,
            action=action,
            from_status=old_status,
            to_status=target_status,
            detail=comment,
        )

        self.db.commit()
        self.db.refresh(result)

        # flow_history: 人工审核状态变更
        from app.services.common.flow import append_flow
        detail = f"审核员 {reviewer_name or f'reviewer#{reviewer_id}'}"
        if target_status == 'rejected':
            detail += f" 驳回: {comment}"
        elif target_status == 'final_review':
            detail += " 复审通过→终审"
        elif target_status == 'warehouse':
            detail += " 终审通过→入库"
        append_flow(self.db, task_id, result.item_id, target_status,
                     actor="reviewer", actor_name=reviewer_name or f"reviewer#{reviewer_id}",
                     round_num=result.round, detail=detail)
        self.db.commit()

        return result

    def create_result(self, task_id: int, **kwargs) -> LabelResult:
        """提交标注结果——同时更新任务进度与 task_item 状态

        TaskItem 状态转移: pending → labeled  或  skipped → labeled
        配额完成后 LabelTask: published → ended
        """
        task = self.get(task_id)
        if task.status != TaskStatus.PUBLISHED:
            raise BadRequestException("任务未发布，无法提交")

        # 防重复：同一标注员对同一 item 已有 submitted 状态的结果时拒绝
        item_id = kwargs.get("item_id")
        labeler_id = kwargs.get("labeler_id")
        existing = (
            self.db.query(LabelResult)
            .filter(
                LabelResult.task_id == task_id,
                LabelResult.item_id == item_id,
                LabelResult.labeler_id == labeler_id,
                LabelResult.status == ResultStatus.SUBMITTED,
            )
            .first()
        )
        if existing:
            raise BadRequestException("该条目已有待审核的提交记录，请等待审核结果后再重新提交")

        result = LabelResult(task_id=task_id, **kwargs)
        self.db.add(result)

        # TaskItem: pending/skipped → labeled（首次标注才推进度）
        ti = (
            self.db.query(TaskItem)
            .filter(TaskItem.task_id == task_id, TaskItem.dataset_item_id == item_id)
            .first()
        )
        is_first_label = False
        if ti:
            if ti.status != ItemStatus.LABELED:
                transit(ti, "status", ItemStatus.LABELED, "TaskItem.status")
                is_first_label = True
            ti.labeler_id = labeler_id

        # 只有首次标注才 +1（打回重提交不重复计数）
        if is_first_label:
            self.db.query(LabelTask).filter(
                LabelTask.id == task_id,
            ).update(
                {"completed_items": LabelTask.completed_items + 1},
                synchronize_session=False,
            )
        self.db.commit()
        self.db.refresh(task)

        self.db.refresh(result)

        # flow_history: 标注员提交
        from app.services.common.flow import append_flow
        append_flow(self.db, task_id, result.item_id, ResultStatus.SUBMITTED,
                     actor="labeler", actor_name=f"labeler#{labeler_id}",
                     round_num=result.round)
        self.db.commit()

        # 触发 AI 预审（任务配置了 AI Agent 时 → MQ → Worker → AgentPool）
        if task.ai_agent_id:
            try:
                from app.infra.mq_client import publish, AI_REVIEW_QUEUE
                publish(AI_REVIEW_QUEUE, {"task_id": task_id, "result_id": result.id, "item_id": result.item_id})
                import logging
                logging.getLogger("app").info(f"AI review queued: task={task_id} result={result.id}")
            except Exception as e:
                import logging
                logging.getLogger("app").error(f"AI review MQ publish failed: {e}")

        return result

    # ── 审计日志 ──

    def _log_audit(self, *, actor_id: int, actor_name: str, actor_role: str,
                   entity_type: str, entity_id: int, task_id: int,
                   action: str, from_status: str, to_status: str, detail: str = "") -> None:
        """内部快捷方法——写一条审计日志"""
        AuditService(self.db).log(
            actor_id=actor_id, actor_name=actor_name, actor_role=actor_role,
            entity_type=entity_type, entity_id=entity_id, task_id=task_id,
            action=action, from_status=from_status, to_status=to_status, detail=detail,
        )

    # ── 标注工作台：条目查询 / 跳过 / 我的结果 / 统计 ──

    def check_task_access(self, task_id: int, user_id: int, user_role: str) -> LabelTask:
        """验证用户对任务的归属权限

        Owner 只能操作自己创建的任务，
        Labeler 只能操作自己认领的任务（assignee_id == user_id）。
        验证通过返回 task 对象，失败抛出 ForbiddenException。
        """
        task = self.get(task_id)
        if user_role == "owner":
            if task.owner_id != user_id:
                raise ForbiddenException("无权访问该任务")
        elif user_role == "labeler":
            if task.distribution_strategy in ("quota_grab", "assigned"):
                # quota_grab/assigned：被指派或已认领才放行
                if task.assignee_id == user_id:
                    return task
                has_claimed = (
                    self.db.query(TaskItem)
                    .filter(TaskItem.task_id == task_id, TaskItem.labeler_id == user_id)
                    .first()
                )
                if not has_claimed:
                    raise ForbiddenException("无权访问该任务——请先在任务大厅认领")
            # first_come：assignee_id 为 NULL 表示开放给所有人，直接放行
        # reviewer 可访问任意任务
        return task

    def _task_item_to_dict(self, ti: TaskItem, di: DatasetItem) -> dict:
        """将 TaskItem + DatasetItem 组装为前端用字典"""
        return {
            "id": di.id,
            "index": di.index,
            "data": di.data,
            "status": ti.status,
            "flow_history": ti.flow_history or [],
            "labeler_id": ti.labeler_id,
        }

    def list_task_items(
        self, task_id: int, status: str | None = None, labeler_id: int | None = None
    ) -> list[dict]:
        """返回任务的条目列表。quota_grab 仅显示当前标注员认领的，first_come 显示全部。"""
        from concurrent.futures import ThreadPoolExecutor
        from app.schemas.task import LabelResultResponse
        from sqlalchemy import and_
        from app.config.database import SessionLocal

        def _fetch_rows():
            db = SessionLocal()
            try:
                q = (
                    db.query(TaskItem, DatasetItem)
                    .join(DatasetItem, TaskItem.dataset_item_id == DatasetItem.id)
                    .filter(TaskItem.task_id == task_id)
                )
                # 配额抢单：只看自己认领的条目；first_come：看全部
                if labeler_id is not None and self.get(task_id).distribution_strategy == "quota_grab":
                    q = q.filter(TaskItem.labeler_id == labeler_id)
                if status is not None:
                    q = q.filter(TaskItem.status == status)
                return q.order_by(DatasetItem.index.asc()).all()
            finally:
                db.close()

        def _fetch_last_results():
            if labeler_id is None:
                return {}
            db = SessionLocal()
            try:
                latest = (
                    db.query(LabelResult.item_id, func.max(LabelResult.round).label("max_round"))
                    .filter(LabelResult.task_id == task_id, LabelResult.labeler_id == labeler_id)
                    .group_by(LabelResult.item_id)
                    .subquery()
                )
                results = (
                    db.query(LabelResult)
                    .join(latest, and_(
                        LabelResult.item_id == latest.c.item_id,
                        LabelResult.round == latest.c.max_round,
                    ))
                    .filter(LabelResult.task_id == task_id, LabelResult.labeler_id == labeler_id)
                    .order_by(LabelResult.created_at.desc())
                    .all()
                )
                last_results: dict[int, dict] = {}
                for r in results:
                    if r.item_id not in last_results:
                        last_results[r.item_id] = LabelResultResponse.model_validate(r).model_dump()
                return last_results
            finally:
                db.close()

        with ThreadPoolExecutor(max_workers=2) as pool:
            f_rows = pool.submit(_fetch_rows)
            f_results = pool.submit(_fetch_last_results)
            rows = f_rows.result()
            last_results = f_results.result()

        return [
            {**self._task_item_to_dict(ti, di), "last_result": last_results.get(di.id)}
            for ti, di in rows
        ]

    def get_task_item(self, task_id: int, item_id: int, labeler_id: int) -> dict:
        """单条详情——原始数据 + 该标注员最近一次提交（一次查询）"""
        from sqlalchemy.orm import joinedload
        from app.schemas.task import LabelResultResponse

        row = (
            self.db.query(TaskItem, DatasetItem)
            .join(DatasetItem, TaskItem.dataset_item_id == DatasetItem.id)
            .filter(
                TaskItem.task_id == task_id,
                TaskItem.dataset_item_id == item_id,
            )
            .first()
        )
        if not row:
            raise NotFoundException("条目")

        ti, di = row

        last = (
            self.db.query(LabelResult)
            .filter(
                LabelResult.task_id == task_id,
                LabelResult.item_id == item_id,
                LabelResult.labeler_id == labeler_id,
            )
            .order_by(LabelResult.round.desc(), LabelResult.created_at.desc())
            .first()
        )

        return {
            **self._task_item_to_dict(ti, di),
            "last_result": LabelResultResponse.model_validate(last).model_dump() if last else None,
        }

    def skip_item(self, task_id: int, item_id: int, labeler_id: int) -> None:
        """跳过条目——状态机: pending → skipped"""
        ti = (
            self.db.query(TaskItem)
            .filter(TaskItem.task_id == task_id, TaskItem.dataset_item_id == item_id)
            .first()
        )
        if not ti:
            raise NotFoundException("条目")
        transit(ti, "status", ItemStatus.SKIPPED, "TaskItem.status")
        ti.labeler_id = labeler_id
        self.db.commit()

    def list_my_results(self, task_id: int, labeler_id: int) -> list[LabelResult]:
        """当前标注员在该任务下的所有提交记录"""
        self.get(task_id)
        return (
            self.db.query(LabelResult)
            .filter(
                LabelResult.task_id == task_id,
                LabelResult.labeler_id == labeler_id,
            )
            .order_by(LabelResult.created_at.desc())
            .all()
        )

    def get_my_stats(self, task_id: int, labeler_id: int) -> dict:
        """当前标注员统计 —— pending(待标注) + in_review(审核中) + rejected(需修改) + done(已归档)"""
        # 该标注员所有 LabelResult（最新状态算一份）
        my_results = (
            self.db.query(LabelResult)
            .filter(LabelResult.task_id == task_id, LabelResult.labeler_id == labeler_id)
            .all()
        )
        # 按 item_id 取最新一条
        latest: dict[int, str] = {}
        latest_time = {}
        for r in my_results:
            if r.item_id not in latest_time or r.created_at > latest_time[r.item_id]:
                latest_time[r.item_id] = r.created_at
                latest[r.item_id] = r.status

        in_review_statuses = {"submitted", "ai_reviewing", "review", "final_review"}
        rejected = sum(1 for s in latest.values() if s == "rejected")
        in_review = sum(1 for s in latest.values() if s in in_review_statuses)
        done = sum(1 for s in latest.values() if s == "warehouse")

        pending = (
            self.db.query(func.count(TaskItem.id))
            .filter(TaskItem.task_id == task_id, TaskItem.status == "pending")
            .scalar()
        )
        total = pending + len(latest)

        return {
            "pending": pending,
            "in_review": in_review,
            "rejected": rejected,
            "done": done,
            "total": total,
        }
