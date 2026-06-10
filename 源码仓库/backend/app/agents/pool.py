"""
agents/pool.py — Agent 线程池管理器
Author: hongchuwudi
Description: 启动时加载所有 ai_agents 配置，维护线程池并发处理审核任务
# Class: AgentPool — 池管理器单例
# Method: start — 加载配置启动池
# Method: submit — 提交审核任务
# Method: reload — 热重载配置
"""
import logging
import threading
from concurrent.futures import ThreadPoolExecutor
from app.config.database import SessionLocal
from app.config.settings import settings
from app.models.ai.agent import AiAgent
from app.agents.agent import Agent

logger = logging.getLogger("agent_pool")

# pool_size — 从环境变量读取，默认 5
POOL_SIZE = getattr(settings, 'AGENT_POOL_SIZE', None)
if POOL_SIZE is None:
    POOL_SIZE = 5
else:
    POOL_SIZE = int(POOL_SIZE)


class AgentPool:
    """Agent 线程池单例"""
    def __init__(self):
        self.executor: ThreadPoolExecutor | None = None
        self.agents: dict[int, Agent] = {}  # agent_id → Agent
        self._lock = threading.Lock()       # 保护 agents 字典的并发访问
        self._pending_count = 0             # 等待中的审核数（含正在执行）

    # start — 从 DB 加载 Agent 配置（幂等）
    def start(self):
        if self.executor is not None:
            return
        db = SessionLocal()
        try:
            rows = db.query(AiAgent).all()
            with self._lock:
                for r in rows:
                    self.agents[r.id] = Agent(r)
            logger.info("AgentPool started: %d agents, pool_size=%d", len(self.agents), POOL_SIZE)
        finally:
            db.close()
        self.executor = ThreadPoolExecutor(max_workers=POOL_SIZE, thread_name_prefix="agent")

    def submit(self, task_id: int, result_id: int, item_id: int):
    # submit — 提交审核任务到线程池
        from app.models.tasks.task import LabelTask
        db = SessionLocal()
        try:
            task = db.query(LabelTask).filter(LabelTask.id == task_id).first()
            agent_id = task.ai_agent_id if task else None
        finally:
            db.close()

        with self._lock:
            if not agent_id or agent_id not in self.agents:
                logger.warning("AgentPool: task %d has no agent_id or agent not loaded", task_id)
                return
            agent = self.agents[agent_id]
            self._pending_count += 1

        future = self.executor.submit(agent.run, task_id, item_id, result_id)
        future.add_done_callback(lambda _f: self._on_task_done())
        logger.info("AgentPool: task=%d → agent[%s]", task_id, agent.name)
        return future

    def _on_task_done(self):
    # _on_task_done — 任务完成回调，递减计数
        with self._lock:
            self._pending_count -= 1

    def reload(self):
    # reload — 重新从 DB 加载配置，不打断正在工作的 Agent
        db = SessionLocal()
        try:
            rows = db.query(AiAgent).all()
            with self._lock:
                new_ids = {r.id for r in rows}
                old_ids = set(self.agents.keys())

                for r in rows:
                    existing = self.agents.get(r.id)
                    if existing is None:
                        # 新增
                        self.agents[r.id] = Agent(r)
                        logger.info("AgentPool: added agent[%s]", r.name)
                    elif existing.status == "idle":
                        # 空闲时更新配置
                        existing.config = {
                            "model": r.llm_model or settings.LLM_MODEL,
                            "dimensions": r.scoring_dimensions,
                            "prompt": r.system_prompt,
                        }
                        existing.name = r.name

                # 删除 Agent，但跳过正在工作中的
                for removed in old_ids - new_ids:
                    agent = self.agents[removed]
                    if agent.status == "busy":
                        logger.info("AgentPool: skip remove busy agent[%s]", agent.name)
                        continue
                    del self.agents[removed]
                    logger.info("AgentPool: removed agent[%s]", agent.name)
        finally:
            db.close()

    def get_status(self) -> dict:
    # get_status — 返回 Agent 列表 + 池状态
        with self._lock:
            busy_count = sum(1 for a in self.agents.values() if a.status == "busy")
            agents = [
                {"id": aid, "name": a.name, "status": a.status, "model": a.config["model"]}
                for aid, a in self.agents.items()
            ]
            return {
                "agents": agents,
                "pool_size": POOL_SIZE,
                "busy_count": busy_count,
                "pending_count": self._pending_count,
            }

    def shutdown(self):
        if self.executor:
            self.executor.shutdown(wait=True)


# pool — 全局单例
pool = AgentPool()
