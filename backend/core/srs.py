"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify SRS engine logic.
Talha: Do not modify SRS helpers unless coordinating backend integration.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any


@dataclass(slots=True)
class SRSReviewResult:
    card_id: str
    rating: int
    interval_before: int
    interval_after: int
    due_at: date
    ease_factor: float
    repetitions: int
    lapses: int


def sm2_update(card: dict[str, Any], got_it: bool) -> dict[str, Any]:
    repetitions = int(card["repetitions"])
    interval_days = int(card["interval_days"])
    ease_factor = float(card["ease_factor"])
    lapses = int(card["lapses"])

    if not got_it:
        repetitions = 0
        interval_days = 0
        lapses += 1
        ease_factor = max(1.3, ease_factor - 0.2)
    else:
        repetitions += 1
        if repetitions == 1:
            interval_days = 1
        elif repetitions == 2:
            interval_days = 3
        else:
            interval_days = round(interval_days * ease_factor)
        ease_factor = min(3.0, ease_factor + 0.05)

    due_at = date.today() + timedelta(days=interval_days)
    return {
        "repetitions": repetitions,
        "interval_days": interval_days,
        "ease_factor": ease_factor,
        "lapses": lapses,
        "due_at": due_at,
    }


async def ensure_vocab_terms(connection: Any, terms: list[str]) -> list[dict[str, Any]]:
    unique_terms = [term.strip() for term in terms if term and term.strip()]
    if not unique_terms:
        return []

    rows: list[dict[str, Any]] = []
    for term in unique_terms:
        row = await connection.fetchrow(
            """
            INSERT INTO vocab_terms (term)
            VALUES ($1)
            ON CONFLICT (term) DO UPDATE SET term = EXCLUDED.term
            RETURNING id, term
            """,
            term,
        )
        if row:
            rows.append(dict(row))
    return rows


async def ensure_srs_cards_for_terms(connection: Any, user_id: str, terms: list[str]) -> None:
    vocab_terms = await ensure_vocab_terms(connection, terms)
    for vocab_term in vocab_terms:
        await connection.execute(
            """
            INSERT INTO srs_cards (user_id, term_id, due_at)
            VALUES ($1, $2, CURRENT_DATE)
            ON CONFLICT (user_id, term_id) DO NOTHING
            """,
            user_id,
            vocab_term["id"],
        )


async def get_due_cards(connection: Any, user_id: str) -> list[dict[str, Any]]:
    rows = await connection.fetch(
        """
        SELECT
          sc.id AS card_id,
          sc.term_id,
          sc.ease_factor,
          sc.interval_days,
          sc.repetitions,
          sc.due_at,
          sc.lapses,
          vt.term,
          vt.phonetic,
          vt.definition,
          vt.context_sentences,
          vt.concept_tags
        FROM srs_cards sc
        JOIN vocab_terms vt ON vt.id = sc.term_id
        WHERE sc.user_id = $1 AND sc.due_at <= CURRENT_DATE
        ORDER BY sc.due_at ASC, vt.term ASC
        """,
        user_id,
    )
    return [dict(row) for row in rows]


async def review_cards(connection: Any, user_id: str, reviews: list[dict[str, Any]]) -> list[SRSReviewResult]:
    results: list[SRSReviewResult] = []

    for review in reviews:
        card = await connection.fetchrow(
            """
            SELECT id, ease_factor, interval_days, repetitions, due_at, lapses
            FROM srs_cards
            WHERE id = $1 AND user_id = $2
            FOR UPDATE
            """,
            review["card_id"],
            user_id,
        )
        if not card:
            continue

        got_it = int(review["rating"]) == 1
        before = int(card["interval_days"])
        updated = sm2_update(dict(card), got_it)

        await connection.execute(
            """
            UPDATE srs_cards
            SET ease_factor = $1,
                interval_days = $2,
                repetitions = $3,
                due_at = $4,
                lapses = $5
            WHERE id = $6 AND user_id = $7
            """,
            updated["ease_factor"],
            updated["interval_days"],
            updated["repetitions"],
            updated["due_at"],
            updated["lapses"],
            review["card_id"],
            user_id,
        )
        await connection.execute(
            """
            INSERT INTO srs_reviews (card_id, rating, interval_before, interval_after)
            VALUES ($1, $2, $3, $4)
            """,
            review["card_id"],
            int(review["rating"]),
            before,
            updated["interval_days"],
        )

        results.append(
            SRSReviewResult(
                card_id=str(review["card_id"]),
                rating=int(review["rating"]),
                interval_before=before,
                interval_after=updated["interval_days"],
                due_at=updated["due_at"],
                ease_factor=float(updated["ease_factor"]),
                repetitions=int(updated["repetitions"]),
                lapses=int(updated["lapses"]),
            )
        )

    return results


async def get_srs_stats(connection: Any, user_id: str) -> dict[str, Any]:
    due_count = await connection.fetchval(
        """
        SELECT COUNT(*)
        FROM srs_cards
        WHERE user_id = $1 AND due_at <= CURRENT_DATE
        """,
        user_id,
    )
    total_count = await connection.fetchval(
        """
        SELECT COUNT(*)
        FROM srs_cards
        WHERE user_id = $1
        """,
        user_id,
    )
    next_due = await connection.fetchval(
        """
        SELECT MIN(due_at)
        FROM srs_cards
        WHERE user_id = $1
        """,
        user_id,
    )
    return {
        "due_count": int(due_count or 0),
        "total_count": int(total_count or 0),
        "next_due": next_due.isoformat() if next_due else None,
    }
