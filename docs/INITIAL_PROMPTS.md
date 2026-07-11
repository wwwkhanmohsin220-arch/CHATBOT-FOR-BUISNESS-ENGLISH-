# AI Handoff Prompts for Mohsin and Talha

When you pass this branch (`test_concept`) to Mohsin and Talha, they can copy-paste the exact prompts below to their respective AI IDEs. These prompts give their AI immediate, perfectly-scoped context on exactly what they need to build next within their vertical domains.

---

## Prompt for Mohsin's AI (Backend DB & Dashboard Frontend)

```text
Hello! Umer just finished Phase 1 on the `test_concept` branch. I am Mohsin, and we need to start my part of the project.

We have adopted a feature-based vertical slicing model. I am the owner of the Backend Core Database and the Dashboard Frontend.

Your job is to execute **Phase 2 & 3** for my domains.

1. Please read `docs/buslingo_implementation_blueprint.md` first. This is the ultimate source of truth for our massive new architecture.
2. Read `docs/project_master.md` and `docs/ROADMAP.md` to understand our overall team goals and new role definitions.
3. Read `docs/phases_mohsin.md` to see your exact task list.
4. Throughout the codebase, look for `@ai-restriction` tags at the top of the files. You MUST strictly obey these ownership rules. Note: As part of the new vertical slicing, you are allowed to modify the Frontend Dashboard files (`home/page.tsx`, `settings/page.tsx`, `/progress` radar chart) because I own them.
5. Your main goal right now is to implement the real `LessonBundle` JSON storage, build the complex `POST /attempt` FastAPI state machines, and wire up the Next.js Dashboard and Progress UI to these new endpoints.
6. DO NOT touch the Core UX (ThreadedTheory) or Voice UI (ThreadedVoice) files, as Umer and Talha own those. Let's get started on Phase 2!
```

---

## Prompt for Talha's AI (AI Brain, Voice API & Voice Frontend)

```text
Hello! Umer just finished Phase 1 on the `test_concept` branch. I am Talha, and we need to start my part of the AI engineering.

We have adopted a feature-based vertical slicing model. I am the owner of the AI Brain, the Voice API, and the Voice UI Frontend.

Your job is to execute your tasks in **Phase 2 & Phase 3** for my domains.

1. Please read `docs/buslingo_implementation_blueprint.md` first. This is the ultimate source of truth.
2. Read `docs/project_master.md` and `docs/ROADMAP.md` to understand the full team scope and new role definitions.
3. Read `docs/phases_talha.md` to see your exact task list.
4. Throughout the codebase, look for `@ai-restriction` tags. You MUST strictly obey these ownership rules. Note: As part of the new vertical slicing, you are allowed to modify the Frontend Voice files (`ThreadedVoice.tsx`, WebSockets logic) because I own them.
5. Your main goal right now is to build the Curriculum Compilation prompts (`prompts/compile.py`), enforce Groq JSON schemas, and build the Voice UI (Walkie-Talkie MediaRecorder logic, Whisper TTS/STT integration). 
6. Do NOT touch the Dashboard UI or the RAG Vector pipelines, as Mohsin and Umer own those. Let's get started!
```
