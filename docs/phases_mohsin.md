# Mohsin's Phases (Backend DB & Dashboard Frontend)

As the Backend DB and Dashboard Frontend owner, you are responsible for the core Postgres database schema, the complex FastAPI state machines that drive user progression, and wiring the Next.js data-visualization components to your APIs.

## Phase 1: DB Skeleton & API Foundation
- **Schema & RLS:** Apply the core `schema.sql` (Units, Slots, Instances, Nodes, Attempts) to the Supabase project. Configure Row Level Security (RLS).
- **FastAPI Core:** Refactor `api/routes.py` into scalable domain routers. Build the `get_current_user` dependency.
- **State Machine:** Build the `POST /attempt` transaction that evaluates mock answers and advances the server-side cursor idempotently.
- **Dashboard Wiring:** Connect the `home/page.tsx` and `settings/page.tsx` React components to your REST endpoints.

## Phase 2: Background Tasks & Director Rule
- **Background Orchestration:** Implement `FastAPI BackgroundTasks` to trigger the AI generation pipeline (owned by Talha) at the end of a lesson.
- **Director Rule:** Build the logic into the attempt transaction to automatically inject a targeted fix branch on the 2nd failed attempt.
- **Concurrency:** Ensure optimistic cursor updates handle concurrent requests safely.

## Phase 3: Dashboard Analytics & Spaced Repetition
- **EMA Math:** Implement the Exponential Moving Average (EMA) math for the `user_stats` radar axes.
- **Radar Chart UI:** Connect the `/progress` Radar Chart Next.js UI to your new 6-axis backend data.
- **Spaced Repetition:** Implement the SuperMemo-2 (SM-2) math in the SRS `/reviews` endpoint.
- **Writing UI:** Wire the `WritingAssessmentPage` to the grading endpoint to display the JSON rubric correctly.

## Phase 4: The Mega-Aggregate Endpoint
- **`/api/dashboard`:** Build a highly optimized massive endpoint to serve the Streak, XP, SRS counts, and Next Lesson in a single network call.
- **Optimization:** Tune database indexes to ensure the Dashboard loads instantly.
