"""
database.py — 数据库层
Author: hongchuwudi
Description: SQLAlchemy 引擎 + 会话工厂，连接池/慢查询日志/FastAPI 依赖注入
# Constant: logger — SQL 慢查询日志记录器
# Constant: engine — SQLAlchemy 引擎实例（连接池10，120s回收）
# Constant: SessionLocal — 线程安全会话工厂
# Function: _before — 查询前记录时间戳
# Function: _after — 查询后记录 >300ms 慢 SQL
# Class: Base — ORM 声明式基类
# Function: get_db — FastAPI Depends 生成器
"""
import time
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config.settings import settings

# logger — SQL 慢查询日志
logger = logging.getLogger("labelhub.sql")
# engine — 全局数据库引擎
engine = create_engine(
    settings.database_url,
    pool_size=10,
    pool_recycle=120,
    pool_pre_ping=True,
    connect_args={
        "connect_timeout": 5,
        "read_timeout": 10,
        "write_timeout": 10,
    },
)

# _before — 查询前记录时间戳
@event.listens_for(engine, "before_cursor_execute")
def _before(conn, cursor, statement, parameters, context, executemany):
    conn.info["_query_start"] = time.perf_counter()

@event.listens_for(engine, "after_cursor_execute")
def _after(conn, cursor, statement, parameters, context, executemany):
    elapsed = time.perf_counter() - conn.info.get("_query_start", time.perf_counter())
    if elapsed > 0.3:  # 只打超过 300ms 的慢查询
        logger.warning("SLOW %.3fs | %s", elapsed, statement[:200])

# SessionLocal — 线程安全会话工厂，手动事务控制
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base — ORM 声明式基类
class Base(DeclarativeBase):
    pass

# get_db — FastAPI 依赖注入，请求结束自动归还连接
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
