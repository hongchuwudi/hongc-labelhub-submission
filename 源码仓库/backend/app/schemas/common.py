"""
通用 Schema——统一响应格式 + 分页

设计意图:
  所有 API 返回 {"code":0, "message":"ok", "data":...} 格式。
  code=0 表示成功，非 0 表示业务异常（由 middleware 的异常 handler 填充）。
  前端 axios 拦截器拿到 code≠0 时直接提示，不用每个接口写判断。

为什么 APIResponse.ok() 返回 dict 而不是 model:
  FastAPI 的 response_model 校验要求 Pydantic model 实例，
  但 APIResponse 是泛型，data 类型每个端点不同——返回 dict 绕过校验，
  实际类型安全由路由函数的类型注解保证。
"""
from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class PageResult(BaseModel, Generic[T]):
    """分页统一格式——total 用于前端计算总页数"""
    total: int
    page: int
    page_size: int
    items: list[T]


class APIResponse(BaseModel, Generic[T]):
    """统一响应包装——所有端点都通过 APIResponse.ok() 返回"""

    code: int = 0
    message: str = "ok"
    data: T | None = None

    @staticmethod
    def ok(data: Any = None, message: str = "ok") -> dict:
        """成功响应快捷方法"""
        return {"code": 0, "message": message, "data": data}

    @staticmethod
    def error(code: int, message: str, data: Any = None) -> dict:
        """错误响应——通常由异常 handler 调用，路由层一般不直接使用"""
        return {"code": code, "message": message, "data": data}


class ResponseModel(BaseModel):
    """Swagger 文档用的兜底模型（FastAPI response_model 不接受裸 dict）"""
    code: int = 0
    message: str = "ok"
    data: Any = None

class LLMTriggerRequest(BaseModel):
    """LLM 字段级辅助建议请求"""
    task_id: int
    item_id: int
    field_key: str
    field_title: str
