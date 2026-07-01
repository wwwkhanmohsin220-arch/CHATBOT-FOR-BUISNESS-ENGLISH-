# TODO (Person 2 - Backend): Create /chat POST endpoint and /ws WebSocket endpoint
# TODO (Person 1 - AI): Wire LLM streaming and TTS to these endpoints later
from fastapi import APIRouter

router = APIRouter()

# Placeholder for REST chat endpoint
@router.post("/chat")
async def chat_endpoint():
    pass

# Placeholder for WebSocket endpoint
@router.websocket("/ws")
async def websocket_endpoint():
    pass
