import asyncio
import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Force load the .env file with absolute path
root_dir = Path(__file__).resolve().parent
load_dotenv(root_dir / "backend" / ".env")

# Force stdout to utf-8 so windows doesn't crash on bullet points
sys.stdout.reconfigure(encoding='utf-8')

from sentence_transformers import SentenceTransformer
from backend.core.database import database

model = SentenceTransformer('BAAI/bge-small-en-v1.5')

async def test_search(query: str):
    print(f"Embedding your query: '{query}'...")
    query_embedding = model.encode(query)
    embedding_json = json.dumps(query_embedding.tolist())
    
    pool = await database.pool()
    async with pool.acquire() as conn:
        print("\nQuerying Supabase pgvector...\n")
        rows = await conn.fetch(
            """
            SELECT dc.content, ds.title, (dc.embedding <-> $1::vector) as distance
            FROM document_chunks dc
            JOIN document_sources ds ON dc.source_id = ds.id
            ORDER BY dc.embedding <-> $1::vector
            LIMIT 3
            """,
            embedding_json
        )
        
        for i, row in enumerate(rows):
            print(f"--- MATCH {i+1} (Source: {row['title']}, Distance: {row['distance']:.3f}) ---")
            print(row['content'])
            print("-" * 50 + "\n")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_rag.py 'your question here'")
    else:
        asyncio.run(test_search(sys.argv[1]))
