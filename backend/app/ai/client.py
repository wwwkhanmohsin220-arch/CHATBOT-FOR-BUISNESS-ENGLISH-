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

from backend.utils.llm import DEFAULT_GROQ_MODEL, groq_chat, groq_chat_stream

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
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY is required to transcribe audio")
    body, boundary = _encode_multipart(
        {"model": model, "temperature": str(temperature)},
        {"file": (filename, audio_bytes, "application/octet-stream")},
    )
    request = urllib.request.Request(
        GROQ_AUDIO_URL,
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Groq transcription failed with status {exc.code}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Groq transcription failed: {exc.reason}") from exc
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


async def generate_voice_reply(*, transcript: str, objectives: list[str], ai_persona: str, coach_voice: str, level: str) -> dict[str, Any]:
    reply_text = f"{ai_persona} Thanks. Let's keep it {coach_voice.replace('_', ' ')} and continue from: {transcript[:120]}"
    return {"reply_text": reply_text, "reply_audio_b64": None, "objectives_hit": objectives[:1], "level": level}


async def generate_voice_score(*, transcript: str, objectives: list[str], concept_tag: str | None = None) -> dict[str, Any]:
    word_count = len(transcript.split())
    return {
        "tone": 70,
        "fluency": 65 if word_count >= 15 else 50,
        "vocabulary": 60 if word_count >= 10 else 45,
        "grammar": 70 if transcript.endswith((".", "?")) else 55,
        "listening": 70 if objectives else 55,
        "objectives_met": objectives[:],
        "notable_errors": [],
        "one_line_feedback": "Fallback voice scoring is active until the AI voice grader is wired in.",
    }

