"""导出功能测试——格式生成 + Job 流程"""
import json
import csv
import io
import pytest


@pytest.fixture
def approved_results(db, claimed_task, seed_labeler):
    """提交并审核通过 3 条结果"""
    from app.services.tasks.service import TaskService
    from app.models.auth.user import User

    svc = TaskService(db)
    items = svc.list_task_items(claimed_task.id)

    reviewer = db.query(User).filter(User.role == "reviewer").first()
    if not reviewer:
        from app.services.auth.service import hash_password
        reviewer = User(name="审核", email="re@t.com", password_hash=hash_password("123"), role="reviewer")
        db.add(reviewer)
        db.commit()

    rids = []
    for i in range(3):
        r = svc.create_result(
            task_id=claimed_task.id, item_id=items[i]["id"],
            labeler_id=seed_labeler.id, labeler_type="human",
            data={"category": "电子产品", "keywords": ["test"]},
        )
        # 状态机: submitted → ai_reviewing → review → final_review → warehouse
        svc.review_result(task_id=claimed_task.id, result_id=r.id,
            reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
            target_status="ai_reviewing")
        svc.review_result(task_id=claimed_task.id, result_id=r.id,
            reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
            target_status="review")
        svc.review_result(task_id=claimed_task.id, result_id=r.id,
            reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
            target_status="final_review")
        svc.review_result(task_id=claimed_task.id, result_id=r.id,
            reviewer_id=reviewer.id, reviewer_name=reviewer.name, reviewer_role="reviewer",
            target_status="warehouse")
        rids.append(r.id)
    return claimed_task.id


class TestExportGenerate:
    """格式生成验证"""

    def test_json(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results)
        assert len(rows) == 3

        data = svc._to_json_bytes(rows)
        parsed = json.loads(data.decode("utf-8"))
        assert len(parsed) == 3
        assert "item_id" in parsed[0]

    def test_jsonl(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results)

        data = svc._to_jsonl_bytes(rows)
        lines = data.decode("utf-8").strip().split("\n")
        assert len(lines) == 3

    def test_csv(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results)

        data = svc._to_csv_bytes(rows)
        reader = csv.DictReader(io.StringIO(data.decode("utf-8-sig")))
        parsed = list(reader)
        assert len(parsed) == 3

    def test_xlsx(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results)

        data = svc._to_xlsx_bytes(rows)
        assert len(data) > 0

    def test_empty_export(self, db, claimed_task):
        """无 warehouse 结果时导出空文件"""
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(claimed_task.id)
        assert len(rows) == 0

        data = svc._to_csv_bytes(rows)
        assert data == b""

    def test_include_review(self, db, approved_results):
        """include_review=True 时包含审核字段"""
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results, {"include_review": True})
        assert len(rows) == 3
        assert "reviewer_id" in rows[0]

    def test_include_review_false(self, db, approved_results):
        """include_review=False 时不包含审核字段"""
        from app.services.common.export import ExportService

        svc = ExportService(db)
        rows = svc.query_data(approved_results, {"include_review": False})
        assert len(rows) == 3
        assert "reviewer_id" not in rows[0]


class TestExportJob:
    """Job 生命周期"""

    def test_create_job(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        job = svc.create_job(approved_results, 1, "json")
        assert job.status == "pending"
        assert job.format == "json"

    def test_field_mapping(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        mapping = {"fields": ["item_id", "result.category"]}
        rows = svc.query_data(approved_results, mapping)
        assert len(rows) == 3
        keys = set(rows[0].keys())
        assert keys == {"item_id", "result.category"}

    def test_field_mapping_with_rename(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        mapping = {
            "fields": ["item_id", "result.category"],
            "rename": {"result.category": "类目"},
        }
        rows = svc.query_data(approved_results, mapping)
        assert "类目" in rows[0]
        assert "result.category" not in rows[0]

    def test_list_jobs(self, db, approved_results):
        from app.services.common.export import ExportService

        svc = ExportService(db)
        svc.create_job(approved_results, 1, "json")
        svc.create_job(approved_results, 1, "csv")

        jobs = svc.list_jobs(approved_results)
        assert len(jobs) == 2
