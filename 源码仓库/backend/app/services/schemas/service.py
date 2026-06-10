"""Schema Service——CRUD + 版本号自增 + key 唯一性校验"""
from sqlalchemy.orm import Session

from app.models.schemas.schema import LabelSchema
from app.models.tasks.task import LabelTask
from app.infra.exceptions import NotFoundException, BadRequestException


def _validate_field_keys(schema_data: dict) -> None:
    """校验 JSON Schema 中字段 key 唯一性——重复则抛出 BadRequestException"""
    fields = schema_data.get("fields", [])
    if not fields:
        return
    seen = set()
    for f in fields:
        key = f.get("key")
        if not key:
            continue
        if key in seen:
            raise BadRequestException(f"字段 key 重复: '{key}'，请使用唯一标识")
        seen.add(key)


class SchemaService:

    def __init__(self, db: Session):
        self.db = db

    def list_schemas(self, owner_id: int | None = None, page: int = 1, page_size: int = 20) -> tuple[list[LabelSchema], int]:
        q = self.db.query(LabelSchema)
        if owner_id is not None:
            q = q.filter(LabelSchema.owner_id == owner_id)
        total = q.count()
        items = (
            q.order_by(LabelSchema.updated_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )
        return items, total

    def get(self, schema_id: int, owner_id: int | None = None) -> LabelSchema:
        q = self.db.query(LabelSchema).filter(LabelSchema.id == schema_id)
        if owner_id is not None:
            q = q.filter(LabelSchema.owner_id == owner_id)
        schema = q.first()
        if not schema:
            raise NotFoundException("Schema")
        return schema

    def create(self, **kwargs) -> LabelSchema:
        if "schema" in kwargs:
            _validate_field_keys(kwargs["schema"])
        schema = LabelSchema(**kwargs)
        self.db.add(schema)
        self.db.commit()
        self.db.refresh(schema)
        return schema

    def update(self, schema_id: int, owner_id: int | None = None, **kwargs) -> LabelSchema:
        """更新——version 自动 +1，保留变更历史"""
        from datetime import datetime
        if "schema" in kwargs and kwargs["schema"] is not None:
            _validate_field_keys(kwargs["schema"])
        schema = self.get(schema_id, owner_id=owner_id)
        # 保存旧版本到历史
        history = list(schema.version_history) if schema.version_history else []
        history.append({
            "version": schema.version,
            "schema": schema.schema,
            "updated_at": schema.updated_at.isoformat() if schema.updated_at else None,
        })
        schema.version_history = history
        schema.version += 1
        for key, val in kwargs.items():
            if val is not None:
                setattr(schema, key, val)
        schema.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(schema)
        return schema

    def delete(self, schema_id: int, owner_id: int) -> None:
        """删除 Schema——先查归属，再查是否有任务引用"""
        schema = self.get(schema_id, owner_id=owner_id)
        ref_count = self.db.query(LabelTask).filter(LabelTask.schema_id == schema_id).count()
        if ref_count > 0:
            raise BadRequestException(f"该 Schema 被 {ref_count} 个任务引用，无法删除")
        self.db.delete(schema)
        self.db.commit()
