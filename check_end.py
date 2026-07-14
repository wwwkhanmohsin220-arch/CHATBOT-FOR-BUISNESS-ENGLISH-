import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    
    # Check if Lesson 45 exists in the chunks
    row = await conn.fetchrow("""
        SELECT content 
        FROM document_chunks 
        WHERE content ILIKE '%Lesson 45%' OR content ILIKE '%Research Methodology%' 
        LIMIT 1
    """)
    
    if row:
        print(f"FOUND THE END OF THE BOOK!\nSnippet: {row['content'][:300].encode('ascii', 'ignore').decode('ascii')}...")
    else:
        print("Not found")
        
    await conn.close()

asyncio.run(main())
