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
        from backend.services.rag_service import RAGService

        llm_service = LLMService()
        rag_service = RAGService()
        
        # 1. Retrieve the curriculum context
        context = rag_service.retrieve_context(prompt)
        
        # 2. Pass both the prompt and the context to your LLM
        response_text = llm_service.generate_response_basic(prompt, rag_context=context)
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


def _parse_websocket_payload(raw_message: str) -> dict:
    try:
        payload = json.loads(raw_message)
    except json.JSONDecodeError:
        return {
            "text": raw_message,
            "session_id": "default_session",
            "error": None,
        }

    if payload.get("action") != "send_message":
        return {
            "text": "",
            "session_id": payload.get("session_id") or "default_session",
            "error": "Unsupported WebSocket action.",
        }

    return {
        "text": payload.get("text", ""),
        "session_id": payload.get("session_id") or "default_session",
        "error": None,
    }


async def _archive_session_later(session_id: str, history: list[dict]) -> None:
    if not history:
        return

    try:
        from arq import create_pool
        from backend.tasks import get_redis_settings

        redis = await create_pool(get_redis_settings())
        await redis.enqueue_job("archive_session", session_id, history)
        try:
            await redis.close()
        except TypeError:
            redis.close()
    except Exception:
        from backend.models.database import DatabaseManager

        database_manager = DatabaseManager()
        await database_manager.save_session(
            {
                "session_id": session_id,
                "messages": history,
            }
        )


async def _archive_active_session(active_session_id: str | None) -> None:
    if not active_session_id:
        return

    history = session_manager.get_history(active_session_id)
    await _archive_session_later(active_session_id, history)


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
        await _archive_session_later(
            payload.session_id,
            session_manager.get_history(payload.session_id),
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
            from backend.services.rag_service import RAGService

            llm_service = LLMService()
            rag_service = RAGService()
            full_response_accumulator = []

            # Retrieve RAG context
            context = rag_service.retrieve_context(prompt)

            async for token in llm_service.generate_response_stream(prompt, rag_context=context):
                full_response_accumulator.append(token)
                yield token

            complete_reply = "".join(full_response_accumulator)
            session_manager.add_message(session_id, "user", payload.message)
            session_manager.add_message(session_id, "assistant", complete_reply)
            await _archive_session_later(
                session_id,
                session_manager.get_history(session_id),
            )
        except Exception as exc:
            yield f"Streaming error: {exc}"

    return StreamingResponse(text_streamer(), media_type="text/plain")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    active_session_id = None

    try:
        while True:
            raw_message = await websocket.receive_text()
            websocket_payload = _parse_websocket_payload(raw_message)
            message_text = websocket_payload["text"]
            session_id = websocket_payload["session_id"]
            active_session_id = session_id

            if websocket_payload["error"]:
                await websocket.send_json(
                    {
                        "type": "text_token",
                        "content": websocket_payload["error"],
                    }
                )
                await websocket.send_json({"type": "done"})
                continue

            if not message_text:
                continue

            from backend.services.llm_service import LLMService
            from backend.services.rag_service import RAGService
            from backend.services.tts_service import TTSService

            llm_service = LLMService()
            rag_service = RAGService()
            tts_service = TTSService()

            history = session_manager.get_history(session_id)
            prompt = _build_prompt(message_text, history)

            # 1. Retrieve Context
            context = rag_service.retrieve_context(prompt)

            # 2. Get the LLM text generator
            llm_generator = llm_service.generate_response_stream(prompt, rag_context=context)
            full_response_accumulator = []

            async def text_chunks_for_tts():
                async for chunk in llm_generator:
                    full_response_accumulator.append(chunk)
                    await websocket.send_json(
                        {
                            "type": "text_token",
                            "content": chunk,
                        }
                    )
                    yield chunk

            if tts_service.api_key:
                audio_generator = tts_service.stream_audio_from_text(text_chunks_for_tts())
                async for audio_chunk in audio_generator:
                    await websocket.send_json(
                        {
                            "type": "audio_chunk",
                            "audio_base64": audio_chunk,
                        }
                    )
            else:
                async for chunk in text_chunks_for_tts():
                    pass

            complete_reply = "".join(full_response_accumulator)
            session_manager.add_message(session_id, "user", message_text)
            session_manager.add_message(session_id, "assistant", complete_reply)
            await _archive_session_later(
                session_id,
                session_manager.get_history(session_id),
            )

            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        await _archive_active_session(active_session_id)
        return
    except Exception:
        await _archive_active_session(active_session_id)
        raise
