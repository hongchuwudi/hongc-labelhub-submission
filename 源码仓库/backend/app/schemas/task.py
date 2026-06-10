"""标注任务 + 标注结果的请求/响应模型"""
from datetime import datetime
from pydantic import BaseModel


# ── 任务 ──

class LabelTaskCreate(BaseModel):
    """创建任务——owner_id 由后端从 JWT 获取，前端无需传递"""
    title: str
    description: str = ""
    tags: str = ""
    dataset_id: int
    schema_id: int
    assignee_id: int | None = None                                   # 指派模式指定标注员，抢单留空
    assignee_type: str = "labeler"
    deadline: datetime | None = None
    quota: int = 0
    reward_per_item: float | None = None
    reward_cap: float | None = None
    distribution_strategy: str = "first_come"
    grab_limit: int | None = None
    ai_agent_id: int | None = None

    model_config = {"json_schema_extra": {"examples": [{"title": "文本情感分类标注任务", "description": "对用户评论进行情感极性标注", "tags": "情感分析,NLP", "dataset_id": 1, "schema_id": 1, "quota": 100, "distribution_strategy": "first_come", "reward_per_item": 0.5, "reward_cap": 200.0, "deadline": "2026-12-31T23:59:59"}]}}


class LabelTaskUpdate(BaseModel):
    """更新任务——所有字段可选"""
    title: str | None = None
    description: str | None = None
    tags: str | None = None
    assignee_id: int | None = None
    assignee_type: str | None = None
    deadline: datetime | None = None
    quota: int | None = None
    reward_per_item: float | None = None
    reward_cap: float | None = None
    distribution_strategy: str | None = None
    status: str | None = None
    ai_agent_id: int | None = None


class LabelTaskResponse(BaseModel):
    """返回任务详情——progress 由 Model 属性自动计算"""
    id: int
    title: str
    description: str
    tags: str
    dataset_id: int
    schema_id: int
    ai_agent_id: int | None
    owner_id: int
    assignee_id: int | None
    assignee_type: str
    deadline: datetime | None
    quota: int
    reward_per_item: float | None
    reward_cap: float | None
    distribution_strategy: str
    grab_limit: int | None = None
    status: str
    total_items: int
    completed_items: int
    progress: float
    claimed_items: int = 0
    schema_snapshot: dict | None = None
    schema_version: int = 1
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── 标注结果 ──

class LabelResultCreate(BaseModel):
    """提交标注结果——task_id 由路径参数提供，labeler_id 从 JWT 获取"""
    item_id: int
    data: dict
    round: int = 1

    model_config = {"json_schema_extra": {"examples": [{"item_id": 1, "data": {"category": "科技", "sentiment": "positive", "keywords": ["AI", "芯片"]}, "round": 1}]}}


class LabelResultUpdate(BaseModel):
    """审核更新——审核员填写状态、意见、AI 评分"""
    status: str | None = None
    comment: str | None = None
    reviewer_id: int | None = None
    reviewed_at: datetime | None = None
    ai_scores: dict | None = None


class LabelResultResponse(BaseModel):
    """返回标注结果详情——含审核追溯信息"""
    id: int
    task_id: int
    item_id: int
    labeler_id: int
    labeler_type: str
    data: dict
    round: int
    status: str
    comment: str
    reviewer_id: int | None
    reviewed_at: datetime | None
    ai_scores: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── 标注工作台：任务条目（task_items JOIN dataset_items）──

class TaskItemResponse(BaseModel):
    """左侧队列——每一条目的原始数据 + 本任务内状态"""
    id: int                                                     # dataset_item.id
    index: int
    data: dict
    status: str                                                 # pending / labeled / skipped
    labeler_id: int | None


class TaskItemDetail(BaseModel):
    """中间表单区——单条详情 + 该标注员最近一次提交（被打回时展示驳回理由）"""
    id: int
    index: int
    data: dict
    status: str
    labeler_id: int | None
    last_result: LabelResultResponse | None = None


class LabelerStats(BaseModel):
    """右侧统计卡片"""
    pending: int
    labeled: int
    skipped: int
    total: int
