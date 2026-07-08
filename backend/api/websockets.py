"""
@ai-restriction
Primary Owners: Mohsin & Talha
Umer: Do not modify WebSocket connections or streaming logic.
Mohsin: Manage backend streaming support and conversational states here.
Talha: Manage ElevenLabs integration, voice states, and voice QA here.
"""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

ws_router = APIRouter()


async def _send_transcript(websocket: WebSocket, text: str, is_final: bool) -> None:
    await websocket.send_json(
        {
            "event": "transcript",
            "text": text,
            "is_final": is_final,
        }
    )


async def _send_audio_placeholder(websocket: WebSocket) -> None:
    await websocket.send_json(
        {
            "event": "ai_response_audio",
            "data": "",
        }
    )


@ws_router.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_lesson_id: str | None = None
    received_audio_chunks = 0

    try:
        while True:
            message = await websocket.receive()

            if message.get("text") is not None:
                try:
                    payload = json.loads(message["text"])
                except json.JSONDecodeError:
                    await _send_transcript(websocket, "Invalid JSON payload.", True)
                    continue

                event = payload.get("event")

                if event == "start_session":
                    active_lesson_id = payload.get("lesson_id")
                    await _send_transcript(
                        websocket,
                        "Voice practice session started.",
                        True,
                    )
                    continue

                await _send_transcript(
                    websocket,
                    f"Unsupported voice event: {event}",
                    True,
                )
                continue

            if message.get("bytes") is not None:
                received_audio_chunks += 1
                await _send_transcript(
                    websocket,
                    f"Received audio chunk {received_audio_chunks}.",
                    False,
                )

                # ElevenLabs and AI conversation streaming will plug in here.
                await _send_audio_placeholder(websocket)

    except WebSocketDisconnect:
        print(
            "Voice websocket disconnected",
            {
                "lesson_id": active_lesson_id,
                "audio_chunks": received_audio_chunks,
            },
        )
