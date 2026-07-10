# Mohsin's Action Plan: Backend Architect & Database Lead

As the **Backend Architect**, your responsibility is to build the deterministic, high-performance API that powers the Buslingo frontend, entirely based on the new "Compiler → Runtime → Director" paradigm.

## The `@ai-restriction` Policy
You are the Primary Owner of the core API routes, Database interactions, and SQLAlchemy/Supabase definitions.
- `backend/models/`
- `backend/api/`
- `backend/core/`

No frontend developer should alter these schemas without your explicit review.

---

## Phase 1 — Skeleton (Zero AI)
*Establishing the Postgres database and the deterministic runtime state machine.*

**Tasks:**
- [ ] **Supabase DDL Execution:** Apply the full relational schema defined in the blueprint to your Supabase Postgres database.
- [ ] **Auth Sync & Protection:** Implement `POST /api/auth/sync` to create `user_profiles` when a user signs up. Build a FastAPI dependency `get_current_user` that verifies Supabase JWTs.
- [ ] **Domain Routers:** Refactor `api/routes.py` into cleanly separated domain routers (`auth.py`, `dashboard.py`, `lessons.py`, `srs.py`, `ops.py`).
- [ ] **The Transactional Attempt:** Build `POST /api/lesson-instances/{id}/nodes/{node_id}/attempt`. This must be a single, bulletproof database transaction that handles attempts, evaluates correctness, and advances the cursor safely (handling race conditions via optimistic updates).

## Phase 2 — Brain (Async Compilation & Director)
*Integrating the background compiling and the Director rule engine.*

**Tasks:**
- [ ] **Background Tasks:** Implement FastAPI `BackgroundTasks` to asynchronously trigger Talha's `compile_lesson` function when a user finishes a lesson, or during a cold-start.
- [ ] **The Director Rule:** Implement the pure Python `if` statement inside your attempt transaction: *if user fails 2nd time on a concept -> inject the Targeted Fix branch from the compiled bundle -> advance cursor by 0.5.*
- [ ] **Idempotent Guards:** Ensure XP granting and status updates are completely idempotent using `ON CONFLICT` constraints, guarding against double-clicks.

## Phase 3 — Assessment (Stats, EMA, and SRS)
*Building the analytical and review engines.*

**Tasks:**
- [ ] **EMA Stats Engine:** Implement the Exponential Moving Average logic that updates a user's 6 axes (Writing, Listening, Grammar, Vocabulary, Tone, Fluency) in the `user_stats` table after every `stat_event`.
- [ ] **SRS Implementation:** Implement the SuperMemo-2 logic algorithm in `POST /api/srs/reviews` to update flashcard due dates.
- [ ] **Writing Grading Pipeline:** Build the `POST /api/lesson-instances/{id}/writing/submit` endpoint that calls Talha's grading LLM and returns the structured rubric.

## Phase 4 — Voice & Polish
*Finalizing the Dashboard and Voice session state.*

**Tasks:**
- [ ] **Dashboard Aggregate:** Build the massive single-call `GET /api/dashboard` endpoint to serve the entire `/home` screen in one round-trip.
- [ ] **Voice Turn Service Interface:** Implement the REST endpoints for the V1 walkie-talkie voice, maintaining a clean interface so the V2 WebSockets can be slotted in later.
