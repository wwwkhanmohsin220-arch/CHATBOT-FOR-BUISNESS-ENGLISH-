# Umer's Action Plan: Frontend Lead & Project Manager

As the **Project Manager and Frontend Lead**, your responsibility is to translate the new "Compiler → Runtime → Director" backend paradigm into a seamless, highly-polished user experience. 

**CRITICAL RULE FOR AI IDE:** When Umer asks you to update the frontend to accommodate backend changes, **you must strictly preserve the existing design methodology, Tailwind styling, and Framer Motion aesthetics.** Do not degrade the UI. The frontend must remain a polished, premium product.

## The `@ai-restriction` Policy
You are the Primary Owner of the entire `frontend/` directory. No backend developer (or their AI agent) should alter frontend files without your explicit permission, unless it is a minimal wire-up for testing.

---

## Phase 1 — Skeleton (Zero AI)
*The backend is building the Supabase schema and serving hand-written mock lessons.*

**Tasks:**
- [ ] **Supabase Auth UI:** Replace the custom JWT login forms with Supabase Auth flows in the frontend.
- [ ] **Lesson Runtime Hookup:** Connect the `/lesson/[id]` flow to the new `GET /api/lesson-instances/{id}/nodes/current` endpoint.
- [ ] **Attempt Pipeline:** Connect the MCQ/Theory submission buttons to `POST /api/lesson-instances/{id}/nodes/{node_id}/attempt`.
- [ ] **Progress Bar Fix:** Ensure the progress bar calculation strictly uses `completed_spine / total_spine` returned from the backend. It must never move backwards.
- [ ] **Targeted Fixes UI Validation:** Ensure the `TargetedFixCard.tsx` renders beautifully when the backend returns an `injected_node` in the attempt response.

## Phase 2 — Brain (Async Compilation)
*The backend is now compiling lessons on the fly using Groq.*

**Tasks:**
- [ ] **Cold-Start Animation:** When clicking a new lesson, the backend will return a 202 `status="compiling"`. Build a polished "Personalizing your lesson..." loading animation that polls the status endpoint until `ready`.
- [ ] **Error Boundaries:** Ensure that if a compile fails, the UI gracefully handles it without crashing.

## Phase 3 — Assessment (Writing, QnA, SRS)
*The backend introduces the writing grading, QnA drawer, and stats engines.*

**Tasks:**
- [ ] **Radar Chart Hookup:** Connect the `/progress` page's Radar Chart to the new 6-axis backend data (Writing, Listening, Grammar, Vocabulary, Tone, Fluency).
- [ ] **Writing Rubric UI:** Connect the `WritingAssessmentPage` to the new grading endpoint. Build a polished loading spinner (the only blocking AI call). Display the returned JSON rubric clearly.
- [ ] **Interactive QnA Drawer:** Ensure the "Ask Anything" chat drawer is available on *every* node. Send user questions to `POST /api/lesson-instances/{id}/qna`.
- [ ] **SRS Flashcards:** Connect the Business Lexicon widget to the Supabase SuperMemo-2 endpoints.

## Phase 4 — Voice & Polish
*The backend introduces the walkie-talkie voice REST pipeline.*

**Tasks:**
- [ ] **Walkie-Talkie UI:** Implement the tap-to-talk voice interface, streaming audio blobs to `POST /api/transcribe` and receiving the AI's audio/text back.
- [ ] **Dashboard Aggregation:** Connect the `/home` Dashboard to the new single-call `/api/dashboard` aggregate endpoint.
- [ ] **Coach Summary Modal:** Build the celebratory confetti screen and poll for the async "AI Coach Summary" when a lesson completes.
