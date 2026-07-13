import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List

from backend.core.auth import CurrentUser, get_current_user
from backend.core.database import database

router = APIRouter(tags=["users"])

class ProfileRequest(BaseModel):
    display_name: str
    level: str
    goals: List[str]

@router.post("/users/profile")
async def create_profile(
    payload: ProfileRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            await connection.execute(
                """
                INSERT INTO user_profiles (user_id, display_name, level, weakness_tags)
                VALUES ($1, $2, $3, $4::jsonb)
                ON CONFLICT (user_id) DO UPDATE SET
                    display_name = EXCLUDED.display_name,
                    level = EXCLUDED.level,
                    weakness_tags = EXCLUDED.weakness_tags
                """,
                current_user.user_id,
                payload.display_name,
                payload.level,
                json.dumps(payload.goals)
            )
            
            # Seed initial activity days for streak setup
            await connection.execute(
                """
                INSERT INTO activity_days (user_id, day)
                VALUES ($1, current_date)
                ON CONFLICT (user_id, day) DO NOTHING
                """,
                current_user.user_id
            )
            
        return {"status": "success"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {exc}"
        )
