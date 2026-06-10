"""
Task API 流程测试——创建→发布→认领→提交结果→数据条目状态筛选
"""
import pytest
from unittest.mock import MagicMock, call


# ── fixtures ──

@pytest.fixture
def mock_db():
    """返回一个 MagicMock Session"""
    return MagicMock()


@pytest.fixture
def task_service(mock_db):
    from app.services.tasks.service import TaskService
    return TaskService(mock_db)


# ── 认领测试 ──

class TestClaimTask:
    def _mock_query(self, task_service, return_task):
        """模拟任务查询链"""
        return_task.deadline = None
        task_service.db.query.return_value.filter.return_value.first.return_value = return_task

    def test_claim_success(self, task_service):
        """正常认领：published + first_come + 未认领"""
        task = MagicMock()
        task.distribution_strategy = "first_come"
        task.status = "published"
        task.assignee_id = None
        self._mock_query(task_service, task)

        result = task_service.claim(1, 10)

        assert result.assignee_id == 10
        task_service.db.commit.assert_called_once()

    def test_claim_wrong_strategy(self, task_service):
        """指派策略不能认领"""
        task = MagicMock()
        task.distribution_strategy = "assigned"
        task.status = "published"
        self._mock_query(task_service, task)

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="指派"):
            task_service.claim(1, 10)

    def test_claim_not_published(self, task_service):
        """未发布不能认领"""
        task = MagicMock()
        task.distribution_strategy = "first_come"
        task.status = "draft"
        self._mock_query(task_service, task)

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="未发布"):
            task_service.claim(1, 10)

    def test_claim_already_claimed(self, task_service):
        """已被认领不能重复认领"""
        task = MagicMock()
        task.distribution_strategy = "first_come"
        task.status = "published"
        task.assignee_id = 5
        self._mock_query(task_service, task)

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="已被认领"):
            task_service.claim(1, 10)


# ── 配额抢单 (quota_grab) 测试 ──

class TestQuotaGrab:
    def _mock_task(self, task_service, strategy="quota_grab", status="published",
                   grab_limit=None, task_id=1):
        task = MagicMock()
        task.distribution_strategy = strategy
        task.status = status
        task.grab_limit = grab_limit
        task.id = task_id
        task.assignee_id = None
        task.deadline = None
        task_service.db.query.return_value.filter.return_value.first.return_value = task
        return task

    def _mock_items(self, task_service, items):
        """模拟 TaskItem 查询返回指定列表"""
        task_service.db.query.return_value.filter.return_value.limit.return_value.with_for_update.return_value.all.return_value = items

    def _mock_already_claimed(self, task_service, count: int):
        """模拟已认领条数查询"""
        task_service.db.query.return_value.filter.return_value.count.return_value = count

    def test_quota_grab_success(self, task_service):
        """配额抢单：正常分配指定数量的条目"""
        self._mock_task(task_service)
        self._mock_already_claimed(task_service, 0)
        mock_items = [MagicMock() for _ in range(5)]
        self._mock_items(task_service, mock_items)

        result = task_service.claim(1, 10, count=5)

        assert result.assignee_id is None  # quota_grab 不设 task.assignee_id
        for item in mock_items:
            assert item.labeler_id == 10
        task_service.db.commit.assert_called_once()

    def test_quota_grab_default_limit(self, task_service):
        """配额抢单：未指定 count 时使用 grab_limit 或默认 10"""
        self._mock_task(task_service, grab_limit=10)
        self._mock_already_claimed(task_service, 0)
        mock_items = [MagicMock() for _ in range(10)]
        self._mock_items(task_service, mock_items)

        result = task_service.claim(1, 10)

        for item in mock_items:
            assert item.labeler_id == 10

    def test_quota_grab_exceed_limit(self, task_service):
        """配额抢单：已达累计上限无法再领"""
        self._mock_task(task_service, grab_limit=5)
        self._mock_already_claimed(task_service, 5)

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="已达上限"):
            task_service.claim(1, 10, count=3)

    def test_quota_grab_partial_remaining(self, task_service):
        """配额抢单：已领部分后只能补领剩余配额"""
        self._mock_task(task_service, grab_limit=5)
        self._mock_already_claimed(task_service, 3)
        mock_items = [MagicMock() for _ in range(2)]
        self._mock_items(task_service, mock_items)

        result = task_service.claim(1, 10, count=5)

        for item in mock_items:
            assert item.labeler_id == 10

    def test_quota_grab_no_items_left(self, task_service):
        """配额抢单：无剩余条目抛出异常"""
        self._mock_task(task_service)
        self._mock_already_claimed(task_service, 0)
        self._mock_items(task_service, [])

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="无剩余"):
            task_service.claim(1, 10, count=5)

    def test_quota_grab_partial_available(self, task_service):
        """配额抢单：剩余条目少于请求数时分配可用的"""
        self._mock_task(task_service)
        self._mock_already_claimed(task_service, 0)
        mock_items = [MagicMock() for _ in range(3)]
        self._mock_items(task_service, mock_items)

        result = task_service.claim(1, 10, count=5)

        for item in mock_items:
            assert item.labeler_id == 10

    def test_quota_grab_not_published(self, task_service):
        """配额抢单：未发布不能抢单"""
        self._mock_task(task_service, status="draft")

        from app.infra.exceptions import BadRequestException
        with pytest.raises(BadRequestException, match="未发布"):
            task_service.claim(1, 10, count=5)


# ── 任务访问权限测试 ──

class TestCheckTaskAccess:
    def _mock_get(self, task_service, task):
        task_service.get = MagicMock(return_value=task)

    def test_owner_access_own_task(self, task_service):
        """Owner 能访问自己创建的任务"""
        task = MagicMock()
        task.owner_id = 5
        self._mock_get(task_service, task)

        result = task_service.check_task_access(1, 5, "owner")
        assert result is task

    def test_owner_cannot_access_others_task(self, task_service):
        """Owner 不能访问别人的任务"""
        task = MagicMock()
        task.owner_id = 5
        self._mock_get(task_service, task)

        from app.infra.exceptions import ForbiddenException
        with pytest.raises(ForbiddenException):
            task_service.check_task_access(1, 99, "owner")

    def test_labeler_first_come_access(self, task_service):
        """first_come 标注员必须 task.assignee_id 匹配"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "first_come"
        task.assignee_id = 10
        self._mock_get(task_service, task)

        result = task_service.check_task_access(1, 10, "labeler")
        assert result is task

    def test_labeler_first_come_denied(self, task_service):
        """first_come 标注员不匹配时拒绝"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "first_come"
        task.assignee_id = 10
        self._mock_get(task_service, task)

        from app.infra.exceptions import ForbiddenException
        with pytest.raises(ForbiddenException):
            task_service.check_task_access(1, 88, "labeler")

    def test_labeler_quota_grab_access(self, task_service):
        """quota_grab 标注员有已认领条目时可访问"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "quota_grab"
        self._mock_get(task_service, task)

        task_service.db.query.return_value.filter.return_value.first.return_value = MagicMock()

        result = task_service.check_task_access(1, 10, "labeler")
        assert result is task

    def test_labeler_quota_grab_denied(self, task_service):
        """quota_grab 标注员未认领条目时拒绝"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "quota_grab"
        self._mock_get(task_service, task)

        task_service.db.query.return_value.filter.return_value.first.return_value = None

        from app.infra.exceptions import ForbiddenException
        with pytest.raises(ForbiddenException):
            task_service.check_task_access(1, 10, "labeler")

    def test_labeler_assigned_access(self, task_service):
        """assigned 标注员 task.assignee_id 匹配时可访问"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "assigned"
        task.assignee_id = 10
        self._mock_get(task_service, task)

        result = task_service.check_task_access(1, 10, "labeler")
        assert result is task

    def test_labeler_assigned_denied(self, task_service):
        """assigned 标注员不匹配时拒绝"""
        task = MagicMock()
        task.owner_id = 99
        task.distribution_strategy = "assigned"
        task.assignee_id = 10
        self._mock_get(task_service, task)

        from app.infra.exceptions import ForbiddenException
        with pytest.raises(ForbiddenException):
            task_service.check_task_access(1, 88, "labeler")

    def test_reviewer_access_any(self, task_service):
        """reviewer 可访问任意任务"""
        task = MagicMock()
        task.owner_id = 99
        self._mock_get(task_service, task)

        result = task_service.check_task_access(1, 7, "reviewer")
        assert result is task


# ── 结果提交测试 ──

class TestCreateResult:
    def test_no_task_id_in_kwargs(self, task_service):
        """修复后：kwargs 不应携带 task_id"""
        task = MagicMock()
        task.status = "published"
        task.total_items = 10
        task.completed_items = 5
        task_service.get = MagicMock(return_value=task)

        # 防重复查询返回 None，TaskItem 查询也返回 None
        task_service.db.query.return_value.filter.return_value.first.return_value = None
        # 原子 update 返回一个 mock
        task_service.db.query.return_value.filter.return_value.update.return_value = None

        # simulate body.model_dump() without task_id
        kwargs = {"item_id": 1, "labeler_id": 10, "labeler_type": "human", "data": {"a": 1}}
        result = task_service.create_result(1, **kwargs)

        # LabelResult 构造时应传入 task_id=1
        task_service.db.add.assert_called_once()
        created = task_service.db.add.call_args[0][0]
        assert created.task_id == 1
        assert created.item_id == 1


# ── 列表筛选测试 ──

class TestListTasksFilter:
    def test_filter_by_assignee(self, task_service):
        """按标注员筛选"""
        task_service.db.query.return_value.filter.side_effect = (
            lambda *args, **kw: task_service.db.query.return_value
        )
        task_service.db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        task_service.db.query.return_value.count.return_value = 0

        items, total = task_service.list_tasks(assignee_id=10)
        assert total == 0

    def test_filter_by_status(self, task_service):
        """按状态筛选"""
        task_service.db.query.return_value.filter.side_effect = (
            lambda *args, **kw: task_service.db.query.return_value
        )
        task_service.db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        task_service.db.query.return_value.count.return_value = 0

        items, total = task_service.list_tasks(status="published")
        assert total == 0


class TestListItemsFilter:
    def test_list_items(self, mock_db):
        from app.services.datasets.item_service import DatasetItemService

        svc = DatasetItemService(mock_db)
        mock_db.query.return_value.filter.side_effect = (
            lambda *args, **kw: mock_db.query.return_value
        )
        mock_db.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        mock_db.query.return_value.count.return_value = 0

        items, total = svc.list_items(1, page=1, page_size=50)
        assert total == 0
