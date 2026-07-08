"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend API logic.
Talha: Do not modify REST routing unless requested by Mohsin. Focus on voice QA/deployment.
"""

from fastapi import APIRouter

from backend.api.auth import auth_router
from backend.models.schema import CurriculumResponse

router = APIRouter(prefix="/api")
router.include_router(auth_router)


@router.get("/curriculum", response_model=CurriculumResponse)
def get_curriculum() -> CurriculumResponse:
    return CurriculumResponse(
        units=[
            {
                "id": "u1",
                "title": "Business Greetings",
                "lessons": [],
            }
        ]
    )
