# 配置 AI Agent

LabelHub 的 AI 预审由可配置的 Agent 驱动。Owner 在 AI 配置页面管理 Agent，在创建任务时关联。

## Agent 配置项

- **名称**：Agent 标识（如"商品标注质检 Agent"）
- **系统 Prompt**：指导 LLM 审核行为，支持占位符注入实时数据
- **评分维度**：JSON 数组，定义评估维度（名称 + 描述 + 权重）
- **LLM 模型**：使用的模型标识（如 doubao-pro-32k）

## Prompt 模板

![Ai Config](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/ai-config.png)


系统 Prompt 中使用占位符，运行时替换为实际数据：
- `{task}` → 任务信息
- `{item}` → 数据集原始内容
- `{result}` → 标注员提交结果
- `{dimensions}` → 评分维度列表

使用 `str.replace()` 安全替换，避免 `str.format()` 的注入风险。

## Agent 池管理

- 后端启动时从 DB 加载所有 Agent 到 `AgentPool`
- 线程池大小由 `.env` 中的 `AGENT_POOL_SIZE` 控制（默认 7）
- API `GET /ai-agents/status` 可查看池状态（空闲 / 繁忙 / 排队数）

