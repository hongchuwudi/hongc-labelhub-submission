"""
test_task_items.py — list_task_items 业务逻辑测试
"""
import pytest
from app.config.database import SessionLocal
from app.services.tasks.service import TaskService


@pytest.fixture
def svc():
    db = SessionLocal()
    svc = TaskService(db)
    yield svc
    db.close()


class TestListTaskItems:
    """验证条目列表不因 labeler_id 而过滤掉待标注条目"""

    def test_returns_items_regardless_of_labeler_id(self, svc):
        """BUG 回归: labeler_id 参数只应用于查 last_result，不应过滤 items"""
        items = svc.list_task_items(26, labeler_id=2)
        # task 26 有 3 个 pending 条目，labeler_id=2 不应该过滤它们
        assert len(items) == 3, f"Expected 3 items, got {len(items)}"
        for it in items:
            assert it["data"] is not None
            assert it["status"] in ("pending", "labeled", "skipped")

    def test_returns_empty_for_nonexistent_task(self, svc):
        items = svc.list_task_items(99999, labeler_id=1)
        assert items == []

    def test_last_result_included(self, svc):
        """已提交过标注的条目应包含 last_result"""
        items = svc.list_task_items(23, labeler_id=2)
        has_result = [it for it in items if it["last_result"] is not None]
        assert len(has_result) > 0, "Should have items with last_result"
