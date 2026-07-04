import os
from urllib.parse import urlparse

from arq.connections import RedisSettings

from backend.models.database import DatabaseManager


def get_redis_settings() -> RedisSettings:
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    parsed_url = urlparse(redis_url)

    database = 0
    if parsed_url.path and parsed_url.path != "/":
        database = int(parsed_url.path.lstrip("/"))

    return RedisSettings(
        host=parsed_url.hostname or "127.0.0.1",
        port=parsed_url.port or 6379,
        database=database,
        password=parsed_url.password,
    )


async def archive_session(ctx, session_id: str, messages: list[dict]) -> bool:
    database_manager = DatabaseManager()
    return await database_manager.save_session(
        {
            "session_id": session_id,
            "messages": messages,
        }
    )


class WorkerSettings:
    functions = [archive_session]
    redis_settings = get_redis_settings()
