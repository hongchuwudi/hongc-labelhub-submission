"""
state_machine/base.py — 状态机基础组件
Author: hongchuwudi
Description: 状态转移校验引擎，提供 validate_transition + transit 通用方法
# Function: validate_transition — 校验状态转移是否合法
# Function: transit — 校验 + 赋值一步完成
"""
from enum import Enum
from typing import Dict, Set
from app.infra.exceptions import BadRequestException


# TRANSITION_TABLES — 全局注册表，key=实体名，value=转移表
TRANSITION_TABLES: Dict[str, Dict] = {}


def register(entity_name: str, table: Dict) -> None:
    """向全局注册表登记一个实体的转移表"""
    TRANSITION_TABLES[entity_name] = table


def validate_transition(entity_name: str, current: str, target: str) -> None:
    """校验状态转移是否合法——不合法抛出 BadRequestException"""
    table = TRANSITION_TABLES.get(entity_name)
    if table is None:
        return
    cur = current.value if isinstance(current, Enum) else current
    tgt = target.value if isinstance(target, Enum) else target
    allowed = table.get(cur, set())
    if tgt not in allowed:
        raise BadRequestException(f"{entity_name} 不允许从 '{cur}' 转移到 '{tgt}'")


def transit(entity: object, field: str, target: str, entity_name: str | None = None) -> None:
    """一步完成校验 + 赋值——自动提取枚举的 value"""
    name = entity_name or f"{type(entity).__name__}.{field}"
    current = getattr(entity, field)
    validate_transition(name, current, target)
    # 枚举 → 取 value，确保存入 DB 的是字符串
    actual = target.value if isinstance(target, Enum) else target
    setattr(entity, field, actual)
