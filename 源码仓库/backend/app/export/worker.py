"""导出 Worker——消费 labelhub.export 队列

启动: python -m app.export_worker
"""
import json
import logging
import sys
import signal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.database import SessionLocal
from app.services.common.export import ExportService
from app.infra.mq_client import consume, EXPORT_QUEUE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [export-worker] %(levelname)s %(message)s",
)
logger = logging.getLogger("export_worker")


def handle_message(ch, method, properties, body):
    try:
        msg = json.loads(body.decode("utf-8"))
        job_id = msg.get("job_id")
        logger.info("Processing export job=%d", job_id)

        db = SessionLocal()
        try:
            svc = ExportService(db)
            job = svc.process_job(job_id)
            logger.info(
                "Export done: job=%d format=%s items=%d path=%s",
                job.id, job.format, job.item_count or 0, job.file_path or "",
            )
        finally:
            db.close()

        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        logger.exception("Export worker error")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)


def main():
    logger.info("Export Worker starting... Queue: %s", EXPORT_QUEUE)

    def shutdown(signum, frame):
        logger.info("Worker shutting down")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    consume(EXPORT_QUEUE, handle_message, prefetch=1)


if __name__ == "__main__":
    main()
