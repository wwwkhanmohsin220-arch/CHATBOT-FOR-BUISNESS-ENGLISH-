# Full Project Roadmap & Learning Guide

**Project:** Business English Tutor (FastAPI, RAG, ElevenLabs, 3-Person Team)

## Part 1: Project Roadmap & Role Distribution

Three people, three layers: Intelligence, Infrastructure, Interface. Each person owns a clear domain so no one blocks another.

### Person 1: AI & RAG Engineer
*The Brain: owns everything that decides what the bot says and sounds like*

**Core Responsibilities:**
- LLM integration with streaming responses (Gemini/OpenAI, token-by-token)
- System prompt design: Business English tutor persona, correction style, scenario simulation
- RAG pipeline: document chunking strategy, embeddings, vector DB (Chroma / FAISS / pgvector)
- Tuning how retrieved context merges into the prompt without breaking streaming
- ElevenLabs integration: text-chunk-to-speech streaming via WebSocket
- Voice/persona selection and latency optimisation
- Evaluation set: 20 common business-English mistakes, testing correction accuracy + RAG relevance

**Skills Required:**
- **Python:** async/await, generators, JSON handling
- **Prompt engineering:** system prompts, few-shot examples, temperature tuning
- **Embeddings & vector search:** what similarity search is, chunk size/overlap
- **LangChain or LlamaIndex:** orchestration layer for RAG
- **ElevenLabs API:** WebSocket streaming TTS

### Person 2: Backend & Infrastructure Engineer
*The Engine: keeps everything alive under load*

**Core Responsibilities:**
- FastAPI app structure, async route design, WebSocket endpoints for chat + audio
- Redis session layer (short-term memory) and SessionManager class (OOP)
- Persistent storage: pushing closed sessions to PostgreSQL/MongoDB
- Background task queue (Celery / Arq) for heavy processing
- Containerisation (Docker) and horizontal scaling behind Nginx
- Wiring Person 1's RAG + LLM + ElevenLabs calls into API endpoints
- Rate-limit handling, retry logic, and fallback responses

**Skills Required:**
- **Python:** FastAPI, OOP, Pydantic models
- **Async programming:** event loop, async/await, non-blocking I/O
- **Redis:** key-value caching, TTL, session patterns
- **Databases:** PostgreSQL or MongoDB basics
- **Docker & Nginx:** containerisation and basics
- **WebSockets:** persistent connections, message framing

### Person 3: Frontend & Integration Engineer
*The Face: everything the user sees and hears*

**Core Responsibilities:**
- Chat UI - Streamlit/Chainlit for fast prototyping OR React/HTML-JS for custom build
- WebSocket client logic to receive streaming text tokens and audio bytes simultaneously
- Audio recording (mic input) and playback pipeline using Web Audio API
- UI feedback: grammar-correction highlighting, vocabulary suggestion pop-ups
- Bot speaking/typing indicators and smooth stream rendering
- End-to-end testing of the full loop: type/speak stream → hear response
- Catching latency or sync issues between text and audio

**Skills Required:**
- **JavaScript/HTML/CSS** or Python (Streamlit/Chainlit)
- **WebSocket client API:** connecting, receiving chunks, handling disconnects
- **Web Audio API:** buffer queuing, playback sequencing
- **UX fundamentals:** chat interface patterns, loading states
- **Basic testing:** simulating slow networks, verifying audio-text sync

### Shared (All Three)
*Nobody owns these alone*

- **API contract design:** agree on JSON request/response shapes before coding
- **Git workflow:** branching, pull requests, merge conflict resolution
- **Load testing:** simulate 100+ concurrent users, find the real bottleneck
- **Provider decisions:** LLM, embedding model, voice (cost vs rate limits affects everyone)

---

## Part 2: Architecture Overview

### Data Flow

| Step | Component | Action |
| :--- | :--- | :--- |
| 1. User | Browser/Mobile App | Sends text or voice from the browser / mobile app |
| 2. Frontend | Client UI | Encodes audio text (STT) if needed; opens WebSocket to backend |
| 3. FastAPI | Backend | Receives message, pulls session history from Redis, authenticates |
| 4. RAG Layer | Vector DB | Embeds user query, queries vector DB, retrieves relevant curriculum chunks |
| 5. LLM | Gemini/GPT | Receives [history + RAG context + user message], streams tokens back |
| 6. ElevenLabs | TTS Service | Receives streamed text chunks, returns streamed audio bytes |
| 7. Frontend | Client UI | Plays audio chunks immediately; renders text corrections in UI |
| 8. PostgreSQL | Database | On session end, full history persisted for analytics/progress tracking |

### Technology Decisions

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Web framework** | FastAPI | Native async, WebSocket support, auto docs |
| **Short-term memory** | Redis | Ultra-fast, in-memory, TTL support |
| **Long-term storage** | PostgreSQL | Relational, good for progress analytics |
| **Vector DB** | pgvector/Chroma | pgvector reuses Postgres; Chroma is simpler for prototyping |
| **LLM** | Gemini/GPT-4o | Strong instruction-following, streaming API available |
| **TTS** | ElevenLabs | Best streaming quality; WebSocket API |
| **Containerisation** | Docker + Nginx | Consistent deploys, easy horizontal scaling |
| **Task queue** | Arq / Celery | Offload heavy jobs (progress reports, batch eval) |

---

## Part 3: Build Timeline (1.5-Week Sprint / ~10 Days)

*The rule: each person is unblocked from day 1. Integration happens every 2-3 days, not at the end of the project.*

### Phase 1 (Days 1-3): Foundations
| Role | Tasks |
| :--- | :--- |
| **Person 1** | - Set up Gemini API key and make a basic non-streaming call in isolation<br>- Write the first version of the system prompt<br>- Install Chroma locally, embed a small test document |
| **Person 2** | - Scaffold FastAPI app with a `/chat` POST endpoint<br>- Add a `/ws` WebSocket endpoint that echoes messages back<br>- Set up Redis locally, write a simple get/set wrapper |
| **Person 3** | - Build a static chat UI with hardcoded bot responses<br>- Add a WebSocket client that connects to Person 2's echo server<br>- Basic mic recording button (no backend yet) |

### Phase 2 (Days 4-5): Integration
| Role | Tasks |
| :--- | :--- |
| **Person 1** | - Wire LLM call into Person 2's `/chat` endpoint (non-streaming first)<br>- Test: does the bot correct a grammar mistake? |
| **Person 2** | - Add SessionManager: pull last 10 messages from Redis per session<br>- Return proper JSON shape agreed in API contract |
| **Person 3** | - Connect real WebSocket to real backend<br>- Render actual bot responses in the chat UI<br>- Handle loading state while waiting for response |

### Phase 3 (Days 6-8): Streaming + RAG
| Role | Tasks |
| :--- | :--- |
| **Person 1** | - Enable LLM token streaming; test chunk delivery to Person 2<br>- Add RAG: embed business English curriculum, hook retrieval into prompt |
| **Person 2** | - Stream LLM tokens through WebSocket to frontend<br>- Add Arq background task for session archival to PostgreSQL |
| **Person 3** | - Render streaming tokens as they arrive (word by word)<br>- Add grammar highlighting for corrected words |

### Phase 4 (Days 9-10): Voice + Polish + Deploy
| Role | Tasks |
| :--- | :--- |
| **Person 1** | - Add ElevenLabs streaming TTS; pipe LLM chunks → ElevenLabs audio bytes |
| **Person 2** | - Stream audio bytes back via WebSocket<br>- Dockerise app, test Nginx load balancing with 2 instances |
| **Person 3** | - Web Audio API playback of streamed audio bytes<br>- Vocabulary pop-up UI, final design polish<br>- End-to-end test: speak → transcribe → reply → hear |

---

## Part 4: Learning Material

**What to Study Before Coding**
*Study these in order. Every person should skim all sections; go deep on the ones marked for your role.*

### 1. Foundational Programming Concepts (Everyone)
- **Python OOP & Classes:** You will build a SessionManager class. Understand `__init__`, instance methods, and encapsulation.
- **Async / Await & the Event Loop:** Understand why blocking I/O kills concurrency. Know what `async def` and `await` actually do.
- **Generators & Iterators:** Streaming responses come back as generators. Know how `yield` and `for chunk in stream` work.
- **JSON & Serialisation:** Every message between every layer is JSON. Know `json.dumps`/`json.loads` and Pydantic models.
- **Environment Variables & Secrets:** API keys must never be hardcoded. Use `python-dotenv` or OS env vars.
- **Decorators:** FastAPI routes are Python decorators (`@app.get`, `@app.post`). Understand how they wrap functions.

### 2. Web & API Fundamentals (Everyone)
- **HTTP Basics:** Methods (GET/POST), status codes (200/404/429), headers, request/response cycle.
- **REST API Design:** What makes an endpoint RESTful. Path params vs query params vs request body.
- **WebSockets vs HTTP:** Why normal request/response can't do real-time streaming. What a persistent connection is.
- **CORS:** You will hit this error. Know what it is and how FastAPI's `CORSMiddleware` fixes it.
- **API Authentication:** How to pass API keys securely in headers. Never in query strings or client-side code.
- **Rate Limiting & 429 Errors:** The real bottleneck is external APIs, not your server. Know retry logic and exponential backoff.

### 3. LLM-Specific Concepts (Person 1 deep, others skim)
- **Tokenisation & Context Window:** An LLM reads tokens, not words. Context window = max tokens in one call (input + output).
- **Stateless Nature of LLMs:** The model remembers nothing between calls. You must send the full history every time.
- **System Prompt vs User Prompt:** System prompt sets persona and rules. User prompt is the actual conversation.
- **Streaming Responses:** LLMs can return tokens one-by-one. Know what a 'delta' chunk looks like in the API response.
- **Temperature & Max Tokens:** Temperature 0 = deterministic/predictable. Higher = creative but inconsistent. Know the tradeoff.
- **Hallucination:** LLMs confidently make things up. RAG reduces this by grounding answers in real documents.
- **Prompt Engineering Patterns:** Few-shot examples, chain-of-thought, role assignment, negative constraints.

### 4. RAG Pipeline (Person 1 deep, Person 2 medium)
- **What an Embedding Is:** Text converted to a numeric vector. Similar meaning = similar vectors = close in vector space.
- **Chunking Strategy:** You can't embed a whole textbook. Chunk by sentence, paragraph, or fixed tokens with overlap.
- **Vector Databases:** Store embeddings and search by similarity. Options: Chroma (simple), FAISS (fast), pgvector (Postgres).
- **Retrieval-Augmented Generation Flow:** Query → embed query → search vector DB → retrieve top-k chunks → inject into LLM prompt.
- **RAG vs Fine-Tuning:** RAG = give the model a reference book at query time. Fine-tuning = retrain the model. RAG is cheaper and updatable.

### 5. State & Memory Management (Person 2 deep)
- **Why In-Process State Breaks at Scale:** A Python dict in memory dies on server restart and doesn't work across multiple instances.
- **Redis as a Cache:** Ultra-fast key-value store. Use it for active session history. TTL auto-expires old sessions.
- **PostgreSQL Basics:** Tables, rows, SQL queries. Good for long-term user history and progress analytics.
- **Session Design Patterns:** `session_id` as Redis key, list of message objects as value. Trim to last N messages for token budget.

### 6. Audio & Voice (Person 1 for TTS, Person 3 for playback)
- **TTS vs Streaming TTS:** Non-streaming: wait for full MP3 (4-5s delay). Streaming: receive audio chunks in <1s. Always stream.
- **ElevenLabs WebSocket API:** Send text chunks as they arrive from the LLM. Receive audio bytes back almost instantly.
- **Web Audio API:** Browser API for playing raw audio. Must buffer and queue chunks; can't just append to an audio element.
- **Audio Formats:** ElevenLabs returns PCM or MP3 chunks. Know which format you're receiving and how to decode it.

### 7. Concurrency & Scaling (Person 2 deep, others skim)
- **Async I/O vs Threads vs Processes:** FastAPI uses async I/O. It handles thousands of open connections, but external API calls are still the bottleneck.
- **Background Task Queues:** Celery or Arq: offload slow jobs (progress reports, bulk eval) so the HTTP response returns immediately.
- **Docker Containers:** Package your app + dependencies into a reproducible image. Run multiple instances easily.
- **Nginx as Load Balancer:** Distributes incoming requests across multiple FastAPI container instances.
- **Horizontal vs Vertical Scaling:** Vertical = bigger server. Horizontal = more servers. Horizontal is cheaper and more resilient.

### 8. System Design Thinking (Everyone)
- **Input → Processing → Output Model:** Break any feature into these three things. Identify what state needs to persist between them.
- **Single Point of Failure Analysis:** Ask: what happens if Redis crashes? If ElevenLabs rate-limits you? Always have a fallback.
- **Latency Budgeting:** Measure time in each stage. Optimise the slowest step, not the fastest. Usually it's the LLM.
- **API Contract Design:** Agree on request/response JSON shapes before anyone writes code. Prevents integration hell.

---
**Advice:** Read Engineering Blogs. ByteByteGo (YouTube/newsletter) for system design. Real-world blogs from Uber, Stripe, Discord.

> **One rule above everything:** agree on the API contract (request/response JSON shapes) in Week 1 before anyone writes integration code. Every integration bug you'll ever hit comes from two people silently assuming different shapes. Good luck - build something real!
