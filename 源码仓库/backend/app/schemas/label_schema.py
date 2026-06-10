"""标注 Schema 的请求/响应模型"""
from datetime import datetime
from pydantic import BaseModel, Field


class LabelSchemaCreate(BaseModel):
    name: str
    schema_data: dict = Field(
        validation_alias="schema", serialization_alias="schema"
    )

    model_config = {"json_schema_extra": {"examples": [{"name": "文本分类标注模板", "schema": {"type": "object", "properties": {"category": {"type": "string", "enum": ["科技", "体育", "娱乐"]}}}}]}}


class LabelSchemaUpdate(BaseModel):
    name: str | None = None
    schema_data: dict | None = Field(
        default=None, validation_alias="schema", serialization_alias="schema"
    )


class LabelSchemaResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    name: str
    version: int
    schema_data: dict = Field(
        validation_alias="schema", serialization_alias="schema"
    )
    created_at: datetime
    updated_at: datetime
