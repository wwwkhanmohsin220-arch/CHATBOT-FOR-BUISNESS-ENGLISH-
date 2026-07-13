import asyncio
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')
from sentence_transformers import SentenceTransformer

async def run():
    model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    conn = await asyncpg.connect(os.environ['DATABASE_URL'], statement_cache_size=0)
    
    test_queries = [
        "What are the key concepts of Research Methodology?", # Last lesson (45)
        "How do I write a Collection Letter for a bad debt?", # Tricky edge case (Lesson 25)
        "What are the Principles of Business Communication?", # Random (Lesson 9)
        "How should I dress for an interview?", # Random (Lesson 37)
        "What is the definition of Consideration?" # Previous failure check (Lesson 11)
    ]
    
    with open('rag_output.txt', 'w', encoding='utf-8') as f:
        for q in test_queries:
            chunks = await conn.fetch(
                'SELECT content FROM document_chunks ORDER BY embedding <-> $1::vector LIMIT 1;',
                json.dumps(model.encode(q).tolist())
            )
            f.write(f'\n--- QUERY: {q} ---\n')
            f.write(chunks[0]['content'] + '\n\n')
            
    await conn.close()

if __name__ == "__main__":
    asyncio.run(run())
