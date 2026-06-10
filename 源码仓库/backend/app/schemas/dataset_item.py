"""
数据集条目 Schema——单条数据 + 批量导入
"""
from datetime import datetime
from pydantic import BaseModel


class DatasetItemCreate(BaseModel):
    """创建单条数据条目——data 是自由 JSON，内容由数据集格式决定"""
    index: int = 0
    data: dict

    model_config = {"json_schema_extra": {"examples": [{"index": 0, "data": {"text": "今天天气真好，适合出去散步。", "label": "positive"}}]}}


class DatasetItemBatchCreate(BaseModel):
    """批量导入——前端上传 CSV/JSONL 解析后批量提交"""
    items: list[DatasetItemCreate]


class DatasetItemUpdate(BaseModel):
    """更新条目内容"""
    data: dict | None = None


class DatasetItemResponse(BaseModel):
    """返回条目详情——标注状态由 task_items 表管理"""
    id: int
    dataset_id: int
    index: int
    data: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
