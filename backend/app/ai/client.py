"""
@ai-restriction
Primary Owner: Talha
Groq client helpers for compiler and runtime AI calls.
"""

from __future__ import annotations

import asyncio
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from backend.utils.llm import DEFAULT_GROQ_MODEL, groq_chat, groq_chat_stream, generate_validated
from backend.prompts.voice import build_voice_reply_messages, build_voice_score_messages
from backend.services.tts import build_tts_provider
from backend.models.schema import VoiceScore

GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
_SEMAPHORE = asyncio.Semaphore(4)

@dataclass(slots=True)
class TranscriptionResult:
    text: str
    raw_response: dict[str, Any]


async def chat(messages: list[dict[str, Any]], *, model: str = DEFAULT_GROQ_MODEL) -> str:
    return await groq_chat(messages, model=model)


async def chat_stream(messages: list[dict[str, Any]], *, model: str = DEFAULT_GROQ_MODEL):
    async for chunk in groq_chat_stream(messages, model=model):
        yield chunk


def _encode_multipart(fields: dict[str, str], files: dict[str, tuple[str, bytes, str]]) -> tuple[bytes, str]:
    boundary = "----BuslingoFormBoundary7MA4YWxkTrZu0gW"
    lines: list[bytes] = []
    for name, value in fields.items():
        lines.extend(
            [
                f"--{boundary}".encode(),
                f'Content-Disposition: form-data; name="{name}"'.encode(),
                b"",
                value.encode(),
            ]
        )
    for name, (filename, content, content_type) in files.items():
        lines.extend(
            [
                f"--{boundary}".encode(),
                f'Content-Disposition: form-data; name="{name}"; filename="{filename}"'.encode(),
                f"Content-Type: {content_type}".encode(),
                b"",
                content,
            ]
        )
    lines.append(f"--{boundary}--".encode())
    lines.append(b"")
    return b"\r\n".join(lines), boundary


def _groq_transcribe_sync(
    audio_bytes: bytes,
    *,
    model: str = "whisper-large-v3",
    filename: str = "audio.webm",
    temperature: float = 0.0,
) -> TranscriptionResult:
    import requests
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required to transcribe audio")
    
    if '.' not in filename:
        filename += '.webm'
        
    ext = filename.split('.')[-1]
    files = {"file": (filename, audio_bytes, f"audio/{ext}")}
    data = {"model": model, "temperature": str(temperature)}
    headers = {"Authorization": f"Bearer {api_key}"}
    
    response = requests.post(
        GROQ_AUDIO_URL,
        headers=headers,
        files=files,
        data=data,
        timeout=60
    )
    
    if not response.ok:
        raise RuntimeError(f"Groq transcription failed with status {response.status_code}: {response.text}")
        
    payload = response.json()
    return TranscriptionResult(text=str(payload.get("text", "")), raw_response=payload)


async def transcribe_audio(
    audio_bytes: bytes,
    *,
    model: str = "whisper-large-v3",
    filename: str = "audio.webm",
    temperature: float = 0.0,
) -> TranscriptionResult:
    async with _SEMAPHORE:
        return await asyncio.to_thread(
            _groq_transcribe_sync,
            audio_bytes,
            model=model,
            filename=filename,
            temperature=temperature,
        )

async def generate_voice_reply(*, objectives: list[str], ai_persona: str, scenario: str, coach_voice: str, level: str, history: list[dict[str, str]]) -> dict[str, Any]:
    messages = build_voice_reply_messages(objectives, ai_persona, scenario, coach_voice, level, history)
    reply_text = await chat(messages)
    
    llm_signaled_complete = False
    if "[SCENARIO_COMPLETE]" in reply_text:
        llm_signaled_complete = True
        reply_text = reply_text.replace("[SCENARIO_COMPLETE]", "").strip()

    try:
        tts_provider = build_tts_provider()
        
        # Select voice based on coach_voice
        voice_id = None
        safe_voice = coach_voice or "female"
        if safe_voice.lower() == "male":
            voice_id = "CwhRBWXzGAHq8TQ4Fs17" # Rogers
        else:
            voice_id = "EST9Ui6982FZPSi7gCHi" # Elise (female default)
            
        tts_result = await tts_provider.synthesize(reply_text, voice_id_override=voice_id)
        reply_audio_b64 = tts_result.audio_b64
    except Exception as e:
        print(f"TTS synthesis failed (e.g. quota exceeded): {e}")
        reply_audio_b64 = None
    
    return {
        "reply_text": reply_text,
        "reply_audio_b64": reply_audio_b64,
        "llm_signaled_complete": llm_signaled_complete,
        "level": level
    }


async def generate_voice_score(*, transcript: str, objectives: list[str], concept_tag: str | None = None) -> dict[str, Any]:
    messages = build_voice_score_messages(transcript, objectives, concept_tag)
    score: VoiceScore = await generate_validated(
        messages=messages,
        schema=VoiceScore,
        task="voice_score"
    )
    return score.model_dump()
