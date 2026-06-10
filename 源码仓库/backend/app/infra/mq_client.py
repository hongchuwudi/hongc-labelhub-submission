"""
RabbitMQ 客户端——阻塞连接 + 两个预定义队列

连接管理:
- 单例长连接（BlockingConnection），heartbeat=600s 防止空闲断连
- 每次 publish 自动 declare 队列（幂等操作，队列已存在则跳过）

两个预定义队列:
  labelhub.ai.review → AI 审核任务: 标注员提交后入队，Agent Worker 消费
  labelhub.export    → 数据导出任务: 异步生成 JSON/CSV/Excel 文件

消息持久化:
  durable=True       → 队列重启不丢
  delivery_mode=2    → 消息重启不丢
"""
import json
import threading
import pika
from pika.adapters.blocking_connection import BlockingChannel

from app.config.settings import settings

# _connections — 线程本地存储，每个线程独立持有自己的 MQ 连接
_connections = threading.local()


def _get_connection() -> pika.BlockingConnection:
    """获取当前线程的 MQ 连接（线程安全）"""
    conn = getattr(_connections, 'conn', None)
    if conn is None or conn.is_closed:
        conn = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=settings.MQ_HOST, port=settings.MQ_PORT,
                virtual_host=settings.MQ_VHOST,
                credentials=pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD),
                heartbeat=600,
            )
        )
        _connections.conn = conn
    return conn


def get_channel() -> BlockingChannel:
    """每次操作开新 Channel（轻量，不需要池化）"""
    return _get_connection().channel()


# ──── 预定义队列 ────

AI_REVIEW_QUEUE = "labelhub.ai.review"    # 标注员提交 → AI Agent 消费
EXPORT_QUEUE = "labelhub.export"          # Owner 点击导出 → Worker 生成文件


def publish(queue: str, body: dict) -> None:
    """发送消息到指定队列——自动声明队列 + 持久化消息"""
    ch = get_channel()
    ch.queue_declare(queue=queue, durable=True)                       # 幂等: 队列已存在则跳过
    ch.basic_publish(
        exchange="",                                                  # 默认交换机，直接路由到同名队列
        routing_key=queue,
        body=json.dumps(body, ensure_ascii=False),
        properties=pika.BasicProperties(delivery_mode=2),             # 消息持久化到磁盘
    )


def consume(queue: str, callback, prefetch: int = 1) -> None:
    """启动消费者——prefetch=1 表示每次只取一条，公平分发（能者多劳）"""
    ch = get_channel()
    ch.queue_declare(queue=queue, durable=True)
    ch.basic_qos(prefetch_count=prefetch)
    ch.basic_consume(queue=queue, on_message_callback=callback, auto_ack=False)  # 手动 ACK
    ch.start_consuming()                                              # 阻塞主线程
