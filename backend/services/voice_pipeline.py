"""
@ai-restriction
Primary Owners: Mohsin & Talha
Voice streaming orchestration for websocket chat.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from backend.app.ai.client import chat_stream
from backend.services.tts import build_tts_provider


@dataclass(slots=True)
class VoiceMessage:
    role: str
    text: str
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass(slots=True)
class VoiceSessionState:
    session_id: str
    lesson_id: str | None = None
    user_id: str | None = None
    history: list[VoiceMessage] = field(default_factory=list)
    assistant_text: str = ""
    turn_count: int = 0
    active: bool = True


def build_voice_messages(state: VoiceSessionState, transcript: str) -> list[dict[str, str]]:
    system_message = {
        "role": "system",
        "content": (
            "You are a Business English tutor speaking in short, natural turns. "
            "Keep replies to two sentences max. Stay helpful, encouraging, and concise."
        ),
    }
    history_messages = [{"role": msg.role, "content": msg.text} for msg in state.history[-12:]]
    return [system_message, *history_messages, {"role": "user", "content": transcript}]


class VoicePipeline:
    def __init__(self) -> None:
        self.tts = build_tts_provider()
        self.sessions: dict[str, VoiceSessionState] = {}

    def get_or_create_session(
        self,
        session_id: str,
        *,
        lesson_id: str | None = None,
        user_id: str | None = None,
    ) -> VoiceSessionState:
        session = self.sessions.get(session_id)
        if session is None:
            session = VoiceSessionState(
                session_id=session_id,
                lesson_id=lesson_id,
                user_id=user_id,
            )
            self.sessions[session_id] = session
        elif lesson_id and not session.lesson_id:
            session.lesson_id = lesson_id
        elif user_id and not session.user_id:
            session.user_id = user_id
        return session

    def append_user_transcript(self, session: VoiceSessionState, transcript: str) -> None:
        session.history.append(VoiceMessage(role="user", text=transcript))
        session.turn_count += 1

    async def stream_assistant_turn(
        self,
        session: VoiceSessionState,
        transcript: str,
    ) -> AsyncIterator[dict[str, Any]]:
        messages = build_voice_messages(session, transcript)
        assistant_text = ""
        async for chunk in chat_stream(messages):
            assistant_text += chunk
            yield {
                "event": "assistant.partial",
                "session_id": session.session_id,
                "text": chunk,
                "accumulated_text": assistant_text,
                "is_final": False,
            }

        session.assistant_text = assistant_text
        session.history.append(VoiceMessage(role="assistant", text=assistant_text))
        speech = await self.tts.synthesize(assistant_text)
        yield {
            "event": "assistant.final",
            "session_id": session.session_id,
            "text": assistant_text,
            "is_final": True,
            "turn_count": session.turn_count,
            "tts_provider": speech.provider,
            "reply_audio_b64": speech.audio_b64,
        }

    def reset(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

