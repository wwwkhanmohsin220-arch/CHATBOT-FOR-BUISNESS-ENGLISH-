"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend persistence logic.
Talha: Do not modify auth persistence unless adding QA/deployment fixtures.
"""

import os
import uuid
from typing import Any


class AuthStore:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL")
        self._pool: Any = None
        self._memory_users: dict[str, dict[str, str]] = {}
        self._memory_users_by_username: dict[str, dict[str, str]] = {}

    async def _get_pool(self) -> Any:
        if not self.database_url:
            return None

        if self._pool is not None:
            return self._pool

        try:
            import asyncpg
        except ImportError:
            return None

        try:
            self._pool = await asyncpg.create_pool(self.database_url)
        except Exception:
            return None

        async with self._pool.acquire() as connection:
            await connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    session_id TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
                """
            )
            await connection.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS session_id TEXT UNIQUE
                """
            )
            await connection.execute(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx
                ON users (LOWER(username))
                """
            )

        return self._pool

    async def get_user_by_username(self, username: str) -> dict[str, str] | None:
        normalized_username = username.lower()
        pool = await self._get_pool()

        if pool is None:
            return self._memory_users_by_username.get(normalized_username)

        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                """
                SELECT id, session_id, username, email, password_hash, salt
                FROM users
                WHERE LOWER(username) = $1
                """,
                normalized_username,
            )

        return dict(row) if row else None

    async def get_user_by_email(self, email: str) -> dict[str, str] | None:
        normalized_email = email.lower()
        pool = await self._get_pool()

        if pool is None:
            return self._memory_users.get(normalized_email)

        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                """
                SELECT id, session_id, username, email, password_hash, salt
                FROM users
                WHERE email = $1
                """,
                normalized_email,
            )

        if not row:
            return None

        user_record = dict(row)
        if not user_record.get("session_id"):
            user_record["session_id"] = str(uuid.uuid4())
            async with pool.acquire() as connection:
                await connection.execute(
                    """
                    UPDATE users
                    SET session_id = $1
                    WHERE id = $2
                    """,
                    user_record["session_id"],
                    user_record["id"],
                )

        return user_record

    async def create_user(self, user_record: dict[str, str]) -> dict[str, str]:
        normalized_email = user_record["email"].lower()
        user_record.setdefault("session_id", str(uuid.uuid4()))
        pool = await self._get_pool()

        if pool is None:
            self._memory_users[normalized_email] = user_record
            self._memory_users_by_username[user_record["username"].lower()] = user_record
            return user_record

        async with pool.acquire() as connection:
            await connection.execute(
                """
                INSERT INTO users (id, session_id, username, email, password_hash, salt)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                user_record["id"],
                user_record["session_id"],
                user_record["username"],
                normalized_email,
                user_record["password_hash"],
                user_record["salt"],
            )

        return user_record
