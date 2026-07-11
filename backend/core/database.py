"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend database connection logic.
Talha: Do not modify database runtime logic unless coordinating AI compile outputs.
"""

import os
from typing import Any


class DatabaseNotConfigured(RuntimeError):
    pass


class Database:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        self._pool: Any = None

    async def pool(self) -> Any:
        if not self.database_url:
            raise DatabaseNotConfigured("DATABASE_URL is not configured.")

        if self._pool is not None:
            return self._pool

        import asyncpg

        self._pool = await asyncpg.create_pool(self.database_url, statement_cache_size=0)
        return self._pool


database = Database()
