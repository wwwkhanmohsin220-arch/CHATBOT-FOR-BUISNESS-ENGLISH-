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
from backend.models.auth_store import AuthStore
from backend.models.schema import (
    AuthResponse,
    AuthSyncResponse,
    LoginRequest,
    SignupRequest,
    UserProfileSchema,
    UserSchema,
)

auth_router = APIRouter(prefix="/auth", tags=["auth"])
auth_store = AuthStore()


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        100_000,
    ).hex()
    return password_hash, password_salt


def _verify_password(password: str, password_hash: str, salt: str) -> bool:
    candidate_hash, _ = _hash_password(password, salt)
    return secrets.compare_digest(candidate_hash, password_hash)


def _build_auth_response(user_record: dict[str, str]) -> AuthResponse:
    return AuthResponse(
        user=UserSchema(
            id=user_record["id"],
            username=user_record["username"],
            email=user_record["email"],
            session_id=user_record["session_id"],
        ),
        access_token=secrets.token_urlsafe(32),
    )


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


@auth_router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest) -> AuthResponse:
    email = payload.email.lower()
    username = payload.username.strip()

    if "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A valid email address is required.",
        )

    if await auth_store.get_user_by_email(email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    if await auth_store.get_user_by_username(username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this username already exists.",
        )

    password_hash, salt = _hash_password(payload.password)
    user_record = {
        "id": str(uuid.uuid4()),
        "session_id": str(uuid.uuid4()),
        "username": username,
        "email": email,
        "password_hash": password_hash,
        "salt": salt,
    }
    await auth_store.create_user(user_record)

    return _build_auth_response(user_record)


@auth_router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest) -> AuthResponse:
    email = payload.email.lower()
    user_record = await auth_store.get_user_by_email(email)

    if not user_record or not _verify_password(
        payload.password,
        user_record["password_hash"],
        user_record["salt"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return _build_auth_response(user_record)


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
