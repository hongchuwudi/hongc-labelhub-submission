"""
API 路由汇总——所有 v1 端点在这里拼装

最终 URL 结构:
  /api/auth/*         认证（注册/登录/刷新/个人信息）
  /api/datasets/*     数据集管理
  /api/schemas/*      Schema 设计器
  /api/tasks/*        标注任务
  /api/items/*        数据条目（嵌套在 datasets 路径下）
  /api/ai-configs/*   AI Agent 配置
"""
from fastapi import APIRouter

from app.api.v1.datasets.router import router as datasets_router
from app.api.v1.schemas.router import router as schemas_router
from app.api.v1.tasks.router import router as tasks_router
from app.api.v1.datasets.items import router as items_router
from app.api.v1.auth.router import router as auth_router
from app.api.v1.ai.configs import router as ai_configs_router
from app.api.v1.ai.router import router as ai_agents_router
from app.api.v1.ai.reviews import router as ai_reviews_router
from app.api.v1.auth.users import router as users_router
from app.api.v1.common.upload import router as upload_router
from app.api.v1.common.llm import router as llm_trigger_router
from app.api.v1.common.dashboard import router as dashboard_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(upload_router, prefix="/upload", tags=["upload"])
api_router.include_router(llm_trigger_router, prefix="/llm-trigger", tags=["llm"])
api_router.include_router(datasets_router, prefix="/datasets", tags=["datasets"])
api_router.include_router(schemas_router, prefix="/schemas", tags=["schemas"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
# items 路由本身以 /datasets/{dataset_id}/items 开头，不额外加 prefix
api_router.include_router(items_router, tags=["items"])
api_router.include_router(ai_configs_router, prefix="/ai-configs", tags=["ai-configs"])
api_router.include_router(ai_agents_router, prefix="/ai-agents", tags=["ai-agents"])
api_router.include_router(ai_reviews_router, prefix="/ai-reviews", tags=["ai-reviews"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
