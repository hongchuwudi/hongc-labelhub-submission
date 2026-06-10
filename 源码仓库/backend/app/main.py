"""
main.py — 应用入口
Author: hongchuwudi
Description: FastAPI 应用工厂，注册中间件/路由/异常处理器，启动时建表
# Function: lifespan — 启动建表 + 创建默认 AI Agent
# Constant: app — FastAPI 实例
# Function: root — 根路径健康检查
# Function: health — 健康检查端点
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.config.database import engine, Base, SessionLocal
from app.models import *  # noqa: F403 触发 Model import 注册到 Base.metadata
from app.api.router import api_router
from app.infra.exceptions import AppException
from app.infra.middleware import (
    RequestLogMiddleware,
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler,
)

# logging — 全局日志格式
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# lifespan — 启动建表 + 默认 AI Agent 账户 + Agent 线程池
@asynccontextmanager
async def lifespan(application: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from app.models.auth.user import User
        from app.services.auth.service import hash_password
        if not db.query(User).filter(User.role == "ai_agent").first():
            ai_user = User(
                name="AI 审核 Agent",
                email="ai-agent@labelhub.system",
                password_hash=hash_password("ai-agent-internal"),
                role="ai_agent",
            )
            db.add(ai_user)
            db.commit()
            logging.getLogger("lifespan").info("Created AI Agent (id=%d)", ai_user.id)
    finally:
        db.close()

    # 启动 Agent 线程池（从 DB 加载所有 Agent 配置）
    try:
        from app.agents.pool import pool
        pool.start()
        logging.getLogger("lifespan").info("AgentPool started")
    except Exception as e:
        logging.getLogger("lifespan").warning("AgentPool start failed: %s", e)

    # 启动 MQ 消费者（后台线程消费 AI 审核队列）
    import threading
    mq_thread = threading.Thread(
        target=_start_ai_worker,
        name="ai-worker-mq",
        daemon=True,  # 主进程退出时自动结束
    )
    mq_thread.start()
    logging.getLogger("lifespan").info("AI MQ Worker started")

    yield

    # 关闭 Agent 池
    try:
        from app.agents.pool import pool
        pool.shutdown()
        logging.getLogger("lifespan").info("AgentPool shutdown")
    except Exception:
        pass

def _start_ai_worker():
    """后台线程 — 消费 MQ AI 审核队列，提交到 Agent 池（MQ 不可用则静默结束）"""
    try:
        from app.agents.ai_worker import main as ai_worker_main
        ai_worker_main()
    except Exception as e:
        logging.getLogger("lifespan").warning("AI MQ Worker exited: %s", e)


# app — FastAPI 实例（非 DEBUG 模式关闭 API 文档）
_docs_enabled = settings.DEBUG
app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

# 中间件
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(RequestLogMiddleware)

# 异常处理器
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# 路由
app.include_router(api_router, prefix="/api")

# 健康检查
@app.get("/")
def root():
    return {"name": settings.APP_NAME, "status": "running"}

@app.get("/health")
def health():
    return {"status": "ok"}
