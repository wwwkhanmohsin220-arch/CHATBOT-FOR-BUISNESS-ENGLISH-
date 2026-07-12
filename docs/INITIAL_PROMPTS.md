# AI Handoff Prompts for Mohsin and Talha

> **Last synced:** July 12, 2026 — after full codebase cleanup and audit.

When you pass the `test_concept` branch to Mohsin and Talha, they should copy-paste the exact prompt below into their AI IDE.

---

## Prompt for Mohsin's AI

```text
Hello! I am Mohsin, Backend Architect & DB owner for Buslingo.

Umer just completed a full codebase cleanup on the `test_concept` branch and the project is roughly 40-50% complete. Here is what you need to know:

1. Read `docs/buslingo_implementation_blueprint.md` — this is the ONLY source of truth. **HOWEVER, we are explicitly executing the v2 route NOW.** Skip the v1 walkie-talkie and JSON-extraction fallbacks. We are building the full v2 features immediately (pgvector RAG, WebSocket streaming voice with barge-in).
2. Read `docs/phases_mohsin.md` — this is my exact task list with a file-by-file audit of what already exists and what I need to build.
3. Read `docs/ROADMAP.md` for the team-wide phase breakdown.
4. Obey `@ai-restriction` ownership tags at the top of every file.

What already works:
- Full Supabase JWT auth (`core/auth.py`) with `get_current_user` and `get_optional_current_user`
- Lesson runtime state machine (`api/lessons.py`, 852 lines): GET /nodes/current, POST /attempt, POST /writing/submit, POST /complete
- Director Rule #1: 2nd MCQ failure injects targeted_fix at position n+0.5
- EMA stats engine (`core/stats.py`), SM-2 SRS (`core/srs.py`), writing grading (`core/writing.py`)
- Dashboard API (`api/dashboard.py`) — works but falls back to hardcoded mock data
- Voice REST + WebSocket routes exist and are functional
- RAG pipeline: pgvector tables created, ingestion script works, search API written (needs wiring into routes.py)

What I need to do RIGHT NOW (Phase 1 blockers):
1. Apply core schema.sql DDL to Supabase and enable RLS
2. Add SUPABASE_JWT_SECRET to backend/.env
3. Fix hardcoded GET /me endpoint to query real user_profiles
4. Build PATCH /api/me/settings endpoint
5. Expand curriculum.json from 1 slot to 6+ slots across 2 units
6. Wire Umer's RAG router (add `from backend.api.qna import router as qna_router` to routes.py)

DO NOT touch: frontend/components/lesson/*, backend/app/ai/*, backend/prompts/*, backend/utils/llm.py, backend/scripts/ingest_documents.py

Let's start with my Phase 1 tasks from phases_mohsin.md.
```

---

## Prompt for Talha's AI

```text
Hello! I am Talha, AI Brain & Voice engineer for Buslingo.

Umer just completed a full codebase cleanup on the `test_concept` branch and the project is roughly 40-50% complete. Here is what you need to know:

1. Read `docs/buslingo_implementation_blueprint.md` — this is the ONLY source of truth. **HOWEVER, we are explicitly executing the v2 route NOW.** Skip the v1 walkie-talkie and JSON-extraction fallbacks. We are building the full v2 features immediately (pgvector RAG, WebSocket streaming voice with barge-in).
2. Read `docs/phases_talha.md` — this is my exact task list with a file-by-file audit of what already exists and what I need to build.
3. Read `docs/ROADMAP.md` for the team-wide phase breakdown.
4. Obey `@ai-restriction` ownership tags at the top of every file.

What already works in MY domain:
- Groq client (`utils/llm.py`, 280 lines): groq_chat(), groq_chat_stream(), generate_validated() with Pydantic repair loop
- AI Compiler (`app/ai/compiler.py`, 308 lines): compile_lesson() with fallback bundle. Calls generate_validated() with LessonBundle schema.
- TTS service (`services/tts.py`): Groq TTS → ElevenLabs → Browser fallback decision tree
- Voice pipeline (`services/voice_pipeline.py`): Session state, streaming via chat_stream(), TTS synthesis
- WebSocket route (`api/websockets.py`): ws://host/ws/voice with auth. **This is our primary V2 voice transport.**
- Voice REST endpoints (`api/voice.py`): POST /transcribe, POST /voice-turn, POST /voice-finish (Legacy V1, migrating to V2 WebSockets)
- Groq Whisper transcription in `app/ai/client.py` with multipart encoding
- Voice prompt (`prompts/voice.py`): Uses persona, scenario, objectives, coach voice
- All Pydantic schemas (LessonBundle, VoiceScore, WritingRubric, QnAResponse) are defined in models/schema.py

What needs work:
- prompts/compile.py is a 24-line skeleton — needs to enforce Blueprint §4 structure (theory→MCQ→voice→writing with concept-tagged branches)
- prompts/grade.py is a 30-line skeleton — needs the exact WritingRubric JSON schema
- prompts/coach.py is a 25-line skeleton — needs coach summary logic
- scripts/seed_curriculum.py and scripts/seed_fixtures.py don't exist yet
- ThreadedVoice.tsx frontend is a UI shell — MediaRecorder→backend loop not fully wired

DO NOT touch: frontend/components/lesson/ThreadedTheory.tsx, ThreadedMCQ.tsx, QnADrawer.tsx, backend/api/lessons.py, api/dashboard.py, api/progress.py, api/srs.py, core/database.py, core/stats.py, core/srs.py, backend/scripts/ingest_documents.py

Let's start with my Phase 1 tasks from phases_talha.md.
```
