"""AI Agent 请求/响应 Schema + 审核输出模型"""
from pydantic import BaseModel, Field

class AiAgentCreate(BaseModel):
    name: str
    email: str
    password: str
    system_prompt: str
    scoring_dimensions: list
    llm_model: str = "gpt-4o"

    model_config = {"json_schema_extra": {"examples": [{"name": "文本审核Agent", "email": "text-reviewer@ai.labelhub.com", "password": "agent123", "system_prompt": "你是一个专业的数据标注审核专家...", "scoring_dimensions": [{"name": "accuracy", "label": "准确性", "weight": 0.4}, {"name": "format", "label": "格式合规", "weight": 0.3}, {"name": "completeness", "label": "完整性", "weight": 0.3}], "llm_model": "gpt-4o"}]}}

class AiAgentUpdate(BaseModel):
    name: str | None = None
    system_prompt: str | None = None
    scoring_dimensions: list | None = None
    llm_model: str | None = None


class DimensionScore(BaseModel):
    """单个维度的评分"""
    name: str = Field(description="维度名称，必须与配置的评分维度一致")
    score: float = Field(ge=0, le=1, description="0-1 之间的分数")
    reason: str = Field(max_length=100, description="评分理由")


class ReviewResult(BaseModel):
    """AI 审核结论"""
    dimensions: list[DimensionScore] = Field(description="各维度的评分列表")
    verdict: str = Field(
        pattern="^(pass|reject|human_review)$",
        description="pass=合格, reject=不合格, human_review=不确定需人工复核",
    )
    summary: str = Field(max_length=200, description="整体评价")


# AiReview 列表项
class AiReviewListItem(BaseModel):
    id: int
    task_id: int
    item_id: int
    result_id: int
    agent_name: str
    verdict: str | None = None
    overall_score: float | None = None
    status: str
    duration_ms: int | None = None
    error_message: str | None = None
    created_at: str
    finished_at: str | None = None
    # 关联的任务/条目摘要
    task_title: str | None = None
    item_summary: str | None = None


# AiReview 详情
class AiReviewDetailResponse(BaseModel):
    id: int
    task_id: int
    item_id: int
    result_id: int
    agent_id: int
    agent_name: str
    agent_model: str | None = None
    verdict: str | None = None
    summary: str | None = None
    dimensions: list | None = None
    overall_score: float | None = None
    model: str | None = None
    prompt_template: str | None = None
    prompt_vars: dict | None = None
    status: str
    error_message: str | None = None
    duration_ms: int | None = None
    created_at: str
    finished_at: str | None = None
    # 关联数据
    task_title: str | None = None
    result_data: dict | None = None
    item_data: dict | None = None
