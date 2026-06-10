"""
agents/ai_worker.py — AI 审核 Worker（基于 Agent 池）
Author: hongchuwudi
Description: 消费 MQ 队列，提交任务到 AgentPool
# Function: handle — MQ 消息处理
# Function: main — 启动消费者
"""
import json
import logging
import signal
import sys
from app.agents.pool import pool
from app.infra.mq_client import consume, AI_REVIEW_QUEUE

logger = logging.getLogger("ai_worker")


def handle_message(ch, method, properties, body):
    try:
        msg = json.loads(body.decode("utf-8"))
        task_id = msg["task_id"]
        result_id = msg["result_id"]
        item_id = msg.get("item_id")

        from app.config.database import SessionLocal
        from app.models.tasks.task import LabelTask
        db = SessionLocal()
        task = db.query(LabelTask).filter(LabelTask.id == task_id).first()
        db.close()

        if not task or not task.ai_agent_id:
            logger.info("AI Worker: task %d has no agent, skip", task_id)
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return

        pool.submit(task_id, result_id, item_id)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        logger.info("AI Worker: submitted task=%d result=%d to pool", task_id, result_id)

    except Exception:
        logger.exception("AI Worker error")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    import time
    pool.start()
    logger.info("AI Worker starting on %s", AI_REVIEW_QUEUE)
    while True:
        try:
            consume(AI_REVIEW_QUEUE, handle_message, prefetch=1)
        except Exception:
            logger.warning("AI Worker: MQ 断连，5秒后重试...")
            time.sleep(5)


if __name__ == "__main__":
    main()
