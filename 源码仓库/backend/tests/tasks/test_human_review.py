"""人工审核完善测试——批量操作 + 审计日志"""
import pytest


class TestBatchReview:
    """批量审核 API"""

    def test_batch_approve(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        # 提交 3 条结果
        rids = []
        for i in range(3):
            r = svc.create_result(
                task_id=claimed_task.id,
                item_id=items[i]["id"],
                labeler_id=seed_labeler.id,
                labeler_type="human",
                data={"category": "电子产品"},
            )
            rids.append(r.id)

        # 批量通过
        from app.models.auth.user import User
        reviewer = db.query(User).filter(User.role == "reviewer").first()
        if not reviewer:
            from app.services.auth.service import hash_password
            reviewer = User(name="审核", email="r2@t.com", password_hash=hash_password("123"), role="reviewer")
            db.add(reviewer)
            db.commit()

        for rid in rids:
            svc.review_result(
                task_id=claimed_task.id, result_id=rid,
                reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
                status="approved",
            )

        db.refresh(svc.get(claimed_task.id))
        # 3 条都已 approved
        from app.models.tasks.result import LabelResult
        for rid in rids:
            r = db.query(LabelResult).filter(LabelResult.id == rid).first()
            assert r.status == "approved"
            assert r.reviewer_id == reviewer.id

    def test_batch_reject_needs_comment(self, db, claimed_task, seed_labeler):
        """驳回必须填理由——单条校验"""
        from app.services.tasks.service import TaskService
        from app.infra.exceptions import BadRequestException

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        r = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        with pytest.raises(BadRequestException, match="驳回必须填写理由"):
            svc.review_result(
                task_id=claimed_task.id, result_id=r.id,
                reviewer_id=seed_labeler.id, reviewer_name="t", reviewer_role="reviewer",
                status="rejected", comment="",
            )


class TestAuditLog:
    """审计日志——状态变更可追溯"""

    def test_audit_on_review(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService
        from app.services.common.audit import AuditService
        from app.models.auth.user import User

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        r = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        reviewer = db.query(User).filter(User.role == "reviewer").first()
        if not reviewer:
            from app.services.auth.service import hash_password
            reviewer = User(name="审核", email="r3@t.com", password_hash=hash_password("123"), role="reviewer")
            db.add(reviewer)
            db.commit()

        # 审核通过
        svc.review_result(
            task_id=claimed_task.id, result_id=r.id,
            reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
            status="approved", comment="",
        )

        # 查询审计日志
        audit = AuditService(db)
        logs = audit.list_by_task(claimed_task.id)
        assert len(logs) >= 1

        latest = logs[0]
        assert latest.entity_type == "LabelResult"
        assert latest.entity_id == r.id
        assert latest.action == "approve"
        assert latest.from_status == "submitted"
        assert latest.to_status == "approved"
        assert latest.actor_id == reviewer.id
        assert latest.actor_name == reviewer.name
        assert latest.actor_role == "reviewer"

    def test_audit_on_reject(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService
        from app.services.common.audit import AuditService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        r = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        svc.review_result(
            task_id=claimed_task.id, result_id=r.id,
            reviewer_id=seed_labeler.id, reviewer_name="tester", reviewer_role="reviewer",
            status="rejected", comment="分类错误",
        )

        audit = AuditService(db)
        logs = audit.list_by_task(claimed_task.id)
        latest = logs[0]
        assert latest.action == "reject"
        assert latest.detail == "分类错误"

    def test_audit_filtered_by_task(self, db, claimed_task, seed_labeler):
        """审计日志按 task_id 隔离"""
        from app.services.tasks.service import TaskService
        from app.services.common.audit import AuditService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        r = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )
        svc.review_result(
            task_id=claimed_task.id, result_id=r.id,
            reviewer_id=seed_labeler.id, reviewer_name="t", reviewer_role="reviewer",
            status="approved",
        )

        # 查别的任务应该为空
        audit = AuditService(db)
        logs = audit.list_by_task(99999)
        assert len(logs) == 0

        # 查本任务应该有
        logs = audit.list_by_task(claimed_task.id)
        assert len(logs) >= 1
