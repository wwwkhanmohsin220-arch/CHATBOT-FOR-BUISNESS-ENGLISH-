"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend ops routing.
Talha: Do not modify ops behavior unless coordinating backend integration.
"""

import os

from fastapi import APIRouter

router = APIRouter(tags=["ops"])


@router.get("/health")
async def health_check():
    return {
        "ok": True,
        "active_compiles": 0,
        "groq_reachable": bool(os.getenv("GROQ_API_KEY")),
    }
