"""
state_machine/item.py — TaskItem 状态机
Author: hongchuwudi
Description: 单条标注条目的状态转移——pending→labeled/skipped, skipped→labeled
# Class: ItemStatus — 条目状态枚举
# Constant: ITEM_TRANSITIONS — 合法转移表
"""
from enum import Enum
from typing import Dict, Set
from app.state_machine.base import register


# ItemStatus — TaskItem 标注进度状态
class ItemStatus(str, Enum):
    PENDING = "pending"
    LABELED = "labeled"
    SKIPPED = "skipped"


# ITEM_TRANSITIONS — pending 可标注/跳过，跳过后可回头标注
ITEM_TRANSITIONS: Dict[ItemStatus, Set[ItemStatus]] = {
    ItemStatus.PENDING:  {ItemStatus.LABELED, ItemStatus.SKIPPED},
    ItemStatus.SKIPPED:  {ItemStatus.LABELED},
    ItemStatus.LABELED:  set(),
}

# 注册 ItemStatus 到全局转移表
register("TaskItem.status", ITEM_TRANSITIONS)
