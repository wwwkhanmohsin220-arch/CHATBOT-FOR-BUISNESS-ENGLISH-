# Umer + Talha Unified Tasks (Core UX, RAG, & AI Brain)

> **Last synced:** July 12, 2026
> **Source of truth:** [`buslingo_implementation_blueprint.md`](./buslingo_implementation_blueprint.md)
> **Goal:** Consolidate Full-Stack RAG, Core UX, AI Prompts, and Voice into a single pipeline to meet deadlines.

---

## 🔴 Priority 1: Finish the RAG & DB Setup (✅ DONE)
1. ~~**Apply the RAG Upgrades (Umer):** Run `pip install -r backend/requirements.txt` to install PyMuPDF. Wipe the old vector database chunks and run the new `ingest_documents.py` script to embed the curriculum using the upgraded `BAAI/bge-small-en-v1.5` model.~~ ✅
2. ~~**Write `scripts/seed_curriculum.py` (Talha):** Connect to Supabase via `asyncpg` and insert the curriculum slots into `units` and `lesson_slots` tables.~~ ✅
3. ~~**Write `scripts/seed_fixtures.py` (Talha):** Insert mock dummy data into `user_profiles`, `vocab_terms`, `daily_activity` so Mohsin's Dashboard has data to render.~~ ✅

## 🟡 Priority 2: The AI Compiler & Grader (The Brain)
1. **Expand `prompts/compile.py` (Talha):** The prompt must enforce the Blueprint §4 structure:
   - Exactly 1 theory node, 1-2 MCQ nodes, 1 voice node, 1 writing node per `LessonBundle`
   - Each node must have a `concept_tag` from `CANONICAL_TAGS`
   - Branches dict must have a pre-compiled targeted fix for each concept tag
   - MCQ must have `correct_index`, `options` (exactly 3), and `explanations`
   - Voice must have `scenario`, `ai_persona`, `objectives`, `opening_line`
   - Writing must have `scenario`
2. **Expand `prompts/grade.py` (Talha):** Add the exact `WritingRubric` JSON schema to the system prompt so the LLM outputs the 10-point scales for tone, clarity, and structure instead of the hardcoded fallback.
3. **Expand `prompts/coach.py` (Talha):** Write the coach summary prompt that names what the next lesson will focus on.

## 🟡 Priority 3: Voice V2 & Global Polish
1. **Finish `ThreadedVoice.tsx` V2 wiring (Talha):** Connect the frontend directly to `ws://host/ws/voice` for real-time WebSocket streaming with barge-in support.
2. **Global Polish (Umer):** Ensure all Framer Motion animations and Tailwind 4 aesthetics feel absolutely premium across the entire Core Lesson Runtime.

---

## Files You Now Own (Combined)

**Backend RAG:** `scripts/ingest_documents.py`, `api/qna.py`
**Frontend Core UX:** `app/page.tsx`, `components/lesson/ThreadedTheory.tsx`, `ThreadedMCQ.tsx`, `QnADrawer.tsx`, `TargetedFixCard.tsx`, `InteractiveQnA.tsx`, `ThreadedVoice.tsx`
**AI Brain:** `app/ai/*`, `prompts/*`, `utils/llm.py`
**Voice/WebSockets:** `services/tts.py`, `services/voice_pipeline.py`, `api/websockets.py`, `api/voice.py`
**Scripts:** `scripts/seed_curriculum.py`, `scripts/seed_fixtures.py`

## Files You Must NOT Touch
- `backend/api/lessons.py`, `api/dashboard.py`, `api/progress.py`, `api/srs.py` — Mohsin
- `backend/core/database.py`, `core/stats.py`, `core/srs.py` — Mohsin
