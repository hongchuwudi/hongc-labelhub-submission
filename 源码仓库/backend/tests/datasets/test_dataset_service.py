"""Dataset Service 单元测试——CRUD + 条目批量导入"""
import pytest
from unittest.mock import MagicMock


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def dataset_service(mock_db):
    from app.services.datasets.service import DatasetService
    return DatasetService(mock_db)


@pytest.fixture
def item_service(mock_db):
    from app.services.datasets.item_service import DatasetItemService
    return DatasetItemService(mock_db)


# ── Dataset CRUD ──

class TestDatasetCRUD:
    def test_create(self, dataset_service):
        """创建数据集"""
        dataset_service.db.add = MagicMock()
        dataset_service.db.commit = MagicMock()
        dataset_service.db.refresh = MagicMock()

        result = dataset_service.create(name="测试数据集", description="desc", format="json")

        assert result.name == "测试数据集"
        assert result.format == "json"
        dataset_service.db.add.assert_called_once()
        dataset_service.db.commit.assert_called_once()

    def test_get_not_found(self, dataset_service):
        """查不存在的数据集抛 404"""
        dataset_service.db.query.return_value.filter.return_value.first.return_value = None

        from app.infra.exceptions import NotFoundException
        with pytest.raises(NotFoundException, match="数据集"):
            dataset_service.get(999)

    def test_delete(self, dataset_service):
        """删除数据集——无关联引用时正常删除"""
        mock_ds = MagicMock()
        mock_ds.id = 1
        dataset_service.get = MagicMock(return_value=mock_ds)

        # Mock query chain: query(...).filter(...).first() → None（无引用）
        mock_query = MagicMock()
        mock_query.filter.return_value.first.return_value = None
        dataset_service.db.query.return_value = mock_query
        dataset_service.db.delete = MagicMock()
        dataset_service.db.commit = MagicMock()

        dataset_service.delete(1)

        dataset_service.db.delete.assert_called_once_with(mock_ds)


# ── DatasetItem 导入 ──

class TestItemBatchImport:
    def test_batch_create(self, item_service):
        """批量导入——add_all 一次性写库"""
        item_service.db.add_all = MagicMock()
        item_service.db.commit = MagicMock()
        item_service.db.refresh = MagicMock()

        # mock _sync_item_count 不干实事
        item_service._sync_item_count = MagicMock()

        items_data = [
            {"data": {"title": "商品A", "price": 100}},
            {"data": {"title": "商品B", "price": 200}},
        ]

        results = item_service.batch_create(1, items_data)

        assert len(results) == 2
        results[0].index = 0
        results[0].data = {"title": "商品A", "price": 100}
        results[1].index = 1
        results[1].data = {"title": "商品B", "price": 200}
        item_service.db.add_all.assert_called_once()

    def test_batch_create_empty(self, item_service):
        """空列表导入——不报错"""
        item_service.db.add_all = MagicMock()
        item_service.db.commit = MagicMock()
        item_service._sync_item_count = MagicMock()

        results = item_service.batch_create(1, [])

        assert len(results) == 0
        item_service.db.add_all.assert_called_once_with([])

    def test_list_items_pagination(self, item_service):
        """分页查询条目——按 index 升序"""
        q = item_service.db.query.return_value
        q.filter.return_value = q
        q.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        q.count.return_value = 10

        items, total = item_service.list_items(1, page=2, page_size=20)

        assert total == 10
