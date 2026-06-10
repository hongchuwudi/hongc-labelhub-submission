"""数据集 Schema——入参校验 + 出参序列化"""
from datetime import datetime
from pydantic import BaseModel


class DatasetCreate(BaseModel):
    """创建数据集——owner_id 由后端从 JWT 获取"""
    name: str
    description: str = ""
    format: str

    model_config = {"json_schema_extra": {"examples": [{"name": "图片分类样本 v1", "description": "包含 1000 张图片的多分类标注数据", "format": "json"}]}}


class DatasetUpdate(BaseModel):
    """更新数据集——所有字段可选"""
    name: str | None = None
    description: str | None = None

    model_config = {"json_schema_extra": {"examples": [{"name": "图片分类样本 v2", "description": "新增 200 条数据后的更新版本"}]}}


class DatasetResponse(BaseModel):
    """返回数据集详情"""
    id: int
    name: str
    description: str
    format: str
    item_count: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
