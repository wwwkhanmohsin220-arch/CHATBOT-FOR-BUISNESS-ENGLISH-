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

            if not message_text or message_text == "Unsupported WebSocket action.":
                continue

            from backend.services.llm_service import LLMService
            from backend.services.rag_service import RAGService
            from backend.services.tts_service import TTSService

            llm_service = LLMService()
            rag_service = RAGService()
            tts_service = TTSService()

            # 1. Retrieve Context
            context = rag_service.retrieve_context(message_text)

            # 2. Get the LLM text generator
            llm_generator = llm_service.generate_response_stream(message_text, rag_context=context)

            # 3. Intercept the text generator to send text chunks to the frontend 
            #    WHILE piping them to ElevenLabs
            async def intercept_text(generator):
                async for chunk in generator:
                    await websocket.send_json({
                        "type": "text_token",
                        "content": chunk
                    })
                    yield chunk

            # 4. Stream audio from the intercepted text stream
            audio_generator = tts_service.stream_audio_from_text(intercept_text(llm_generator))
            
            if audio_generator:
                async for audio_chunk in audio_generator:
                    await websocket.send_json({
                        "type": "audio_chunk",
                        "audio_base64": audio_chunk
                    })

            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        return
