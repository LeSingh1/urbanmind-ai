"""
RQ worker entry point. Run with: rq worker urbanmind
Jobs are enqueued by simulation.py when Redis is available.
Without Redis, simulations run directly in the WebSocket handler.
"""
import os
import sys
from pathlib import Path

try:
    from rq import Worker, Queue, Connection
    import redis

    listen = ["urbanmind"]
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    conn = redis.from_url(redis_url)

    if __name__ == "__main__":
        with Connection(conn):
            worker = Worker(list(map(Queue, listen)))
            worker.work()
except ImportError:
    print("RQ not available. Simulations run in-process via WebSocket handler.")
