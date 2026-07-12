# Mohsin's Updated Tasks — Backend DB & Dashboard Frontend

> **Last synced:** July 12, 2026
> **Source of truth:** [`buslingo_implementation_blueprint.md`](./buslingo_implementation_blueprint.md)
> **CRITICAL OVERRIDE:** We are skipping v1 fallbacks and building the **v2 route NOW** (pgvector RAG, WebSocket streaming voice with barge-in).
> **Branch:** `test_concept`

---

## Current State of the Backend (What Already Exists)

### ✅ Fully Working

| Module | File | What it does |
|--------|------|-------------|
| **Auth (JWT)** | `core/auth.py` (163 lines) | Full Supabase JWT verification with `get_current_user` and `get_optional_current_user`. Checks HS256 signature, expiry, audience, issuer. **This is DONE.** |
| **Auth API** | `api/auth.py` (182 lines) | `/auth/signup`, `/auth/login`, `/auth/sync`. Sync upserts into `user_profiles` and seeds `user_stats`. |
| **Lesson Runtime** | `api/lessons.py` (852 lines) | The big one. `GET /curriculum`, `GET /nodes/current`, `POST /attempt`, `POST /writing/submit`, `POST /complete`, `POST /qna`. Full state machine with `FOR UPDATE` row-level locking. |
| **Director Rule #1** | `api/lessons.py:560-611` | On 2nd MCQ failure, injects `targeted_fix` at position `n+0.5`. Marks branch as consumed. Max 2 injections per instance. |
| **XP Awards** | `api/lessons.py:102-113` | Idempotent `xp_events` insert on lesson completion with `ON CONFLICT DO NOTHING`. |
| **Writing Grading** | `core/writing.py` (118 lines) | `grade_writing_draft()` tries Talha's AI grader first, falls back to deterministic heuristic rubric. Records `writing`, `tone`, `grammar` axis scores. |
| **EMA Stats** | `core/stats.py` (247 lines) | `record_stat_event()`, `record_axis_score()`, `seed_user_stats()`, `get_user_progress()`. Full EMA math with α=0.15 across 6 axes. |
| **SRS (SM-2)** | `core/srs.py` (215 lines) | `sm2_update()`, `ensure_vocab_terms()`, `ensure_srs_cards_for_terms()`, `get_due_cards()`, `review_cards()`, `get_srs_stats()`. Full SuperMemo-2 algorithm. |
| **SRS API** | `api/srs.py` (104 lines) | `GET /srs/due`, `POST /srs/review`, `GET /srs/stats`. |
| **Dashboard API** | `api/dashboard.py` (225 lines) | `GET /dashboard` queries `user_profiles`, `activity_days`, `lesson_instances`, SRS stats. Falls back to hardcoded mock data on any DB error. `GET /me` returns hardcoded "Umer". |
| **Progress API** | `api/progress.py` (27 lines) | `GET /progress` delegates to `get_user_progress()` in stats module. |
| **Background Jobs** | `core/jobs.py` (34 lines) | `compile_lesson_background()` dynamically imports Talha's `backend.app.ai.compiler` if it exists. |
| **Voice REST** | `api/voice.py` (358 lines) | `POST /transcribe`, `POST /voice-turn/{instance_id}`, `POST /voice-finish/{instance_id}`. Full REST voice pipeline with session state. |
| **Voice State** | `core/voice.py` (289 lines) | `VoiceState`, `generate_voice_reply()`, `score_voice_session_background()`, `transcribe_audio_bytes()`. Tries Groq Whisper, falls back to browser. |
| **WebSocket Voice** | `api/websockets.py` (142 lines) | `ws://host/ws/voice`. Handles `start_session`, `audio_chunk`, `transcript`, `end_session` events. Streams assistant replies via `VoicePipeline`. |
| **Voice Pipeline** | `services/voice_pipeline.py` (110 lines) | `VoicePipeline` class with session management, streaming `chat_stream()` via Groq, TTS synthesis. |
| **TTS Service** | `services/tts.py` (127 lines) | `BrowserSpeechProvider`, `ElevenLabsSpeechProvider`, `GroqTTSProvider`. Decision tree: `Groq TTS → ElevenLabs → Browser fallback`. |
| **Groq LLM** | `utils/llm.py` (280 lines) | `groq_chat()`, `groq_chat_stream()`, `generate_validated()` with Pydantic repair loop (up to 2 retries). `log_llm_failure()` writes to `llm_failures` table. |
| **AI Compiler** | `app/ai/compiler.py` (308 lines) | `compile_lesson()` loads slot from curriculum.json, loads user profile, calls Groq via `generate_validated()` → `LessonBundle`, falls back to `_fallback_bundle()`. Persists metadata to DB. |
| **Pydantic Schemas** | `models/schema.py` (265 lines) | `LessonBundle`, `LessonNode`, `WritingRubric`, `VoiceScore`, `QnAResponse`, `SlotContext`, SRS schemas, Dashboard schemas — all with strict validators. |
| **Prompt Templates** | `prompts/compile.py`, `grade.py`, `qna.py`, `coach.py`, `voice.py` | Skeleton prompt templates. All return `list[dict]` message arrays for Groq. |
| **RAG Ingestion** | `scripts/ingest_documents.py` | Chunks text → embeds via local `all-MiniLM-L6-v2` → inserts into `document_chunks` with `vector(384)`. **Working and tested.** |
| **RAG Search API** | `api/qna.py` | `POST /semantic-search`. Embeds query locally, uses pgvector `<->` cosine distance. **Not yet wired into routes.py.** |

### ⚠️ Known Issues

| Issue | Details |
|-------|---------|
| **`GET /me` is hardcoded** | Returns `{"name": "Umer", "level": "intermediate", ...}` always (line 212-224 of `dashboard.py`). Blueprint §3 says it should serve profile + settings + streak + XP totals. |
| **`GET /dashboard` falls back to mock** | Lines 183-210: catches *all* DB errors and returns fake streak/XP data. Also queries `activity_days` but Blueprint DDL calls it `activity_days` — verify table name matches. |
| **Curriculum has only 1 slot** | `curriculum.json` has only `u1l1`. Blueprint §2.3 says: "Seed 2 units × 3 lessons for v1" = 6 polished slots minimum. |
| **`SUPABASE_JWT_SECRET` missing from `.env`** | Auth works for demo user but real JWT verification will fail without this key. |
| **Core DDL not applied** | The `schema.sql` core tables haven't been confirmed applied to Supabase. Also missing: `qna_exchanges` table from Blueprint §5.5. |
| **No `PATCH /api/me/settings`** | Blueprint §3: `coach_voice`, `timezone`, `daily_goal_min`, `level`. No endpoint exists. |
| **No `POST /lessons/{slot_id}/start`** | Blueprint §3: get-or-create instance. If `ready` → mark `in_progress` + return. If missing → create `compiling`, fire background compile, return `202 {status:"compiling"}`. Currently the lesson starts via the `test` demo alias only. |
| **No `GET /lesson-instances/{id}/summary`** | Blueprint §3: coach summary polling endpoint (`pending` → `ready` with `summary, prioritized_fixes, scores`). |
| **Custom auth code still exists** | Blueprint §3 says: "Delete the existing custom JWT/password-hashing code entirely; do not migrate it." `api/auth.py` still has `/signup` and `/login` with custom pbkdf2 hashing + `AuthStore`. Frontend uses Supabase Auth directly — this backend auth is dead code. |
| **`GET /curriculum` doesn't show per-user status** | Blueprint §3: should return `completed`/`in_progress`/`available`/`locked` per slot per user. Currently returns flat list. |
| **Uses `urllib.request` not `httpx`** | Blueprint §6.1 specifies `httpx.AsyncClient` with async 429 backoff. `utils/llm.py` currently uses synchronous `urllib.request` wrapped in `asyncio.to_thread`. Consider migrating. |

---

## What You Need to Do Next

### 🔴 Phase 1 Completion (Blocking Everyone)

1. **Apply Core DDL to Supabase** — Run the core section of `schema.sql` in the Supabase SQL Editor. Also add the `qna_exchanges` table from Blueprint §5.5. Enable RLS with `user_id = auth.uid()` on all user-owned tables.
2. **Add `SUPABASE_JWT_SECRET` to `.env`** — Get this from Supabase Dashboard → Settings → API → JWT Secret.
3. **Delete custom auth code** — Blueprint §3 says "Delete the existing custom JWT/password-hashing code entirely." Remove `/signup`, `/login` from `api/auth.py` and `AuthStore` from `models/auth_store.py`. Keep `/auth/sync` only. Frontend already uses Supabase Auth directly.
4. **Fix `GET /me`** — Replace the hardcoded response at `dashboard.py:212-224` with a real query to `user_profiles` + streak + XP totals (Blueprint §3).
5. **Build `PATCH /api/me/settings`** — Save `coach_voice`, `daily_goal_min`, `timezone`, `level` to `user_profiles`.
6. **Build `POST /lessons/{slot_id}/start`** — Blueprint §3: get-or-create instance. Ready → `in_progress`. Missing → create `compiling` + fire background compile + return `202`. This replaces the current demo-alias workaround.
7. **Expand `curriculum.json`** — Add at least 5 more slots across 2 units with diverse `concept_tags` and `node_template` per level (Blueprint §2.3). The entire demo depends on this.
8. **`GET /curriculum` per-user status** — Blueprint §3: return `completed`/`in_progress`/`available`/`locked` per slot.
9. **Wire Umer's RAG router** — Add `from backend.api.qna import router as qna_router` and `router.include_router(qna_router, prefix="/qna")` to `routes.py`.

### 🟡 Phase 2 (After Phase 1)

1. **Remove mock fallback from `GET /dashboard`** — Delete lines 183-210 in `dashboard.py` once real data flows.
2. **Director Rule #2** — Inject targeted fix when the same concept is asked about repeatedly in QnA (Blueprint §5.5).

### 🟡 Phase 3

1. **Connect Radar Chart UI** — Wire `frontend/app/(dashboard)/progress/page.tsx` to `GET /api/progress`.
2. **Wire Settings page** — Connect `settings/page.tsx` to `PATCH /api/me/settings` with auth headers.
3. **Wire Dashboard page** — Connect `home/page.tsx` to `GET /api/dashboard` and `GET /api/me` with auth headers.

---

## Files You Own (with `@ai-restriction`)

**Backend Core:** `core/auth.py`, `core/database.py`, `core/jobs.py`, `core/stats.py`, `core/srs.py`, `core/writing.py`, `core/voice.py`
**Backend API:** `api/routes.py`, `api/auth.py`, `api/lessons.py`, `api/dashboard.py`, `api/progress.py`, `api/srs.py`, `api/voice.py`, `api/ops.py`
**Backend Models:** `models/schema.py`, `models/auth_store.py`
**Frontend Dashboard:** `(dashboard)/home/page.tsx`, `(dashboard)/settings/page.tsx`, `(dashboard)/progress/page.tsx`

## Files You Must NOT Touch

- `frontend/app/page.tsx`, `frontend/components/lesson/*` — Umer
- `backend/app/ai/*`, `backend/prompts/*`, `backend/utils/llm.py`, `backend/services/tts.py` — Talha
- `backend/scripts/ingest_documents.py`, `backend/api/qna.py` — Umer
