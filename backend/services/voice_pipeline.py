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
from backend.prompts.voice import build_voice_reply_messages
from backend.services.tts import TTSProvider, build_tts_provider


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
    # Node content fields for proper scenario prompting
    scenario: str = "A general business conversation."
    ai_persona: str = "a professional business person"
    objectives: list[str] = field(default_factory=lambda: ["Practice professional English"])
    coach_voice: str = "female"
    level: str = "intermediate"


def build_voice_messages(state: VoiceSessionState, transcript: str) -> list[dict[str, str]]:
    """Build properly contextualised messages using the full voice prompt."""
    history_as_dicts = [{"role": msg.role, "text": msg.text} for msg in state.history[-12:]]
    return build_voice_reply_messages(
        objectives=state.objectives,
        ai_persona=state.ai_persona,
        scenario=state.scenario,
        coach_voice=state.coach_voice,
        level=state.level,
        history=history_as_dicts,
    )


class VoicePipeline:
    def __init__(self) -> None:
        self._tts: TTSProvider | None = None
        self.sessions: dict[str, VoiceSessionState] = {}

    @property
    def tts(self) -> TTSProvider:
        # Lazy-init: read env vars at first request, not at import time
        if self._tts is None:
            self._tts = build_tts_provider()
            provider_name = type(self._tts).__name__
            import os
            has_key = bool(os.getenv("ELEVENLABS_API_KEY"))
            print(f"[VoicePipeline] TTS provider initialized: {provider_name} | ElevenLabs key present: {has_key}")
        return self._tts


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
                "accumulated_text": assistant_text.replace("[SCENARIO_COMPLETE]", ""),
                "is_final": False,
            }

        is_complete = False
        if "[SCENARIO_COMPLETE]" in assistant_text:
            is_complete = True
            assistant_text = assistant_text.replace("[SCENARIO_COMPLETE]", "").strip()

        session.assistant_text = assistant_text
        session.history.append(VoiceMessage(role="assistant", text=assistant_text))
        
        if assistant_text:
            voice_id = "ErXwobaYiN019PkySvjV" if session.coach_voice.lower() == "male" else "21m00Tcm4TlvDq8ikWAM"
            speech = await self.tts.synthesize(assistant_text, voice_id_override=voice_id)
            yield {
                "event": "assistant.final",
                "session_id": session.session_id,
                "text": assistant_text,
                "is_final": True,
                "turn_count": session.turn_count,
                "tts_provider": speech.provider,
                "reply_audio_b64": speech.audio_b64,
            }
            
        if is_complete:
            yield {
                "event": "conversation.complete",
                "session_id": session.session_id,
            }

    def reset(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)

