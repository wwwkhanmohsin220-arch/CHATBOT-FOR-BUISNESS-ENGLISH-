# Talha's Updated Tasks — AI Brain, Voice API & Voice Frontend

> **Last synced:** July 12, 2026
> **Source of truth:** [`buslingo_implementation_blueprint.md`](./buslingo_implementation_blueprint.md)
> **CRITICAL OVERRIDE:** We are skipping v1 fallbacks and building the **v2 route NOW** (pgvector RAG, WebSocket streaming voice with barge-in).
> **Branch:** `test_concept`

---

## Current State of Your Domain (What Already Exists)

### ✅ Fully Working

| Module | File | What it does | Status |
|--------|------|-------------|--------|
| **Groq Client** | `utils/llm.py` (280 lines) | `groq_chat()` and `groq_chat_stream()` using `urllib.request` (no SDK dependency). Supports streaming via SSE parsing. Uses `GROQ_API_KEY` env var. | **Done** |
| **`generate_validated()`** | `utils/llm.py:252-278` | Pydantic repair loop: calls Groq in JSON mode → validates against schema → if fails, feeds errors back to LLM and retries (up to 2 repairs). Logs failures to `llm_failures` table. | **Done** |
| **AI Compiler** | `app/ai/compiler.py` (308 lines) | `compile_lesson()` loads slot from `curriculum.json`, loads user profile from DB, calls `generate_validated()` with `LessonBundle` schema. Falls back to `_fallback_bundle()` if Groq fails. Persists compile metadata. | **Done — but using skeleton prompt** |
| **Compile Prompt** | `prompts/compile.py` (24 lines) | Bare skeleton: "You are the lesson compiler... Return JSON only." No detailed instructions, no node type specifications, no branching rules. | **Needs major expansion** |
| **Grade Prompt** | `prompts/grade.py` (30 lines) | Bare skeleton with anchored scoring (9-10, 5-6, 0-4). No detailed rubric instructions. | **Needs expansion** |
| **QnA Prompt** | `prompts/qna.py` (27 lines) | Skeleton: classifies scope as core/adjacent/off_topic. | **Needs expansion** |
| **Coach Prompt** | `prompts/coach.py` (25 lines) | Skeleton: summarizes lesson attempts and recommends next steps. | **Needs expansion** |
| **Voice Prompt** | `prompts/voice.py` (48 lines) | Most complete prompt. Voice reply prompt uses persona, scenario, objectives, coach voice. Voice scorer prompt for `VoiceScore` schema. | **Mostly done** |
| **AI Client** | `app/ai/client.py` (155 lines) | Groq Whisper transcription via `GROQ_AUDIO_URL`. Multipart encoding for audio blobs. `chat()` and `chat_stream()` wrappers. Voice reply and score generation. | **Done** |
| **AI Grader** | `app/ai/grader.py` (26 lines) | Thin wrapper. Imports `generate_validated` and `grade_prompt`, used by `core/writing.py`. | **Done (thin)** |
| **AI QnA** | `app/ai/qna.py` (11 lines) | Thin wrapper. `qna_prompt()` calls `build_qna_messages()`. | **Done (thin)** |
| **AI Coach** | `app/ai/coach.py` (11 lines) | Thin wrapper. Not yet called from anywhere. | **Shell only** |
| **TTS Service** | `services/tts.py` (127 lines) | Decision tree: `GroqTTSProvider` → `ElevenLabsSpeechProvider` → `BrowserSpeechProvider` fallback. `GroqTTSProvider` uses Groq's playai TTS API. `build_tts_provider()` reads `TTS_PROVIDER` env var. | **Done** |
| **Voice Pipeline** | `services/voice_pipeline.py` (110 lines) | `VoicePipeline` class with session state, streaming via `chat_stream()`, TTS synthesis on final turn. | **Done** |
| **WebSocket Route** | `api/websockets.py` (142 lines) | `ws://host/ws/voice`. Handles `start_session`, `audio_chunk`, `transcript`, `end_session`. JWT auth from headers. | **Done** |
| **Voice REST** | `api/voice.py` (358 lines) | `POST /transcribe`, `POST /voice-turn/{instance_id}`, `POST /voice-finish/{instance_id}`. Session state in `core/voice.py`. | **Done** |
| **Pydantic Schemas** | `models/schema.py` | `LessonBundle`, `LessonNode`, `SlotContext`, `WritingRubric`, `VoiceScore`, `QnAResponse` — all with strict field validators and canonical tag enforcement. | **Done** |

### ⚠️ Known Issues

| Issue | Details |
|-------|---------|
| **Compile prompt is too thin** | `prompts/compile.py` is 24 lines. The Blueprint §4 specifies exactly how a `LessonBundle` must be structured: theory → MCQ → voice → writing, with concept-tagged branches. The prompt doesn't enforce any of this. |
| **No seed scripts** | `scripts/seed_curriculum.py` and `scripts/seed_fixtures.py` don't exist. The Blueprint Phase 1 requires these. |
| **`curriculum.json` has only 1 slot** | Only `u1l1` exists. The compiler needs real slot data to generate diverse lessons. Mohsin needs to expand this, but your prompts need to handle the expanded data properly. |
| **Grader prompt is too thin** | `prompts/grade.py` doesn't specify the exact `WritingRubric` JSON schema fields. The LLM may hallucinate incorrect field names. |
| **Voice frontend is a UI shell** | `ThreadedVoice.tsx` renders the walkie-talkie UI but the MediaRecorder → WebSocket → Whisper → TTS loop isn't fully wired on the frontend side. |
| **No CI/CD** | GitHub Actions not set up for `main` branch protection. |

---

## What You Need to Do Next

### 🔴 Phase 1 Completion

1. **Write `scripts/seed_curriculum.py`** — Connect directly to Supabase via `asyncpg` and insert at least 6 slots across 2 units into the `units` and `lesson_slots` tables. Use the `curriculum.json` format as reference.
2. **Write `scripts/seed_fixtures.py`** — Insert mock dummy data into `user_profiles`, `vocab_terms`, `daily_activity` so the Dashboard and SRS pages have real data to show.
3. **Finish `ThreadedVoice.tsx` V2 wiring** — Skip the walkie-talkie REST flow. Connect the frontend directly to `ws://host/ws/voice` for real-time WebSocket streaming with barge-in support.

### 🟡 Phase 2 (The Brain)

1. **Expand `prompts/compile.py`** — This is your most critical task. The prompt must enforce the Blueprint §4 structure:
   - Exactly 1 theory node, 1-2 MCQ nodes, 1 voice node, 1 writing node per `LessonBundle`
   - Each node must have a `concept_tag` from `CANONICAL_TAGS`
   - Branches dict must have a pre-compiled targeted fix for each concept tag
   - MCQ must have `correct_index`, `options` (exactly 3), and `explanations` (keyed by index)
   - Voice must have `scenario`, `ai_persona`, `objectives`, `opening_line`
   - Writing must have `prompt` and `success_criteria`
2. **Expand `prompts/grade.py`** — Add the exact `WritingRubric` JSON schema to the system prompt so the LLM returns `tone: {score, explanation}`, `clarity: {score, explanation}`, `structure: {score, explanation}`, `overall_comment`, `suggested_rewrite`, `detected_concept_errors`.
3. **Test `generate_validated()` end-to-end** — Call `compile_lesson()` with a real slot and verify the Groq output validates against `LessonBundle`. If it fails, tune the prompts.

### 🟡 Phase 3 (Grading & Voice)

1. **Expand `prompts/coach.py`** — Write the coach summary prompt that names what the next lesson will focus on (Blueprint §8).
2. **Integrate WebSocket frontend** — Wire `ThreadedVoice.tsx` to `ws://host/ws/voice` for real-time streaming.
3. **Write `prompts/grade.py` properly** — Full grading prompt with anchored scoring rubric.

### ⬜ Phase 4 (Full Voice Pipeline & RAG)

1. **pgvector RAG Integration** — Ensure the Compiler and QnA prompts query Umer's pgvector tables (`document_chunks`) via the new search API instead of just reading `curriculum.json`.
2. **WebSocket Barge-in refinement** — Fine-tune the VAD and generation cancellation logic for seamless barge-in on the V2 WebSocket.
3. **Monitor `llm_failures`** — Track prompt degradation over time via the `llm_failures` table.
4. **Set up GitHub Actions CI/CD** — Protect `main` branch with automated tests.

---

## Files You Own (with `@ai-restriction`)

**AI Brain:** `app/ai/__init__.py`, `app/ai/client.py`, `app/ai/compiler.py`, `app/ai/grader.py`, `app/ai/qna.py`, `app/ai/coach.py`
**Prompts:** `prompts/compile.py`, `prompts/grade.py`, `prompts/qna.py`, `prompts/coach.py`, `prompts/voice.py`
**LLM Utils:** `utils/llm.py`
**TTS:** `services/tts.py`
**Voice Pipeline:** `services/voice_pipeline.py` (shared with Mohsin)
**WebSocket:** `api/websockets.py` (shared with Mohsin)
**Scripts:** `scripts/seed_curriculum.py` (to create), `scripts/seed_fixtures.py` (to create)
**Frontend Voice:** `components/lesson/ThreadedVoice.tsx`

## Files You Must NOT Touch

- `frontend/app/page.tsx`, `frontend/components/lesson/ThreadedTheory.tsx`, `ThreadedMCQ.tsx`, `QnADrawer.tsx` — Umer
- `backend/api/lessons.py`, `api/dashboard.py`, `api/progress.py`, `api/srs.py` — Mohsin
- `backend/core/database.py`, `core/stats.py`, `core/srs.py` — Mohsin
- `backend/scripts/ingest_documents.py`, `backend/api/qna.py` — Umer
