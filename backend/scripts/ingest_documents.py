"""
@ai-restriction
Primary Owner: Talha / Umer
Script to chunk educational material and insert it into the pgvector document_chunks table.
Usage: python -m backend.scripts.ingest_documents path/to/book.md
"""

import sys
import os
import json
import asyncio
import tiktoken
from dotenv import load_dotenv
from pathlib import Path

# Load env variables BEFORE importing the database
_BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(_BACKEND_DIR / ".env")

from sentence_transformers import SentenceTransformer
from backend.core.database import database

# We use all-MiniLM-L6-v2 which runs locally and outputs 384 dimensions
model = SentenceTransformer('all-MiniLM-L6-v2')

MAX_TOKENS_PER_CHUNK = 400

def chunk_text(text: str) -> list[str]:
    """
    Chunks a large text into smaller paragraphs, ensuring no chunk exceeds MAX_TOKENS_PER_CHUNK.
    """
    enc = tiktoken.encoding_for_model("text-embedding-3-small") # Just using tiktoken for fast counting
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = []
    current_length = 0

    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
            
        p_len = len(enc.encode(p))
        
        if p_len > MAX_TOKENS_PER_CHUNK:
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
                current_chunk = []
                current_length = 0
            # Force split the massive paragraph
            words = p.split(" ")
            temp_chunk = []
            temp_len = 0
            for w in words:
                w_len = len(enc.encode(w + " "))
                if temp_len + w_len > MAX_TOKENS_PER_CHUNK:
                    chunks.append(" ".join(temp_chunk))
                    temp_chunk = [w]
                    temp_len = w_len
                else:
                    temp_chunk.append(w)
                    temp_len += w_len
            if temp_chunk:
                chunks.append(" ".join(temp_chunk))
            continue

        if current_length + p_len > MAX_TOKENS_PER_CHUNK:
            chunks.append("\n\n".join(current_chunk))
            current_chunk = [p]
            current_length = p_len
        else:
            current_chunk.append(p)
            current_length += p_len

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks

async def ingest(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        sys.exit(1)

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    print(f"Chunking {file_path}...")
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks.")

    pool = await database.pool()
    
    # 1. Create a Document Source record
    title = os.path.basename(file_path)
    async with pool.acquire() as conn:
        source_id = await conn.fetchval(
            """
            INSERT INTO document_sources (title, metadata)
            VALUES ($1, $2)
            RETURNING id
            """,
            title, json.dumps({"source_type": "file", "path": file_path})
        )

        print(f"Created document_source {source_id}. Generating local embeddings...")

        # 2. Embed and insert each chunk using the local model
        # sentence-transformers can embed in batches, which is incredibly fast
        embeddings = model.encode(chunks)
        
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            embedding_list = embedding.tolist()
            
            await conn.execute(
                """
                INSERT INTO document_chunks (source_id, content, embedding)
                VALUES ($1, $2, $3::vector)
                """,
                source_id, chunk, json.dumps(embedding_list)
            )
            print(f"Inserted chunk {i+1}/{len(chunks)}")
            
    print("Ingestion complete!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m backend.scripts.ingest_documents path/to/file.md")
        sys.exit(1)
        
    asyncio.run(ingest(sys.argv[1]))
