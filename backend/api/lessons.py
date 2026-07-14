"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend lesson runtime logic.
Talha: Do not modify lesson routing unless coordinating backend integration.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel

from backend.core.auth import CurrentUser, get_optional_current_user
from backend.core.database import DatabaseNotConfigured, database
from backend.core.jobs import compile_lesson_background
from backend.core.stats import record_axis_score, record_stat_event
from backend.core.srs import ensure_srs_cards_for_terms
from backend.core.writing import grade_writing_draft
from backend.models.schema import WritingSubmitRequest, WritingSubmitResponse

router = APIRouter(tags=["lessons"])

CURRICULUM_PATH = Path(__file__).resolve().parents[1] / "app" / "content" / "curriculum.json"
DEMO_USER_ID = os.getenv("BUSLINGO_DEMO_USER_ID", "00000000-0000-0000-0000-000000000001")
COMPILE_VERSION = "fixture_v1"


class AttemptIn(BaseModel):
    answer_index: Optional[int] = None
    read_ack: Optional[bool] = None

class QnARequest(BaseModel):
    question: str
    chat_history: Optional[list[dict[str, str]]] = None


@dataclass(slots=True)
class LessonInstanceContext:
    user_id: str
    instance_id: str
    instance_row: Any


def _writing_score_axis(rubric: Any) -> tuple[int, int, int]:
    writing_score = round(((rubric.clarity.score + rubric.structure.score) / 2) * 10)
    tone_score = rubric.tone.score * 10
    grammar_score = 100 if not rubric.detected_concept_errors else 0
    return writing_score, tone_score, grammar_score


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


def _to_decimal(value: Any) -> Decimal:
    if isinstance(value, Decimal):
        return value
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def _decimal_to_float(value: Any) -> float:
    return float(_to_decimal(value))


def _json_object(value: Any) -> dict[str, Any]:
    if isinstance(value, str):
        return json.loads(value)
    return dict(value)


def _safe_node(row: Any) -> dict[str, Any]:
    content = _json_object(row["content"])
    content.pop("correct_index", None)
    content.pop("explanations", None)

    return {
        "node_id": str(row["id"]),
        "type": row["node_type"],
        "concept_tag": row["concept_tag"],
        "content": content,
    }


async def _award_completion_xp(connection: Any, user_id: str, instance_id: str, final_score: int | None = None) -> None:
    base_xp = 10
    bonus_xp = int((final_score or 0) / 2)
    total_xp = base_xp + bonus_xp
    
    await connection.execute(
        """
        INSERT INTO xp_events (user_id, amount, reason, idempotency_key)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (idempotency_key) DO NOTHING
        """,
        user_id,
        total_xp,
        "lesson completion",
        f"xp:lesson:{instance_id}",
    )


async def _log_activity_day(connection: Any, user_id: str, minutes: int = 15) -> None:
    from datetime import datetime
    try:
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
    except ImportError:
        from backports.zoneinfo import ZoneInfo, ZoneInfoNotFoundError

    profile = await connection.fetchrow("SELECT timezone FROM user_profiles WHERE user_id = $1", user_id)
    tz_str = profile["timezone"] if profile and profile["timezone"] else "UTC"
    
    try:
        tz = ZoneInfo(tz_str)
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
        
    today = datetime.now(tz).date()
    
    await connection.execute(
        """
        INSERT INTO activity_days (user_id, day, minutes, xp)
        VALUES ($1, $2, $3, 0)
        ON CONFLICT (user_id, day) DO UPDATE SET
            minutes = activity_days.minutes + EXCLUDED.minutes
        """,
        user_id,
        today,
        minutes,
    )


async def _seed_srs_cards_for_slot(connection: Any, user_id: str, slot_key: str) -> None:
    curriculum = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))
    for unit in curriculum["units"]:
        for slot in unit["slots"]:
            if slot["slot_key"] == slot_key:
                await ensure_srs_cards_for_terms(connection, user_id, slot.get("key_vocabulary", []))
                return


async def _seed_srs_in_background(user_id: str, slot_key: str) -> None:
    """Fire-and-forget SRS seeding with its own DB connection so it doesn't
    block the attempt transaction response."""
    try:
        pool = await database.pool()
        async with pool.acquire() as conn:
            await _seed_srs_cards_for_slot(conn, user_id, slot_key)
    except Exception as exc:
        import logging
        logging.warning(f"Background SRS seeding failed for {slot_key}: {exc}")


def _fixture_bundle(slot: dict[str, Any]) -> dict[str, Any]:
    concept_tag = slot["concept_tags"][0]
    return {
        "title": "Business Greetings",
        "spine": [
            {
                "node_type": "theory",
                "concept_tag": "tone_formality",
                "content": {
                    "text": (
                        "When speaking with a new client, it is safer to use polite phrasing "
                        "like 'I would like to' rather than 'I want to'."
                    ),
                    "example": "I would like to discuss our proposal.",
                },
            },
            {
                "node_type": "mcq",
                "concept_tag": concept_tag,
                "content": {
                    "question": "Which of these is the most appropriate way to ask for a meeting with a new client?",
                    "options": [
                        "I want a meeting with you.",
                        "I would like to schedule a meeting.",
                        "Let's meet.",
                    ],
                    "correct_index": 1,
                    "explanations": {
                        "0": "'I want' sounds demanding.",
                        "1": "Correct. 'I would like' is polite and professional.",
                        "2": "'Let's meet' is too informal for a first impression.",
                    },
                },
            },
            {
                "node_type": "voice",
                "concept_tag": "small_talk",
                "content": {
                    "scenario": "You are meeting a new client for the first time.",
                    "ai_persona": "A polite client who wants to understand your role.",
                    "objectives": slot["objectives"],
                    "opening_line": "Nice to meet you. Could you briefly introduce your role?",
                },
            },
        ],
        "branches": {
            concept_tag: {
                "content": {
                    "text": "Quick Fix: Use softer, more professional phrasing when you make requests.",
                    "micro_theory": "A polite request often starts with 'I would like to...' or 'Could we...?'",
                    "drill_mcq": {
                        "question": "Which phrase sounds most professional?",
                        "options": ["I want your time.", "Meet me.", "Could we schedule a short meeting?"],
                        "correct_index": 2,
                        "explanations": {
                            "0": "'I want' can sound too direct.",
                            "1": "'Meet me' sounds like an order.",
                            "2": "Correct. This is polite and specific.",
                        },
                    },
                }
            }
        },
    }


async def _hydrate_fixture_instance(connection: Any, *, user_id: str, slot_row: Any, slot: dict[str, Any]) -> str:
    existing = await connection.fetchrow(
        """
        SELECT id
        FROM lesson_instances
        WHERE user_id = $1 AND lesson_slot_id = $2
        """,
        user_id,
        slot_row["id"],
    )

    bundle = _fixture_bundle(slot)
    profile_snapshot = json.dumps({"level": "beginner", "source": "fixture"})

    if existing:
        instance_id = str(existing["id"])
        await connection.execute("DELETE FROM lesson_nodes WHERE lesson_instance_id = $1::uuid", instance_id)
        await connection.execute("DELETE FROM lesson_branches WHERE lesson_instance_id = $1::uuid", instance_id)
        await connection.execute(
            """
            UPDATE lesson_instances
            SET title = $2,
                status = 'ready',
                current_node_index = 0,
                compile_version = $3,
                profile_snapshot = $4::jsonb,
                completed_at = NULL,
                started_at = NULL
            WHERE id = $1::uuid
            """,
            instance_id,
            bundle["title"],
            COMPILE_VERSION,
            profile_snapshot,
        )
    else:
        instance_id = await connection.fetchval(
            """
            INSERT INTO lesson_instances
              (user_id, lesson_slot_id, title, status, current_node_index, compile_version, profile_snapshot)
            VALUES ($1, $2, $3, 'ready', 0, $4, $5::jsonb)
            RETURNING id
            """,
            user_id,
            slot_row["id"],
            bundle["title"],
            COMPILE_VERSION,
            profile_snapshot,
        )

    for index, node in enumerate(bundle["spine"]):
        await connection.execute(
            """
            INSERT INTO lesson_nodes
              (lesson_instance_id, position, node_type, concept_tag, content)
            VALUES ($1, $2, $3, $4, $5::jsonb)
            """,
            instance_id,
            index,
            node["node_type"],
            node["concept_tag"],
            json.dumps(node["content"]),
        )

    for concept_tag, branch in bundle["branches"].items():
        await connection.execute(
            """
            INSERT INTO lesson_branches (lesson_instance_id, concept_tag, content)
            VALUES ($1, $2, $3::jsonb)
            ON CONFLICT (lesson_instance_id, concept_tag) DO NOTHING
            """,
            instance_id,
            concept_tag,
            json.dumps(branch["content"]),
        )

    return str(instance_id)




async def _ensure_curriculum_seeded(connection: Any) -> None:
    existing_units = await connection.fetchval("SELECT COUNT(*) FROM units")
    if existing_units and int(existing_units) > 0:
        return

    curriculum = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))
    for unit in curriculum.get("units", []):
        unit_id = await connection.fetchval(
            """
            INSERT INTO units (position, title)
            VALUES ($1, $2)
            ON CONFLICT (position) DO UPDATE
            SET title = EXCLUDED.title
            RETURNING id
            """,
            unit["position"],
            unit["title"],
        )

        for slot in unit.get("slots", []):
            await connection.execute(
                """
                INSERT INTO lesson_slots (unit_id, position, slot_key)
                VALUES ($1, $2, $3)
                ON CONFLICT (slot_key) DO UPDATE
                SET unit_id = EXCLUDED.unit_id,
                    position = EXCLUDED.position
                """,
                unit_id,
                slot["position"],
                slot["slot_key"],
            )



async def get_db_user_instance(
    connection: Any,
    instance_id: str,
    current_user: CurrentUser | None = None,
    background_tasks: BackgroundTasks | None = None,
) -> LessonInstanceContext:
    user_id = current_user.user_id if current_user else DEMO_USER_ID
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Supabase authentication is required for lesson instances.",
        )

    # Check if this looks like a slot_key rather than a UUID
    import re
    is_uuid = bool(re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', instance_id, re.I))

    if not is_uuid:
        # Treat as slot_key - find or create a lesson instance for this user+slot
        slot_row = await connection.fetchrow(
            "SELECT id FROM lesson_slots WHERE slot_key = $1",
            instance_id,
        )
        if not slot_row:
            raise HTTPException(status_code=404, detail=f"Lesson slot '{instance_id}' not found.")

        existing = await connection.fetchrow(
            "SELECT id, status, current_node_index FROM lesson_instances WHERE user_id = $1::uuid AND lesson_slot_id = $2",
            user_id,
            slot_row["id"],
        )
        if existing:
            if existing["status"] == "compiling":
                node_count = await connection.fetchval(
                    "SELECT COUNT(*) FROM lesson_nodes WHERE lesson_instance_id = $1::uuid",
                    existing["id"],
                )
                if node_count and int(node_count) > 0:
                    await connection.execute(
                        "UPDATE lesson_instances SET status = 'ready' WHERE id = $1::uuid",
                        existing["id"],
                    )
                    existing = await connection.fetchrow(
                        "SELECT id, status, current_node_index FROM lesson_instances WHERE id = $1::uuid",
                        existing["id"],
                    )
            resolved_id = str(existing["id"])
            instance = existing
        else:
            resolved_id = await connection.fetchval(
                """
                INSERT INTO lesson_instances
                  (user_id, lesson_slot_id, title, status, current_node_index, compile_version, profile_snapshot)
                VALUES ($1, $2, 'Generating...', 'compiling', 0, 'v2', '{}'::jsonb)
                RETURNING id
                """,
                user_id,
                slot_row["id"]
            )
            if background_tasks:
                from backend.app.ai.compiler import compile_lesson
                background_tasks.add_task(
                    compile_lesson,
                    user_id=user_id,
                    slot_key=instance_id,
                    instance_id=str(resolved_id),
                )

    else:
        resolved_id = instance_id

    instance = await connection.fetchrow(
        """
        SELECT id, user_id, status, current_node_index
        FROM lesson_instances
        WHERE id = $1::uuid
        """,
        resolved_id,
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    if current_user and str(instance["user_id"]) != current_user.user_id:
        raise HTTPException(status_code=403, detail="This lesson instance does not belong to the current user.")

    return LessonInstanceContext(user_id=user_id, instance_id=str(resolved_id), instance_row=instance)


@router.post("/lessons/{slot_id}/start", status_code=202)
async def start_lesson(
    slot_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    user_id = current_user.user_id if current_user else DEMO_USER_ID
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            ls = await connection.fetchrow("SELECT id FROM lesson_slots WHERE slot_key = $1", slot_id)
            if not ls:
                raise HTTPException(status_code=404, detail="Slot not found")
                
            existing = await connection.fetchrow(
                "SELECT id, status FROM lesson_instances WHERE user_id = $1 AND lesson_slot_id = $2",
                user_id, ls["id"]
            )
            
            if existing:
                if existing["status"] in ("compiling", "ready", "in_progress", "completed"):
                    status_value = existing["status"]
                    if status_value == "compiling":
                        node_count = await connection.fetchval(
                            "SELECT COUNT(*) FROM lesson_nodes WHERE lesson_instance_id = $1::uuid",
                            existing["id"],
                        )
                        if node_count and int(node_count) > 0:
                            await connection.execute(
                                "UPDATE lesson_instances SET status = 'ready' WHERE id = $1::uuid",
                                existing["id"],
                            )
                            status_value = "ready"
                    if status_value == "ready":
                        await connection.execute("UPDATE lesson_instances SET status = 'in_progress' WHERE id = $1", existing["id"])
                        return {"instance_id": str(existing["id"]), "status": "in_progress"}
                    return {"instance_id": str(existing["id"]), "status": status_value}

            slot = await connection.fetchrow(
                """
                SELECT slot_key
                FROM lesson_slots
                WHERE id = $1
                """,
                ls["id"],
            )
            if not slot:
                raise HTTPException(status_code=404, detail="Slot not found")

            resolved_id = await _hydrate_fixture_instance(
                connection,
                user_id=user_id,
                slot_row=ls,
                slot={
                    "slot_key": slot["slot_key"],
                    "objectives": [
                        "Understand introduction to communication",
                        "Apply professional communication techniques",
                    ],
                    "concept_tags": ["polite_disagreement"],
                    "key_vocabulary": ["communication", "professional", "strategy", "structure"],
                    "grammar_points": ["Present simple for general truths"],
                    "example_phrases": ["Let's discuss introduction to communication in detail."],
                },
            )

            return {"instance_id": str(resolved_id), "status": "ready"}
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc

@router.get("/curriculum")
async def get_curriculum(current_user: CurrentUser | None = Depends(get_optional_current_user)):
    user_id = current_user.user_id if current_user else DEMO_USER_ID
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            await _ensure_curriculum_seeded(connection)
            rows = await connection.fetch(
                """
                SELECT
                  u.id AS unit_id,
                  u.title AS unit_title,
                  ls.slot_key,
                  ls.position AS lesson_position,
                  li.status,
                  li.current_node_index,
                  li.coach_summary,
                  li.id AS instance_id
                FROM units u
                LEFT JOIN lesson_slots ls ON ls.unit_id = u.id
                LEFT JOIN lesson_instances li ON li.lesson_slot_id = ls.id AND li.user_id = $1
                ORDER BY u.position, ls.position
                """,
                user_id
            )
    except Exception as exc:
        raise _db_error(exc) from exc

    import json
    from pathlib import Path
    curr_path = Path(__file__).parent.parent / "app" / "content" / "curriculum.json"
    curr_data = json.loads(curr_path.read_text(encoding="utf-8"))

    units_by_id: dict[int, dict[str, Any]] = {}
    for row in rows:
        unit = units_by_id.setdefault(
            row["unit_id"],
            {
                "id": f"u{row['unit_id']}",
                "title": row["unit_title"],
                "lessons": [],
            },
        )
        if row["slot_key"]:
            real_title = f"Lesson {row['lesson_position']}"
            for c_unit in curr_data.get("units", []):
                for c_slot in c_unit.get("slots", []):
                    if c_slot.get("slot_key") == row["slot_key"]:
                        if c_slot.get("concept_tags"):
                            tag = c_slot["concept_tags"][0].replace("_", " ").title()
                            real_title += f": {tag}"
                        break
            
            # Extract final_score from coach_summary if available
            final_score = None
            if row["coach_summary"]:
                try:
                    summary_data = json.loads(row["coach_summary"])
                    if "final_score" in summary_data:
                        final_score = summary_data["final_score"]
                except:
                    pass
            
            unit["lessons"].append(
                {
                    "id": row["slot_key"],
                    "instance_id": str(row["instance_id"]) if row["instance_id"] else None,
                    "title": real_title,
                    "status": row["status"] or "available",
                    "current_node_index": float(row["current_node_index"] or 0),
                    "final_score": final_score
                }
            )

    return {"units": list(units_by_id.values())}


@router.get("/lesson-instances/{instance_id}/nodes/current")
async def get_current_node(
    instance_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user, background_tasks)
            instance = context.instance_row
            if instance["status"] == "completed":
                return {"status": "already_completed"}
            if instance["status"] == "compiling":
                node_count = await connection.fetchval(
                    "SELECT COUNT(*) FROM lesson_nodes WHERE lesson_instance_id = $1::uuid",
                    context.instance_id,
                )
                if node_count and int(node_count) > 0:
                    await connection.execute(
                        "UPDATE lesson_instances SET status = 'ready' WHERE id = $1::uuid",
                        context.instance_id,
                    )
                    context.instance_row = await connection.fetchrow(
                        """
                        SELECT id, user_id, status, current_node_index
                        FROM lesson_instances
                        WHERE id = $1::uuid
                        """,
                        context.instance_id,
                    )
                    instance = context.instance_row
                if instance["status"] == "compiling":
                    return {"status": "compiling"}

            node = await connection.fetchrow(
                """
                SELECT id, node_type, concept_tag, content, position
                FROM lesson_nodes
                WHERE lesson_instance_id = $1::uuid
                  AND status = 'pending'
                  AND position >= $2
                ORDER BY position ASC
                LIMIT 1
                """,
                context.instance_id,
                instance["current_node_index"],
            )
            if not node:
                return {"status": "completed"}

            return _safe_node(node)
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/nodes/{node_id}/attempt")
async def submit_attempt(
    instance_id: str,
    node_id: str,
    payload: AttemptIn,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                context = await get_db_user_instance(connection, instance_id, current_user)
                instance = context.instance_row
                if instance["status"] == "completed":
                    raise HTTPException(status_code=400, detail="Lesson already completed")

                node = await connection.fetchrow(
                    """
                    SELECT id, node_type, concept_tag, content, position
                    FROM lesson_nodes
                    WHERE id = $1 AND lesson_instance_id = $2
                    FOR UPDATE
                    """,
                    node_id,
                    context.instance_id,
                )
                if not node:
                    raise HTTPException(status_code=404, detail="Node not found")
                if _to_decimal(node["position"]) != _to_decimal(instance["current_node_index"]):
                    raise HTTPException(status_code=400, detail="Node ID mismatch")

                content = _json_object(node["content"])
                correct = False
                explanation = None
                injected_node = None

                if node["node_type"] == "theory":
                    correct = bool(payload.read_ack is not False)
                elif node["node_type"] == "targeted_fix":
                    drill = content.get("drill_mcq")
                    if drill and payload.answer_index is not None:
                        correct_index = drill.get("correct_index")
                        correct = payload.answer_index == correct_index
                        explanations = drill.get("explanations", {})
                        explanation = explanations.get(str(payload.answer_index))
                    else:
                        correct = bool(payload.read_ack is not False)
                elif node["node_type"] == "mcq":
                    correct_index = content.get("correct_index")
                    correct = payload.answer_index == correct_index
                    explanations = content.get("explanations", {})
                    if payload.answer_index is not None:
                        explanation = explanations.get(str(payload.answer_index))
                elif node["node_type"] in {"voice", "writing"}:
                    correct = True

                attempt_no = await connection.fetchval(
                    "SELECT COUNT(*) + 1 FROM node_attempts WHERE node_id = $1",
                    node["id"],
                )
                inserted_attempt_id = await connection.fetchval(
                    """
                    INSERT INTO node_attempts (node_id, user_id, attempt_no, payload, result)
                    VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
                    ON CONFLICT (node_id, attempt_no) DO NOTHING
                    RETURNING id
                    """,
                    node["id"],
                    instance["user_id"],
                    attempt_no,
                    json.dumps(payload.model_dump(exclude_none=True)),
                    json.dumps({"correct": correct, "explanation": explanation}),
                )

                if inserted_attempt_id:
                    await record_stat_event(
                        connection,
                        instance["user_id"],
                        node,
                        correct,
                    )

                if correct:
                    await connection.execute(
                        "UPDATE lesson_nodes SET status = 'completed' WHERE id = $1",
                        node["id"],
                    )
                    next_position = await connection.fetchval(
                        """
                        SELECT position
                        FROM lesson_nodes
                        WHERE lesson_instance_id = $1 AND status = 'pending' AND position > $2
                        ORDER BY position ASC
                        LIMIT 1
                        """,
                        context.instance_id,
                        node["position"],
                    )
                    if next_position is None:
                        slot_key = await connection.fetchval(
                            """
                            SELECT ls.slot_key
                            FROM lesson_instances li
                            JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                            WHERE li.id = $1
                            """,
                            context.instance_id,
                        )
                        await connection.execute(
                            """
                            UPDATE lesson_instances
                            SET current_node_index = $2
                            WHERE id = $1 AND status <> 'completed'
                            """,
                            context.instance_id,
                            _to_decimal(node["position"]) + Decimal("1"),
                        )
                        # 1. Fetch current slot info
                        curr_slot = await connection.fetchrow(
                            """
                            SELECT u.position as unit_pos, ls.position as slot_pos
                            FROM lesson_instances li
                            JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                            JOIN units u ON u.id = ls.unit_id
                            WHERE li.id = $1
                            """,
                            context.instance_id,
                        )

                        # 2. Find the next chronological slot
                        next_slot = None
                        if curr_slot:
                            next_slot = await connection.fetchrow(
                                """
                                SELECT ls.id, ls.slot_key 
                                FROM lesson_slots ls
                                JOIN units u ON u.id = ls.unit_id
                                WHERE u.position > $1 OR (u.position = $1 AND ls.position > $2)
                                ORDER BY u.position ASC, ls.position ASC
                                LIMIT 1
                                """,
                                curr_slot["unit_pos"],
                                curr_slot["slot_pos"]
                            )

                        if slot_key:
                            # Offload SRS seeding to background — not needed for the response
                            background_tasks.add_task(_seed_srs_in_background, context.user_id, slot_key)
                            
                        # 3. Trigger compilation for the NEXT slot
                        if next_slot:
                            # Check if instance already exists
                            next_existing = await connection.fetchval(
                                "SELECT id FROM lesson_instances WHERE user_id = $1 AND lesson_slot_id = $2",
                                context.user_id,
                                next_slot["id"]
                            )
                            if not next_existing:
                                next_instance_id = await connection.fetchval(
                                    """
                                    INSERT INTO lesson_instances
                                      (user_id, lesson_slot_id, title, status, current_node_index, compile_version, profile_snapshot)
                                    VALUES ($1, $2, 'Generating...', 'compiling', 0, 'v2', '{}'::jsonb)
                                    RETURNING id
                                    """,
                                    context.user_id,
                                    next_slot["id"]
                                )
                                from backend.app.ai.compiler import compile_lesson
                                background_tasks.add_task(
                                    compile_lesson,
                                    user_id=context.user_id,
                                    slot_key=next_slot["slot_key"],
                                    instance_id=str(next_instance_id),
                                )
                        advance_to = _decimal_to_float(_to_decimal(node["position"]) + Decimal("1"))
                    else:
                        await connection.execute(
                            """
                            UPDATE lesson_instances
                            SET status = 'in_progress', current_node_index = $2
                            WHERE id = $1
                            """,
                            context.instance_id,
                            next_position,
                        )
                        advance_to = _decimal_to_float(next_position)
                else:
                    advance_to = _decimal_to_float(instance["current_node_index"])
                    if attempt_no >= 2 and node["concept_tag"]:
                        injected_count = await connection.fetchval(
                            """
                            SELECT COUNT(*)
                            FROM lesson_nodes
                            WHERE lesson_instance_id = $1 AND is_injected = TRUE
                            """,
                            context.instance_id,
                        )
                        branch = await connection.fetchrow(
                            """
                            SELECT id, content
                            FROM lesson_branches
                            WHERE lesson_instance_id = $1
                              AND concept_tag = $2
                              AND consumed = FALSE
                            FOR UPDATE
                            """,
                            context.instance_id,
                            node["concept_tag"],
                        )
                        if branch and injected_count < 2:
                            injected_position = _to_decimal(node["position"]) + Decimal("0.5")
                            injected = await connection.fetchrow(
                                """
                                INSERT INTO lesson_nodes
                                  (lesson_instance_id, position, node_type, is_injected, concept_tag, content)
                                VALUES ($1, $2, 'targeted_fix', TRUE, $3, $4::jsonb)
                                ON CONFLICT (lesson_instance_id, position) DO NOTHING
                                RETURNING id, node_type, concept_tag, content
                                """,
                                context.instance_id,
                                injected_position,
                                node["concept_tag"],
                                json.dumps(_json_object(branch["content"])),
                            )
                            await connection.execute(
                                "UPDATE lesson_branches SET consumed = TRUE WHERE id = $1",
                                branch["id"],
                            )
                            if injected:
                                injected_node = _safe_node(injected)
                                await connection.execute(
                                    """
                                    UPDATE lesson_instances
                                    SET status = 'in_progress', current_node_index = $2
                                    WHERE id = $1
                                    """,
                                    context.instance_id,
                                    injected_position,
                                )
                                advance_to = _decimal_to_float(injected_position)

                return {
                    "correct": correct,
                    "explanation": explanation,
                    "injected_node": injected_node,
                    "advance_to": advance_to,
                }
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/writing/submit", response_model=WritingSubmitResponse)
async def submit_writing(
    instance_id: str,
    payload: WritingSubmitRequest,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
) -> WritingSubmitResponse:
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                context = await get_db_user_instance(connection, instance_id, current_user)

                node = await connection.fetchrow(
                    """
                    SELECT id, node_type, concept_tag, content, position
                    FROM lesson_nodes
                    WHERE lesson_instance_id = $1
                      AND status = 'pending'
                      AND position >= $2
                    ORDER BY position ASC
                    LIMIT 1
                    """,
                    context.instance_id,
                    context.instance_row["current_node_index"],
                )
                if not node:
                    raise HTTPException(status_code=404, detail="Writing node not found.")
                if node["node_type"] != "writing":
                    raise HTTPException(status_code=400, detail="Current node is not a writing prompt.")

                profile = await connection.fetchrow(
                    "SELECT coach_voice FROM user_profiles WHERE user_id = $1",
                    context.user_id,
                )
                coach_voice = profile["coach_voice"] if profile else "balanced"
                rubric = await grade_writing_draft(
                    payload.draft,
                    coach_voice,
                    [node["concept_tag"]] if node["concept_tag"] else [],
                )

                await connection.execute(
                    """
                    INSERT INTO node_attempts (node_id, user_id, attempt_no, payload, result)
                    VALUES (
                        $1,
                        $2,
                        COALESCE((SELECT MAX(attempt_no) + 1 FROM node_attempts WHERE node_id = $1), 1),
                        $3::jsonb,
                        $4::jsonb
                    )
                    ON CONFLICT (node_id, attempt_no) DO NOTHING
                    """,
                    node["id"],
                    context.user_id,
                    json.dumps({"draft": payload.draft}),
                    json.dumps(rubric.model_dump()),
                )

                writing_score, tone_score, grammar_score = _writing_score_axis(rubric)
                await record_axis_score(
                    connection,
                    context.user_id,
                    "writing",
                    writing_score,
                    node["id"],
                    node["concept_tag"],
                )
                await record_axis_score(
                    connection,
                    context.user_id,
                    "tone",
                    tone_score,
                    node["id"],
                    node["concept_tag"],
                )
                await record_axis_score(
                    connection,
                    context.user_id,
                    "grammar",
                    grammar_score,
                    node["id"],
                    node["concept_tag"],
                )

                await connection.execute(
                    "UPDATE lesson_nodes SET status = 'completed' WHERE id = $1",
                    node["id"],
                )
                next_position = await connection.fetchval(
                    """
                    SELECT position
                    FROM lesson_nodes
                    WHERE lesson_instance_id = $1 AND status = 'pending' AND position > $2
                    ORDER BY position ASC
                    LIMIT 1
                    """,
                    context.instance_id,
                    node["position"],
                )
                if next_position is None:
                    await connection.execute(
                        """
                        UPDATE lesson_instances
                        SET status = 'completed', completed_at = NOW(), current_node_index = $2
                        WHERE id = $1 AND status <> 'completed'
                        """,
                        context.instance_id,
                        _to_decimal(node["position"]) + Decimal("1"),
                    )
                else:
                    await connection.execute(
                        """
                        UPDATE lesson_instances
                        SET status = 'in_progress', current_node_index = $2
                        WHERE id = $1
                        """,
                        context.instance_id,
                        next_position,
                    )

                return WritingSubmitResponse(status="graded", rubric=rubric)
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/complete")
async def complete_lesson(
    instance_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            instance = context.instance_row

            slot_row = await connection.fetchrow(
                """
                SELECT ls.slot_key
                FROM lesson_instances li
                JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                WHERE li.id = $1
                """,
                context.instance_id,
            )
            if not slot_row:
                raise HTTPException(status_code=404, detail="Lesson slot not found.")

            if instance["status"] != "completed" or not instance["coach_summary"]:
                # Generate Coach Summary synchronously
                attempts_rows = await connection.fetch(
                    """
                    SELECT na.attempt_no, na.payload, na.result, ln.node_type, ln.concept_tag, ln.content
                    FROM node_attempts na
                    JOIN lesson_nodes ln ON na.node_id = ln.id
                    WHERE ln.lesson_instance_id = $1
                    ORDER BY ln.position ASC, na.attempt_no ASC
                    """,
                    context.instance_id,
                )
                attempts_history = [dict(r) for r in attempts_rows]
                for att in attempts_history:
                    if att.get("payload"): att["payload"] = json.loads(att["payload"])
                    if att.get("result"): att["result"] = json.loads(att["result"])
                    if att.get("content"): att["content"] = json.loads(att["content"])

                profile = json.loads(instance.get("profile_snapshot") or "{}")

                from backend.app.ai.summary import build_summary_messages
                from backend.utils.llm import generate_validated
                from backend.models.schema import CoachSummary
                import asyncio

                messages = build_summary_messages(profile, attempts_history)
                summary_json = None
                try:
                    async with asyncio.timeout(45):
                        summary = await generate_validated(messages, schema=CoachSummary, task="coach_summary")
                        
                        # Mathematical final score calculation
                        total_earned = 0.0
                        total_possible = 0.0
                        
                        # Keep track of which MCQ nodes we've processed so we only count the first attempt for possible points
                        processed_mcqs = set()

                        for att in attempts_history:
                            node_type = att["node_type"]
                            attempt_no = att["attempt_no"]
                            result = att.get("result", {})
                            if not result:
                                continue
                            
                            if node_type == "mcq" and "correct" in result:
                                node_id = att.get("node_id", "")  # We don't have node_id in the fetch! Wait, we don't need it if we just use attempt_no.
                                # Actually, attempt_no = 1 is always the first attempt of a given node.
                                if attempt_no == 1:
                                    total_possible += 100
                                if result.get("correct"):
                                    if attempt_no == 1:
                                        total_earned += 100
                                    elif attempt_no == 2:
                                        total_earned += 50
                                    elif attempt_no == 3:
                                        total_earned += 25
                            elif node_type == "writing":
                                scores = []
                                for key in ["tone", "clarity", "structure"]:
                                    if key in result and isinstance(result[key], dict) and "score" in result[key]:
                                        scores.append(result[key]["score"] * 10)
                                if scores:
                                    total_possible += 100
                                    total_earned += sum(scores) / len(scores)
                            elif node_type == "voice":
                                scores = []
                                for key in ["tone", "fluency", "vocabulary", "grammar", "listening"]:
                                    if key in result and isinstance(result[key], (int, float)):
                                        scores.append(result[key])
                                if scores:
                                    total_possible += 100
                                    total_earned += sum(scores) / len(scores)
                        
                        summary.final_score = int(round(total_earned / (total_possible / 100))) if total_possible > 0 else 100
                        summary_json = summary.model_dump_json()
                except Exception as exc:
                    import logging
                    logging.error(f"Failed to generate coach summary: {exc}")
                    # If LLM fails, we just don't set the summary (UI handles 404 or empty)
                    pass

                await connection.execute(
                    """
                    UPDATE lesson_instances
                    SET status = 'completed', 
                        completed_at = COALESCE(completed_at, NOW()), 
                        coach_summary = COALESCE(coach_summary, $2)
                    WHERE id = $1
                    """,
                    context.instance_id,
                    summary_json,
                )
                
                if instance["status"] != "completed":
                    await _award_completion_xp(connection, context.user_id, context.instance_id, instance.get("final_score"))
                    await _log_activity_day(connection, context.user_id, minutes=15)
            await _seed_srs_cards_for_slot(
                connection,
                context.user_id,
                slot_row["slot_key"],
            )

        return {"status": "completed"}
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc

@router.post("/lesson-instances/{instance_id}/qna")
async def lesson_qna(
    instance_id: str,
    req: QnARequest,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            instance = context.instance_row
            
            node_row = await connection.fetchrow(
                """
                SELECT id, node_type, concept_tag, content, position
                FROM lesson_nodes
                WHERE lesson_instance_id = $1
                  AND status = 'pending'
                  AND position >= $2
                ORDER BY position ASC
                LIMIT 1
                """,
                context.instance_id,
                instance["current_node_index"],
            )
            
            if not node_row:
                raise HTTPException(status_code=404, detail="No active node found")
                
            node_dict = dict(node_row)
            if node_dict.get("content"):
                node_dict["content"] = json.loads(node_dict["content"])
                
            from backend.app.ai.qna import qna_prompt
            messages = qna_prompt(question=req.question, current_node=node_dict, slot_context={}, chat_history=req.chat_history)
            
            from backend.utils.llm import generate_validated
            from backend.models.schema import QnAResponse
            
            res = await generate_validated(messages, schema=QnAResponse, task="qna")
            
            # Director Rule 2: Track QnA and inject targeted_fix if repeated
            try:
                await connection.execute(
                    """
                    INSERT INTO qna_exchanges (lesson_instance_id, node_id, question, answer_content)
                    VALUES ($1, $2, $3, $4::jsonb)
                    """,
                    context.instance_id, node_row["id"], req.question, res.model_dump_json()
                )
                
                qna_count = await connection.fetchval(
                    "SELECT COUNT(*) FROM qna_exchanges WHERE lesson_instance_id = $1 AND node_id = $2",
                    context.instance_id, node_row["id"]
                )
                
                if qna_count >= 2:
                    injected_count = await connection.fetchval(
                        "SELECT COUNT(*) FROM lesson_nodes WHERE lesson_instance_id = $1 AND is_injected = TRUE AND concept_tag = $2",
                        context.instance_id, node_row["concept_tag"]
                    )
                    if injected_count < 2:
                        branch = await connection.fetchrow(
                            """
                            SELECT id, content FROM lesson_branches
                            WHERE lesson_instance_id = $1 AND concept_tag = $2 AND consumed = FALSE
                            FOR UPDATE
                            """,
                            context.instance_id, node_row["concept_tag"]
                        )
                        if branch:
                            injected_position = _to_decimal(node_row["position"]) + Decimal("0.5")
                            await connection.execute(
                                """
                                INSERT INTO lesson_nodes (lesson_instance_id, position, node_type, is_injected, concept_tag, content)
                                VALUES ($1, $2, 'targeted_fix', TRUE, $3, $4::jsonb)
                                ON CONFLICT (lesson_instance_id, position) DO NOTHING
                                """,
                                context.instance_id, injected_position, node_row["concept_tag"], branch["content"]
                            )
                            await connection.execute("UPDATE lesson_branches SET consumed = TRUE WHERE id = $1", branch["id"])
            except Exception as e:
                import logging
                logging.error(f"Failed to process Director Rule 2 for QnA: {e}")
                
            return res
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/lesson-instances/{instance_id}/summary")
async def get_lesson_summary(
    instance_id: str,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            row = await connection.fetchrow(
                "SELECT coach_summary FROM lesson_instances WHERE id = $1",
                context.instance_id,
            )
            if not row or not row["coach_summary"]:
                raise HTTPException(status_code=404, detail="Summary not found or not generated yet")
            return json.loads(row["coach_summary"])
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc

@router.delete("/lesson-instances/{instance_id}")
async def delete_lesson_instance(
    instance_id: str,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            # Check if qna_exchanges table exists outside any transaction
            qna_exists = await connection.fetchval(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'qna_exchanges')"
            )
            
            async with connection.transaction():
                if qna_exists:
                    await connection.execute(
                        "DELETE FROM qna_exchanges WHERE lesson_instance_id = $1::uuid",
                        context.instance_id,
                    )
                await connection.execute(
                    """
                    DELETE FROM node_attempts 
                    WHERE node_id IN (
                        SELECT id FROM lesson_nodes WHERE lesson_instance_id = $1::uuid
                    )
                    """,
                    context.instance_id,
                )
                await connection.execute(
                    "DELETE FROM lesson_branches WHERE lesson_instance_id = $1::uuid",
                    context.instance_id,
                )
                await connection.execute(
                    "DELETE FROM lesson_nodes WHERE lesson_instance_id = $1::uuid",
                    context.instance_id,
                )
                await connection.execute(
                    "DELETE FROM lesson_instances WHERE id = $1::uuid",
                    context.instance_id,
                )
            return {"status": "deleted"}
    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        try:
            with open("delete_error.log", "w") as f:
                f.write(traceback.format_exc())
                f.write(f"\nException message: {exc}")
        except:
            pass
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/restart")
async def restart_lesson_instance(
    instance_id: str,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            lesson_slot_id = await connection.fetchval(
                "SELECT lesson_slot_id FROM lesson_instances WHERE id = $1::uuid",
                context.instance_id,
            )
            slot_key = await connection.fetchval(
                """
                SELECT ls.slot_key
                FROM lesson_instances li
                JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                WHERE li.id = $1::uuid
                """,
                context.instance_id,
            )
            if not slot_key:
                raise HTTPException(status_code=404, detail="Lesson slot not found for restart")

            async with connection.transaction():
                await connection.execute(
                    "DELETE FROM node_attempts WHERE node_id IN (SELECT id FROM lesson_nodes WHERE lesson_instance_id = $1::uuid)",
                    context.instance_id,
                )
                await connection.execute(
                    "UPDATE lesson_branches SET consumed = FALSE WHERE lesson_instance_id = $1::uuid",
                    context.instance_id,
                )
                await connection.execute(
                    "DELETE FROM lesson_nodes WHERE lesson_instance_id = $1::uuid AND is_injected = TRUE",
                    context.instance_id,
                )
                await connection.execute(
                    """
                    UPDATE lesson_nodes
                    SET status = 'pending'
                    WHERE lesson_instance_id = $1::uuid
                    """,
                    context.instance_id,
                )
                await connection.execute(
                    """
                    UPDATE lesson_instances
                    SET title = COALESCE(title, 'Generating...'),
                        status = 'ready',
                        current_node_index = 0,
                        completed_at = NULL,
                        started_at = NULL
                    WHERE id = $1::uuid
                    """,
                    context.instance_id,
                )

            return {
                "status": "restarted",
                "instance_id": str(context.instance_id),
                "slot_key": slot_key,
            }
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc
