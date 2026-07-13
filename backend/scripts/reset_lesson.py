import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path('backend/.env').resolve())

from backend.core.database import database

async def reset_lesson():
    pool = await database.pool()
    async with pool.acquire() as conn:
        await conn.execute("UPDATE lesson_instances SET status = 'ready', current_node_index = 0, completed_at = NULL")
        await conn.execute("UPDATE lesson_nodes SET status = 'pending'")
        await conn.execute("UPDATE lesson_branches SET consumed = FALSE")
        await conn.execute("DELETE FROM node_attempts")
        await conn.execute("DELETE FROM xp_events WHERE idempotency_key LIKE 'xp:lesson:%'")
    print("Lesson reset to beginning!")

asyncio.run(reset_lesson())
