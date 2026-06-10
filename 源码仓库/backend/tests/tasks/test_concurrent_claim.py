"""
并发认领测试——SELECT FOR UPDATE 行锁防竞态
Author: hongchuwudi
Description: 多线程模拟标注员同时抢单，验证无重复分配
"""
import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter
from sqlalchemy.orm import Session

from app.services.tasks.service import TaskService
from app.services.auth.service import hash_password
from app.models.auth.user import User
from app.models.datasets.dataset import Dataset
from app.models.datasets.item import DatasetItem
from app.models.schemas.schema import LabelSchema
from app.models.tasks.task import LabelTask
from app.models.tasks.item import TaskItem


def _create_user(db: Session, name: str, role: str = "labeler") -> User:
    u = User(name=name, email=f"{name}@t.com", password_hash=hash_password("123"), role=role)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _create_task(db: Session, owner_id: int, dataset_id: int, schema_id: int,
                 strategy: str = "quota_grab", quota: int = 5, grab_limit: int | None = 2) -> LabelTask:
    svc = TaskService(db)
    task = svc.create(
        title="并发测试任务", dataset_id=dataset_id, schema_id=schema_id,
        owner_id=owner_id, distribution_strategy=strategy,
        quota=quota, grab_limit=grab_limit, assignee_type="labeler",
    )
    svc.update(task.id, status="published")
    return task


def _claim(task_id: int, user_id: int, count: int | None = None) -> dict:
    """在独立 session 中认领——模拟不同请求的数据库连接"""
    from app.config.database import SessionLocal as SL
    s = SL()
    try:
        svc = TaskService(s)
        result = svc.claim(task_id, user_id, count)
        return {"user_id": user_id, "task_id": result.id, "status": "ok"}
    except Exception as e:
        return {"user_id": user_id, "error": str(e)}
    finally:
        s.close()


@pytest.fixture
def quota_grab_setup(db):
    """准备配额抢单环境：owner + 数据集(10条) + schema + 任务(quota_grab, quota=10, grab_limit=3)"""
    owner = _create_user(db, "owner_concurrent", "owner")
    ds = Dataset(name="并发测试数据集", format="json", owner_id=owner.id)
    db.add(ds)
    db.flush()
    for i in range(10):
        db.add(DatasetItem(dataset_id=ds.id, index=i, data={"idx": i, "text": f"数据_{i}"}))
    db.commit()

    schema = LabelSchema(name="并发测试模板", version=1, schema={"type": "object"}, owner_id=owner.id)
    db.add(schema)
    db.commit()

    task = _create_task(db, owner.id, ds.id, schema.id, "quota_grab", quota=10, grab_limit=3)
    return {"owner": owner, "dataset": ds, "schema": schema, "task": task}


class TestConcurrentQuotaGrab:
    def test_no_duplicate_assignment(self, db, quota_grab_setup):
        """5个标注员同时抢10条(每人最多3条)——不能有重复分配"""
        task = quota_grab_setup["task"]
        labelers = [_create_user(db, f"labeler_{i}") for i in range(5)]

        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(_claim, task.id, u.id, 3): u.id for u in labelers}
            results = [f.result() for f in as_completed(futures)]

        db.expire_all()
        task_items = db.query(TaskItem).filter(TaskItem.task_id == task.id).all()
        assigned = [ti for ti in task_items if ti.labeler_id is not None]

        labeler_ids = {u.id for u in labelers}
        for ti in assigned:
            assert ti.labeler_id in labeler_ids, f"条目 {ti.id} 被未知标注员 {ti.labeler_id} 认领"

        # 每人最多 3 条（grab_limit）
        counts = Counter(ti.labeler_id for ti in assigned)
        for uid, cnt in counts.items():
            assert cnt <= 3, f"标注员 {uid} 认领了 {cnt} 条，超过 grab_limit=3"

        # 不能全空——至少有几个线程成功了
        assert len(assigned) > 0, "没有任何条目被认领"

    def test_first_come_only_one_wins(self, db, quota_grab_setup):
        """first_come 并发——只有一个能认领成功"""
        task = _create_task(db, quota_grab_setup["owner"].id,
                           quota_grab_setup["dataset"].id,
                           quota_grab_setup["schema"].id,
                           "first_come", quota=5)
        labelers = [_create_user(db, f"fc_labeler_{i}") for i in range(5)]

        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = {pool.submit(_claim, task.id, u.id): u.id for u in labelers}
            results = [f.result() for f in as_completed(futures)]

        db.expire_all()
        task_refreshed = db.query(LabelTask).filter(LabelTask.id == task.id).first()
        ok = [r for r in results if r.get("status") == "ok"]

        assert len(ok) == 1, f"first_come 应该有且只有一个成功，实际 {len(ok)} 个"
        assert task_refreshed.assignee_id is not None
        assert task_refreshed.assignee_id in {u.id for u in labelers}
