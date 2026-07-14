"""
@ai-restriction
Primary Owner: Talha
TTS provider seam for voice streaming.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
from dataclasses import dataclass
from typing import Protocol
import urllib.error
import urllib.request


@dataclass(slots=True)
class SpeechResult:
    audio_b64: str | None
    provider: str


class TTSProvider(Protocol):
    async def synthesize(self, text: str) -> SpeechResult:
        ...


class BrowserSpeechProvider:
    async def synthesize(self, text: str) -> SpeechResult:
        return SpeechResult(audio_b64=None, provider="browser")


class ElevenLabsSpeechProvider:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")

    async def synthesize(self, text: str, voice_id_override: str = None) -> SpeechResult:
        if not self.api_key:
            return SpeechResult(audio_b64=None, provider="elevenlabs_missing_key")

        voice_id = voice_id_override or os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")
        model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2")
        output_format = os.getenv("ELEVENLABS_OUTPUT_FORMAT", "mp3_44100_128")
        optimize_streaming_latency = os.getenv("ELEVENLABS_OPTIMIZE_STREAMING_LATENCY", "3")
        enable_logging = os.getenv("ELEVENLABS_ENABLE_LOGGING", "true").lower()
        auto_mode = os.getenv("ELEVENLABS_AUTO_MODE", "false").lower()
        url = (
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream"
            f"?output_format={output_format}"
            f"&optimize_streaming_latency={optimize_streaming_latency}"
            f"&enable_logging={enable_logging}"
            f"&auto_mode={auto_mode}"
        )
        payload = json.dumps(
            {
                "text": text,
                "model_id": model_id,
                "voice_settings": {
                    "stability": float(os.getenv("ELEVENLABS_STABILITY", "0.5")),
                    "similarity_boost": float(os.getenv("ELEVENLABS_SIMILARITY_BOOST", "0.75")),
                },
            }
        ).encode("utf-8")

        request = urllib.request.Request(
            url,
            data=payload,
            headers={
                "xi-api-key": self.api_key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            method="POST",
        )

        try:
            audio_bytes = await asyncio.to_thread(self._fetch_audio_bytes, request)
        except urllib.error.HTTPError as exc:
            print(f"ElevenLabs HTTPError: {exc.code} for voice {voice_id}")
            if hasattr(exc, 'read'):
                print(exc.read().decode('utf-8', errors='replace'))
            if exc.code == 402:
                return SpeechResult(audio_b64=None, provider="elevenlabs_payment_required")

            return SpeechResult(audio_b64=None, provider="elevenlabs_error")
        except Exception as exc:
            import traceback
            traceback.print_exc()
            return SpeechResult(audio_b64=None, provider="elevenlabs_error")

        if not audio_bytes:
            print("ElevenLabs returned empty audio bytes")
            return SpeechResult(audio_b64=None, provider="elevenlabs_empty")

        return SpeechResult(audio_b64=base64.b64encode(audio_bytes).decode("ascii"), provider="elevenlabs")

    @staticmethod
    def _fetch_audio_bytes(request: urllib.request.Request) -> bytes:
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError:
            raise
        except urllib.error.URLError:
            raise


class MockSpeechProvider:
    async def synthesize(self, text: str) -> SpeechResult:
        encoded = base64.b64encode(text.encode("utf-8")).decode("ascii")
        return SpeechResult(audio_b64=encoded, provider="mock")


def build_tts_provider() -> TTSProvider:
    provider = os.getenv("TTS_PROVIDER", "auto").lower()
    has_elevenlabs_key = bool(os.getenv("ELEVENLABS_API_KEY"))

    if provider == "elevenlabs":
        return ElevenLabsSpeechProvider()
    if provider == "mock":
        return MockSpeechProvider()
    if provider == "auto" and has_elevenlabs_key:
        return ElevenLabsSpeechProvider()
    return BrowserSpeechProvider()
