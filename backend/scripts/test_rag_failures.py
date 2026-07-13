import asyncio
import asyncpg
import json
import os
from dotenv import load_dotenv

load_dotenv('backend/.env')

from backend.utils.llm import generate_validated
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

class RagEvalResponse(BaseModel):
    is_correct: bool = Field(description="True if the chunks contain the answer to the query.")
    comment: str = Field(description="Reasoning why it passed or failed.")

async def test_specific_questions():
    conn = await asyncpg.connect(os.environ['DATABASE_URL'], statement_cache_size=0)
    
    test_queries = [
        "What is the definition of Concreteness?", # Previously Pass
        "What is the definition of Consideration?", # Previously Fail (Q168)
        "Can you explain Communication through Technology in the context of Business Communication?" # Previously Fail (Q188)
    ]
    
    print("Loading embedding model...")
    model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    
    for query in test_queries:
        print(f"\nEvaluating: {query}")
        
        # Embed query
        query_embedding = model.encode(query).tolist()
        
        # Retrieve chunks
        chunks = await conn.fetch(
            """
            SELECT id, content, 1 - (embedding <-> $1::vector) AS similarity
            FROM document_chunks
            ORDER BY embedding <-> $1::vector
            LIMIT 3
            """,
            json.dumps(query_embedding)
        )
        
        chunk_text = ""
        for i, c in enumerate(chunks):
            chunk_text += f"--- Chunk {i+1} ---\n{c['content']}\n\n"
            
        sys_prompt = f"""You are an expert curriculum evaluator for a Business English platform.
Your task is to review a user query and 3 retrieved textbook chunks.

Analyze the chunks. Does at least ONE of the chunks contain the core conceptual definition or outline needed to answer the query?
If yes, return is_correct=true.
If all chunks are irrelevant noise, return is_correct=false.
Output your evaluation as a JSON object matching the requested schema."""

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"Query: {query}\n\nRetrieved Chunks:\n{chunk_text}"}
        ]
        
        try:
            result = await generate_validated(messages, RagEvalResponse, "rag_eval")
            status = "Pass" if result.is_correct else "Fail"
            print(f"   -> {status} | {result.comment}")
        except Exception as e:
            print(f"   -> Error: {e}")
            
    await conn.close()

if __name__ == "__main__":
    asyncio.run(test_specific_questions())
