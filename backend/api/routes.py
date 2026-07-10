"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend API logic.
Talha: Do not modify REST routing unless requested by Mohsin. Focus on voice QA/deployment.

Note: This file contains the Phase 1 MOCK runtime for frontend prototyping.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional

try:
    from backend.api.auth import auth_router
except ImportError:
    auth_router = None

router = APIRouter(prefix="/api")
if auth_router:
    router.include_router(auth_router)

# MOCK IN-MEMORY DATABASE FOR PHASE 1 SKELETON PROTOTYPING
MOCK_DB = {
    "instances": {
        "test": {
            "current_cursor": 0,
            "nodes": [
                {
                    "node_id": "node_1",
                    "type": "theory",
                    "concept_tag": "tone_formality",
                    "content": {
                        "text": "When speaking with a new client, it's safer to use polite phrasing like 'I would like to' rather than 'I want to'.",
                        "example": "I would like to discuss our proposal."
                    }
                },
                {
                    "node_id": "node_2",
                    "type": "mcq",
                    "concept_tag": "tone_formality",
                    "content": {
                        "question": "Which of these is the most appropriate way to ask for a meeting with a new client?",
                        "options": [
                            "I want a meeting with you.",
                            "I would like to schedule a meeting.",
                            "Let's meet."
                        ],
                        "correct_index": 1,
                        "explanations": [
                            "'I want' sounds demanding.",
                            "Correct! 'I would like' is polite and professional.",
                            "'Let's meet' is too informal for a first impression."
                        ]
                    }
                }
            ]
        }
    }
}

class AttemptIn(BaseModel):
    answer_index: Optional[int] = None
    read_ack: Optional[bool] = None

@router.get("/curriculum")
def get_curriculum():
    return {
        "units": [
            {
                "id": "u1",
                "title": "Business Greetings",
                "lessons": [{"id": "test", "title": "Mock Lesson (Click to test UI)"}],
            }
        ]
    }

@router.get("/lesson-instances/{instance_id}/nodes/current")
def get_current_node(instance_id: str):
    instance = MOCK_DB["instances"].get(instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    cursor = int(instance["current_cursor"])
    
    if cursor >= len(instance["nodes"]):
        return {"status": "completed"}
        
    node = instance["nodes"][cursor]
    
    # Strip answers from the payload before sending to frontend
    safe_content = dict(node["content"])
    if "correct_index" in safe_content:
        del safe_content["correct_index"]
    if "explanations" in safe_content:
        del safe_content["explanations"]
        
    return {
        "node_id": node["node_id"],
        "type": node["type"],
        "concept_tag": node["concept_tag"],
        "content": safe_content
    }

@router.post("/lesson-instances/{instance_id}/nodes/{node_id}/attempt")
def submit_attempt(instance_id: str, node_id: str, payload: AttemptIn):
    instance = MOCK_DB["instances"].get(instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")
        
    cursor = int(instance["current_cursor"])
    if cursor >= len(instance["nodes"]):
        raise HTTPException(status_code=400, detail="Lesson already completed")
        
    current_node = instance["nodes"][cursor]
    if current_node["node_id"] != node_id:
        raise HTTPException(status_code=400, detail="Node ID mismatch")

    # Evaluate attempt
    correct = False
    explanation = None
    
    if current_node["type"] == "theory":
        correct = True
    elif current_node["type"] == "mcq":
        correct_index = current_node["content"]["correct_index"]
        if payload.answer_index == correct_index:
            correct = True
        if payload.answer_index is not None and payload.answer_index < len(current_node["content"]["explanations"]):
            explanation = current_node["content"]["explanations"][payload.answer_index]
            
    # Advance cursor if correct
    if correct:
        instance["current_cursor"] += 1
        
    return {
        "correct": correct,
        "explanation": explanation,
        "advance_to": instance["current_cursor"]
    }
