# Talha's Action Plan: AI/ML, Voice & Infrastructure

As the **AI & Infrastructure Lead**, your responsibility is to harness Groq, Llama 70B, Whisper, and ElevenLabs to power the "Compiler" and "JIT Assessment" layers, ensuring sub-second latency and strict JSON schema adherence.

## The `@ai-restriction` Policy
You are the Primary Owner of the AI integration, LLM prompts, and Python extraction scripts.
- `backend/app/ai/`
- `backend/prompts/`
- `backend/scripts/`

No other developer should alter the core LLM generation wrapper or prompts without your explicit review.

---

## Phase 1 — Skeleton (Zero AI)
*Creating the static fixtures so Umer and Mohsin can build the application runtime without waiting for LLM generation.*

**Tasks:**
- [ ] **Curriculum Seed:** Write `scripts/seed_curriculum.py` to parse `curriculum.json` and insert the base units/slots into Supabase.
- [ ] **Fixture Generation:** Write `scripts/seed_fixtures.py` to insert a fully pre-compiled mock lesson bundle into the database so the frontend has something to render.
- [ ] **CI/CD:** Setup GitHub Actions to ensure Mohsin's backend tests and Umer's Next.js build pass on every commit.

## Phase 2 — Brain (Groq & The Compiler)
*Building the async LLM pipeline that writes the curriculum.*

**Tasks:**
- [ ] **Groq Client:** Build `app/ai/client.py` to handle async calls to Groq's API with built-in retries, timeouts, and `retry-after` backoff for rate limits.
- [ ] **Structured Generation Wrapper:** Build `generate_validated()`. This is critical. It must take Pydantic models, force the LLM to output JSON, and use a self-correction loop if the LLM hallucinates outside the schema.
- [ ] **The Compile Prompt:** Write `prompts/compile.py`. Given a JSON syllabus slot and a user profile, it must output a full `LessonBundle` (spine + branches + MCQ explanations).

## Phase 3 — Assessment (Writing & QnA)
*Building the JIT (Just-In-Time) evaluation layers.*

**Tasks:**
- [ ] **Writing Grader Prompt:** Write `prompts/grade.py` to output the `WritingRubric` JSON. It must anchor scores so 5/10 actually means something specific.
- [ ] **QnA Prompt:** Write `prompts/qna.py` to classify user questions (core, adjacent, off_topic) and provide the relevant Markdown answer.
- [ ] **Coach Summary Prompt:** Write the async prompt to ingest lesson attempts and output prioritized fixes.

## Phase 4 — Voice & Polish
*Building the walkie-talkie transcription and TTS pipeline.*

**Tasks:**
- [ ] **Whisper STT:** Implement `POST /api/transcribe` to take audio blobs from Umer's frontend and convert them to text using Groq's Whisper API.
- [ ] **TTS Interface:** Build the unified TTS interface that attempts Groq-hosted TTS, falls back to the free browser `speechSynthesis`, and uses ElevenLabs strictly for the final demo recording.
- [ ] **Failure Logging:** Ensure all LLM failures across your wrappers write cleanly to the `llm_failures` table for debugging.
