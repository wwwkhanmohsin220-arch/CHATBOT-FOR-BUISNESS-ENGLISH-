"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend auth verification logic.
Talha: Do not modify JWT verification unless coordinating backend integration.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from dataclasses import dataclass
from typing import Any

from fastapi import Header, HTTPException, status


@dataclass(slots=True)
class CurrentUser:
    user_id: str
    email: str | None = None
    display_name: str | None = None
    claims: dict[str, Any] | None = None


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header.",
        )
    return token.strip()


def verify_supabase_jwt(token: str) -> dict[str, Any]:
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_JWT_SECRET is not configured.",
        )

    try:
        header_part, payload_part, signature_part = token.split(".")
        header = json.loads(_base64url_decode(header_part))
        payload = json.loads(_base64url_decode(payload_part))
        signature = _base64url_decode(signature_part)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed Supabase JWT.",
        ) from exc

    if header.get("alg") != "HS256":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unsupported JWT algorithm.",
        )

    signing_input = f"{header_part}.{payload_part}".encode("utf-8")
    expected_signature = hmac.new(
        secret.encode("utf-8"),
        signing_input,
        hashlib.sha256,
    ).digest()

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Supabase JWT signature.",
        )

    now = int(time.time())
    exp = payload.get("exp")
    if exp is not None and now >= int(exp):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase JWT has expired.",
        )

    audience = os.getenv("SUPABASE_JWT_AUD")
    if audience:
        token_audience = payload.get("aud")
        if isinstance(token_audience, list):
            audience_ok = audience in token_audience
        else:
            audience_ok = token_audience == audience
        if not audience_ok:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supabase JWT audience mismatch.",
            )

    issuer = os.getenv("SUPABASE_JWT_ISSUER")
    if issuer and payload.get("iss") != issuer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase JWT issuer mismatch.",
        )

    return payload


import httpx
import time
import asyncio

# Cache valid tokens for 5 minutes to avoid redundant network calls to Supabase Auth.
_TOKEN_CACHE: dict[str, tuple[float, CurrentUser]] = {}
_TOKEN_LOCKS: dict[str, asyncio.Lock] = {}
_CACHE_TTL = 300  # 5 minutes

async def verify_supabase_jwt_async(token: str) -> CurrentUser:
    now = time.time()
    
    # Check cache
    if token in _TOKEN_CACHE:
        timestamp, user = _TOKEN_CACHE[token]
        if now - timestamp < _CACHE_TTL:
            return user
        else:
            del _TOKEN_CACHE[token]

    if token not in _TOKEN_LOCKS:
        _TOKEN_LOCKS[token] = asyncio.Lock()
        
    async with _TOKEN_LOCKS[token]:
        # Check cache again inside lock
        if token in _TOKEN_CACHE:
            timestamp, user = _TOKEN_CACHE[token]
            if now - timestamp < _CACHE_TTL:
                return user

        supabase_url = os.getenv("SUPABASE_URL")
        anon_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not supabase_url or not anon_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="SUPABASE_URL or SUPABASE_ANON_KEY is not configured.",
            )
            
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "apikey": anon_key,
                    "Authorization": f"Bearer {token}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Supabase access token.",
                )
                
            user_data = response.json()
            
            user_metadata = user_data.get("user_metadata", {})
            app_metadata = user_data.get("app_metadata", {})
            display_name = (
                user_metadata.get("full_name")
                or user_metadata.get("name")
                or user_metadata.get("username")
                or app_metadata.get("provider")
                or (user_data.get("email") or "").split("@")[0]
                or None
            )
            
            current_user = CurrentUser(
                user_id=user_data["id"],
                email=user_data.get("email"),
                display_name=display_name,
                claims=user_data,
            )
            
            _TOKEN_CACHE[token] = (now, current_user)
            return current_user


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Supabase access token.",
        )

    return await verify_supabase_jwt_async(token)


async def get_optional_current_user(
    authorization: str | None = Header(default=None),
) -> CurrentUser | None:
    token = _extract_bearer_token(authorization)
    if not token:
        return None
        
    try:
        return await verify_supabase_jwt_async(token)
    except HTTPException:
        return None
