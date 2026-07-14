import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    
    rows = await conn.fetch("""
        SELECT id, content 
        FROM document_chunks 
        WHERE content LIKE '%LESSON 45%'
        LIMIT 3
    """)
    
    for row in rows:
        print(f"--- Chunk ID: {row['id']} ---")
        print(row['content'].encode('ascii', 'ignore').decode('ascii'))
        print("\n")
        
    await conn.close()

asyncio.run(main())
