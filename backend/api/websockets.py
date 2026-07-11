"""
@ai-restriction
Primary Owners: Mohsin & Talha
Umer: Do not modify WebSocket connections or streaming logic.
Mohsin: Manage backend streaming support and conversational states here.
Talha: Manage ElevenLabs integration, voice states, and voice QA here.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.core.auth import verify_supabase_jwt
from backend.services.voice_pipeline import VoicePipeline

ws_router = APIRouter()
voice_pipeline = VoicePipeline()


def _parse_message(raw_message: str) -> dict[str, Any]:
    try:
        payload = json.loads(raw_message)
    except json.JSONDecodeError:
        return {"type": "text", "content": raw_message}
    if isinstance(payload, dict):
        return payload
    return {"type": "text", "content": raw_message}


async def _send_error(websocket: WebSocket, code: str, message: str) -> None:
    await websocket.send_json({"event": "error", "code": code, "message": message})


@ws_router.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()

    user_id: str | None = None
    token = websocket.headers.get("authorization")
    if token and token.lower().startswith("bearer "):
        try:
            claims = verify_supabase_jwt(token.split(" ", 1)[1].strip())
            user_id = str(claims.get("sub") or "")
        except Exception as exc:
            await _send_error(websocket, "auth_error", str(exc))

    session_id = websocket.headers.get("x-session-id") or websocket.query_params.get("session_id") or "anonymous"
    lesson_id = websocket.query_params.get("lesson_id")
    session = voice_pipeline.get_or_create_session(session_id, lesson_id=lesson_id, user_id=user_id)

    await websocket.send_json(
        {
            "event": "voice.session.ready",
            "session_id": session.session_id,
            "lesson_id": session.lesson_id,
            "user_id": session.user_id,
            "message": "Voice streaming session established.",
            "streaming": True,
        }
    )

    try:
        while True:
            incoming = await websocket.receive()
            if incoming.get("type") == "websocket.disconnect":
                break

            raw_bytes = incoming.get("bytes")
            raw_text = incoming.get("text")

            if raw_bytes is not None:
                await websocket.send_json(
                    {
                        "event": "audio.chunk.received",
                        "session_id": session.session_id,
                        "bytes_received": len(raw_bytes),
                        "message": "Audio chunk received. Send transcript text for live assistant streaming.",
                    }
                )
                continue

            message = _parse_message(str(raw_text or ""))
            message_type = str(message.get("event") or message.get("type") or "text")

            if message_type in {"ping", "voice.ping"}:
                await websocket.send_json({"event": "pong", "session_id": session.session_id})
                continue

            if message_type in {"voice.start", "session.start", "start_session"}:
                session.lesson_id = message.get("lesson_id") or session.lesson_id
                await websocket.send_json(
                    {
                        "event": "voice.session.started",
                        "session_id": session.session_id,
                        "lesson_id": session.lesson_id,
                        "message": "Voice session is active.",
                    }
                )
                continue

            if message_type in {"voice.stop", "session.stop", "end_session"}:
                voice_pipeline.reset(session.session_id)
                await websocket.send_json(
                    {
                        "event": "voice.session.stopped",
                        "session_id": session.session_id,
                        "message": "Voice session paused.",
                    }
                )
                continue

            transcript = (
                message.get("transcript")
                or message.get("text")
                or message.get("content")
                or ""
            ).strip()

            if message_type in {"transcript", "voice.transcript", "transcript.final", "voice.turn", "user.message"} or transcript:
                if not transcript:
                    await _send_error(websocket, "missing_transcript", "Transcript text is required for assistant streaming.")
                    continue

                voice_pipeline.append_user_transcript(session, transcript)
                async for event in voice_pipeline.stream_assistant_turn(session, transcript):
                    await websocket.send_json(event)
                continue

            await _send_error(
                websocket,
                "unsupported_message",
                f"Unsupported websocket message type: {message_type}",
            )

    except WebSocketDisconnect:
        voice_pipeline.reset(session.session_id)
    except Exception as exc:  # pragma: no cover - defensive websocket guard
        await _send_error(websocket, "internal_error", str(exc))
