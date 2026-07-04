# Mohsin's Task Tracking (Mohsin - Infrastructure Layer)
*(Note: Umer = Umer / Intelligence, Talha = Talha / Frontend)*

## Today - 2026-07-02
- [x] Read `docs/ROADMAP.md` and `docs/api_contract.md`
- [x] Create Mohsin sprint task tracker
- [x] Scaffold FastAPI app in `backend/main.py`
- [x] Mount API router in `backend/main.py`
- [x] Prepare `/chat` and `/ws` as the next small backend features
- [x] Add baseline `/chat` POST route with Pydantic request/response models
- [x] Add baseline `/ws` WebSocket echo endpoint
- [x] Add `SessionManager` Redis wrapper with in-memory fallback

## Phase 1 (Days 1-3): Foundations
### Mohsin - Mohsin / Infrastructure
- [x] Scaffold FastAPI app with a `/chat` POST endpoint
- [x] Add a `/ws` WebSocket endpoint that echoes messages back
- [x] Set up Redis-compatible session layer with local fallback
- [x] Write a simple Redis get/set wrapper

### Umer - Umer / Intelligence
- [x] Set up a basic non-streaming Gemini call in `llm_service.py`
- [x] Write a robust first version of the system prompt in `llm_service.py`
- [x] Set up the RAG pipeline foundation in `rag_service.py`

### Talha - Talha / Frontend
- [x] Build a static chat UI with hardcoded bot responses
- [x] Add a WebSocket client that connects to Mohsin's echo server
- [x] Add a basic mic recording button with no backend dependency yet

## Phase 2 (Days 4-5): Integration
### Mohsin - Mohsin / Infrastructure
- [x] Add `SessionManager` to pull the last 10 messages from Redis per session
- [x] Test session memory flow successfully
- [x] Return the exact JSON response shape from `docs/api_contract.md`
- [x] Keep `/chat` non-streaming first so Umer can wire the LLM call cleanly

### Umer - Umer / Intelligence
- [x] Wire the LLM call into Mohsin's `/chat` endpoint once it is ready
- [x] Test whether the bot correctly fixes a business English mistake

### Talha - Talha / Frontend
- [x] Connect the real WebSocket client to the backend
- [x] Render actual bot responses in the chat UI
- [x] Handle loading state while waiting for a response

## Phase 3 (Days 6-8): Streaming + RAG
### Mohsin - Mohsin / Infrastructure
- [x] Stream LLM text tokens through WebSocket to the frontend
- [x] Add an Arq background task for session archival
- [x] Persist closed sessions to PostgreSQL
- [x] Test PostgreSQL/session archival flow successfully

### Umer - Umer / Intelligence
- [x] Upgrade `llm_service.py` to stream tokens as an async generator
- [x] Hook `rag_service.py` into `llm_service.py` to inject retrieved context

### Talha - Talha / Frontend
- [x] Render streaming tokens as they arrive
- [x] Add grammar highlighting for corrected words

## Phase 4 (Days 9-10): Voice + Polish + Deploy
### Mohsin - Mohsin / Infrastructure
- [x] Stream audio bytes back through WebSocket
- [x] Test ElevenLabs voice module with `test_voice.py`
- [ ] Dockerise the backend app
- [ ] Test Nginx load balancing with 2 backend instances

### Umer - Umer / Intelligence
- [x] Implement `tts_service.py` with ElevenLabs WebSocket streaming
- [x] Pipe LLM streaming text chunks into `tts_service.py` to get audio bytes

### Talha - Talha / Frontend
- [x] Add Web Audio API playback for streamed audio bytes
- [ ] Add vocabulary pop-up UI
- [ ] Run final end-to-end test: speak -> transcribe -> reply -> hear
