# Team Roadmap (Implementation Blueprint)

This document breaks down the project milestones across the three primary team members (Umer, Mohsin, and Talha) according to the definitive `buslingo_implementation_blueprint.md`. We have adopted a feature-based "vertical slicing" approach.

## Phase 1: Skeleton
*Goal: The whole clickable lesson flow with hand-written fake lessons and zero AI code — proves database + endpoints first.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Hook up the Next.js frontend `/lesson/[id]` flow to the REST endpoints.
- Manage the Core Aesthetic and the complex `ThreadedTheory`/`ThreadedMCQ` lesson components.
- Install `@supabase/supabase-js` and build the frontend Auth UI to log in via Supabase Auth.

**Mohsin (Backend DB & Dashboard Frontend):**
- Build the `POST /attempt` transaction that evaluates mock answers and advances the server-side cursor idempotently.
- Apply the core `schema.sql` (Units, Slots, Instances, Nodes, Attempts) to Supabase.
- Wire up `home/page.tsx` and `settings/page.tsx` to the backend REST endpoints.

**Talha (AI Brain, Voice API & Voice Frontend):**
- Write Python `scripts/seed_curriculum.py` and `scripts/seed_fixtures.py` to insert mock dummy data into Supabase.
- Build the initial Walkie-Talkie Voice UI in `ThreadedVoice.tsx` without AI wiring.

---

## Phase 2: Brain
*Goal: The Compiler + Quick Fix injection (fake lessons become generated ones).*

**Umer (Full-Stack RAG Lead & Core UX):**
- Build polished async polling UI (e.g., "Personalizing your lesson...") handling the 202 `compiling` HTTP response.
- Ensure the Quick Fix (`TargetedFixCard`) dynamically renders when the backend injects it.
- Initialize the `pgvector` extension in Supabase and define the vector schema for RAG.

**Mohsin (Backend DB & Dashboard Frontend):**
- Implement `FastAPI BackgroundTasks` to trigger the AI generation pipeline at the end of a lesson.
- Build the **Director Rule** into the attempt transaction: automatically injecting a branch on the 2nd failed attempt.
- Begin wiring the `/progress` route to test basic stat displays.

**Talha (AI Brain, Voice API & Voice Frontend):**
- Build the `Groq` client wrapper and the `generate_validated` function to force strict Pydantic JSON outputs.
- Write `prompts/compile.py` to generate the entire `LessonBundle`.

---

## Phase 3: Assessment
*Goal: Writing grading, QnA, radar chart, SRS flashcards.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Own the entire RAG pipeline from end to end.
- Chunk documents, generate embeddings via OpenAI/Groq.
- Write the retrieval APIs (`POST /api/qna/semantic-search`) and connect the "Ask Anything" interactive QnA drawer to it.

**Mohsin (Backend DB & Dashboard Frontend):**
- Implement the Exponential Moving Average (EMA) math for `user_stats` radar axes.
- Connect the `/progress` Radar Chart UI to the 6-axis backend data.
- Connect `WritingAssessmentPage` to the new grading endpoint, showing the JSON rubric.
- Implement the SuperMemo-2 (SM-2) math in the SRS `/reviews` endpoint.

**Talha (AI Brain, Voice API & Voice Frontend):**
- Write `prompts/grade.py` to output strictly formatted `WritingRubric` JSON.
- Write `prompts/summary.py` for the async coach summary.
- Begin integrating the WebSocket frontend in `ThreadedVoice.tsx`.

---

## Phase 4: Voice & Polish
*Goal: Voice + dashboard aggregate + demo video.*

**Umer (Full-Stack RAG Lead & Core UX):**
- Polish the global Core UX flows.
- Refine the retrieval logic for grammar/theory lookups.

**Mohsin (Backend DB & Dashboard Frontend):**
- Finalize the Dashboard and Progress frontend logic.
- Build the `/api/dashboard` endpoint to serve Streak, XP, SRS counts, and Next Lesson in one call.

**Talha (AI Brain, Voice API & Voice Frontend):**
- Finalize the "Walkie-Talkie" tap-to-talk voice UI, sending blobs via WebSockets.
- Build the TTS decision tree (Groq TTS -> Browser `speechSynthesis` -> ElevenLabs).
- Integrate Groq's Whisper API for Speech-to-Text.
- Monitor `llm_failures` table for prompt degradation.
