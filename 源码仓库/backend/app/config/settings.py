"""
config.py — 应用配置中心
Author: hongchuwudi
Description: 环境变量统一入口，pydantic-settings 从 .env 文件读取，优先级: 系统环境 > .env > 默认值
# Class: Settings — 应用配置数据类
# Property: database_url — SQLAlchemy 连接字符串
"""
from pydantic_settings import BaseSettings


# Settings — 全局配置单例，所有环境变量通过 pydantic-settings 自动加载
class Settings(BaseSettings):
    # ── 应用 ──
    # APP_NAME: 应用名称（API 文档标题）
    APP_NAME: str = "LabelHub API"
    # DEBUG: 调试模式开关
    DEBUG: bool = True

    # ── MySQL ──
    # DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME: 数据库连接五元组
    DB_HOST: str = ""
    DB_PORT: int = 3306
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    DB_NAME: str = ""

    # ── LLM ──
    # LLM_API_KEY: LLM 服务商 API Key（必填，否则 AI 审核/触发不可用）
    LLM_API_KEY: str = ""
    # LLM_BASE_URL: LLM 服务商 Base URL（默认 OpenAI）
    LLM_BASE_URL: str = "https://api.openai.com/v1"
    # LLM_MODEL: 使用的 LLM 模型标识
    LLM_MODEL: str = "gpt-4o"
    # AGENT_POOL_SIZE: AI Agent 池最大并发数
    AGENT_POOL_SIZE: int = 5

    # ── Redis ──
    # REDIS_HOST / REDIS_PORT / REDIS_PASSWORD / REDIS_DB: Redis 连接配置
    REDIS_HOST: str = ""
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0

    # ── RabbitMQ ──
    # MQ_HOST / MQ_PORT / MQ_USER / MQ_PASSWORD / MQ_VHOST: RabbitMQ 连接五元组
    MQ_HOST: str = ""
    MQ_PORT: int = 5672
    MQ_USER: str = ""
    MQ_PASSWORD: str = ""
    MQ_VHOST: str = "/"

    # ── 阿里云 OSS ──
    # OSS_ENDPOINT / OSS_ACCESS_KEY_ID / OSS_ACCESS_KEY_SECRET / OSS_BUCKET_NAME
    OSS_ENDPOINT: str = ""
    OSS_ACCESS_KEY_ID: str = ""
    OSS_ACCESS_KEY_SECRET: str = ""
    OSS_BUCKET_NAME: str = ""

    # ── JWT ──
    # JWT_SECRET: JWT 签名密钥（必填）
    JWT_SECRET: str = ""
    # ACCESS_TOKEN_EXPIRE_MINUTES: Access Token 过期时间（分钟）
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    # REFRESH_TOKEN_EXPIRE_DAYS: Refresh Token 过期时间（天）
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # database_url — 拼接 pymysql 连接字符串
    @property
    def database_url(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    class Config:
        # env_file: 从 backend/ 运行时 .env 在上级目录
        env_file = "../.env"
        env_file_encoding = "utf-8"
        # extra: 忽略 .env 中未定义的字段
        extra = "ignore"


# settings — 全局配置实例
settings = Settings()
