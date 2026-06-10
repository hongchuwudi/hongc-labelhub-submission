# AI 预审流程

标注员提交后 AI 预审自动触发，全程异步后台执行，不阻塞标注和审核流程。

## 处理流程

![Ai Review](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/ai-review.png)


```text
1. create_result()     → Labeler 提交标注
2. 检测 ai_agent_id     → 如果有 → 发布 MQ 消息到 labelhub.ai.review
3. ai_worker.py         → 消费 MQ 消息
4. AgentPool.submit()   → 提交到线程池（ThreadPoolExecutor）
5. Agent.run()          → 查 DB 获取 task + item + result
6. 构建 Prompt          → 替换占位符 + 拼接 dimensions 表格
7. POST LLM API         → temperature=0，Function Calling
8. Pydantic 校验        → ReviewResult schema，失败则重试
9. 写 ai_reviews        → 维度分 + 总体分 + 判定 + Prompt 原文
10. 更新 result         → status → review (通过) 或 rejected (打回)
```

## 纠错机制

- temperature=0 减少随机性
- JSON 解析失败时重试（最多 3 次），每次追加错误信息到 prompt
- 3 次重试后仍失败 → ai_review.status = failed，记录 error_message

## 性能特性

![Ai Mq Status](https://hc-base.oss-cn-beijing.aliyuncs.com/tutorial/ai-mq-status.png)


- Agent 池并发数：AGENT_POOL_SIZE (可配，默认 7)
- MQ 异步解耦：提交不阻塞，审核结果实时可见
- 审核延迟：取决于 LLM API 响应时间（通常 2-5 秒）


