import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    await conn.execute('''
        create table if not exists rag_evaluations (
            id serial primary key,
            question text not null,
            expected_lesson text not null,
            retrieved_chunks jsonb not null,
            is_correct bool,
            comment text,
            created_at timestamptz default now()
        );
    ''')
    await conn.close()

asyncio.run(main())
