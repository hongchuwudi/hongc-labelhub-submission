"""
标注工作台集成测试——条目列表 / 跳过 / 提交 / 我的结果 / 统计

用户故事:
  标注员领任务 → 看左侧条目队列 → 逐题作答 → 跳过不懂的 →
  提交后右侧统计实时更新 → 时间轴显示所有提交记录

共享 fixtures 在 conftest.py: seed_labeler, seed_schema, seed_dataset_with_items, seed_task, claimed_task
"""
import pytest


# ── 测试 ──

class TestListTaskItems:
    """左侧条目队列"""

    def test_list_all_items(self, db, claimed_task, seed_labeler):
        """认领后能看到全部 5 条待标注条目"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        assert len(items) == 5
        assert all(it["status"] == "pending" for it in items)
        assert items[0]["index"] == 0
        assert items[0]["data"]["title"] == "商品A"

    def test_owner_sees_all(self, db, seed_task):
        """Owner 不传 labeler_id，看到所有条目"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(seed_task.id)

        assert len(items) == 5

    def test_filter_by_status(self, db, claimed_task, seed_labeler):
        """按状态筛选项——先跳过一条，再查 skipped"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        # 先拿到第一条的 item_id
        items = svc.list_task_items(claimed_task.id)
        first_item_id = items[0]["id"]

        svc.skip_item(claimed_task.id, first_item_id, seed_labeler.id)

        pending = svc.list_task_items(claimed_task.id, status="pending")
        skipped = svc.list_task_items(claimed_task.id, status="skipped")

        assert len(pending) == 4
        assert len(skipped) == 1


class TestGetTaskItem:
    """单条详情"""

    def test_get_without_result(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        detail = svc.get_task_item(claimed_task.id, items[0]["id"], seed_labeler.id)

        assert detail["data"]["title"] == "商品A"
        assert detail["last_result"] is None

    def test_get_with_result(self, db, claimed_task, seed_labeler):
        """提交后再查，能看到 last_result"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品", "keywords": ["手机"]},
            round=1,
        )

        detail = svc.get_task_item(claimed_task.id, items[0]["id"], seed_labeler.id)

        assert detail["last_result"] is not None
        assert detail["last_result"]["data"]["category"] == "电子产品"
        assert detail["last_result"]["status"] == "submitted"


class TestSkipItem:
    """跳过条目"""

    def test_skip_and_revisit(self, db, claimed_task, seed_labeler):
        """跳过后状态为 skipped，但仍可对该条目提交结果（从 skipped → labeled）"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)
        target = items[2]

        svc.skip_item(claimed_task.id, target["id"], seed_labeler.id)

        # 验证 skipped
        skipped = svc.list_task_items(claimed_task.id, status="skipped")
        assert len(skipped) == 1

        # 回头再做——提交结果，状态自动变为 labeled
        svc.create_result(
            task_id=claimed_task.id,
            item_id=target["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "食品", "keywords": ["零食"]},
        )

        detail = svc.get_task_item(claimed_task.id, target["id"], seed_labeler.id)
        assert detail["status"] == "labeled"

    def test_skip_nonexistent(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService
        from app.infra.exceptions import NotFoundException

        svc = TaskService(db)
        with pytest.raises(NotFoundException):
            svc.skip_item(claimed_task.id, 99999, seed_labeler.id)


class TestCreateResult:
    """提交标注结果"""

    def test_submit_success(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        result = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品", "keywords": ["手机", "平板"]},
        )

        assert result.task_id == claimed_task.id
        assert result.status == "submitted"
        assert result.round == 1

        # task_item 状态同步为 labeled
        detail = svc.get_task_item(claimed_task.id, items[0]["id"], seed_labeler.id)
        assert detail["status"] == "labeled"

    def test_duplicate_submit_rejected(self, db, claimed_task, seed_labeler):
        """同一标注员对同一条目重复提交 submitted 状态的结果应被拒绝"""
        from app.services.tasks.service import TaskService
        from app.infra.exceptions import BadRequestException

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )

        with pytest.raises(BadRequestException, match="已有待审核"):
            svc.create_result(
                task_id=claimed_task.id,
                item_id=items[0]["id"],
                labeler_id=seed_labeler.id,
                labeler_type="human",
                data={"category": "服装"},
            )

    def test_submit_after_rejected_allowed(self, db, claimed_task, seed_labeler):
        """被打回后再重新提交应该允许——round+1，新记录"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        # 第一次提交
        r1 = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )
        # 模拟审核打回——直接操作 DB 改 status
        from app.models.tasks.result import LabelResult
        db.query(LabelResult).filter(LabelResult.id == r1.id).update({"status": "rejected", "comment": "分类错误"})
        db.commit()

        # 重新提交
        r2 = svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "服装"},
            round=2,
        )
        assert r2.round == 2


class TestMyResultsAndStats:
    """我的结果列表 & 统计"""

    def test_my_results(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )
        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[1]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "服装"},
        )

        results = svc.list_my_results(claimed_task.id, seed_labeler.id)
        assert len(results) == 2
        item_ids = {r.item_id for r in results}
        assert item_ids == {items[0]["id"], items[1]["id"]}

    def test_my_stats(self, db, claimed_task, seed_labeler):
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        items = svc.list_task_items(claimed_task.id)

        # 提交 2 条
        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[0]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "电子产品"},
        )
        svc.create_result(
            task_id=claimed_task.id,
            item_id=items[1]["id"],
            labeler_id=seed_labeler.id,
            labeler_type="human",
            data={"category": "服装"},
        )
        # 跳过 1 条
        svc.skip_item(claimed_task.id, items[2]["id"], seed_labeler.id)

        stats = svc.get_my_stats(claimed_task.id, seed_labeler.id)
        assert stats["pending"] == 2
        assert stats["labeled"] == 2
        assert stats["skipped"] == 1
        assert stats["total"] == 5

    def test_unclaimed_task_stats(self, db, seed_task):
        """未认领任务——所有条目都是 pending，labeled/skipped 为 0"""
        from app.services.tasks.service import TaskService

        svc = TaskService(db)
        stats = svc.get_my_stats(seed_task.id, 99999)
        assert stats["pending"] == 5
        assert stats["labeled"] == 0
        assert stats["skipped"] == 0
        assert stats["total"] == 5


# ── 权限测试（通过 API 层）──

@pytest.fixture
def api_setup(client):
    """注册 owner + labeler1 + labeler2，owner 创建任务后 labeler1 认领"""
    # 注册 owner
    r = client.post("/api/auth/register", json={
        "name": "Owner", "email": "owner@t.com", "password": "123", "role": "owner",
    })
    owner_token = r.json()["data"]["access_token"]

    # 注册两个 labeler
    r1 = client.post("/api/auth/register", json={
        "name": "L1", "email": "l1@t.com", "password": "123", "role": "labeler",
    })
    l1_token = r1.json()["data"]["access_token"]

    r2 = client.post("/api/auth/register", json={
        "name": "L2", "email": "l2@t.com", "password": "123", "role": "labeler",
    })
    l2_token = r2.json()["data"]["access_token"]

    # Owner 创建数据集
    auth = {"Authorization": f"Bearer {owner_token}"}
    ds_resp = client.post("/api/datasets/", json={
        "name": "权限测试集", "format": "json",
    }, headers=auth)
    ds_id = ds_resp.json()["data"]["id"]

    # 导入条目
    client.post(f"/api/datasets/{ds_id}/items/batch", json={
        "items": [{"index": i, "data": {"t": f"item{i}"}} for i in range(3)]
    }, headers=auth)

    # 创建 schema
    s_resp = client.post("/api/schemas/", json={
        "name": "权限测试模板",
        "schema": {"type": "object", "properties": {"a": {"type": "string"}}},
    }, headers=auth)
    schema_id = s_resp.json()["data"]["id"]

    # 创建任务
    t_resp = client.post("/api/tasks/", json={
        "title": "权限测试任务",
        "dataset_id": ds_id,
        "schema_id": schema_id,
        "distribution_strategy": "first_come",
        "quota": 3,
    }, headers=auth)
    task_id = t_resp.json()["data"]["id"]

    # 发布
    client.patch(f"/api/tasks/{task_id}", json={"status": "published"}, headers=auth)

    # 获取 L1 的 user_id
    l1_auth = {"Authorization": f"Bearer {l1_token}"}
    me_resp = client.get("/api/auth/me", headers=l1_auth)
    l1_id = me_resp.json()["data"]["id"]

    # L1 认领
    client.post(f"/api/tasks/{task_id}/claim", headers=l1_auth)

    return {
        "task_id": task_id,
        "owner_token": owner_token,
        "l1_token": l1_token,
        "l2_token": l2_token,
    }


class TestAccessControl:
    """权限隔离——非认领 labeler 不能操作别人任务的条目"""

    def test_l1_can_list_items(self, client, api_setup):
        """认领者 L1 可以看到条目"""
        auth = {"Authorization": f"Bearer {api_setup['l1_token']}"}
        resp = client.get(f"/api/tasks/{api_setup['task_id']}/items", headers=auth)
        assert resp.status_code == 200
        assert len(resp.json()["data"]) == 3

    def test_l2_cannot_list_items(self, client, api_setup):
        """非认领者 L2 访问别人任务的条目 → 403"""
        auth = {"Authorization": f"Bearer {api_setup['l2_token']}"}
        resp = client.get(f"/api/tasks/{api_setup['task_id']}/items", headers=auth)
        assert resp.status_code == 403
        assert "无权访问" in resp.json()["message"]

    def test_l2_cannot_skip(self, client, api_setup):
        """非认领者不能跳过别人的条目"""
        auth = {"Authorization": f"Bearer {api_setup['l2_token']}"}
        resp = client.post(f"/api/tasks/{api_setup['task_id']}/items/1/skip", headers=auth)
        assert resp.status_code == 403

    def test_l2_cannot_see_results(self, client, api_setup):
        """非认领者不能看别人的提交记录"""
        auth = {"Authorization": f"Bearer {api_setup['l2_token']}"}
        resp = client.get(f"/api/tasks/{api_setup['task_id']}/my-results", headers=auth)
        assert resp.status_code == 403

    def test_l2_cannot_see_stats(self, client, api_setup):
        """非认领者不能看别人的统计"""
        auth = {"Authorization": f"Bearer {api_setup['l2_token']}"}
        resp = client.get(f"/api/tasks/{api_setup['task_id']}/my-stats", headers=auth)
        assert resp.status_code == 403
