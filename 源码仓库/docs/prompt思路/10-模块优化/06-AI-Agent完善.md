# AI Agent 审核引擎完善

## 提示词

```
请完善 AI Agent 审核引擎：

1. Agent 核心执行流程完善 (agents/agent.py)：
   - run(task_id, item_id, result_id) 方法：
     a. 打开独立 DB Session
     b. 查 LabelTask → 获取标注数据
     c. 查 DatasetItem → 获取原始数据
     d. 查 LabelResult → 获取标注结果
     e. 用 str.format() 渲染 prompt 模板
       变量：{task_title} {task_description} {item_data} {result_data} {dimensions}
     f. 调用 OpenAI Chat Completions API
       - 参数：temperature=0.1, response_format={type: "json_object"}
       - 指定 JSON Schema 约束输出格式
     g. 解析 JSON 返回 → Pydantic ReviewResult 校验
     h. 写入 ai_reviews 表
     i. 更新 LabelResult.ai_scores + LabelResult.status
     j. 写入 audit_log

2. Prompt 模板设计：
   - 默认模板结构：
     "你是一个专业的{task_title}数据标注审核员。
      请根据以下评分标准对标注结果进行审核：
      {dimensions}
      
      任务说明：{task_description}
      原始数据：{item_data}
      标注结果：{result_data}
      
      请对每个维度进行评分（0-100分）并给出理由。
      综合评分后给出最终结论：pass/reject/human_review"
   
3. 评分维度配置管理：
   - 每个 Agent 可配多个维度
   - 维度包含：name、description、weight（权重）
   - 综合评分 = sum(score * weight) / sum(weight)

4. AgentPool 完善 (agents/pool.py)：
   - start()：从 DB 加载所有 Agent，创建 ThreadPoolExecutor
   - submit(task_id, result_id, item_id)：
     通过 task.ai_agent_id 找到对应 Agent → executor.submit(agent.run)
   - reload()：增量同步 DB 变更（增/删/改配置）
   - get_status()：返回 [{id, name, status: idle/busy, model}]
   - shutdown()：优雅关闭线程池

5. MQ 消费者 (agents/ai_worker.py)：
   - 消费 labelhub.ai.review 队列
   - 解析消息 → pool.submit()
   - 异常处理 + 日志记录

6. 失败处理：
   - LLM 调用异常时：写入 ai_reviews 记录 status=failed + error_message
   - 不自动重试（避免消耗 token）
   - 前端提供"重跑"按钮手动触发
   - 重跑时重新投递 MQ

7. MQ 降级策略：
   - MQ 不可用时 publish() 静默 catch 不阻塞提交
   - 前端"重跑"按钮可以直接同步触发 Agent.run()

请逐步实现并测试：创建 Agent → 配置 Prompt → 标注员提交 → 查看 AI 审核结果。

## AI 的回答

已实现：Agent.run() 完整管线（加载 DB 数据 → 渲染 prompt → 调用 OpenAI 并指定 json_object response_format → Pydantic ReviewResult 校验 → 写入 AiReview → 更新 LabelResult.status → 写入 audit_log）。Prompt 模板支持 {task_title}/{dimensions}/{item_data}/{result_data} 变量。评分维度支持 name/description/weight，加权平均计算综合评分。AgentPool.start() 加载所有 Agent，submit() 根据 task.ai_agent_id 匹配 Agent，reload() 增量同步。ai_worker 消费 labelhub.ai.review 队列。失败处理：写入 AiReview status=failed+error_message，不自动重试。MQ 降级：静默 catch + 前端重跑按钮可同步触发 Agent.run()。
