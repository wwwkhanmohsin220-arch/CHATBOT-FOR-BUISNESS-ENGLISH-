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
                "node_type": "writing",
                "concept_tag": "email_structure",
                "content": {
                    "scenario": "A client just asked for a project update. Write a brief, professional reply.",
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
            VALUES ($1::uuid, $2, $3, 'ready', 0, $4, $5::jsonb)
            RETURNING id
            """,
            user_id,
            slot_row["id"],
            bundle["title"],
            COMPILE_VERSION,
            json.dumps({"level": "beginner", "source": "fixture"}),
        )
    except Exception as exc:
        print(f"Demo instance creation failed: {exc}")
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
    background_tasks: BackgroundTasks | None = None,
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

        # Check if this looks like a slot_key rather than a UUID
        # UUIDs have the format 8-4-4-4-12 hex chars with dashes
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
                resolved_id = str(existing["id"])
                instance = existing
            else:
                from backend.app.ai.compiler import compile_lesson
                
                # Create a new instance for this user with status 'compiling'
                await _ensure_curriculum_seeded(connection)
                
                instance_uuid = await connection.fetchval(
                    """
                    INSERT INTO lesson_instances
                      (user_id, lesson_slot_id, title, status, current_node_index, compile_version, profile_snapshot)
                    VALUES ($1::uuid, $2, 'Generating...', 'compiling', 0, 'v2', '{}'::jsonb)
                    RETURNING id
                    """,
                    user_id,
                    slot_row["id"],
                )
                resolved_id = str(instance_uuid)
                
                if background_tasks:
                    background_tasks.add_task(
                        compile_lesson,
                        user_id=user_id,
                        slot_key=instance_id,
                        instance_id=resolved_id
                    )
        else:
            resolved_id = await _resolve_instance_id(connection, instance_id)

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


@router.get("/curriculum")
async def get_curriculum(current_user: CurrentUser | None = Depends(get_optional_current_user)):
    user_id = current_user.user_id if current_user else DEFAULT_USER_ID
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
                    "id": DEMO_INSTANCE_ALIAS if row["lesson_position"] == 1 else row["slot_key"],
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
                            await _seed_srs_cards_for_slot(
                                connection,
                                context.user_id,
                                slot_key,
                            )
                            
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
                                for key in ["fluency", "grammar", "tone", "diplomacy"]:
                                    if key in result and isinstance(result[key], dict) and "score" in result[key]:
                                        scores.append(result[key]["score"] * 10)
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
                    await _award_completion_xp(connection, context.user_id, context.instance_id)
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
            messages = qna_prompt(question=req.question, current_node=node_dict, slot_context={})
            
            from backend.utils.llm import generate_validated
            from backend.models.schema import QnAResponse
            
            res = await generate_validated(messages, schema=QnAResponse, task="qna")
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
