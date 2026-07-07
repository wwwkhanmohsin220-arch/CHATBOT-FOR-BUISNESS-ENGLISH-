"""
@ai-restriction
Primary Owners: Mohsin & Talha
Umer: Do not modify WebSocket connections or streaming logic.
Mohsin: Manage ElevenLabs integration and voice states here.
Talha: Manage database connections and conversational states here.
"""

from fastapi import APIRouter, WebSocket

ws_router = APIRouter()

@ws_router.websocket("/ws/voice")
async def voice_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"status": "connected"})
