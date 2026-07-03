# TODO (Person 2 - Backend): Implement PostgreSQL long-term storage
# Schema for persisting completed sessions for analytics.
import json
import os
from typing import Any

class DatabaseManager:
    def __init__(self, database_url: str | None = None):
        self.database_url = database_url or os.getenv("DATABASE_URL")

    async def save_session(self, session_data: dict[str, Any]) -> bool:
        if not self.database_url:
            return False

        import asyncpg

        connection = await asyncpg.connect(self.database_url)
        try:
            await connection.execute(
                """
                CREATE TABLE IF NOT EXISTS archived_sessions (
                    id SERIAL PRIMARY KEY,
                    session_id TEXT NOT NULL,
                    messages JSONB NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            await connection.execute(
                """
                INSERT INTO archived_sessions (session_id, messages)
                VALUES ($1, $2::jsonb)
                """,
                session_data["session_id"],
                json.dumps(session_data["messages"]),
            )
            return True
        finally:
            await connection.close()
