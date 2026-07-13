import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
DB_URL = os.environ["DATABASE_URL"]

async def main():
    print("Connecting to database...")
    conn = await asyncpg.connect(DB_URL)
    print("Wiping lesson progress...")
    await conn.execute("DELETE FROM node_attempts;")
    await conn.execute("DELETE FROM lesson_branches;")
    await conn.execute("DELETE FROM lesson_nodes;")
    await conn.execute("DELETE FROM lesson_instances;")
    await conn.execute("DELETE FROM document_chunks;")
    await conn.execute("DELETE FROM document_sources;")
    await conn.close()
    print("Database reset successfully.")

asyncio.run(main())
