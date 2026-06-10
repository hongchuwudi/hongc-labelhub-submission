"""一键启动：FastAPI + Export Worker"""
import sys
import threading
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import uvicorn
import json
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [worker] %(levelname)s %(message)s")
logging.getLogger("pika").setLevel(logging.WARNING)
logger = logging.getLogger("run")


def start_ai_worker():
    """AI 审核 Worker——基于 Agent 池"""
    from app.agents.pool import pool
    pool.start()
    from app.agents.ai_worker import main as ai_main
    ai_main()


def start_export_worker():
    from app.infra.mq_client import consume, EXPORT_QUEUE
    from app.config.database import SessionLocal
    from app.services.common.export import ExportService

    def handle(ch, method, properties, body):
        import time
        msg = json.loads(body.decode("utf-8"))
        job_id = msg.get("job_id")
        logger.info("Export job=%d", job_id)
        for attempt in range(3):
            db = SessionLocal()
            try:
                ExportService(db).process_job(job_id)
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return
            except Exception as e:
                db.rollback()
                if "Deadlock" in str(e) and attempt < 2:
                    logger.warning("Deadlock retry %d/3 for job=%d", attempt + 1, job_id)
                    time.sleep(1 * (attempt + 1))
                else:
                    logger.exception("Export worker error job=%d", job_id)
                    ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
                    return
            finally:
                db.close()

    logger.info("Export Worker starting on %s", EXPORT_QUEUE)
    try:
        consume(EXPORT_QUEUE, handle, prefetch=1)
    except Exception:
        logger.warning("Export Worker: MQ 不可用，导出将回退同步处理")


if __name__ == "__main__":
    t1 = threading.Thread(target=start_export_worker, daemon=True, name="export-worker")
    t1.start()
    t2 = threading.Thread(target=start_ai_worker, daemon=True, name="ai-worker")
    t2.start()

    logger.info("Starting FastAPI on http://127.0.0.1:8000")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
