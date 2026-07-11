# Talha's Phases (AI Brain, Voice API & Voice Frontend)

As the AI Brain, Voice API, and Voice Frontend owner, you are responsible for the intelligent orchestration of the curriculum (Groq prompts/schemas), the entire speech-to-text and text-to-speech pipelines, and the complex real-time WebSocket React components.

## Phase 1: Skeleton & Voice UI Foundation
- **Data Seeding:** Write the Python `scripts/seed_curriculum.py` and `scripts/seed_fixtures.py` that connect directly to the Supabase Postgres instance to insert mock dummy data.
- **Voice UX:** Build the initial Walkie-Talkie Voice UI in `ThreadedVoice.tsx`. Set up the MediaRecorder logic and waveform animations on the frontend.
- **CI/CD:** Setup GitHub Actions CI/CD to protect the `main` branch.

## Phase 2: AI Compiler & Schemas
- **Groq Client:** Build the `Groq` client wrapper.
- **Validation Wrapper:** Implement the vital `generate_validated` function to force strict Pydantic JSON outputs from Llama 70B.
- **Compiler Prompts:** Write the `prompts/compile.py` to generate the entire `LessonBundle`. Ensure the output strictly conforms to the expected JSON schema.

## Phase 3: Grading & WebSocket Architecture
- **Writing Assessment:** Write the `prompts/grade.py` to evaluate email drafts and output strictly formatted `WritingRubric` JSON.
- **Coach Summaries:** Write the `prompts/summary.py` for the async coach summary.
- **WebSocket Route:** Build the FastAPI WebSocket route for the Voice pipeline. Connect the React frontend's MediaRecorder to this socket.

## Phase 4: Full Voice Pipeline Integration
- **STT:** Integrate Groq's Whisper API for `POST /api/transcribe` to decode the audio blobs sent by the frontend.
- **TTS:** Build the dynamic TTS decision tree (Groq TTS -> Browser `speechSynthesis` -> ElevenLabs). Ensure it returns binary audio directly to the frontend.
- **Degradation Monitoring:** Monitor the `llm_failures` table for prompt degradation over time.
