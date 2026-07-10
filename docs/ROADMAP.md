# Team Roadmap (Implementation Blueprint)

This document breaks down the project milestones across the three primary team members (Umer, Mohsin, and Talha) according to the definitive `buslingo_implementation_blueprint.md`.

## Phase 1: Skeleton
*Goal: The whole clickable lesson flow with hand-written fake lessons and zero AI code — proves database + endpoints first.*

**Umer (Frontend & Supabase Auth):**
- Hook up the Next.js frontend `/lesson/[id]` flow to the new REST endpoints.
- Ensure the Progress Bar uses the deterministic `completed_spine/total_spine` math.
- **Supabase Task:** Install `@supabase/supabase-js` in Next.js. Build the frontend Auth UI to log in directly via Supabase Auth and manage the client-side session JWT.

**Mohsin (Backend DB/Architecture & Supabase SQL):**
- Refactor `api/routes.py` into domain routers.
- Build the `POST /attempt` transaction that evaluates mock answers and advances the server-side cursor idempotently.
- **Supabase Task:** Apply the `schema.sql` (Units, Slots, Instances, Nodes, Attempts) to the Supabase project. Configure Row Level Security (RLS) and build the FastAPI `get_current_user` dependency to verify Supabase JWTs.

**Talha (AI & Infrastructure & Supabase Seeding):**
- Setup GitHub Actions CI/CD to protect the `main` branch.
- **Supabase Task:** Write Python `scripts/seed_curriculum.py` and `scripts/seed_fixtures.py` that connect directly to the Supabase Postgres instance to insert the mock dummy data.

---

## Phase 2: Brain
*Goal: The Compiler + Quick Fix injection (fake lessons become generated ones).*

**Umer (Frontend):**
- Build polished async polling UI (e.g. "Personalizing your lesson...") handling the 202 `compiling` HTTP response.
- Ensure the Quick Fix (TargetedFixCard) dynamically renders when the backend injects it.

**Mohsin (Backend DB/Architecture):**
- Implement `FastAPI BackgroundTasks` to trigger the AI generation pipeline at the end of a lesson.
- Build the **Director Rule** into the attempt transaction: automatically injecting a branch on the 2nd failed attempt.
- Handle concurrent requests with optimistic cursor updates.

**Talha (AI & Infrastructure):**
- Build the `Groq` client wrapper.
- Implement the vital `generate_validated` function to force strict Pydantic JSON outputs.
- Write the `prompts/compile.py` to generate the entire `LessonBundle`.

---

## Phase 3: Assessment
*Goal: Writing grading, QnA, radar chart, SRS flashcards.*

**Umer (Frontend):**
- Connect the `/progress` Radar Chart to the 6-axis backend data.
- Connect `WritingAssessmentPage` to the new grading endpoint, showing the JSON rubric.
- Hook up the "Ask Anything" interactive QnA drawer to the backend.

**Mohsin (Backend DB/Architecture):**
- Implement the Exponential Moving Average (EMA) math for `user_stats` radar axes.
- Implement the SuperMemo-2 (SM-2) math in the SRS `/reviews` endpoint.
- Connect the writing submit endpoint to the LLM.

**Talha (AI & Infrastructure):**
- Write the `prompts/grade.py` to output strictly formatted `WritingRubric` JSON.
- Write the `prompts/qna.py` to classify and answer user questions.
- Write the `prompts/summary.py` for the async coach summary.

---

## Phase 4: Voice & Polish
*Goal: Voice + dashboard aggregate + demo video.*

**Umer (Frontend):**
- Implement the "Walkie-Talkie" tap-to-talk voice UI, sending blobs to `/transcribe`.
- Hook up the Home Dashboard widgets to the massive `/api/dashboard` aggregate endpoint.

**Mohsin (Backend DB/Architecture):**
- Build the `/api/dashboard` endpoint to serve Streak, XP, SRS counts, and Next Lesson in one call.
- Provide the clean REST Interface for the Voice pipeline (`/voice/turn`).

**Talha (AI & Infrastructure):**
- Integrate Groq's Whisper API for `POST /api/transcribe`.
- Build the TTS decision tree (Groq TTS -> Browser `speechSynthesis` -> ElevenLabs).
- Monitor `llm_failures` table for prompt degradation.
