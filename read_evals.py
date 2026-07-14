import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    rows = await conn.fetch("SELECT id, is_correct, comment FROM rag_evaluations WHERE is_correct IS NOT NULL ORDER BY id ASC")
    
    print(f"Total evaluated: {len(rows)}\n")
    for r in rows:
        status = "Pass" if r['is_correct'] else "Fail"
        comment = r['comment'] if r['comment'] else "No comment"
        print(f"Q{r['id']}: {status} | Comment: {comment}")
        
    await conn.close()

asyncio.run(main())
