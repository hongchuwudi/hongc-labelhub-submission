"""
agents/agent.py — 单个 AI Agent 实例
Author: hongchuwudi
Description: 绑定一条 ai_agents 配置，独立持有 OpenAI 客户端，执行审核任务
# Class: Agent — 单个 Agent 实例
# Method: run — 执行一次审核
"""
import logging
from datetime import datetime
from openai import OpenAI

from app.config.settings import settings
from app.config.database import SessionLocal
from app.models.tasks.ai_review import AiReview

logger = logging.getLogger("agent")


# Agent — 绑定单条 ai_agents 配置的审核实例
class Agent:
    def __init__(self, agent_row):
        self.id = agent_row.id
        self.name = agent_row.name
        self.client = OpenAI(api_key=settings.LLM_API_KEY, base_url=settings.LLM_BASE_URL)
        self.config = {
            "model": agent_row.llm_model or settings.LLM_MODEL,
            "dimensions": agent_row.scoring_dimensions,
            "prompt": agent_row.system_prompt,
        }
        self.status = "idle"

    # run — 执行审核，状态机流转 + 审计日志
    def run(self, task_id: int, item_id: int, result_id: int):
        self.status = "busy"
        start = datetime.utcnow()
        db = SessionLocal()
        try:
            from app.models.tasks.task import LabelTask
            from app.models.datasets.item import DatasetItem
            from app.models.tasks.result import LabelResult
            from app.models.auth.user import User
            from app.state_machine.base import transit
            from app.state_machine.result import ResultStatus
            from app.services.common.audit import AuditService

            task = db.query(LabelTask).filter(LabelTask.id == task_id).first()
            item = db.query(DatasetItem).filter(DatasetItem.id == item_id).first()
            result = db.query(LabelResult).filter(LabelResult.id == result_id).first()
            if not all([task, item, result]):
                raise ValueError("任务/数据/结果不存在")

            # 查找 AI Agent 对应的 User（审计日志用）
            ai_user = db.query(User).filter(User.role == "ai_agent", User.name == self.name).first()
            if not ai_user:
                ai_user = db.query(User).filter(User.role == "ai_agent").first()
            actor_id = ai_user.id if ai_user else 0
            actor_name = ai_user.name if ai_user else self.name

            # 状态流转: submitted → ai_reviewing
            old_status = result.status
            transit(result, "status", ResultStatus.AI_REVIEWING, "LabelResult.status")
            db.commit()
            from app.services.common.flow import append_flow
            append_flow(db, task_id, result.item_id, ResultStatus.AI_REVIEWING,
                         actor="ai", actor_name=self.name, round_num=result.round,
                         detail=f"Agent[{self.name}] 开始审核")
            AuditService(db).log(
                actor_id=actor_id, actor_name=actor_name, actor_role="ai_agent",
                entity_type="LabelResult", entity_id=result_id, task_id=task_id,
                action="ai_review_start", from_status=old_status,
                to_status=ResultStatus.AI_REVIEWING.value,
                detail=f"Agent[{self.name}] 开始审核",
            )
            db.commit()

            # 构建 Prompt（安全替换，不碰花括号以外的 {} 字符）
            dims = self.config["dimensions"]
            dims_text = "\n".join(f"- {d['label']} (权重{d['weight']})" for d in dims)
            prompt_text = self.config["prompt"]
            prompt_text = prompt_text.replace("{dimensions}", dims_text)
            prompt_text = prompt_text.replace("{task}", f"标题: {task.title}\n描述: {task.description}")
            prompt_text = prompt_text.replace("{item}", str(item.data))
            prompt_text = prompt_text.replace("{result}", str(result.data))
            base_prompt = prompt_text

            # 调 LLM + 重试纠错（最多 3 次，temperature=0 减少随机性）
            import re, json
            from app.schemas.ai import ReviewResult
            validated = None
            last_error = None
            schema_hint = json.dumps(ReviewResult.model_json_schema(), ensure_ascii=False)

            for attempt in range(3):
                resp = self.client.chat.completions.create(
                    model=self.config["model"],
                    messages=[
                        {"role": "system", "content": prompt_text},
                        {"role": "user", "content": f"请返回 JSON，严格匹配以下格式：\n{schema_hint}"},
                    ],
                    temperature=0.1,  # DeepSeek 等部分 provider 不支持 temperature=0
                )
                content = resp.choices[0].message.content or "{}"

                # 提取 JSON：先找 markdown 代码块，再找裸 JSON 对象
                match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", content, re.DOTALL)
                json_str = match.group(1) if match else content.strip()
                if not json_str.startswith("{"):
                    match = re.search(r"\{.*\}", json_str, re.DOTALL)
                    if match:
                        json_str = match.group()

                try:
                    raw = json.loads(json_str)
                    validated = ReviewResult.model_validate(raw)
                    break  # 校验通过
                except json.JSONDecodeError as e:
                    last_error = f"JSON 解析失败: {e}"
                    prompt_text = f"[修正要求: {last_error}]\n\n{base_prompt}"
                except Exception as e:
                    last_error = str(e)
                    prompt_text = f"[修正要求: {last_error}]\n\n{base_prompt}"

            if validated is None:
                raise ValueError(f"LLM 3次尝试均未返回合法 JSON: {last_error}")

            # 写入 AiReview
            dims_list = [d.model_dump() for d in validated.dimensions]
            overall = round(sum(d.score for d in validated.dimensions) / len(validated.dimensions) * 100) if validated.dimensions else None

            review = AiReview(
                task_id=task_id, item_id=item_id, result_id=result_id, agent_id=self.id,
                verdict=validated.verdict,
                summary=validated.summary,
                dimensions=dims_list,
                overall_score=overall,
                model=self.config["model"],
                prompt_template=prompt_text,
                prompt_vars={"dimensions": dims_text, "task": str(task.title), "item": str(item.data), "result": str(result.data)},
                status="done",
                duration_ms=int((datetime.utcnow() - start).total_seconds() * 1000),
                finished_at=datetime.utcnow(),
            )
            db.add(review)
            db.commit()
            logger.info("Agent[%s] done: verdict=%s", self.name, review.verdict)

            # 同步更新 LabelResult.ai_scores
            try:
                result.ai_scores = {
                    "verdict": review.verdict,
                    "summary": review.summary,
                    "dimensions": review.dimensions,
                    "overall_score": review.overall_score,
                    "model": review.model,
                    "prompt_template": review.prompt_template,
                    "prompt_vars": review.prompt_vars,
                    "reviewer_name": self.name,
                    "reviewer_type": "ai_agent",
                    "reviewed_at": review.finished_at.isoformat() if review.finished_at else None,
                }
                db.commit()
            except Exception:
                pass

            # AI 判定 → 结果状态（Pydantic 已校验 verdict ∈ {pass, reject, human_review}）
            from_status_val = result.status
            if review.verdict == "reject":
                # AI 打回时写入驳回理由，标注员可在工作台看到
                result.comment = review.summary or "AI 审核判定不合格，请修改后重新提交"
                # AI 明确不合格 → 直接打回
                target = ResultStatus.REJECTED
                transit(result, "status", target, "LabelResult.status")
                db.commit()
                append_flow(db, task_id, result.item_id, target.value,
                             actor="ai", actor_name=self.name, round_num=result.round,
                             detail=f"AI 判定不合格: {review.verdict} (综合评分 {overall or '-'})")
                AuditService(db).log(
                    actor_id=actor_id, actor_name=actor_name, actor_role="ai_agent",
                    entity_type="LabelResult", entity_id=result_id, task_id=task_id,
                    action="ai_reject", from_status=from_status_val, to_status=target.value,
                    detail=f"Agent[{self.name}] 判定不合格: {review.verdict} (综合评分 {overall or '-'})",
                )
            else:
                # pass 或 human_review → 进入复审
                target = ResultStatus.REVIEW
                transit(result, "status", target, "LabelResult.status")
                db.commit()
                append_flow(db, task_id, result.item_id, target.value,
                             actor="ai", actor_name=self.name, round_num=result.round,
                             detail=f"AI 审核完成: {review.verdict} (综合评分 {overall or '-'}), 进入复审")
                AuditService(db).log(
                    actor_id=actor_id, actor_name=actor_name, actor_role="ai_agent",
                    entity_type="LabelResult", entity_id=result_id, task_id=task_id,
                    action="ai_to_review",
                    from_status=from_status_val, to_status=target.value,
                    detail=f"Agent[{self.name}] verdict={review.verdict}, 进入复审 (综合评分 {overall or '-'})",
                )
            db.commit()

            logger.info("Agent[%s] result=%d status -> %s", self.name, result.id, result.status)

        except Exception as e:
            db.rollback()
            err_msg = str(e)
            # 截取前 500 字符，防止超长报错信息
            review = AiReview(
                task_id=task_id, item_id=item_id, result_id=result_id, agent_id=self.id,
                verdict="error", status="failed", error_message=err_msg[:500],
                duration_ms=int((datetime.utcnow() - start).total_seconds() * 1000),
                finished_at=datetime.utcnow(),
            )
            db.add(review)
            db.commit()
            logger.error("Agent[%s] failed: %s", self.name, err_msg)
            raise
        finally:
            self.status = "idle"
            db.close()
