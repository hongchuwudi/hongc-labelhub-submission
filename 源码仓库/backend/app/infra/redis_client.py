"""
Redis 客户端——连接池 + 三种工具类

连接管理:
- 单例连接池（全局复用），避免每次操作都建连/断连
- decode_responses=True: 自动把 bytes 转 str，不用手动 .decode()
- max_connections=20: 足够这个项目用，co-routine 再多也不会超过连接池

三种工具类分别对标三个场景:
  RedisQueue → AI 审核任务入队（替代 Celery/RQ 的轻量方案）
  RedisLock  → 任务抢单防并发（SETNX 原子操作）
  RedisCache → Schema JSON 热缓存（减少 MySQL 查询）
"""
import redis

from app.config.settings import settings

_pool: redis.ConnectionPool | None = None


def get_redis() -> redis.Redis:
    """获取 Redis 连接（连接池单例）"""
    global _pool
    if _pool is None:
        _pool = redis.ConnectionPool(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD,
            db=settings.REDIS_DB,
            decode_responses=True,
            max_connections=20,
        )
    return redis.Redis(connection_pool=_pool)


class RedisQueue:
    """基于 Redis List 的 FIFO 任务队列
    push 右进，pop 左出（BLPOP 阻塞读，无任务时自动等待不空转）"""

    def __init__(self, name: str):
        self.name = f"labelhub:queue:{name}"

    def push(self, payload: str) -> int:
        return get_redis().rpush(self.name, payload)

    def pop(self, timeout: int = 5) -> str | None:
        """阻塞弹出，timeout 秒内无数据返回 None"""
        result = get_redis().blpop(self.name, timeout=timeout)
        return result[1] if result else None

    def length(self) -> int:
        return get_redis().llen(self.name)


class RedisLock:
    """分布式锁——基于 SET key value NX EX ttl 原子命令
    用法:
      lock = RedisLock("task:claim:42")
      if lock.acquire(token=str(user_id)):
          try:
              # 临界区: 只有一个人能进
          finally:
              lock.release()
    """

    def __init__(self, name: str, ttl: int = 30):
        self.key = f"labelhub:lock:{name}"
        self.ttl = ttl

    def acquire(self, token: str = "1") -> bool:
        """尝试获取锁，返回 True 表示成功。ttl 秒后自动释放防死锁"""
        return bool(get_redis().set(self.key, token, nx=True, ex=self.ttl))

    def release(self) -> None:
        get_redis().delete(self.key)


class RedisCache:
    """通用缓存——TTL 自动过期，适合 Schema JSON 等读多写少的数据"""

    def __init__(self, prefix: str = "", ttl: int = 300):
        self.prefix = f"labelhub:cache:{prefix}" if prefix else "labelhub:cache"
        self.ttl = ttl

    def _key(self, k: str) -> str:
        return f"{self.prefix}:{k}"

    def get(self, k: str) -> str | None:
        return get_redis().get(self._key(k))

    def set(self, k: str, v: str) -> None:
        get_redis().setex(self._key(k), self.ttl, v)

    def delete(self, k: str) -> None:
        get_redis().delete(self._key(k))
