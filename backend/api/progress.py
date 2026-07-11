"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify progress routing.
Talha: Do not modify progress payloads unless coordinating backend integration.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from backend.core.auth import CurrentUser, get_optional_current_user
from backend.core.database import database
from backend.core.stats import get_user_progress

router = APIRouter(tags=["progress"])


@router.get("/progress")
async def get_progress(
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    pool = await database.pool()
    async with pool.acquire() as connection:
        user_id = current_user.user_id if current_user else "00000000-0000-0000-0000-000000000001"
        return await get_user_progress(connection, user_id)
