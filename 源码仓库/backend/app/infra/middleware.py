"""
中间件 & 异常处理器——请求管道和全局错误拦截

中间件执行顺序（后注册的先执行）:
  请求 → CORS → RequestLog → 路由 → 响应 → RequestLog → CORS → 客户端

异常处理器优先级:
  1. AppException → 业务异常（401/403/404/409）
  2. RequestValidationError → Pydantic 参数校验失败（422）
  3. Exception → 兜底，未预期错误（500）
"""
import time
import logging

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.infra.exceptions import AppException

logger = logging.getLogger("labelhub")


class RequestLogMiddleware(BaseHTTPMiddleware):
    """每个请求打印一行日志: 方法 + 路径 + 状态码 + 耗时"""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response: Response = await call_next(request)
        elapsed = time.perf_counter() - start
        logger.info(
            "%s %s -> %s (%.3fs)",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """业务异常 → 统一 JSON: {code, message, data: null}"""
    return JSONResponse(
        status_code=exc.code,
        content={"code": exc.code, "message": exc.message, "data": None},
    )


async def validation_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Pydantic 校验失败 → 拼出人类可读的错误描述
    如 "body.name: field required; query.page: ensure this value is greater than 0" """
    from fastapi.exceptions import RequestValidationError

    if isinstance(exc, RequestValidationError):
        errors = exc.errors()
        detail = "; ".join(
            f"{'.'.join(str(l) for l in e['loc'])}: {e['msg']}" for e in errors
        )
        return JSONResponse(
            status_code=422,
            content={"code": 422, "message": detail, "data": None},
        )
    raise exc                                                    # 不是 ValidationError，继续往上抛


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """兜底——未预期的 500 错误"""
    from sqlalchemy.exc import IntegrityError

    if isinstance(exc, IntegrityError):
        msg = str(exc.orig) if exc.orig else "数据完整性冲突"
        logger.warning("IntegrityError: %s", msg)
        return JSONResponse(
            status_code=409,
            content={"code": 409, "message": f"操作冲突：{msg}", "data": None},
        )

    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"code": 500, "message": "服务器内部错误", "data": None},
    )
