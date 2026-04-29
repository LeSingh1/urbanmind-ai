from redis import Redis
from rq import Queue, Worker

from config import settings
from worker.simulation_job import run_simulation


def main() -> None:
    connection = Redis.from_url(settings.redis_url)
    worker = Worker([Queue("simulations", connection=connection)], connection=connection)
    worker.work()


if __name__ == "__main__":
    main()
