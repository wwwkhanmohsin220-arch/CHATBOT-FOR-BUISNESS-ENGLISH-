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
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.core.auth import CurrentUser, get_optional_current_user, get_current_user
from backend.core.database import DatabaseNotConfigured, database
from backend.core.jobs import compile_lesson_background, compile_cold_start_background
from backend.core.stats import record_axis_score, record_stat_event
from backend.core.srs import ensure_srs_cards_for_terms
from backend.core.writing import grade_writing_draft
from backend.models.schema import WritingSubmitRequest, WritingSubmitResponse

router = APIRouter(tags=["lessons"])

CURRICULUM_PATH = Path(__file__).resolve().parents[1] / "app" / "content" / "curriculum.json"
DEMO_INSTANCE_ALIAS = "test"
DEMO_USER_ID = os.getenv("BUSLINGO_DEMO_USER_ID", "00000000-0000-0000-0000-000000000001")
COMPILE_VERSION = "fixture_v1"


class AttemptIn(BaseModel):
    answer_index: Optional[int] = None
    read_ack: Optional[bool] = None

class QnARequest(BaseModel):
    question: str


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


async def _award_completion_xp(connection: Any, user_id: str, instance_id: str) -> None:
    await connection.execute(
        """
        INSERT INTO xp_events (user_id, amount, reason, idempotency_key)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (idempotency_key) DO NOTHING
        """,
        user_id,
        10,
        "lesson completion",
        f"xp:lesson:{instance_id}",
    )


async def _seed_srs_cards_for_slot(connection: Any, user_id: str, slot_key: str) -> None:
    curriculum = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))
    for unit in curriculum["units"]:
        for slot in unit["slots"]:
            if slot["slot_key"] == slot_key:
                await ensure_srs_cards_for_terms(connection, user_id, slot.get("key_vocabulary", []))
                return


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


async def _ensure_curriculum_seeded(connection: Any) -> None:
    existing = await connection.fetchval("SELECT COUNT(*) FROM units")
    if existing:
        return

    curriculum = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))
    for unit in curriculum["units"]:
        unit_id = await connection.fetchval(
            """
            INSERT INTO units (position, title)
            VALUES ($1, $2)
            ON CONFLICT (position) DO UPDATE SET title = EXCLUDED.title
            RETURNING id
            """,
            unit["position"],
            unit["title"],
        )

        for slot in unit["slots"]:
            await connection.execute(
                """
                INSERT INTO lesson_slots (unit_id, position, slot_key)
                VALUES ($1, $2, $3)
                ON CONFLICT (slot_key) DO UPDATE
                SET unit_id = EXCLUDED.unit_id, position = EXCLUDED.position
                """,
                unit_id,
                slot["position"],
                slot["slot_key"],
            )


async def _ensure_demo_instance(connection: Any, user_id: str) -> str:
    await _ensure_curriculum_seeded(connection)
    slot = json.loads(CURRICULUM_PATH.read_text(encoding="utf-8"))["units"][0]["slots"][0]
    slot_row = await connection.fetchrow(
        "SELECT id FROM lesson_slots WHERE slot_key = $1",
        slot["slot_key"],
    )
    if not slot_row:
        raise HTTPException(status_code=404, detail="Lesson slot not found.")

    existing = await connection.fetchrow(
        """
        SELECT id
        FROM lesson_instances
        WHERE user_id = $1 AND lesson_slot_id = $2
        """,
        user_id,
        slot_row["id"],
    )
    if existing:
        return str(existing["id"])

    bundle = _fixture_bundle(slot)
    try:
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
            json.dumps({"level": "beginner", "source": "fixture"}),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Could not create demo lesson instance. Ensure BUSLINGO_DEMO_USER_ID "
                "exists in Supabase auth.users before testing the runtime."
            ),
        ) from exc

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


async def _resolve_instance_id(connection: Any, instance_id: str) -> str:
    if instance_id == DEMO_INSTANCE_ALIAS:
        return await _ensure_demo_instance(connection, DEMO_USER_ID)
    return instance_id


async def get_db_user_instance(
    connection: Any,
    instance_id: str,
    current_user: CurrentUser | None = None,
) -> LessonInstanceContext:
    user_id = current_user.user_id if current_user else DEMO_USER_ID
    if instance_id == DEMO_INSTANCE_ALIAS:
        resolved_id = await _ensure_demo_instance(connection, user_id)
    else:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Supabase authentication is required for non-demo lesson instances.",
            )
        resolved_id = await _resolve_instance_id(connection, instance_id)

    instance = await connection.fetchrow(
        """
        SELECT id, user_id, status, current_node_index
        FROM lesson_instances
        WHERE id = $1
        """,
        resolved_id,
    )
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    if current_user and str(instance["user_id"]) != current_user.user_id:
        raise HTTPException(status_code=403, detail="This lesson instance does not belong to the current user.")

    return LessonInstanceContext(user_id=user_id, instance_id=str(resolved_id), instance_row=instance)


@router.post("/lessons/{slot_id}/start")
async def start_lesson(
    slot_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user),
):
    user_id = current_user.user_id
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            slot_row = None
            if slot_id.isdigit():
                slot_row = await connection.fetchrow(
                    "SELECT id, slot_key FROM lesson_slots WHERE id = $1",
                    int(slot_id)
                )
            if not slot_row:
                slot_row = await connection.fetchrow(
                    "SELECT id, slot_key FROM lesson_slots WHERE slot_key = $1",
                    slot_id
                )
            if not slot_row:
                raise HTTPException(status_code=404, detail=f"Lesson slot '{slot_id}' not found")

            db_slot_id = slot_row["id"]
            slot_key = slot_row["slot_key"]

            instance = await connection.fetchrow(
                """
                SELECT id, status, current_node_index
                FROM lesson_instances
                WHERE user_id = $1 AND lesson_slot_id = $2
                """,
                user_id,
                db_slot_id
            )

            if instance:
                status_str = instance["status"]
                instance_id = str(instance["id"])

                if status_str in ("ready", "in_progress"):
                    await connection.execute(
                        """
                        UPDATE lesson_instances
                        SET status = 'in_progress', started_at = COALESCE(started_at, NOW())
                        WHERE id = $1
                        """,
                        instance["id"]
                    )
                    return {
                        "status": "in_progress",
                        "instance_id": instance_id,
                        "current_node_index": float(instance["current_node_index"])
                    }
                elif status_str == "compiling":
                    return JSONResponse(
                        status_code=status.HTTP_202_ACCEPTED,
                        content={"status": "compiling", "instance_id": instance_id}
                    )
                elif status_str == "completed":
                    return {
                        "status": "completed",
                        "instance_id": instance_id,
                        "current_node_index": float(instance["current_node_index"])
                    }
                elif status_str == "failed":
                    await connection.execute("DELETE FROM lesson_instances WHERE id = $1", instance["id"])
                    instance = None

            if not instance:
                try:
                    instance_id = await connection.fetchval(
                        """
                        INSERT INTO lesson_instances (user_id, lesson_slot_id, status, current_node_index)
                        VALUES ($1, $2, 'compiling', 0)
                        ON CONFLICT (user_id, lesson_slot_id) DO NOTHING
                        RETURNING id
                        """,
                        user_id,
                        db_slot_id
                    )
                    was_created = True if instance_id else False
                except Exception:
                    was_created = False
                    instance_id = None

                if instance_id is None:
                    instance_id = await connection.fetchval(
                        """
                        SELECT id FROM lesson_instances
                        WHERE user_id = $1 AND lesson_slot_id = $2
                        """,
                        user_id,
                        db_slot_id
                    )
                    was_created = False

                if was_created:
                    background_tasks.add_task(
                        compile_cold_start_background,
                        user_id,
                        slot_key,
                        str(instance_id)
                    )

                return JSONResponse(
                    status_code=status.HTTP_202_ACCEPTED,
                    content={"status": "compiling", "instance_id": str(instance_id)}
                )

    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.get("/curriculum")
async def get_curriculum(current_user: CurrentUser = Depends(get_current_user)):
    user_id = current_user.user_id
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            await _ensure_curriculum_seeded(connection)
            slots = await connection.fetch(
                """
                SELECT
                  u.id AS unit_id,
                  u.title AS unit_title,
                  u.position AS unit_position,
                  ls.id AS slot_id,
                  ls.slot_key,
                  ls.position AS lesson_position
                FROM units u
                JOIN lesson_slots ls ON ls.unit_id = u.id
                ORDER BY u.position, ls.position
                """
            )
            
            instances = await connection.fetch(
                """
                SELECT lesson_slot_id, status, title
                FROM lesson_instances
                WHERE user_id = $1
                """,
                user_id
            )
            instance_map = {row["lesson_slot_id"]: (row["status"], row["title"]) for row in instances}
    except Exception as exc:
        raise _db_error(exc) from exc

    previous_completed = True

    units_by_id: dict[int, dict[str, Any]] = {}
    for row in slots:
        slot_id = row["slot_id"]
        slot_key = row["slot_key"]
        
        inst_data = instance_map.get(slot_id)
        if inst_data:
            inst_status, inst_title = inst_data
            if inst_status == "completed":
                status_str = "completed"
                current_completed = True
            elif inst_status in ("in_progress", "ready", "compiling"):
                status_str = "in_progress"
                current_completed = False
            else:
                status_str = "available" if previous_completed else "locked"
                current_completed = False
        else:
            inst_title = None
            if previous_completed:
                status_str = "available"
            else:
                status_str = "locked"
            current_completed = False
            
        previous_completed = current_completed

        unit = units_by_id.setdefault(
            row["unit_id"],
            {
                "id": f"u{row['unit_id']}",
                "title": row["unit_title"],
                "lessons": [],
            },
        )
        
        topic_title = inst_title
        if not topic_title:
            if slot_key == "u1l1":
                topic_title = "Introductions & Role"
            elif slot_key == "u1l2":
                topic_title = "Meetings & Disagreement"
            elif slot_key == "u1l3":
                topic_title = "Follow-up Emails"
            elif slot_key == "u2l1":
                topic_title = "Negotiation & Price"
            elif slot_key == "u2l2":
                topic_title = "Timeline Clarity"
            elif slot_key == "u2l3":
                topic_title = "Closing the Deal"
            else:
                topic_title = "Business English Practice"

        unit["lessons"].append(
            {
                "id": slot_key,
                "title": f"Lesson {row['lesson_position']}: {topic_title}",
                "status": status_str,
            }
        )

    return {"units": list(units_by_id.values())}


@router.get("/lesson-instances/{instance_id}/nodes/current")
async def get_current_node(
    instance_id: str,
    current_user: CurrentUser | None = Depends(get_optional_current_user),
):
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            context = await get_db_user_instance(connection, instance_id, current_user)
            instance = context.instance_row
            if instance["status"] == "completed":
                return {"status": "completed"}

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
                instance["current_node_index"],
            )
            if not node:
                await connection.execute(
                    """
                    UPDATE lesson_instances
                    SET status = 'completed', completed_at = NOW()
                    WHERE id = $1
                    """,
                    context.instance_id,
                )
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

                if node["node_type"] in {"theory", "targeted_fix"}:
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
                            SET status = 'completed', completed_at = NOW(), current_node_index = $2
                            WHERE id = $1 AND status <> 'completed'
                            """,
                            context.instance_id,
                            _to_decimal(node["position"]) + Decimal("1"),
                        )
                        await _award_completion_xp(connection, context.user_id, context.instance_id)
                        if slot_key:
                            await _seed_srs_cards_for_slot(
                                connection,
                                context.user_id,
                                slot_key,
                            )
                        advance_to = _decimal_to_float(_to_decimal(node["position"]) + Decimal("1"))
                        if slot_key:
                            background_tasks.add_task(
                                compile_lesson_background,
                                context.user_id,
                                slot_key,
                                context.instance_id,
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

            if instance["status"] != "completed":
                await connection.execute(
                    """
                    UPDATE lesson_instances
                    SET status = 'completed', completed_at = NOW()
                    WHERE id = $1 AND status <> 'completed'
                    """,
                    context.instance_id,
                )
                await _award_completion_xp(connection, context.user_id, context.instance_id)
            await _seed_srs_cards_for_slot(
                connection,
                context.user_id,
                slot_row["slot_key"],
            )

        background_tasks.add_task(
            compile_lesson_background,
            context.user_id,
            slot_row["slot_key"],
            context.instance_id,
        )

        return {"status": "completed", "background_compile_scheduled": True}
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
            messages = qna_prompt(question=req.question, current_node=node_dict, slot_context={})
            
            from backend.utils.llm import generate_validated
            from backend.models.schema import QnAResponse
            
            res = await generate_validated(messages, schema=QnAResponse, task="qna")
            return res
            
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
