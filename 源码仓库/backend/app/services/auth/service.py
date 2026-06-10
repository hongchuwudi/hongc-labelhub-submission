"""
认证业务逻辑——双 JWT 完整生命周期

注意事项:
- 密码用 bcrypt 哈希，cost factor 由 gensalt() 自动选择（默认 12 轮）
- bcrypt 自动处理盐值（salt 嵌入在 hash 字符串中），不需要单独存 salt 字段
- Refresh Token 的白名单标记存在 Redis（key = jti, value = user_id）
  TTL 与 Refresh JWT 的 exp 一致（7 天），过期自动清除，不产生垃圾数据
"""
import bcrypt
from sqlalchemy.orm import Session

from app.models.auth.user import User
from app.config.settings import settings
from app.infra.exceptions import AppException, ConflictException
from app.infra.redis_client import get_redis
from app.infra.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
)


def hash_password(password: str) -> str:
    """bcrypt 哈希，盐值自动嵌入结果中"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """从哈希字符串中提取盐值验证"""
    return bcrypt.checkpw(password.encode(), hashed.encode())


class AuthService:
    """认证服务——每个请求创建一个实例，db 由 FastAPI Depends 注入"""

    def __init__(self, db: Session):
        self.db = db

    def register(self, name: str, email: str, password: str, role: str = "labeler") -> dict:
        """注册新用户，默认角色为 labeler。注册成功直接返回令牌对（免二次登录）"""
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise ConflictException("邮箱已被注册")
        user = User(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return self._make_tokens(user)

    def login(self, email: str, password: str) -> dict:
        """登录验证——密码错误和用户不存在返回相同错误信息（防用户枚举）
        AI Agent 系统账号禁止登录（password_hash 为空）"""
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise AppException(401, "邮箱或密码错误")
        if user.role == "ai_agent":
            raise AppException(403, "AI Agent 系统账号不支持登录")
        return self._make_tokens(user)

    def refresh(self, raw_refresh_token: str) -> dict:
        """用 Refresh JWT 换取新令牌对——三步安全保障:
        1. JWT 签名 + 过期校验（CPU，不查 Redis）
        2. Redis 白名单检查（防止已撤销的令牌重复使用）
        3. 删除旧白名单 → 签发新对（旧 Refresh Token 立即失效，实现一次性）
        """
        payload = decode_refresh_token(raw_refresh_token)
        r = get_redis()
        jti = payload["jti"]
        user_id = r.get(f"labelhub:refresh:{jti}")
        if not user_id:
            raise AppException(401, "刷新令牌已失效，请重新登录")
        r.delete(f"labelhub:refresh:{jti}")                         # 一次性: 旧令牌立即作废
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise AppException(401, "用户不存在")
        return self._make_tokens(user)

    def revoke(self, raw_refresh_token: str) -> None:
        """退出登录：删除当前 Refresh Token 的白名单"""
        try:
            payload = decode_refresh_token(raw_refresh_token)
            get_redis().delete(f"labelhub:refresh:{payload['jti']}")
        except AppException:
            pass                                                    # token 已失效无需操作

    def revoke_all(self, user_id: int) -> None:
        """改密码后强制下线所有设备: 扫描 Redis 删除该用户的所有白名单
        SCAN 命令不阻塞 Redis，key 数量少 (<1万) 时性能无影响"""
        r = get_redis()
        for key in r.scan_iter("labelhub:refresh:*"):
            if r.get(key) == str(user_id):
                r.delete(key)

    def _make_tokens(self, user: User) -> dict:
        """签发令牌对 + 写 Redis 白名单"""
        access_token = create_access_token(user.id, user.role)
        refresh_token = create_refresh_token(user.id)
        # 解码刚签发的 Refresh JWT 拿 jti，写入白名单
        # 注意: 这里 decode 不做 try/except，因为刚签发必然合法
        import jwt as pyjwt
        payload = pyjwt.decode(refresh_token, settings.JWT_SECRET, algorithms=["HS256"])
        get_redis().setex(
            f"labelhub:refresh:{payload['jti']}",
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            str(user.id),
        )
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }
