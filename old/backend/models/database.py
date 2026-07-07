# TODO (Person 2 - Backend): Implement PostgreSQL long-term storage
# Schema for persisting completed sessions for analytics.
import json
import os
from typing import Any
from dotenv import load_dotenv  # <-- ADD THIS IMPORT

# Force load the .env file so separate worker processes can read the DB credentials
load_dotenv()  

class DatabaseManager:
    def __init__(self, database_url: str | None = None):
        self.database_url = database_url or os.getenv("DATABASE_URL")

    async def save_session(self, session_data: dict[str, Any]) -> bool:
        if not self.database_url:
            print("❌ DATABASE ERROR: DATABASE_URL environment variable is blank or not found!")
            return False

        import asyncpg

        # 1. Attempt connection with verbose error logging
        try:
            connection = await asyncpg.connect(self.database_url)
        except Exception as e:
            print(f"❌ DATABASE CONNECTION ERROR: Failed to connect to Postgres. Details: {e}")
            return False

        # 2. Attempt table creation and data insertion
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
            print("✅ DATABASE SUCCESS: Session successfully archived to PostgreSQL!")
            return True
        except Exception as e:
            print(f"❌ DATABASE EXECUTION ERROR: Table creation or row insertion failed. Details: {e}")
            return False
        finally:
            await connection.close()