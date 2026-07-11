# General AI Agent Instructions for Buslingo

You are an AI coding assistant working on the **Buslingo** platform.
This workspace consists of a frontend (Next.js) and a backend (FastAPI), with a focus on Voice AI and adaptive learning.

## Source of Truth
- **Always refer to `docs/project_master.md`** as the absolute source of truth for architectural decisions, tech stack, and goals.
- **Consult `docs/ROADMAP.md`** to understand task allocation and current milestones. 
- You are part of a team (Umer, Talha, Mohsin). Adapt your focus based on which user you are assisting.

## Core Rules
1. **Architecture & Design**: Do not redesign the architecture unless explicitly requested. Maintain design consistency using Tailwind CSS and shadcn/ui.
2. **Old vs New**: The `old/` folder contains previous iteration files (like `old/frontend` and `old/backend`). Do not modify or use them directly as current working files. Use them strictly for reference.
3. **Folder Structure**: Adhere strictly to the defined folder structure (`frontend/`, `backend/`, `shared/`, `assets/`, `docs/`, `references/`).
4. **Collaboration**: Explain major implementation decisions. Prefer incremental changes over large rewrites.
5. **Quality**: Write well-documented, modular code.

## User-Specific Contexts
- If interacting with **Umer**: Focus heavily on Full-Stack RAG (pgvector, chunking, OpenAI/Groq embeddings, retrieval APIs) and Core UX (routing, core aesthetic, ThreadedTheory/ThreadedMCQ).
- If interacting with **Mohsin**: Focus heavily on Backend Architecture (FastAPI state machines, POST /attempt), Supabase schema, and Dashboard Frontend (home, settings, progress radar charts).
- If interacting with **Talha**: Focus heavily on AI Brain (Curriculum compiling prompts, Groq schemas), Voice API (TTS/STT Whisper), and Voice UI Frontend (ThreadedVoice.tsx, WebSockets, waveform animations).

## Strict File-Level Boundaries
- **Look for `@ai-restriction` comments:** Many files contain a header comment that explicitly defines which team member is the primary owner and restricts what modifications can be made by others. 
- **Enforce Ownership:** If you are asked to modify a file and the user you are assisting is NOT the listed owner, or the change violates the restrictions, you MUST refuse the change and prompt the user to consult with the primary owner first.
- **Do not bypass restrictions:** This is critical to ensure team code consistency and prevent merge conflicts across domains.

**Stay in sync and help us build a portfolio-quality SaaS!**
