"""
@ai-restriction
Primary Owner: Talha / Umer
Script to chunk educational material and insert it into the pgvector document_chunks table.
Usage: python -m backend.scripts.ingest_documents path/to/book.md
       python -m backend.scripts.ingest_documents path/to/book.pdf
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

# Upgraded to BAAI/bge-small-en-v1.5 which dominates MTEB local benchmarks
# and outputs 384 dimensions matching our existing database schema!
model = SentenceTransformer('BAAI/bge-small-en-v1.5')

MAX_TOKENS_PER_CHUNK = 400

def extract_text(file_path: str) -> str:
    """Extracts raw text from .md, .txt, or .pdf files."""
    ext = file_path.lower().split('.')[-1]
    
    if ext in ['md', 'txt']:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
            
    elif ext == 'pdf':
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            text = []
            for page in doc:
                text.append(page.get_text())
            return "\n\n".join(text)
        except ImportError:
            print("Error: PyMuPDF is not installed. Run `pip install PyMuPDF` to ingest PDFs.")
            sys.exit(1)
            
    else:
        print(f"Error: Unsupported file extension .{ext}")
        sys.exit(1)

def get_toc() -> dict[str, str]:
    from backend.scripts.generate_eval_questions import TOC
    toc = {}
    lines = [line.strip() for line in TOC.strip().split("\n") if line.strip()]
    for line in lines:
        parts = line.split(" ", 2)
        if len(parts) >= 3:
            lesson_key = f"{parts[0]} {parts[1]}"  # "Lesson 1"
            toc[lesson_key] = parts[2]
    return toc

def chunk_text(text: str) -> list[str]:
    """
    Chunks text with a sliding window (200 tokens max, 50 token overlap).
    Injects context (e.g. "[Context: Lesson 4 - Concreteness]") into every chunk.
    """
    enc = tiktoken.encoding_for_model("text-embedding-3-small")
    toc = get_toc()
    
    chunks = []
    lines = text.split("\n")
    current_context = "General Context"
    
    MAX_TOKENS = 200
    OVERLAP_TOKENS = 50
    
    current_chunk_tokens = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Detect Lesson Headers
        upper_line = line.upper()
        if "LESSON " in upper_line:
            parts = upper_line.split("LESSON ")
            if len(parts) > 1:
                num_str = parts[1].split()[0] if parts[1].split() else ""
                num_str = ''.join(c for c in num_str if c.isdigit())
                if num_str.isdigit():
                    num = int(num_str)
                    lesson_key = f"Lesson {num}"
                    if lesson_key in toc:
                        current_context = f"{lesson_key} - {toc[lesson_key]}"
                        
        tokens = enc.encode(line + " ")
        
        if len(current_chunk_tokens) + len(tokens) > MAX_TOKENS:
            if current_chunk_tokens:
                raw_text = enc.decode(current_chunk_tokens).strip()
                final_text = f"[Context: {current_context}] {raw_text}"
                chunks.append(final_text)
                
                overlap_size = min(OVERLAP_TOKENS, len(current_chunk_tokens))
                current_chunk_tokens = current_chunk_tokens[-overlap_size:]
                
        current_chunk_tokens.extend(tokens)
        
    if current_chunk_tokens:
        raw_text = enc.decode(current_chunk_tokens).strip()
        final_text = f"[Context: {current_context}] {raw_text}"
        chunks.append(final_text)
        
    return chunks

async def ingest(file_path: str):
    if not os.path.exists(file_path):
        print(f"Error: File {file_path} not found.")
        sys.exit(1)

    print(f"Extracting text from {file_path}...")
    text = extract_text(file_path)

    print("Chunking text...")
    chunks = chunk_text(text)
    print(f"Created {len(chunks)} chunks.")

    pool = await database.pool()
    
    async with pool.acquire() as conn:
        print("Wiping existing document chunks and sources to ensure clean state...")
        await conn.execute("DELETE FROM document_chunks;")
        await conn.execute("DELETE FROM document_sources;")
        
        # 1. Create a Document Source record
        title = os.path.basename(file_path)
        source_id = await conn.fetchval(
            """
            INSERT INTO document_sources (title, metadata)
            VALUES ($1, $2)
            RETURNING id
            """,
            title, json.dumps({"source_type": "file", "path": file_path})
        )

        print(f"Created document_source {source_id}. Generating BAAI local embeddings...")

        # 2. Embed and insert each chunk using the local model
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
