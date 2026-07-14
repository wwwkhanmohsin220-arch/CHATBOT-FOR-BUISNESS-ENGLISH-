"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend auth API logic.
Talha: Do not modify auth routes unless requested by Mohsin.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status

from backend.core.auth import CurrentUser, get_current_user
from backend.core.database import DatabaseNotConfigured, database
from backend.core.stats import seed_user_stats
from backend.models.schema import (
    AuthSyncResponse,
    UserProfileSchema,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])


def _db_error(exc: Exception) -> HTTPException:
    if isinstance(exc, DatabaseNotConfigured):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL is not configured. Connect Supabase Postgres first.",
        )
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=f"Database runtime is unavailable: {exc}",
    )





@auth_router.post("/sync", response_model=AuthSyncResponse)
async def sync_auth_user(current_user: CurrentUser = Depends(get_current_user)) -> AuthSyncResponse:
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            profile = await connection.fetchrow(
                """
                INSERT INTO user_profiles (
                    user_id,
                    display_name,
                    level,
                    coach_voice,
                    timezone,
                    daily_goal_min
                )
                VALUES ($1, $2, 'beginner', 'balanced', 'UTC', 20)
                ON CONFLICT (user_id) DO UPDATE SET
                    display_name = COALESCE(EXCLUDED.display_name, user_profiles.display_name)
                RETURNING
                    user_id,
                    display_name,
                    level,
                    coach_voice,
                    timezone,
                    daily_goal_min,
                    weakness_tags,
                    strength_tags
                """,
                current_user.user_id,
                current_user.display_name,
                )
            await seed_user_stats(connection, current_user.user_id)
    except Exception as exc:
        raise _db_error(exc) from exc

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not sync Supabase user profile.",
        )

    return AuthSyncResponse(
        synced=True,
        profile=UserProfileSchema(
            user_id=str(profile["user_id"]),
            display_name=profile["display_name"],
            level=profile["level"],
            coach_voice=profile["coach_voice"],
            timezone=profile["timezone"],
            daily_goal_min=profile["daily_goal_min"],
            weakness_tags=list(profile["weakness_tags"] or []),
            strength_tags=list(profile["strength_tags"] or []),
        ),
    )
