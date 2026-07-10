# AI Handoff Prompts for Mohsin and Talha

When you pass this branch (`test_concept`) to Mohsin and Talha, they can copy-paste the exact prompts below to their respective AI IDEs. These prompts give their AI immediate, perfectly-scoped context on exactly what they need to build next without breaking the frontend we just perfected.

---

## Prompt for Mohsin's AI (Backend & Database)

```text
Hello! Umer just finished Phase 1 on the `test_concept` branch. I am Mohsin, and we need to start my part of the backend work. The Next.js frontend is fully wired up to a fake "Mock Backend" (`backend/api/routes.py`). It currently serves fake JSON and handles progress locally in memory.

Your job is to execute **Phase 2** (The Database & Deterministic Runtime).

1. Please read `docs/buslingo_implementation_blueprint.md` first. This is the ultimate source of truth for our massive new architecture.
2. Read `docs/project_master.md` and `docs/ROADMAP.md` to understand our overall team goals and design methodologies.
3. Read `docs/phases_mohsin.md` to see your exact task list.
4. Throughout the codebase (especially in the skeleton files Umer just pushed), look for `@ai-restriction` tags at the top of the files. You MUST strictly obey these ownership rules so we don't break each other's code.
5. Your main goal right now is to connect to Supabase, implement the real `LessonBundle` JSON storage, and replace the fake endpoints in `backend/api/routes.py` with real Postgres transactions. 
6. DO NOT touch the frontend code. Umer has already made it perfect. The API contract is strictly defined in the blueprint. Let's get started on Phase 2!
```

---

## Prompt for Talha's AI (AI Integrations & Infrastructure)

```text
Hello! Umer just finished Phase 1 on the `test_concept` branch. I am Talha, and we need to start my part of the AI engineering. The Next.js frontend is fully built and wired up to a dummy backend.

Your job is to execute your tasks in **Phase 2 & Phase 3** (The AI Compiler & Prompts).

1. Please read `docs/buslingo_implementation_blueprint.md` first. This is the ultimate source of truth. We are NOT calling the LLM synchronously during lessons; we are pre-compiling JSON bundles.
2. Read `docs/project_master.md` and `docs/ROADMAP.md` to understand the full team scope.
3. Read `docs/phases_talha.md` to see your exact task list.
4. Throughout the codebase, look for `@ai-restriction` tags at the top of the files. You MUST strictly obey these ownership rules so we don't break Umer or Mohsin's code.
5. Your main goal right now is to build `backend/utils/llm.py`. You need to write the `generate_validated()` wrapper that uses Groq (Llama 70b) and strictly enforces Pydantic schemas using our self-correction loop. 
6. Do NOT touch the frontend UI or the REST API routes. Your job is strictly the Python AI logic, the compiler background tasks, and the Whisper/TTS voice pipeline. Let's get started!
```
