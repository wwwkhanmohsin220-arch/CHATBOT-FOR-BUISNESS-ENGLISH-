import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    count = await conn.fetchval("SELECT count(*) FROM rag_evaluations WHERE is_correct IS NULL")
    print(f"Unevaluated questions: {count}")
    
    first = await conn.fetchrow("SELECT id, question, is_correct FROM rag_evaluations LIMIT 1")
    print(f"First row: {dict(first) if first else None}")
    
    await conn.close()

asyncio.run(main())
