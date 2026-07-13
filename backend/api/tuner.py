"""
@ai-restriction
Primary Owner: Umer
API routes for the RAG Tuner GUI.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
import json
from backend.core.database import database

router = APIRouter()

class RagEvaluation(BaseModel):
    id: int
    question: str
    expected_lesson: str
    retrieved_chunks: List[Any]
    is_correct: Optional[bool]
    comment: Optional[str]

class EvaluateRequest(BaseModel):
    is_correct: bool
    comment: Optional[str] = None
    retrieved_chunks: List[Any]

@router.get("/questions/next", response_model=Optional[RagEvaluation])
async def get_next_question():
    """Fetches the next unevaluated question from the DB."""
    pool = await database.pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT id, question, expected_lesson, retrieved_chunks, is_correct, comment
            FROM rag_evaluations
            WHERE is_correct IS NULL
            ORDER BY id ASC
            LIMIT 1
        """)
        
        if not row:
            return None
            
        return RagEvaluation(
            id=row["id"],
            question=row["question"],
            expected_lesson=row["expected_lesson"],
            retrieved_chunks=json.loads(row["retrieved_chunks"]),
            is_correct=row["is_correct"],
            comment=row["comment"]
        )

@router.post("/evaluate/{eval_id}")
async def submit_evaluation(eval_id: int, request: EvaluateRequest):
    """Saves the human evaluation for a question."""
    pool = await database.pool()
    async with pool.acquire() as conn:
        result = await conn.execute("""
            UPDATE rag_evaluations
            SET is_correct = $1, comment = $2, retrieved_chunks = $3::jsonb
            WHERE id = $4
        """, request.is_correct, request.comment, json.dumps(request.retrieved_chunks), eval_id)
        
        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="Evaluation not found")
            
    return {"status": "success"}
