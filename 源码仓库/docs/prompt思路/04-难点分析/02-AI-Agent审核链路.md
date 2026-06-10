# AI Agent 审核链路难点分析

## 我的提示词

```
请分析 LabelHub AI Agent 审核链路的难点和解决方案。

需求：
- 标注员提交后自动入队 → Agent 调用 LLM → 多维度打分 → 写回结果
- Agent 配置可热重载（system prompt + 评分维度 + LLM 模型）
- 失败重试 + 幂等性保证
- 审核结果可追溯（记录原始 Prompt + 返回 JSON）

请分析：
1. 为什么不用 Celery？Celery 的 worker 对本项目来说有什么冗余
2. 线程池方案如何管理多个 Agent 的生命周期和配置热重载
3. LLM 结构化输出如何保证（Function Calling / JSON mode / Pydantic 校验）
4. 失败后如何重试？自动重试 vs 手动重试的权衡
5. 消息队列不可用时的降级策略
6. Agent 做为一个"系统用户"如何记录审计日志

输出：每个难点给出方案和代码示例
```

---

## AI 的回答

# AI Agent 审核链路 — 难点解决方案

## 1. 为什么不用 Celery

| 对比 | Celery | 线程池方案 |
|------|--------|-----------|
| 进程模型 | 独立 worker 进程 | FastAPI 进程内线程 |
| Agent 状态 | 无状态（每次从 DB 加载配置） | 有状态（常驻内存，持有 OpenAI Client） |
| 启动成本 | 慢（fork 新进程+初始化 Broker） | 快（线程创建微秒级） |
| 配置热重载 | 需重启 Worker | pool.reload() 增量同步 |
| 运维复杂度 | 需管理 broker + result backend | 无额外中间件 |

**结论**：Agent 数 < 10 的单机场景，Celery 的分布式架构是"用牛刀杀鸡"。线程池方案把所有 Agent 放在同一个进程内，代码可在一个 logger.info 里追踪完整链路。

## 2. 线程池 + 长生命周期 Agent

```python
# agents/pool.py

class AgentPool:
    _instance = None
    
    def __init__(self):
        self.agents: Dict[int, Agent] = {}     # agent_id → Agent 实例
        self.executor = ThreadPoolExecutor(max_workers=5)
    
    def start(self):
        """从 DB 加载所有 Agent"""
        db = SessionLocal()
        try:
            agent_records = db.query(AiAgent).all()
            for record in agent_records:
                self.agents[record.id] = Agent(record)
        finally:
            db.close()
    
    def submit(self, task_id: int, result_id: int, item_id: int):
        """提交审核任务到线程池"""
        db = SessionLocal()
        try:
            task = db.query(LabelTask).filter_by(id=task_id).first()
            agent = self.agents.get(task.ai_agent_id)
            if not agent:
                raise ValueError(f"Agent {task.ai_agent_id} not found")
        finally:
            db.close()
        
        self.executor.submit(agent.run, task_id, item_id, result_id)
    
    def reload(self):
        """热重载：增量同步 DB 变更"""
        db = SessionLocal()
        try:
            current_ids = set(r.id for r in db.query(AiAgent).all())
            pool_ids = set(self.agents.keys())
            
            # 新增的 Agent
            for new_id in current_ids - pool_ids:
                record = db.query(AiAgent).filter_by(id=new_id).first()
                self.agents[new_id] = Agent(record)
            
            # 更新配置（只更新空闲的 Agent）
            for exist_id in current_ids & pool_ids:
                if self.agents[exist_id].status == "idle":
                    record = db.query(AiAgent).filter_by(id=exist_id).first()
                    self.agents[exist_id].update_config(record)
            
            # 删除（标记清理，等待 busy 的完成后移除）
            for del_id in pool_ids - current_ids:
                if self.agents[del_id].status == "idle":
                    del self.agents[del_id]
        finally:
            db.close()
    
    def get_status(self):
        """返回所有 Agent 的状态"""
        return [
            {"id": a.id, "name": a.name, "status": a.status, "model": a.config.model}
            for a in self.agents.values()
        ]
```

## 3. LLM 结构化输出

```python
# agents/agent.py

class Agent:
    def run(self, task_id, item_id, result_id):
        self.status = "busy"
        db = SessionLocal()
        try:
            # 1. 加载数据
            task = db.query(LabelTask).filter_by(id=task_id).first()
            item = db.query(DatasetItem).filter_by(id=item_id).first()
            result = db.query(LabelResult).filter_by(id=result_id).first()
            
            # 2. 渲染 Prompt
            dimensions_text = "\n".join([
                f"- {d['name']}（权重 {d['weight']}%）：{d['description']}"
                for d in self.config.scoring_dimensions
            ])
            prompt = self.config.system_prompt.format(
                task_title=task.title,
                task_description=task.description or "",
                dimensions=dimensions_text,
                item_data=json.dumps(item.data, ensure_ascii=False),
                result_data=json.dumps(result.data, ensure_ascii=False),
            )
            
            # 3. 调用 LLM — 指定 JSON 输出格式
            start = time.time()
            response = self.client.chat.completions.create(
                model=self.config.llm_model,
                temperature=0.1,
                messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": "请按指定格式输出审核结果"}
                ],
                response_format={"type": "json_object"},  # JSON Mode
            )
            duration_ms = int((time.time() - start) * 1000)
            
            # 4. 解析 + Pydantic 校验
            raw_json = response.choices[0].message.content
            
            try:
                parsed = json.loads(raw_json)
                review_result = ReviewResult.model_validate(parsed)
            except (json.JSONDecodeError, ValidationError) as e:
                # 解析失败 — 记录为 error
                self._write_error(db, task_id, item_id, result_id, 
                                  f"JSON解析失败: {str(e)}", duration_ms)
                return
            
            # 5. 写入结果
            self._write_review(db, task_id, item_id, result_id, 
                              review_result, prompt, duration_ms)
            
            # 6. 状态流转
            transit(result, "status", "LabelResult.status",
                    self._verdict_to_status(review_result.verdict), db, {...})
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Agent {self.name} error: {e}")
        finally:
            self.status = "idle"
            db.close()
```

```python
# schemas/ai.py — Pydantic 校验模型

class DimensionScore(BaseModel):
    name: str
    score: float = Field(ge=0, le=100)
    reason: str

class ReviewResult(BaseModel):
    verdict: Literal["pass", "reject", "human_review"]
    overall_score: float = Field(ge=0, le=100)
    summary: str
    dimensions: List[DimensionScore]
```

## 4. 失败重试策略

**选择：不自动重试，手动触发"重跑"**

理由：
- LLM 调用有 token 成本，自动重试可能浪费大量 token 在同一个失败请求上
- 失败原因多种：API 超时 / JSON 格式错误 / 模型限流 — 有些需要人工判断
- 手动重跑让操作者看到失败原因后再决定

```python
# 前端 "重跑" 按钮 → 调用 rerun API
@router.post("/ai-reviews/{review_id}/rerun")
def rerun_review(review_id: int, db: Session = Depends(get_db)):
    review = db.query(AiReview).filter_by(id=review_id).first()
    if not review:
        raise NotFoundException("审核记录不存在")
    
    # 重新投递 MQ
    try:
        mq_publish("labelhub.ai.review", {
            "task_id": review.task_id,
            "item_id": review.item_id,
            "result_id": review.result_id,
        })
    except Exception:
        # MQ 不可用 — 同步执行降级
        pool.submit(review.task_id, review.result_id, review.item_id)
    
    return APIResponse(success=True, message="已重新投递审核")
```

## 5. MQ 降级策略

```python
# services/tasks/service.py — 提交结果时

def create_result(db, task_id, item_id, labeler_id, data):
    result = LabelResult(...)
    db.add(result)
    db.commit()
    
    # 尝试投递 MQ 触发 AI 审核
    try:
        mq_publish("labelhub.ai.review", {
            "task_id": task_id,
            "item_id": item_id,
            "result_id": result.id,
        })
    except Exception as e:
        # MQ 不可用 — 静默降级，不阻塞标注提交
        logger.warning(f"MQ publish failed (审核降级为手动触发): {e}")
        # 前端可通过 "重跑" 按钮手动触发

```

## 6. AI Agent 作为系统用户

```python
# 写入 audit_log 时使用 Agent 的 User 信息
agent_user = db.query(User).filter_by(id=agent.agent_record.id).first()

audit_log = AuditLog(
    actor_id=agent_user.id,
    actor_name=agent_user.name,
    actor_role="ai_agent",
    entity_type="LabelResult",
    entity_id=result.id,
    task_id=task_id,
    action="ai_review",
    from_status="submitted",
    to_status=review_verdict_to_status(verdict),
    detail=json.dumps({"ai_review_id": ai_review.id, "score": overall_score})
)
db.add(audit_log)
```

这样在审核时间线中，AI 审核的操作者和人工审核员一样可见可追溯。
