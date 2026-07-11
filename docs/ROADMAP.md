# Team Roadmap (Implementation Blueprint)

This document breaks down the project milestones across the three primary team members (Umer, Mohsin, and Talha) according to the definitive `buslingo_implementation_blueprint.md`.

## Phase 1: Skeleton
*Goal: The whole clickable lesson flow with hand-written fake lessons and zero AI code — proves database + endpoints first.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Hook up the Next.js frontend `/lesson/[id]` flow to the new REST endpoints.
- Build the initial `pgvector` database schema for RAG.
- **Supabase Task:** Install `@supabase/supabase-js` in Next.js. Build the frontend Auth UI to log in directly via Supabase Auth and manage the client-side session JWT.

**Mohsin (Backend DB & Dashboard Frontend):**
- Refactor `api/routes.py` into domain routers.
- Build the `POST /attempt` transaction that evaluates mock answers and advances the server-side cursor idempotently.
- **Supabase Task:** Apply the `schema.sql` (Units, Slots, Instances, Nodes, Attempts) to the Supabase project. Configure Row Level Security (RLS) and build the FastAPI `get_current_user` dependency to verify Supabase JWTs.

**Talha (AI Brain & Voice API):**
- Setup GitHub Actions CI/CD to protect the `main` branch.
- **Supabase Task:** Write Python `scripts/seed_curriculum.py` and `scripts/seed_fixtures.py` that connect directly to the Supabase Postgres instance to insert the mock dummy data.

---

## Phase 2: Brain
*Goal: The Compiler + Quick Fix injection (fake lessons become generated ones).*

**Umer (Full-Stack RAG Lead & Core UX):**
- Build polished async polling UI (e.g. "Personalizing your lesson...") handling the 202 `compiling` HTTP response.
- Build the RAG Data Ingestion pipeline (chunking and storing vector embeddings).

**Mohsin (Backend DB & Dashboard Frontend):**
- Implement `FastAPI BackgroundTasks` to trigger the AI generation pipeline at the end of a lesson.
- Build the **Director Rule** into the attempt transaction: automatically injecting a branch on the 2nd failed attempt.
- Handle concurrent requests with optimistic cursor updates.

**Talha (AI Brain & Voice API):**
- Build the `Groq` client wrapper.
- Write the `prompts/compile.py` to generate the entire `LessonBundle`.

---

## Phase 3: Assessment
*Goal: Writing grading, QnA, radar chart, SRS flashcards.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Build the RAG Retrieval API (`POST /api/qna/semantic-search`) to fetch relevant vectors.
- Hook up the "Ask Anything" interactive QnA drawer to the backend.

**Mohsin (Backend DB & Dashboard Frontend):**
- Connect the `/progress` Radar Chart to the 6-axis backend data.
- Connect `WritingAssessmentPage` to the new grading endpoint, showing the JSON rubric.
- Implement the Exponential Moving Average (EMA) math for `user_stats` radar axes.
- Implement the SuperMemo-2 (SM-2) math in the SRS `/reviews` endpoint.
- Connect the writing submit endpoint to the LLM.

**Talha (AI Brain & Voice API):**
- Write the `prompts/grade.py` to output strictly formatted `WritingRubric` JSON.
- Write the `prompts/qna.py` to classify and answer user questions.
- Write the `prompts/summary.py` for the async coach summary.

---

## Phase 4: Voice & Polish
*Goal: Voice + dashboard aggregate + demo video.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Finalize the QnA semantic search integration within the UI.

**Mohsin (Backend DB & Dashboard Frontend):**
- Hook up the Home Dashboard widgets.
- Build the Backend `GET /api/dashboard` and `GET /api/me` aggregate endpoints.
- Provide the clean REST Interface for the Voice pipeline (`/voice/turn`).
- Hook up Row Level Security for Dashboard views.

**Talha (AI Brain, Voice API & Voice Frontend):**
- Implement the "Walkie-Talkie" tap-to-talk voice UI (`ThreadedVoice.tsx`), sending blobs to `/transcribe`.
- Integrate Groq's Whisper API for `POST /api/transcribe`.
- Build the TTS decision tree (Groq TTS -> Browser `speechSynthesis` -> ElevenLabs).
- Implement advanced Voice WebSockets for realtime mode.
