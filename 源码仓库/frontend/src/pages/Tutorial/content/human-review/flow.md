# 审核流程

人工审核是保证标注质量的最终环节，Reviewer 对标注结果逐条或批量操作。

## 审核状态机

```text
submitted → ai_reviewing → review → final_review → warehouse
                 ↓            ↓           ↓
              rejected ← ← ← ← ← ← ← ← ← ←
```

## 审核节点

| 状态 | 进入条件 | 可执行操作 |
|------|------|------|
| review | AI 审核通过或可疑 | 通过 (final_review) / 打回 (rejected) |
| final_review | 复审通过 | 入库 (warehouse) / 打回 (rejected) |
| warehouse | 终审通过 | 终态，可导出 |
| rejected | 被驳回 | 标注员修改后重新创建提交 (round+1) |

## 审核界面

![Human Review](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/human-review.png)


- **左侧列表**：标注结果列表，按 AI 判定分组（通过/打回/复核）
- **中间表单**：标注内容多轮对比视图 + 评论区
- **右侧面板**：AI 评分进度条 + 审核操作按钮

## 操作约束

![Review Reject](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/review-reject.png)


- 打回必须填写驳回理由（comment 为空则拦截）
- 状态变更由状态机 `transit()` 校验
- 每次操作记录 AuditLog + flow_history
- REJECTED 可回到 REVIEW（审核员重新打开）


