# 工作流概览

LabelHub 完整标注流程从任务创建到数据导出，贯穿三端角色。

## 端到端流程

![Workflow Overview](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/workflow-overview.png)


```text
1. [Owner]   创建数据集（导入 CSV/JSON/JSONL/Excel）
2. [Owner]   Schema Designer 拖拽搭建标注模板
3. [Owner]   创建任务 + 选数据集/Schema + 配置策略 + 发布
4. [Labeler] 任务大厅浏览 + 认领任务
5. [Labeler] 标注工作台逐条作答（支持草稿自动保存）
6. [Labeler] 提交 → 触发 AI 预审（如配置了 AI Agent）
7. [Agent]   MQ 异步队列 → 调 LLM → 维度评分 → 写回
8. [Reviewer] 审核台查看 AI 评分 + 复审 + 终审
9. [Owner]   数据看板 + 导出中心下载结果
```

## 关键设计

- **Schema 快照**：任务发布时冻结 Schema，后续修改不影响已发布任务
- **AI 预审**：提交后自动入 MQ 队列，异步处理不阻塞标注
- **审核流转**：6 状态机，合法转移由状态机引擎校验
- **打回重提**：驳回后标注员修改重新提交，旧记录保留为审计历史

