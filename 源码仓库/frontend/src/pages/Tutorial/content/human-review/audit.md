# 审计追溯

LabelHub 为每条标注数据维护完整的操作审计日志，保障全流程可追溯。

## 审计存储

`AuditLog` 表记录每次操作：
- 操作人（actor_id + actor_name + actor_role）
- 操作目标（entity_type + entity_id）
- 任务 ID + 操作前后状态 + 操作类型
- 详细描述 + 时间戳

`TaskItem.flow_history` 记录条目级流转：
```json
[
  {"status": "submitted", "time": "...", "actor": "labeler", "actor_name": "张三", "round": 1},
  {"status": "review", "time": "...", "actor": "reviewer", "actor_name": "李四", "round": 1}
]
```

## 前端展示

![Review Audit](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/review-audit.png)


- `AuditTimeline` 组件：审核操作时间线
- `FlowTimeline` 组件：条目完整流转历史
- 审核工作台右侧面板展示当前条目的完整操作链路

## 设计特点

- 每次操作自动记录，无需开发者手动调用
- 记录原始状态变更轨迹，不可篡改
- 支持按任务 ID、操作人、操作类型等条件检索

