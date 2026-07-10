# 1. Project Overview

We are building **Buslingo**, an AI-native Business English learning platform. It is a structured educational product that combines the gamification and pedagogical structure of Duolingo with the conversational power of modern LLMs. 

The definitive architecture for the backend is defined in `docs/buslingo_implementation_blueprint.md`. **This document must be followed strictly.**

# 2. Vision

Our vision is to create an AI-first learning experience where users feel like they have a personal Business English coach. We avoid "spinner fatigue" (waiting for the AI to think between every screen) by utilizing the **Compiler → Runtime → Director** architecture. The app feels live, but 90% of the AI's work is done quietly in the background before the user even clicks "Start".

# 3. Architecture Summary

The backend drives the highly-polished React/Next.js frontend. The core loop:
- **The Compiler**: Asynchronously generates complete, personalized lesson bundles (using Groq + Llama 3 70B) and saves them to Supabase (Postgres).
- **The Runtime**: A deterministic FastAPI state machine that serves these pre-compiled nodes instantly. Zero latency. Zero LLM calls during transitions.
- **The Director**: A pure Python rules engine that injects pre-compiled "Targeted Fix" branches into the lesson if the user fails twice.

# 4. Tech Stack (Final, Do Not Substitute)

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Framer Motion
- **Backend Framework**: FastAPI (Python 3.11+), Uvicorn, BackgroundTasks
- **Database**: Supabase (Postgres + Auth + Row Level Security)
- **AI Models**: Groq (`llama-3.3-70b-versatile`), Whisper (STT)
- **Voice/TTS**: Groq-hosted TTS → Browser Web Speech API fallback → ElevenLabs (for demos only)

# 5. Strict Frontend Design Rules

**CRITICAL RULE:** The frontend design methodology, styling, animations (Framer Motion), and Tailwind implementation must remain **PRISTINE**. 
If backend changes require frontend updates (e.g., adding a new component or altering an API response), the AI IDE is explicitly forbidden from stripping out styles, removing gradients, or simplifying the UI. The frontend must always maintain a premium, polished SaaS aesthetic.

# 6. Team Roles & `@ai-restriction` Tags

The project is divided between three engineers. To prevent destructive overlapping edits, files are tagged with `@ai-restriction Primary Owner: [Name]`.

- **Umer (Frontend Lead & PM)**: Primary owner of the entire `frontend/` directory. Responsible for maintaining the pristine UX/UI and connecting it to the backend.
- **Mohsin (Backend Architect & DB)**: Primary owner of `backend/models/`, `backend/api/`, and `backend/core/`. Responsible for the deterministic FastAPI runtime and Supabase schema.
- **Talha (AI & Infrastructure)**: Primary owner of `backend/app/ai/`, `backend/prompts/`, and `backend/scripts/`. Responsible for Groq integration, Whisper STT, and enforcing JSON schema output from the LLMs.

# 7. Phased Build Order

The project must be built in these exact phases (as detailed in `docs/ROADMAP.md`):
1. **Phase 1: Skeleton**: Supabase schema, FastAPI routing, and hand-written fixture lessons. Zero AI. Proves the DB and frontend runtime work.
2. **Phase 2: Brain**: Groq integration, background compiling, and the Director rules engine.
3. **Phase 3: Assessment**: Writing grading, QnA Drawer, and Radar Chart EMA stats.
4. **Phase 4: Voice + Polish**: Walkie-talkie voice integration, Dashboard aggregate APIs.

# 8. Definition of Done (MVP)

- The user can log in via Supabase Auth.
- The user can complete a full dynamically generated lesson.
- The progress bar works deterministically without retreating.
- Voice practice (walkie-talkie mode) is operational.
- Writing practice evaluates Tone, Clarity, and Structure via the strict JSON rubric.
- The Radar Chart accurately reflects the user's EMA stats.
- The frontend UI remains flawless and perfectly responsive throughout all these features.