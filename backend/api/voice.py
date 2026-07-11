"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend voice routing.
Talha: Do not modify voice generation hooks unless coordinating backend integration.
"""

from __future__ import annotations

import json
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status

from backend.api.lessons import CURRICULUM_PATH, get_db_user_instance
from backend.core.auth import CurrentUser, get_current_user
from backend.core.database import DatabaseNotConfigured, database
from backend.core.jobs import compile_lesson_background
from backend.core.srs import ensure_srs_cards_for_terms
from backend.core.voice import (
    VOICE_SESSIONS,
    VoiceMessage,
    generate_voice_reply,
    get_or_create_state,
    score_voice_session_background,
    transcribe_audio_bytes,
)
from backend.models.schema import TranscribeResponse, VoiceFinishResponse, VoiceTurnResponse

router = APIRouter(tags=["voice"])


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


async def _fetch_current_voice_node(connection: Any, instance_id: str, current_user: CurrentUser):
    context = await get_db_user_instance(connection, instance_id, current_user)
    instance = context.instance_row
    if instance["status"] == "completed":
        raise HTTPException(status_code=400, detail="Lesson already completed.")

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
        raise HTTPException(status_code=404, detail="Voice node not found.")
    if node["node_type"] != "voice":
        raise HTTPException(status_code=400, detail="Current node is not a voice prompt.")

    profile = await connection.fetchrow(
        """
        SELECT level, coach_voice
        FROM user_profiles
        WHERE user_id = $1
        """,
        context.user_id,
    )
    return context, instance, node, profile


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


async def _advance_after_voice_finish(
    connection: Any,
    context_user_id: str,
    instance_id: str,
    current_position: Any,
) -> tuple[float | None, bool, str | None]:
    next_position = await connection.fetchval(
        """
        SELECT position
        FROM lesson_nodes
        WHERE lesson_instance_id = $1
          AND status = 'pending'
          AND position > $2
        ORDER BY position ASC
        LIMIT 1
        """,
        instance_id,
        current_position,
    )

    if next_position is None:
        slot_key = await connection.fetchval(
            """
            SELECT ls.slot_key
            FROM lesson_instances li
            JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
            WHERE li.id = $1
            """,
            instance_id,
        )
        await connection.execute(
            """
            UPDATE lesson_instances
            SET status = 'completed', completed_at = NOW(), current_node_index = $2
            WHERE id = $1 AND status <> 'completed'
            """,
            instance_id,
            Decimal(str(current_position)) + Decimal("1"),
        )
        await _award_completion_xp(connection, context_user_id, instance_id)
        if slot_key:
            await _seed_srs_cards_for_slot(connection, context_user_id, slot_key)
        return float(Decimal(str(current_position)) + Decimal("1")), True, slot_key

    await connection.execute(
        """
        UPDATE lesson_instances
        SET status = 'in_progress', current_node_index = $2
        WHERE id = $1
        """,
        instance_id,
        next_position,
    )
    return float(next_position), False, None


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_route(
    audio: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> TranscribeResponse:
    try:
        audio_bytes = await audio.read()
        transcript = await transcribe_audio_bytes(audio_bytes)
        return TranscribeResponse(transcript=transcript)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/voice/turn", response_model=VoiceTurnResponse)
async def voice_turn_route(
    instance_id: str,
    audio: UploadFile = File(...),
    current_user: CurrentUser = Depends(get_current_user),
) -> VoiceTurnResponse:
    try:
        audio_bytes = await audio.read()
        transcript = await transcribe_audio_bytes(audio_bytes)

        pool = await database.pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                context, _instance, node, profile = await _fetch_current_voice_node(
                    connection,
                    instance_id,
                    current_user,
                )
                state = await get_or_create_state(
                    connection,
                    context.user_id,
                    context.instance_id,
                    node,
                    profile,
                )

                user_message = VoiceMessage(role="user", text=transcript)
                state.history.append(user_message)
                state.last_seen_at = user_message.created_at
                state.objectives_hit.update(
                    objective
                    for objective in state.objectives
                    if any(term in transcript.lower() for term in objective.lower().split())
                )

                reply_text, reply_audio_b64 = await generate_voice_reply(state, transcript)
                assistant_message = VoiceMessage(role="assistant", text=reply_text)
                state.history.append(assistant_message)
                state.last_seen_at = assistant_message.created_at
                state.turn_count = len([entry for entry in state.history if entry.role == "user"])

                return VoiceTurnResponse(
                    transcript=transcript,
                    reply_text=reply_text,
                    reply_audio_b64=reply_audio_b64,
                    objectives_hit=sorted(state.objectives_hit),
                    turn_count=state.turn_count,
                    session_key=state.key,
                )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc


@router.post("/lesson-instances/{instance_id}/voice/finish", response_model=VoiceFinishResponse)
async def voice_finish_route(
    instance_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser = Depends(get_current_user),
) -> VoiceFinishResponse:
    try:
        pool = await database.pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                context, _instance, node, profile = await _fetch_current_voice_node(
                    connection,
                    instance_id,
                    current_user,
                )
                slot_key = await connection.fetchval(
                    """
                    SELECT ls.slot_key
                    FROM lesson_instances li
                    JOIN lesson_slots ls ON ls.id = li.lesson_slot_id
                    WHERE li.id = $1
                    """,
                    context.instance_id,
                )
                session_key = f"{context.instance_id}:{node['id']}"
                state = VOICE_SESSIONS.get(session_key)
                if state is None:
                    state = await get_or_create_state(
                        connection,
                        context.user_id,
                        context.instance_id,
                        node,
                        profile,
                    )

                transcript_lines = [
                    {"role": message.role, "text": message.text}
                    for message in state.history
                ]
                payload = {
                    "voice_session": True,
                    "transcript": transcript_lines,
                    "turn_count": state.turn_count,
                    "objectives": state.objectives,
                    "objectives_hit": sorted(state.objectives_hit),
                }

                attempt_row = await connection.fetchrow(
                    """
                    SELECT id, result
                    FROM node_attempts
                    WHERE node_id = $1 AND user_id = $2
                    ORDER BY attempt_no DESC
                    LIMIT 1
                    """,
                    node["id"],
                    context.user_id,
                )

                already_finished = False
                if attempt_row:
                    already_finished = attempt_row["result"] is not None
                    await connection.execute(
                        """
                        UPDATE node_attempts
                        SET payload = $1::jsonb
                        WHERE id = $2
                        """,
                        json.dumps(payload),
                        attempt_row["id"],
                    )
                else:
                    await connection.execute(
                        """
                        INSERT INTO node_attempts (node_id, user_id, attempt_no, payload)
                        VALUES ($1, $2, 1, $3::jsonb)
                        ON CONFLICT (node_id, attempt_no) DO UPDATE
                        SET payload = EXCLUDED.payload
                        """,
                        node["id"],
                        context.user_id,
                        json.dumps(payload),
                    )

                advance_to, lesson_completed, _completed_slot_key = await _advance_after_voice_finish(
                    connection,
                    context.user_id,
                    context.instance_id,
                    node["position"],
                )

                if state.key in VOICE_SESSIONS:
                    VOICE_SESSIONS.pop(state.key, None)

        if not already_finished:
            background_tasks.add_task(
                score_voice_session_background,
                context.user_id,
                context.instance_id,
                str(node["id"]),
                transcript_lines,
                list(state.objectives),
                node["concept_tag"],
            )
            if lesson_completed and slot_key:
                background_tasks.add_task(
                    compile_lesson_background,
                    context.user_id,
                    slot_key,
                    context.instance_id,
                )

        return VoiceFinishResponse(
            status="already_finished" if already_finished else "finished",
            background_scoring_scheduled=not already_finished,
            instance_id=context.instance_id,
            node_id=str(node["id"]),
            advance_to=advance_to,
            transcript_turns=len(transcript_lines),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc) from exc
