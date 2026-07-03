# TODO (Person 2 - Backend): Implement SessionManager and Redis caching logic
# Store short-term memory (last N messages) per session ID.
import json
import os
from typing import Any

class SessionManager:
    def __init__(self, redis_url: str | None = None, ttl_seconds: int = 3600):
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.ttl_seconds = ttl_seconds
        self._memory_store: dict[str, list[dict[str, Any]]] = {}
        self._redis_client = self._connect_redis()

    def _connect_redis(self):
        try:
            from redis import Redis

            client = Redis.from_url(self.redis_url, decode_responses=True)
            client.ping()
            return client
        except Exception:
            return None

    def _key(self, session_id: str) -> str:
        return f"session:{session_id}:history"

    def get_history(self, session_id: str) -> list[dict[str, Any]]:
        if self._redis_client:
            raw_history = self._redis_client.get(self._key(session_id))
            if not raw_history:
                return []
            return json.loads(raw_history)

        return self._memory_store.get(session_id, [])

    def set_history(self, session_id: str, history: list[dict[str, Any]]) -> None:
        trimmed_history = history[-10:]

        if self._redis_client:
            self._redis_client.setex(
                self._key(session_id),
                self.ttl_seconds,
                json.dumps(trimmed_history),
            )
            return

        self._memory_store[session_id] = trimmed_history

    def add_message(self, session_id: str, role: str, content: str) -> None:
        history = self.get_history(session_id)
        history.append({"role": role, "content": content})
        self.set_history(session_id, history)
