"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend SRS routing.
Talha: Do not modify SRS behavior unless coordinating backend integration.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from backend.core.auth import CurrentUser, get_optional_current_user
from backend.core.database import database
from backend.core.srs import get_due_cards, get_srs_stats, review_cards
from backend.models.schema import (
    SRSReviewItem,
    SRSReviewResponse,
    SRSDueCard,
    SRSStatsResponse,
)

router = APIRouter(tags=["srs"])


@router.get("/srs/due", response_model=list[SRSDueCard])
async def get_srs_due(
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> list[SRSDueCard]:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Supabase authentication is required.")

    pool = await database.pool()
    async with pool.acquire() as connection:
        rows = await get_due_cards(connection, current_user.user_id)

    return [
        SRSDueCard(
            card_id=str(row["card_id"]),
            term_id=row["term_id"],
            term=row["term"],
            phonetic=row["phonetic"],
            definition=row["definition"],
            context_sentences=row["context_sentences"],
            concept_tags=list(row["concept_tags"] or []),
            ease_factor=float(row["ease_factor"]),
            interval_days=row["interval_days"],
            repetitions=row["repetitions"],
            due_at=row["due_at"].isoformat(),
            lapses=row["lapses"],
        )
        for row in rows
    ]


@router.post("/srs/reviews", response_model=SRSReviewResponse)
async def post_srs_reviews(
    payload: list[SRSReviewItem],
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> SRSReviewResponse:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Supabase authentication is required.")
    if not payload:
        return SRSReviewResponse(reviewed=0, results=[])

    pool = await database.pool()
    async with pool.acquire() as connection:
        async with connection.transaction():
            results = await review_cards(
                connection,
                current_user.user_id,
                [item.model_dump() for item in payload],
            )

    return SRSReviewResponse(
        reviewed=len(results),
        results=[
            {
                "card_id": result.card_id,
                "rating": result.rating,
                "interval_before": result.interval_before,
                "interval_after": result.interval_after,
                "due_at": result.due_at.isoformat(),
                "ease_factor": result.ease_factor,
                "repetitions": result.repetitions,
                "lapses": result.lapses,
            }
            for result in results
        ],
    )


@router.get("/srs/stats", response_model=SRSStatsResponse)
async def get_srs_stats_endpoint(
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> SRSStatsResponse:
    if current_user is None:
        raise HTTPException(status_code=401, detail="Supabase authentication is required.")

    pool = await database.pool()
    async with pool.acquire() as connection:
        stats = await get_srs_stats(connection, current_user.user_id)

    return SRSStatsResponse(**stats)
