"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify stats engine logic.
Talha: Do not modify stats mapping unless coordinating backend integration.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any


EMA_ALPHA = Decimal("0.15")
EMA_BASE = Decimal("0.85")
DEFAULT_STAT_VALUE = Decimal("50")
STAT_AXES = ("writing", "listening", "grammar", "vocabulary", "tone", "fluency")

GRAMMAR_TAGS = {"tense_past_perfect", "conditionals"}
VOCABULARY_TAGS = {"email_structure", "meeting_vocabulary", "negotiation_phrases", "numbers_and_dates"}
TONE_TAGS = {"polite_disagreement", "tone_formality", "closing_language", "small_talk"}
LISTENING_TAGS = {"active_listening_phrases", "clarifying_questions"}


@dataclass(slots=True)
class StatEventResult:
    axis: str
    score: Decimal
    previous_value: Decimal
    next_value: Decimal
    sample_count: int


def _to_decimal(value: Any) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def _concept_axis(concept_tag: str | None) -> str | None:
    if not concept_tag:
        return None
    if concept_tag in GRAMMAR_TAGS:
        return "grammar"
    if concept_tag in VOCABULARY_TAGS:
        return "vocabulary"
    if concept_tag in LISTENING_TAGS:
        return "listening"
    if concept_tag in TONE_TAGS:
        return "tone"
    return None


def _event_score(node_type: str, correct: bool) -> Decimal | None:
    if node_type not in {"mcq", "theory", "targeted_fix"}:
        return None
    return Decimal("100") if correct else Decimal("0")


async def seed_user_stats(connection: Any, user_id: str) -> None:
    for axis in STAT_AXES:
        await connection.execute(
            """
            INSERT INTO user_stats (user_id, axis, value, sample_count)
            VALUES ($1, $2, $3, 0)
            ON CONFLICT (user_id, axis) DO NOTHING
            """,
            user_id,
            axis,
            DEFAULT_STAT_VALUE,
        )


async def record_stat_event(
    connection: Any,
    user_id: str,
    node: Any,
    correct: bool,
) -> StatEventResult | None:
    axis = _concept_axis(node.get("concept_tag"))
    score = _event_score(node.get("node_type", ""), correct)
    if axis is None or score is None:
        return None

    await seed_user_stats(connection, user_id)

    event_id = await connection.fetchval(
        """
        INSERT INTO stat_events (user_id, axis, score, source_node_id, concept_tag)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
        """,
        user_id,
        axis,
        score,
        node.get("id"),
        node.get("concept_tag"),
    )
    if not event_id:
        return None

    previous_row = await connection.fetchrow(
        """
        SELECT value, sample_count
        FROM user_stats
        WHERE user_id = $1 AND axis = $2
        FOR UPDATE
        """,
        user_id,
        axis,
    )
    previous_value = _to_decimal(previous_row["value"] if previous_row else DEFAULT_STAT_VALUE)
    sample_count = int(previous_row["sample_count"] if previous_row else 0)
    next_value = previous_value * EMA_BASE + score * EMA_ALPHA

    await connection.execute(
        """
        INSERT INTO user_stats (user_id, axis, value, sample_count, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, axis) DO UPDATE SET
            value = EXCLUDED.value,
            sample_count = EXCLUDED.sample_count,
            updated_at = NOW()
        """,
        user_id,
        axis,
        next_value,
        sample_count + 1,
    )

    return StatEventResult(
        axis=axis,
        score=score,
        previous_value=previous_value,
        next_value=next_value,
        sample_count=sample_count + 1,
    )


async def record_axis_score(
    connection: Any,
    user_id: str,
    axis: str,
    score: int | float | Decimal,
    source_node_id: Any = None,
    concept_tag: str | None = None,
) -> StatEventResult:
    if axis not in STAT_AXES:
        raise ValueError(f"Unknown axis: {axis}")

    await seed_user_stats(connection, user_id)

    score_decimal = _to_decimal(score)
    await connection.execute(
        """
        INSERT INTO stat_events (user_id, axis, score, source_node_id, concept_tag)
        VALUES ($1, $2, $3, $4, $5)
        """,
        user_id,
        axis,
        score_decimal,
        source_node_id,
        concept_tag,
    )

    previous_row = await connection.fetchrow(
        """
        SELECT value, sample_count
        FROM user_stats
        WHERE user_id = $1 AND axis = $2
        FOR UPDATE
        """,
        user_id,
        axis,
    )
    previous_value = _to_decimal(previous_row["value"] if previous_row else DEFAULT_STAT_VALUE)
    sample_count = int(previous_row["sample_count"] if previous_row else 0)
    next_value = previous_value * EMA_BASE + score_decimal * EMA_ALPHA

    await connection.execute(
        """
        INSERT INTO user_stats (user_id, axis, value, sample_count, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id, axis) DO UPDATE SET
            value = EXCLUDED.value,
            sample_count = EXCLUDED.sample_count,
            updated_at = NOW()
        """,
        user_id,
        axis,
        next_value,
        sample_count + 1,
    )

    return StatEventResult(
        axis=axis,
        score=score_decimal,
        previous_value=previous_value,
        next_value=next_value,
        sample_count=sample_count + 1,
    )


async def get_user_progress(connection: Any, user_id: str) -> dict[str, Any]:
    await seed_user_stats(connection, user_id)

    radar_rows = await connection.fetch(
        """
        SELECT axis, value, sample_count
        FROM user_stats
        WHERE user_id = $1
        ORDER BY axis
        """,
        user_id,
    )
    radar = {
        row["axis"]: {
            "value": float(row["value"]),
            "sample_count": row["sample_count"],
        }
        for row in radar_rows
    }

    activity_rows = await connection.fetch(
        """
        SELECT day, minutes, xp
        FROM activity_days
        WHERE user_id = $1
          AND day >= CURRENT_DATE - INTERVAL '6 days'
        ORDER BY day ASC
        """,
        user_id,
    )
    activity = [
        {
            "day": row["day"].isoformat(),
            "minutes": row["minutes"],
            "xp": row["xp"],
        }
        for row in activity_rows
    ]

    return {"radar": radar, "activity": activity}
