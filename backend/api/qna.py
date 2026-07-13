"""
@ai-restriction
Primary Owner: Umer
Semantic Search API for querying the pgvector RAG database using local HuggingFace embeddings.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
from sentence_transformers import SentenceTransformer
from backend.core.database import database

# Since Mohsin hasn't finished the get_current_user dependency yet, we'll use a mock
# dependency to allow testing. Mohsin MUST replace this when he wires it up.
async def mock_get_current_user():
    return {"id": "123", "name": "Test User"}

router = APIRouter()

# We will lazy-load the model to prevent massive startup delays
_model = None

def get_model():
    global _model
    if _model is None:
        print("Lazy-loading SentenceTransformer model (BAAI/bge-small-en-v1.5)...")
        _model = SentenceTransformer('BAAI/bge-small-en-v1.5')
    return _model

class SemanticSearchRequest(BaseModel):
    query: str
    limit: int = 5
    concept_tags: Optional[List[str]] = None

class SearchResultChunk(BaseModel):
    content: str
    source_title: str
    distance: float

class SemanticSearchResponse(BaseModel):
    results: List[SearchResultChunk]

@router.post("/semantic-search", response_model=SemanticSearchResponse)
async def semantic_search(
    request: SemanticSearchRequest,
    user: dict = Depends(mock_get_current_user)
):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # 1. Embed the query locally (zero cost, zero latency)
        query_embedding = get_model().encode(request.query)
        embedding_json = json.dumps(query_embedding.tolist())

        # 2. Vector search via pgvector cosine distance operator <->
        pool = await database.pool()
        async with pool.acquire() as conn:
            # Note: $1::vector casts the 384-dimensional JSON array to the vector type
            rows = await conn.fetch(
                """
                SELECT 
                    dc.content,
                    ds.title as source_title,
                    (dc.embedding <-> $1::vector) as distance
                FROM document_chunks dc
                JOIN document_sources ds ON dc.source_id = ds.id
                ORDER BY dc.embedding <-> $1::vector
                LIMIT $2
                """,
                embedding_json, request.limit
            )

            results = [
                SearchResultChunk(
                    content=row["content"],
                    source_title=row["source_title"],
                    distance=row["distance"]
                )
                for row in rows
            ]

            return SemanticSearchResponse(results=results)

    except Exception as e:
        print(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))
