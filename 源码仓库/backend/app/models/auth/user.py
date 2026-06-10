"""
用户表——平台三种人类角色 + AI Agent (system)

role 枚举:
  owner    → 项目负责人: 创建任务、搭建模板、数据导出
  labeler  → 标注员: 领取任务、在线作答、提交标注
  reviewer → 审核员: 人工审核、通过/驳回、终审
  (AI Agent 不在此表，由系统服务承载，审核记录用 labeler_type='ai' 区分)

密码存储: bcrypt 哈希，盐值嵌入哈希字符串中，不需要单独存 salt
"""
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, comment="自增主键")
    name: Mapped[str] = mapped_column(String(50), nullable=False, comment="用户显示名称")
    role: Mapped[str] = mapped_column(
        SAEnum("owner", "labeler", "reviewer", "ai_agent"), nullable=False, default="labeler",
        comment="角色: owner=项目负责人, labeler=标注员, reviewer=审核员, ai_agent=AI Agent 系统账号"
    )
    email: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, comment="登录邮箱，全局唯一"
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False, comment="bcrypt 密码哈希（含内置盐值）"
    )
    avatar: Mapped[str] = mapped_column(String(255), default="", comment="头像 URL")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, comment="注册时间")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, comment="最近更新时间"
    )
