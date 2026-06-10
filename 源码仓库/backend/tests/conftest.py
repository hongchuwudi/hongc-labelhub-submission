import os
import sys
from pathlib import Path

# 1. 必须最先：设置测试环境变量（pydantic-settings 在导入时会读 env）
os.environ["JWT_SECRET"] = "test-secret"
os.environ["DB_HOST"] = ""          # 空值 → database_url 无效，但后面会 monkeypatch
os.environ["REDIS_HOST"] = ""       # 后面 MockRedis 接管
os.environ["MQ_HOST"] = ""          # 不需要 MQ

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy.pool import StaticPool

from app.config.database import Base
from app.services.auth.service import hash_password
from app.models.auth.user import User

# 2. SQLite 内存引擎（StaticPool 确保所有会话共享同一连接）
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


class MockRedis:
    def __init__(self):
        self._store: dict[str, str] = {}
        self._lists: dict[str, list] = {}

    def set(self, key, value, nx=False, ex=None):
        if nx and key in self._store:
            return None  # key already exists, NX prevents overwrite
        self._store[key] = value
        return True

    def setex(self, key, ttl, value):
        self._store[key] = value

    def get(self, key):
        return self._store.get(key)

    def delete(self, key):
        self._store.pop(key, None)

    def rpush(self, key, *values):
        if key not in self._lists:
            self._lists[key] = []
        self._lists[key].extend(values)
        return len(self._lists[key])

    def blpop(self, key, timeout=0):
        lst = self._lists.get(key, [])
        if lst:
            return (key, lst.pop(0))
        return None

    def llen(self, key):
        return len(self._lists.get(key, []))

    def ping(self):
        return True


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    mock = MockRedis()
    monkeypatch.setattr("app.services.auth.service.get_redis", lambda: mock)
    monkeypatch.setattr("app.infra.redis_client.get_redis", lambda: mock)
    return mock


@pytest.fixture(autouse=True)
def mock_database(monkeypatch):
    """把所有用到数据库的地方都指向 SQLite"""
    import app.config.database as db_mod
    monkeypatch.setattr(db_mod, "engine", test_engine)
    monkeypatch.setattr(db_mod, "SessionLocal", TestingSession)

    def _test_get_db():
        session = TestingSession()
        try:
            yield session
        finally:
            session.close()

    monkeypatch.setattr(db_mod, "get_db", _test_get_db)


@pytest.fixture
def db():
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    from contextlib import asynccontextmanager
    from app.main import app

    @asynccontextmanager
    async def test_lifespan(application):
        Base.metadata.create_all(bind=test_engine)
        yield

    app.router.lifespan_context = test_lifespan
    with TestClient(app) as c:
        yield c


@pytest.fixture
def seed_user(db) -> User:
    user = User(
        name="测试员",
        email="test@test.com",
        password_hash=hash_password("123456"),
        role="owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ── 标注工作台共享 fixtures ──

@pytest.fixture
def seed_labeler(db):
    user = User(
        name="标注员", email="labeler@t.com",
        password_hash=hash_password("123"), role="labeler",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def seed_schema(db, seed_user):
    from app.models.schemas.schema import LabelSchema

    s = LabelSchema(
        name="商品标注模板", version=1,
        schema={
            "type": "object",
            "properties": {
                "category": {"type": "string", "enum": ["电子产品", "服装", "食品"]},
                "keywords": {"type": "array", "items": {"type": "string"}},
            },
        },
        owner_id=seed_user.id,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@pytest.fixture
def seed_dataset_with_items(db, seed_user):
    from app.models.datasets.dataset import Dataset
    from app.models.datasets.item import DatasetItem

    ds = Dataset(name="商品数据", format="json", owner_id=seed_user.id)
    db.add(ds)
    db.flush()

    items_data = [
        {"title": "商品A", "desc": "描述A"},
        {"title": "商品B", "desc": "描述B"},
        {"title": "商品C", "desc": "描述C"},
        {"title": "商品D", "desc": "描述D"},
        {"title": "商品E", "desc": "描述E"},
    ]
    for i, d in enumerate(items_data):
        db.add(DatasetItem(dataset_id=ds.id, index=i, data=d))
    db.commit()
    db.refresh(ds)
    return ds


@pytest.fixture
def seed_task(db, seed_user, seed_schema, seed_dataset_with_items):
    from app.services.tasks.service import TaskService

    svc = TaskService(db)
    task = svc.create(
        title="商品标注任务",
        description="<p>测试</p>",
        tags="电商,测试",
        dataset_id=seed_dataset_with_items.id,
        schema_id=seed_schema.id,
        owner_id=seed_user.id,
        assignee_type="labeler",
        distribution_strategy="first_come",
        quota=5,
    )
    return task


@pytest.fixture
def claimed_task(db, seed_task, seed_labeler):
    from app.services.tasks.service import TaskService

    svc = TaskService(db)
    svc.update(seed_task.id, status="published")
    return svc.claim(seed_task.id, seed_labeler.id)
