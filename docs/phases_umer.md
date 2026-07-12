# Umer's Tasks — Full-Stack RAG & Core UX

> **Last synced:** July 12, 2026
> **Source of truth:** [`buslingo_implementation_blueprint.md`](./buslingo_implementation_blueprint.md)
> **CRITICAL OVERRIDE:** We are skipping v1 fallbacks and building the **v2 route NOW** (pgvector RAG, WebSocket streaming voice with barge-in).
> **Branch:** `test_concept`

---

## Current State of Your Domain (What Already Exists)

### ✅ Fully Working

| Module | File | What it does | Status |
|--------|------|-------------|--------|
| **RAG Ingestion** | `backend/scripts/ingest_documents.py` | Chunks markdown (`test.md`), uses `sentence-transformers/all-MiniLM-L6-v2` locally, inserts into `document_chunks` table with `vector(384)`. | **Done & Tested** |
| **QnA RAG Search API** | `backend/api/qna.py` | `POST /semantic-search` takes a query, embeds locally, uses pgvector `<->` (cosine distance) to return top 3 chunks. | **Done (Needs Wiring)** |
| **Lesson Skeleton** | `frontend/components/lesson/*` | `ThreadedTheory.tsx`, `ThreadedMCQ.tsx`, `QnADrawer.tsx` UI shells exist. | **UI Shell Done** |

### ⚠️ Known Issues

| Issue | Details |
|-------|---------|
| **RAG isn't connected to FastAPI** | `backend/api/qna.py` exists but is not included in `backend/api/routes.py` so the frontend cannot hit the endpoint. |
| **Frontend is disconnected** | `ThreadedTheory`, `ThreadedMCQ`, etc. do not yet make real calls to `POST /attempt`. They are purely visual right now. |
| **No QnA integration** | `QnADrawer.tsx` is static. It needs to call the RAG endpoint (`/semantic-search`) and Talha's AI compiler to give real answers. |

---

## What You Need to Do Next

### 🔴 Phase 1 Completion

1. **Wire RAG to FastAPI** — Ensure `backend/api/qna.py` is included in `backend/api/routes.py`.
2. **Hook up the Lesson Runtime** — Connect `ThreadedTheory.tsx` and `ThreadedMCQ.tsx` to the backend REST endpoints (`GET /lesson-instances/{id}/nodes/current` and `POST /lesson-instances/{id}/nodes/{node_id}/attempt`).

### 🟡 Phase 2 (RAG UI & Polling)

1. **Build `InteractiveQnA.tsx` logic** — Connect the `QnADrawer.tsx` to `POST /api/qna/semantic-search` so users can ask anything and get a real RAG-grounded response.
2. **Build Async Polling UI** — Handle the `202 {status: "compiling"}` response from `POST /lessons/{id}/start`. Show a polished "Personalizing your lesson..." animation while polling.
3. **Targeted Fix Display** — Ensure the `TargetedFixCard` dynamically renders when `POST /attempt` returns an `injected_node` (from Mohsin's Director rules).

### 🟡 Phase 3 & 4 (Refinement)

1. **Refine RAG pipeline** — Make sure Talha's AI Compiler prompt can query your `/semantic-search` endpoint to build lessons grounded in your vector store.
2. **Global Polish** — Ensure all Framer Motion animations and Tailwind 4 aesthetics feel absolutely premium.

---

## Files You Own (with `@ai-restriction`)

**Backend RAG:** `backend/scripts/ingest_documents.py`, `backend/api/qna.py`
**Frontend Core UX:** `frontend/app/page.tsx`, `frontend/components/lesson/ThreadedTheory.tsx`, `frontend/components/lesson/ThreadedMCQ.tsx`, `frontend/components/lesson/QnADrawer.tsx`, `frontend/components/lesson/TargetedFixCard.tsx`

## Files You Must NOT Touch

- `backend/core/auth.py`, `backend/api/lessons.py`, `backend/api/dashboard.py` — Mohsin
- `backend/app/ai/*`, `backend/prompts/*`, `backend/utils/llm.py`, `frontend/components/lesson/ThreadedVoice.tsx` — Talha
