import asyncio
import asyncpg
import os
import json
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel, Field
from backend.utils.llm import generate_validated

load_dotenv("backend/.env")

class RagEvaluationOutput(BaseModel):
    is_correct: bool = Field(description="True if AT LEAST ONE of the retrieved chunks contains the correct semantic information to write a curriculum about the requested lesson.")
    comment: str = Field(description="A brief explanation of why the chunks pass or fail. Which chunk was the winner? Was it completely off topic?")

async def run_judge():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    
    print("Loading embedding model...")
    model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    
    # Fetch all unevaluated
    rows = await conn.fetch("SELECT id, question, expected_lesson FROM rag_evaluations WHERE is_correct IS NULL ORDER BY id ASC")
    
    if not rows:
        print("No unevaluated questions left. All done!")
        await conn.close()
        return
        
    print(f"Found {len(rows)} unevaluated questions. Starting LLM-as-a-Judge...\n")
    
    for row in rows:
        q_id = row['id']
        question = row['question']
        expected_lesson = row['expected_lesson']
        
        print(f"Evaluating Q{q_id}: {question}", flush=True)
        
        # 1. Embed and retrieve chunks
        query_embedding = model.encode(question)
        embedding_json = json.dumps(query_embedding.tolist())
        
        chunks = await conn.fetch(
            """
            SELECT dc.content, ds.title as source_title, (dc.embedding <-> $1::vector) as distance
            FROM document_chunks dc
            JOIN document_sources ds ON dc.source_id = ds.id
            ORDER BY dc.embedding <-> $1::vector
            LIMIT 3
            """,
            embedding_json
        )
        
        retrieved_chunks = []
        chunk_text = ""
        for i, c in enumerate(chunks):
            retrieved_chunks.append({
                "content": c["content"],
                "source_title": c["source_title"],
                "distance": float(c["distance"])
            })
            chunk_text += f"--- Chunk {i+1} ---\n{c['content']}\n\n"
            
        # 2. Prompt LLM
        sys_prompt = f"""You are an expert curriculum evaluator for a Business English platform.
Your task is to review a user query and 3 retrieved textbook chunks.
The expected lesson topic is: {expected_lesson}

Analyze the chunks. Does at least ONE of the chunks contain the core conceptual definition or outline needed to answer the query?
If yes, return is_correct=true.
If all chunks are irrelevant noise (e.g. they discuss a completely different chapter), return is_correct=false.
Output your evaluation as a JSON object matching the requested schema."""

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": f"Query: {question}\n\nRetrieved Chunks:\n{chunk_text}"}
        ]
        
        try:
            result = await generate_validated(
                messages=messages,
                schema=RagEvaluationOutput,
                task="rag_evaluation",
                model="llama-3.3-70b-versatile"
            )
            
            # 3. Save to DB
            await conn.execute("""
                UPDATE rag_evaluations 
                SET is_correct = $1, comment = $2, retrieved_chunks = $3::jsonb
                WHERE id = $4
            """, result.is_correct, result.comment, json.dumps(retrieved_chunks), q_id)
            
            status = "Pass" if result.is_correct else "Fail"
            print(f"   -> {status} | {result.comment}", flush=True)
            
        except Exception as e:
            print(f"   -> Error evaluating Q{q_id}: {e}", flush=True)
            
        # Delay to respect Groq free tier TPM (Tokens Per Minute) rate limits.
        # We are sending ~1500 tokens per request. Groq limit is 12,000 TPM.
        # 60 seconds / (12000/1500) = 8 requests/min. We sleep 9.0s to be extremely safe.
        await asyncio.sleep(9.0)
        
    await conn.close()
    print("\nLLM-as-a-Judge evaluation complete!")

if __name__ == "__main__":
    asyncio.run(run_judge())
