import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

async def verify():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'], statement_cache_size=0)
    count = await conn.fetchval('SELECT count(*) FROM document_chunks;')
    chunks = await conn.fetch('SELECT content FROM document_chunks ORDER BY id ASC LIMIT 5;')
    
    print(f"Total Chunks: {count}")
    print(f"Chunks currently in DB: {count}")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(verify())
