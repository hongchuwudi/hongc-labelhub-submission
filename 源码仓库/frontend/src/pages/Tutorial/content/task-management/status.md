# 任务状态

LabelHub 任务具有完整的生命周期状态机（4 状态 + 6 条合法转移）。

## 状态流转图

```text
draft ──→ published ──→ paused
  │          │             │
  └──────────┼─────────────┘
             ↓
           ended
```

## 状态说明

![Task Status](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/task-status.png)


| 状态 | 含义 | 允许操作 |
|------|------|------|
| draft | 草稿，未发布 | 编辑、发布、删除 |
| published | 已发布，标注员可认领 | 暂停、结束 |
| paused | 已暂停 | 恢复为 published、结束 |
| ended | 已结束（最终态） | 仅删除 |

## 状态机

后端 `state_machine/task.py` 定义合法转移表：

```python
TASK_TRANSITIONS = {
    draft:     {published, ended},
    published: {paused, ended},
    paused:    {published, ended},
    ended:     set(),
}
```

所有状态变更前必须通过 `transit()` 校验，非法转移直接抛出 `BadRequestException`。

