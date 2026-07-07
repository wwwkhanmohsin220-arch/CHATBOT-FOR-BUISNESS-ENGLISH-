"""
@ai-restriction
Primary Owner: Talha
Umer: Do not modify backend API logic.
Mohsin: Do not modify REST routing unless requested by Talha. Focus on websockets.py instead.
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/curriculum")
def get_curriculum():
    return {"message": "Curriculum data will go here."}
