# TODO (Person 2 - Backend): Create /chat POST endpoint and /ws WebSocket endpoint
# TODO (Person 1 - AI): Wire LLM streaming and TTS to these endpoints later
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from backend.models.session import SessionManager

router = APIRouter()
session_manager = SessionManager()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    session_id: str | None = None


class ChatResponse(BaseModel):
    response: str
    status: str


def _build_prompt(message: str, history: list) -> str:
    if not history:
        return message

    history_text = "\n".join(str(item) for item in history)
    return f"Conversation history:\n{history_text}\n\nUser message:\n{message}"


def _generate_response(prompt: str) -> ChatResponse:
    try:
        from backend.services.llm_service import LLMService

        llm_service = LLMService()
        response_text = llm_service.generate_response_basic(prompt)
        return ChatResponse(response=response_text, status="success")
    except Exception as exc:
        return ChatResponse(
            response=f"LLM service is not ready yet: {exc}",
            status="error",
        )


def _parse_websocket_message(raw_message: str) -> str:
    try:
        payload = json.loads(raw_message)
    except json.JSONDecodeError:
        return raw_message

    if payload.get("action") != "send_message":
        return "Unsupported WebSocket action."

    return payload.get("text", "")


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    history = []
    if payload.session_id:
        history = session_manager.get_history(payload.session_id)
        session_manager.add_message(payload.session_id, "user", payload.message)

    prompt = _build_prompt(payload.message, history)
    chat_response = _generate_response(prompt)

    if payload.session_id:
        session_manager.add_message(
            payload.session_id,
            "assistant",
            chat_response.response,
        )

    return chat_response


@router.post("/chat/stream")
async def chat_stream_endpoint(payload: ChatRequest) -> StreamingResponse:
    session_id = payload.session_id or "default_session"
    history = session_manager.get_history(session_id)
    prompt = _build_prompt(payload.message, history)

    async def text_streamer():
        try:
            from backend.services.llm_service import LLMService

            llm_service = LLMService()
            full_response_accumulator = []

            async for token in llm_service.generate_response_stream(prompt):
                full_response_accumulator.append(token)
                yield token

            complete_reply = "".join(full_response_accumulator)
            session_manager.add_message(session_id, "user", payload.message)
            session_manager.add_message(session_id, "assistant", complete_reply)
        except Exception as exc:
            yield f"Streaming error: {exc}"

    return StreamingResponse(text_streamer(), media_type="text/plain")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        while True:
            raw_message = await websocket.receive_text()
            message_text = _parse_websocket_message(raw_message)

            await websocket.send_json(
                {
                    "type": "text_token",
                    "content": f"Echo: {message_text}",
                }
            )
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        return
