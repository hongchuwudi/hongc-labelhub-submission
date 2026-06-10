"""
state_machine/task.py — LabelTask 状态机
Author: hongchuwudi
Description: 任务生命周期——draft→published→paused→ended
# Class: TaskStatus — 任务状态枚举
# Constant: TASK_TRANSITIONS — 合法转移表
"""
from enum import Enum
from typing import Dict, Set
from app.state_machine.base import register


# TaskStatus — LabelTask 生命周期: draft→published→paused→ended
class TaskStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PAUSED = "paused"
    ENDED = "ended"


# TASK_TRANSITIONS — 草稿可发布/结束，发布后可暂停/结束，暂停后可恢复/结束
TASK_TRANSITIONS: Dict[TaskStatus, Set[TaskStatus]] = {
    TaskStatus.DRAFT:     {TaskStatus.PUBLISHED, TaskStatus.ENDED},
    TaskStatus.PUBLISHED: {TaskStatus.PAUSED, TaskStatus.ENDED},
    TaskStatus.PAUSED:    {TaskStatus.PUBLISHED, TaskStatus.ENDED},
    TaskStatus.ENDED:     set(),
}

# 注册到全局表
register("LabelTask.status", TASK_TRANSITIONS)
