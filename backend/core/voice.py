"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify voice session orchestration.
Talha: Do not modify voice generation hooks unless coordinating backend integration.
"""

from __future__ import annotations

import asyncio
import base64
import importlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any

from backend.models.schema import VoiceScore

VOICE_SESSION_TTL_SECONDS = 1800
VOICE_SESSIONS: dict[str, "VoiceState"] = {}


@dataclass(slots=True)
class VoiceMessage:
    role: str
    text: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class VoiceState:
    key: str
    user_id: str
    instance_id: str
    node_id: str
    level: str
    coach_voice: str
    ai_persona: str
    objectives: list[str]
    objectives_hit: set[str] = field(default_factory=set)
    history: list[VoiceMessage] = field(default_factory=list)
    turn_count: int = 0
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


def _session_key(instance_id: str, node_id: str) -> str:
    return f"{instance_id}:{node_id}"


def purge_idle_sessions() -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(seconds=VOICE_SESSION_TTL_SECONDS)
    for key, state in list(VOICE_SESSIONS.items()):
        if state.last_seen_at < cutoff:
            VOICE_SESSIONS.pop(key, None)


def _fallback_transcript(audio_bytes: bytes) -> str:
    size_hint = len(audio_bytes)
    return f"Fallback transcription for {size_hint} audio bytes."


def _fallback_reply(state: VoiceState, transcript: str) -> str:
    coach_voice = state.coach_voice.replace("_", " ")
    if state.turn_count == 0:
        return (
            f"Thanks. Let's keep going in a {coach_voice} way. "
            f"Please respond to this prompt: {state.ai_persona}"
        )

    unmet = [objective for objective in state.objectives if objective not in state.objectives_hit]
    if unmet:
        focus = unmet[0]
        return (
            f"Good. Let's focus on {focus.lower()}. "
            f"Can you answer with one more clear sentence about it?"
        )

    return "Nice work. You have covered the objectives, so let's wrap up the roleplay."


def _extract_objectives_hit(state: VoiceState, transcript: str) -> list[str]:
    normalized = transcript.lower()
    hits: list[str] = []
    for objective in state.objectives:
        objective_terms = [word for word in objective.lower().split() if len(word) > 3]
        if objective_terms and any(term in normalized for term in objective_terms[:4]):
            hits.append(objective)
    return hits


async def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    if not audio_bytes:
        raise ValueError("Audio payload is empty.")

    try:
        ai_module = importlib.import_module("backend.app.ai.client")
    except Exception:
        return _fallback_transcript(audio_bytes)

    transcribe = getattr(ai_module, "transcribe_audio", None)
    if transcribe is None:
        return _fallback_transcript(audio_bytes)

    try:
        maybe_result = transcribe(audio_bytes=audio_bytes)
        if hasattr(maybe_result, "__await__"):
            result = await maybe_result
        else:
            result = maybe_result
    except Exception as exc:
        import traceback
        traceback.print_exc()
        return _fallback_transcript(audio_bytes)

    if isinstance(result, str):
        return result
    if hasattr(result, "text"):
        return str(result.text)
    if isinstance(result, dict):
        return str(result.get("text") or result.get("transcript") or _fallback_transcript(audio_bytes))
    return _fallback_transcript(audio_bytes)


async def generate_voice_reply(state: VoiceState, transcript: str) -> tuple[str, str | None]:
    try:
        ai_module = importlib.import_module("backend.app.ai.client")
    except Exception:
        return _fallback_reply(state, transcript), None

    generate_reply = getattr(ai_module, "generate_voice_reply", None)
    if generate_reply is None:
        return _fallback_reply(state, transcript), None

    try:
        maybe_result = generate_reply(
            transcript=transcript,
            objectives=state.objectives,
            ai_persona=state.ai_persona,
            coach_voice=state.coach_voice,
            level=state.level,
        )
        if hasattr(maybe_result, "__await__"):
            result = await maybe_result
        else:
            result = maybe_result
    except Exception:
        return _fallback_reply(state, transcript), None

    if isinstance(result, dict):
        reply_text = str(result.get("reply_text") or result.get("text") or _fallback_reply(state, transcript))
        reply_audio = result.get("reply_audio_b64")
        return reply_text, reply_audio if isinstance(reply_audio, str) else None

    if isinstance(result, str):
        return result, None

    return _fallback_reply(state, transcript), None


async def get_or_create_state(
    connection: Any,
    user_id: str,
    instance_id: str,
    node: Any,
    profile: Any = None,
) -> VoiceState:
    purge_idle_sessions()
    key = _session_key(instance_id, str(node["id"]))
    existing = VOICE_SESSIONS.get(key)
    if existing:
        existing.last_seen_at = datetime.now(timezone.utc)
        return existing

    content = node["content"] if isinstance(node["content"], dict) else json.loads(node["content"])
    state = VoiceState(
        key=key,
        user_id=user_id,
        instance_id=instance_id,
        node_id=str(node["id"]),
        level=(profile["level"] if profile else "beginner"),
        coach_voice=(profile["coach_voice"] if profile else "balanced"),
        ai_persona=str(content.get("ai_persona") or "A supportive business English coach."),
        objectives=list(content.get("objectives") or []),
    )
    opening_line = content.get("opening_line")
    if opening_line:
        state.history.append(VoiceMessage(role="assistant", text=str(opening_line)))
    VOICE_SESSIONS[key] = state
    return state


async def score_voice_session_background(
    user_id: str,
    instance_id: str,
    node_id: str,
    transcript_lines: list[dict[str, str]],
    objectives: list[str],
    concept_tag: str | None,
) -> None:
    try:
        ai_module = importlib.import_module("backend.app.ai.client")
    except Exception:
        ai_module = None

    transcript_text = " ".join(entry.get("text", "") for entry in transcript_lines).strip()
    if ai_module and hasattr(ai_module, "generate_voice_score"):
        try:
            maybe_result = ai_module.generate_voice_score(
                transcript=transcript_text,
                objectives=objectives,
                concept_tag=concept_tag,
            )
            if hasattr(maybe_result, "__await__"):
                result = await maybe_result
            else:
                result = maybe_result
            if isinstance(result, dict):
                voice_score = VoiceScore.model_validate(result)
            else:
                voice_score = VoiceScore.model_validate(result)
        except Exception:
            voice_score = _fallback_voice_score(transcript_lines, objectives)
    else:
        voice_score = _fallback_voice_score(transcript_lines, objectives)

    try:
        from backend.core.database import database
        from backend.core.stats import record_axis_score
    except Exception:
        return

    pool = await database.pool()
    async with pool.acquire() as connection:
        attempt_row = await connection.fetchrow(
            """
            SELECT id
            FROM node_attempts
            WHERE node_id = $1 AND user_id = $2
            ORDER BY attempt_no DESC
            LIMIT 1
            """,
            node_id,
            user_id,
        )
        if not attempt_row:
            return

        await connection.execute(
            """
            UPDATE node_attempts
            SET result = $1::jsonb
            WHERE id = $2
            """,
            json.dumps(voice_score.model_dump()),
            attempt_row["id"],
        )

        await record_axis_score(connection, user_id, "tone", voice_score.tone, node_id, concept_tag)
        await record_axis_score(connection, user_id, "fluency", voice_score.fluency, node_id, concept_tag)
        await record_axis_score(connection, user_id, "vocabulary", voice_score.vocabulary, node_id, concept_tag)
        await record_axis_score(connection, user_id, "grammar", voice_score.grammar, node_id, concept_tag)
        await record_axis_score(connection, user_id, "listening", voice_score.listening, node_id, concept_tag)


def _fallback_voice_score(transcript_lines: list[dict[str, str]], objectives: list[str]) -> VoiceScore:
    transcript_text = " ".join(entry.get("text", "") for entry in transcript_lines).strip()
    word_count = len(transcript_text.split())
    objectives_met = [objective for objective in objectives if objective.lower().split()[0] in transcript_text.lower()]
    tone = 70 if "please" in transcript_text.lower() or "would" in transcript_text.lower() else 55
    fluency = 65 if word_count >= 20 else 50
    vocabulary = 60 if word_count >= 15 else 45
    grammar = 70 if transcript_text.endswith(".") or transcript_text.endswith("?") else 55
    listening = 75 if objectives_met else 55
    return VoiceScore(
        tone=tone,
        fluency=fluency,
        vocabulary=vocabulary,
        grammar=grammar,
        listening=listening,
        objectives_met=objectives_met,
        notable_errors=[],
        one_line_feedback="Fallback voice scoring is active until the AI voice grader is wired in.",
    )
