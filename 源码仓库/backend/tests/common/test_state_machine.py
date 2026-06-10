"""状态机测试——转移表正确性 + 校验拦截 + 审核流转集成"""
import pytest
from app.state_machine import (
    ItemStatus,
    ResultStatus,
    TaskStatus,
    validate_transition,
    transit,
)
from app.infra.exceptions import BadRequestException


class TestTransitionsTable:
    """转移表覆盖 PDF 4.5 节全流转链"""

    # ── TaskItem ──

    def test_item_pending_to_labeled(self):
        validate_transition("TaskItem.status", ItemStatus.PENDING, ItemStatus.LABELED)

    def test_item_pending_to_skipped(self):
        validate_transition("TaskItem.status", ItemStatus.PENDING, ItemStatus.SKIPPED)

    def test_item_skipped_to_labeled(self):
        validate_transition("TaskItem.status", ItemStatus.SKIPPED, ItemStatus.LABELED)

    def test_item_labeled_is_terminal(self):
        for tgt in ItemStatus:
            if tgt == ItemStatus.LABELED:
                continue
            with pytest.raises(BadRequestException, match="不允许"):
                validate_transition("TaskItem.status", ItemStatus.LABELED, tgt)

    # ── LabelResult ──

    def test_result_submitted_to_ai_reviewing(self):
        validate_transition("LabelResult.status", ResultStatus.SUBMITTED, ResultStatus.AI_REVIEWING)

    def test_result_ai_reviewing_to_review(self):
        validate_transition("LabelResult.status", ResultStatus.AI_REVIEWING, ResultStatus.REVIEW)

    def test_result_ai_reviewing_to_rejected(self):
        validate_transition("LabelResult.status", ResultStatus.AI_REVIEWING, ResultStatus.REJECTED)

    def test_result_review_to_final_review(self):
        validate_transition("LabelResult.status", ResultStatus.REVIEW, ResultStatus.FINAL_REVIEW)

    def test_result_review_to_rejected(self):
        validate_transition("LabelResult.status", ResultStatus.REVIEW, ResultStatus.REJECTED)

    def test_result_final_review_to_warehouse(self):
        validate_transition("LabelResult.status", ResultStatus.FINAL_REVIEW, ResultStatus.WAREHOUSE)

    def test_result_final_review_to_rejected(self):
        validate_transition("LabelResult.status", ResultStatus.FINAL_REVIEW, ResultStatus.REJECTED)

    def test_result_rejected_to_review(self):
        """打回后可重新打开到复审（误操作恢复/申诉）"""
        validate_transition("LabelResult.status", ResultStatus.REJECTED, ResultStatus.REVIEW)

    def test_result_rejected_other_invalid(self):
        """REJECTED 只能回 REVIEW"""
        for tgt in ResultStatus:
            if tgt in (ResultStatus.REJECTED, ResultStatus.REVIEW):
                continue
            with pytest.raises(BadRequestException, match="不允许"):
                validate_transition("LabelResult.status", ResultStatus.REJECTED, tgt)

    def test_result_warehouse_is_terminal(self):
        for tgt in ResultStatus:
            if tgt == ResultStatus.WAREHOUSE:
                continue
            with pytest.raises(BadRequestException, match="不允许"):
                validate_transition("LabelResult.status", ResultStatus.WAREHOUSE, tgt)

    # ── LabelTask ──

    def test_task_draft_to_published(self):
        validate_transition("LabelTask.status", TaskStatus.DRAFT, TaskStatus.PUBLISHED)

    def test_task_published_to_paused(self):
        validate_transition("LabelTask.status", TaskStatus.PUBLISHED, TaskStatus.PAUSED)

    def test_task_published_to_ended(self):
        validate_transition("LabelTask.status", TaskStatus.PUBLISHED, TaskStatus.ENDED)

    def test_task_paused_to_published(self):
        validate_transition("LabelTask.status", TaskStatus.PAUSED, TaskStatus.PUBLISHED)

    def test_task_ended_is_terminal(self):
        for tgt in TaskStatus:
            if tgt == TaskStatus.ENDED:
                continue
            with pytest.raises(BadRequestException, match="不允许"):
                validate_transition("LabelTask.status", TaskStatus.ENDED, tgt)

    def test_draft_cannot_jump_to_paused(self):
        with pytest.raises(BadRequestException, match="不允许"):
            validate_transition("LabelTask.status", TaskStatus.DRAFT, TaskStatus.PAUSED)


class TestTransitHelper:

    def test_transit_success(self):
        class Obj:
            status = "pending"
        obj = Obj()
        transit(obj, "status", "labeled", "TaskItem.status")
        assert obj.status == "labeled"

    def test_transit_invalid(self):
        class Obj:
            status = "labeled"
        obj = Obj()
        with pytest.raises(BadRequestException, match="不允许"):
            transit(obj, "status", "pending", "TaskItem.status")


class TestReviewFlow:
    """审核流转集成测试——通过 Service 层完整链路"""

    def test_full_flow_to_warehouse(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService
        from app.models.auth.user import User
        from app.services.auth.service import hash_password

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        reviewer = db.query(User).filter(User.role == "reviewer").first()
        if not reviewer:
            reviewer = User(name="审核员", email="r@t.com", password_hash=hash_password("123"), role="reviewer")
            db.add(reviewer)
            db.commit()

        # 1. labeler 提交
        r = svc.create_result(task_id=claimed_task.id, item_id=items[0]["id"],
                              labeler_id=seed_labeler.id, labeler_type="human",
                              data={"category": "电子产品"})
        assert r.status == ResultStatus.SUBMITTED

        # 2. AI 审核
        svc.review_result(claimed_task.id, r.id, reviewer.id,
                          reviewer_name=reviewer.name, reviewer_role="reviewer",
                          target_status=ResultStatus.AI_REVIEWING)
        db.refresh(r)
        assert r.status == ResultStatus.AI_REVIEWING

        # 3. 复审通过
        svc.review_result(claimed_task.id, r.id, reviewer.id,
                          reviewer_name=reviewer.name, reviewer_role="reviewer",
                          target_status=ResultStatus.REVIEW)
        db.refresh(r)
        assert r.status == ResultStatus.REVIEW

        # 4. 终审通过
        svc.review_result(claimed_task.id, r.id, reviewer.id,
                          reviewer_name=reviewer.name, reviewer_role="reviewer",
                          target_status=ResultStatus.FINAL_REVIEW)
        db.refresh(r)
        assert r.status == ResultStatus.FINAL_REVIEW

        # 5. 入库
        svc.review_result(claimed_task.id, r.id, reviewer.id,
                          reviewer_name=reviewer.name, reviewer_role="reviewer",
                          target_status=ResultStatus.WAREHOUSE)
        db.refresh(r)
        assert r.status == ResultStatus.WAREHOUSE

    def test_reject_without_comment(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        r = svc.create_result(task_id=claimed_task.id, item_id=items[0]["id"],
                              labeler_id=seed_labeler.id, labeler_type="human",
                              data={"category": "电子产品"})
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.AI_REVIEWING)

        with pytest.raises(BadRequestException, match="驳回必须填写理由"):
            svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                              reviewer_name="test", reviewer_role="reviewer",
                              target_status=ResultStatus.REJECTED, comment="  ")

    def test_reject_with_comment(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        r = svc.create_result(task_id=claimed_task.id, item_id=items[0]["id"],
                              labeler_id=seed_labeler.id, labeler_type="human",
                              data={"category": "电子产品"})
        # AI 审核后打回
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.AI_REVIEWING)
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.REJECTED, comment="分类错误")
        db.refresh(r)
        assert r.status == ResultStatus.REJECTED
        assert r.comment == "分类错误"

    def test_rejected_reopen_to_review(self, db, claimed_task, seed_labeler):
        """打回后审核员重新打开到复审"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        r = svc.create_result(task_id=claimed_task.id, item_id=items[0]["id"],
                              labeler_id=seed_labeler.id, labeler_type="human",
                              data={"category": "电子产品"})
        # 走到 rejected
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.AI_REVIEWING)
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.REJECTED, comment="分类错误")
        # 重新打开
        svc.review_result(claimed_task.id, r.id, seed_labeler.id,
                          reviewer_name="test", reviewer_role="reviewer",
                          target_status=ResultStatus.REVIEW)
        db.refresh(r)
        assert r.status == ResultStatus.REVIEW
