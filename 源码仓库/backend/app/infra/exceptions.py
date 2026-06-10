"""
全局异常体系——替代 try/except 散落在各路由

AppException 携带 HTTP 状态码和业务消息，被 middleware.py 的
app_exception_handler 捕获后统一转为 JSON 响应

子类分层:
  NotFoundException (404) → Service 层找不到资源时抛出
  BadRequestException (400) → 请求参数不合业务规则时抛出
  ConflictException (409) → 唯一约束冲突（如邮箱重复）
"""


class AppException(Exception):
    """业务异常基类——抛出的任何子类都会被全局 handler 捕获"""

    def __init__(self, code: int = 400, message: str = "请求错误"):
        self.code = code
        self.message = message


class NotFoundException(AppException):
    """资源不存在——查库返回 None 时抛出"""

    def __init__(self, resource: str = "资源"):
        super().__init__(code=404, message=f"{resource}不存在")


class BadRequestException(AppException):
    """请求参数不符合业务规则（非格式校验，格式校验由 Pydantic 处理）"""

    def __init__(self, message: str = "请求参数错误"):
        super().__init__(code=400, message=message)


class ConflictException(AppException):
    """资源冲突——唯一键重复、状态不允许操作等"""

    def __init__(self, message: str = "资源冲突"):
        super().__init__(code=409, message=message)


class ForbiddenException(AppException):
    """无权访问——操作了不属于自己的资源"""

    def __init__(self, message: str = "无权访问"):
        super().__init__(code=403, message=message)
