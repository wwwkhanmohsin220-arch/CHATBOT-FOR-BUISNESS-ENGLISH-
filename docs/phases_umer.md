# Umer's Phases (Full-Stack RAG Lead & Core UX)

As the Full-Stack RAG Lead and Core UX owner, you are responsible for the entire Retrieval-Augmented Generation pipeline (both database and API), as well as the overarching structural UI and complex learning components.

## Phase 1: Core UX & Skeleton
- **Next.js Foundation:** Finalize the `/lesson/[id]` flow, hooking up the mock REST endpoints.
- **Core Components:** Perfect the intricate `ThreadedTheory` and `ThreadedMCQ` UI flows, ensuring crisp Framer Motion animations.
- **Auth UI:** Build the Supabase Auth login flow and manage the client-side session.

## Phase 2: RAG Pipeline & Vector DB
- **Supabase pgvector:** Initialize the `pgvector` extension in your Supabase project. Define the vector schema required to store textbook embeddings.
- **Async Polling UI:** Build the polished async UI (e.g., "Personalizing your lesson...") that handles the 202 `compiling` responses.
- **Targeted Fixes:** Ensure the `TargetedFixCard` triggers perfectly when injected by the backend state machine.

## Phase 3: Semantic Search API
- **End-to-End RAG:** Own the ingestion pipeline. Write the scripts to chunk the source textbook and generate embeddings via OpenAI or Groq.
- **Retrieval API:** Build the FastAPI `POST /api/qna/semantic-search` endpoint.
- **QnA Drawer:** Hook up the "Ask Anything" interactive interactive drawer on the frontend to your new retrieval API.

## Phase 4: Polish
- **Core UX Refinement:** Review global UX states, loading spinners, and error boundaries.
- **RAG Fine-Tuning:** Refine the retrieval logic (top-k, hybrid search) to ensure the AI tutor always quotes the textbook accurately.
