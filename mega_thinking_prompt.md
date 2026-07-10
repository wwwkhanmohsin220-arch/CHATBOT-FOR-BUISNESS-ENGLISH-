# Buslingo: The Ultimate Architectural Master Prompt

You are the world's foremost Expert AI Systems Architect, Principal Backend Engineer, and EdTech Product Strategist. You have designed infrastructure for highly scalable, low-latency, AI-native applications (akin to a modern, AI-powered Duolingo or Coursera). You have been brought in to design the absolute, definitive backend architecture and AI orchestration strategy for **Buslingo**, an AI-native Business English learning platform.

Because you cannot execute the application yourself, this document provides a massively detailed, forensic, line-by-line breakdown of the current state of the codebase, the intricate UI/UX flows, the backend skeleton, the specific AI models in use, and the strict technical constraints we are operating under. 

Your ultimate goal is to solve the **Curriculum Orchestration Dilemma**—how the AI actually *teaches*, sequences lessons, handles edge cases, and generates content—and provide a complete, bulletproof blueprint for the backend architecture. You are strongly encouraged to think *outside* of our proposed hypothetical approaches if a superior architectural paradigm exists. Do not hold back. We need senior-level, production-grade architectural reasoning.

---

## Part 1: Comprehensive Forensic Breakdown of the Frontend Codebase

The frontend is a highly polished React 19 / Next.js 16 application using Tailwind CSS (v4) and Framer Motion for micro-interactions. It acts as a highly reactive, state-driven "dumb" view layer, waiting for the backend to drive its global state. We use Turbopack for compilation.

### 1.1 Navigation & Global Layout Subsystem
- **`Sidebar.tsx`**: A left-hand navigation menu built for desktop views. It contains standard navigation items: `Home`, `Learn` (Curriculum), `Progress` (Analytics), and `Settings`. We intentionally removed legacy `Writing` and `Vocabulary` tabs to integrate those features directly into the core curriculum flow. It uses Next.js `usePathname` for active state styling.
- **`TopNav.tsx`**: A sticky top header that handles mobile menu toggling and global user stats.
  - A search bar for finding specific grammar or vocabulary concepts.
  - A Streak counter (Flame icon, e.g., 12 days).
  - An XP counter (Star icon, e.g., 2,450 XP).
  - A User dropdown (`U` gradient avatar) containing state-driven toggle logic for accessing `Profile & Settings` and `Log Out`.

### 1.2 Dashboard Subsystem (`/home`)
The `/home` route is the entry point for the authenticated user. It aggregates progress and next actions into highly scannable widgets.
- **Daily Goal Card**: Shows minutes studied vs. daily target (e.g., 13 / 20 mins) with a smoothly animating progress bar. The backend must eventually feed this `minutes_studied` variable based on active session time.
- **Current Streak Card**: Shows a weekly calendar (`M T W T F`) with active days highlighted. The backend must calculate this based on consecutive days of activity > 0 XP.
- **Continue Learning Widget**: A large hero card showing the "Up Next" lesson (e.g., "Unit 3: Meeting Communication") with a percentage completion bar and a "Resume lesson" CTA. The backend must provide a `get_next_lesson()` API to populate this.
- **Business Lexicon (SRS) Widget**: A "Daily Review" card indicating how many vocabulary terms are due for spaced repetition today (e.g., "12 terms due"). Clicking this routes to `/lesson/vocabulary`.

### 1.3 Curriculum Map Subsystem (`/learn` and `UnitCard.tsx`)
The main syllabus view representing the macro-structure of the app.
- Displays a vertical timeline of predefined **Units** (e.g., Unit 1: Professional Introductions, Unit 2: Negotiations).
- Each Unit is rendered via `UnitCard.tsx`.
- A Unit contains an array of `lessons`. 
- Lessons have a distinct `status` ("locked", "in_progress", "completed"). 
- Clicking an active lesson routes the user to `/lesson/[id]`.
- *Note:* We intentionally removed unit-level certificates in favor of a single end-of-course certificate to reduce gamification clutter and focus on serious learning.

### 1.4 Progress & Analytics Subsystem (`/progress`)
This route focuses on deep metrics to prove to the user that they are learning.
- Features a complex **RadarChart** component (using SVG or Recharts) scoring the user out of 100 on 6 distinct axes: Writing, Listening, Grammar, Vocabulary, Tone, and Fluency. 
- Includes historical activity charts (hours spent per day over the last week).
- The backend needs a highly sophisticated way of calculating these 6 axes based on transcripts from voice sessions and rubrics from writing sessions.

### 1.5 Settings Subsystem (`/settings`)
- Users can update their **Coach Voice** preference (Encouraging, Direct & Professional, Balanced). *Note: This is critical. The backend must intercept this user preference and use it to alter the system prompt during real-time voice and writing lessons.*
- Users can toggle Daily Reminders and Weekly Reports, which requires a backend cron-job system to process notifications based on timezone and preferences.

### 1.6 Vocabulary Spaced Repetition System (`/lesson/vocabulary`)
A dedicated flashcard UI built for rapid-fire review, styled with a sleek dark mode aesthetic.
- Displays a horizontal progress bar at the top (e.g., Term 1 of 12).
- The flashcard initially shows the term (e.g., "Mitigation").
- Clicking "Reveal Answer" triggers a 3D Framer Motion flip (`rotateY: 180`).
- The back of the card shows: Phonetic spelling, Definition, and a Business Context sentence.
- The user must click either **"Still Learning"** (red) or **"Got It"** (green).
- *Missing Backend Requirement*: The backend must implement a SuperMemo-2 (SM-2) or Leitner system. When the user clicks "Got It", the backend must calculate the next review date (e.g., +1 day, +3 days, +7 days).

### 1.7 The Lesson Engine & Interactive Node Components (`/lesson/[id]`)
This is the heart of the application. A single lesson consists of multiple distinct "Stages" or "Nodes" that the user progresses through sequentially. The frontend relies on the backend to provide an array of nodes or to dynamically stream the next node upon completion of the current one.
- **`ThreadedTheory.tsx`**: Renders beautifully formatted markdown content (explanations, tips, bullet points) providing the foundational knowledge for the lesson.
- **`ThreadedMCQ.tsx`**: Renders a question with multiple choices. The user selects one. If incorrect, the UI shakes (via Framer Motion `x: [-10, 10, -10, 10, 0]`) and turns red. If correct, it turns green and reveals a "Continue" button.
- **`WritingAssessmentPage` (`/lesson/writing`)**: An Email/Slack simulation workspace. The user is given a scenario (e.g., "Draft an email apologizing to a client for a delayed deliverable"). They type in a standard `textarea`. Upon submission, a loading spinner simulates "AI Grading". The UI then reveals a rubric score (Tone 8/10, Clarity 9/10, Structure 6/10), specific explanations for each score, and an "AI Suggested Rewrite" for comparison.
- **`TargetedFixCard.tsx`**: A component designed to pop up dynamically when the user makes a recurring mistake across multiple lessons, offering a targeted micro-drill to fix it.
- **`InteractiveQnA.tsx`**: A freeform chat component where the user can ask the AI questions about the current lesson. We want this to have a transcribe feature, where the user can speak their question instead of typing it.
- **`ThreadedVoice.tsx` (The Crown Jewel)**:
  - This is a real-time conversational interface powered entirely by WebSockets.
  - It displays a scenario (e.g., "Negotiate a 10% discount on software licensing").
  - Features an animated audio visualizer that pulses when the user speaks and when the AI speaks.
  - The user speaks into their microphone. The frontend uses the MediaRecorder API or Web Audio API to stream raw WebM or PCM chunks to the backend socket.
  - The AI speaks back immediately. The frontend receives binary audio blobs and plays them seamlessly via an AudioBufferSourceNode.
  - *Strict Requirement*: Latency must be under 1 second to maintain the illusion of a fluid conversation. Furthermore, if the user begins speaking while the AI is mid-sentence, the frontend fires an `interrupt` signal to the backend to kill the TTS stream immediately.
- **`Assessment Complete Screen`**: After finishing the nodes, the user sees a completion screen showing their overall scores (Grammar 90%, Vocabulary 80%, Tone 85%) and an "AI Coach Summary" which details their performance and "Prioritized Fixes".

---

## Part 2: Forensic Breakdown of the Current Backend (FastAPI, Python)

The backend is currently a rudimentary skeleton. It lacks the complex connective tissue, the state machine, and the data models required to drive the rich frontend described above. It is a greenfield opportunity for you to design it right the first time.

### 2.1 Existing Infrastructure & Core Stack
- **Framework**: FastAPI (Python 3.11+). Using Uvicorn as the ASGI server. Fast, asynchronous, and perfectly suited for WebSocket concurrency.
- **Database Layer**: **Supabase**. We are shifting to Supabase (PostgreSQL under the hood, but leveraging Supabase Auth, Row Level Security, and edge functions if needed). Basic Pydantic models exist in `schema.py` for `UserSchema`, `LoginRequest`, `SignupRequest`, `LessonSchema`, `UnitSchema`. However, there are no actual relational mappings for Curriculum, Spaced Repetition, or deeply nested User Stats in Supabase yet.
- **REST Routes (`api/routes.py` & `api/auth.py`)**: Basic boilerplate for JWT authentication. User creation, password hashing, and token generation exist in a primitive state. We intend to migrate this to Supabase Auth.
- **WebSocket Routes (`api/websockets.py`)**: Placeholder files for the Voice pipeline. Currently does not handle streaming audio bytes correctly.

### 2.2 Available AI Tools & Dependencies (The Shift to Groq + Llama 70B)
- **Groq + Llama 3 70B**: We are pivoting from Google Gemini to using **Groq** hosting **Llama 70B** as our core Foundation Model. We need the lightning-fast inference speed of Groq to achieve our sub-second latency constraints. Groq will handle text generation, curriculum generation, writing grading rubrics, and the conversational brain behind the Voice nodes.
- **ElevenLabs**: Will be used for ultra-realistic Text-to-Speech (TTS) during the Voice Node. We are using their WebSocket streaming API to receive audio chunks as fast as Groq generates text chunks.
- **ChromaDB / Supabase pgvector**: Installed for vector-based Retrieval-Augmented Generation (RAG). The strategic plan is to embed our "Core Curriculum Textbook" (PDF chunks) so the LLM can query it when generating lesson content to prevent hallucinations.
- **Redis**: Installed and running. Intended for fast session state management during active WebSocket connections. We cannot afford to write every conversational turn to Supabase during a live voice call; Redis must handle the ephemeral chat history.

### 2.3 The Missing Connective Tissue (What we need you to architect)
1. **Supabase Relational Schemas**: We need a complex schema that maps `Units` -> `Lessons` -> `Lesson Nodes`. We need highly normalized tables for `User Progress`, `User Stats` (to feed the Radar chart axes), and `SRS Vocabulary` (tracking SuperMemo-2 variables: next review date, interval, repetition number, ease factor).
2. **The Writing Assessment Engine**: A REST pipeline that receives a user's email draft, constructs a complex prompt including the scenario, passes it to Groq enforcing a strict JSON schema output (Pydantic parsing), and returns the graded rubric to the frontend without timing out.
3. **The Low-Latency Voice Pipeline (WebSockets)**: This is the most harrowing engineering challenge. We must orchestrate: User Audio Stream -> STT (Speech to Text, via Groq/Whisper) -> Groq LLM -> ElevenLabs TTS -> Audio Byte Stream back to Frontend. 
   - Latency must remain under 1 second. 
   - How do we handle "interruptions"? If the user speaks while ElevenLabs is talking, we must instantly kill the audio stream, send a kill signal to ElevenLabs, halt Groq's generation, and append the partial text to the conversation history.

---

## Part 3: The Source Material Constraints ("The Book")

Buslingo is absolutely NOT an open-ended conversational chatbot wrapper. It is a highly structured, pedagogical EdTech platform. To ensure high quality, we are enforcing strict constraints on how knowledge is managed.

### 3.1 The Ingestion Pipeline
1. **The Knowledge Base**: We will ingest a core knowledge base (e.g., a 500-page PDF textbook on Business English or a highly structured JSON syllabus provided by linguistic experts).
2. **Chunking & Embedding**: This textbook must be chunked and embedded into our vector store (ChromaDB or Supabase pgvector) so that Groq has ground truth to reference for grammar rules, business etiquette, and vocabulary definitions.

### 3.2 Hardcoded Scaffolding (The Macro Structure)
- The overarching skeleton of the curriculum is fixed. It is not generated on the fly.
- There will be exactly 10 **Units** (e.g., Unit 1: Introductions, Unit 2: Emails, Unit 3: Negotiations, Unit 4: Presentations).
- The *number of lessons* within each Unit is strictly fixed (e.g., Unit 1 has exactly 4 lessons). A user looks at the `/learn` page and sees a definitive path.

### 3.3 Dynamic AI Content (The Micro Structure)
- While the scaffolding is fixed, the *titles of the lessons* and the *actual content inside the nodes* are dynamically generated by the AI.
- This generation is highly personalized based on two core variables:
  - **Proficiency Level**: (Beginner, Intermediate, Advanced). Assessed during an onboarding placement test.
  - **Historical Weaknesses**: Pulled from the user's Radar Chart stats (e.g., User struggles with "Present Perfect Tense" or "Professional Tone").
- *A Concrete Example*: 
  - User A (Beginner) opens Unit 3, Lesson 1. The AI names the lesson "Basic Meeting Greetings". It generates simple Theory nodes and basic MCQs. 
  - User B (Advanced) opens Unit 3, Lesson 1. The AI names the lesson "Taking Control of Hostile Board Meetings". It skips simple Theory and generates a highly complex Voice Negotiation node. 
  - *Crucially*, both versions pull their core facts and learning objectives from "Chapter 3: Meetings" in the embedded textbook.

---

## Part 4: The Core Architectural Dilemma: Orchestrating the Lesson Flow

Here is the exact crux of the problem we need your architectural brilliance to solve. 

When a user clicks "Start Lesson" on the frontend, they enter the `/lesson/[id]` flow. As detailed earlier, a single lesson consists of a sequence of Nodes (`Theory`, `MCQ`, `Voice`, `Writing`, `QnA`).

**How does the AI actually *teach* and sequence these nodes?** 

We have hypothesized two distinct approaches, but both have severe, potentially project-killing drawbacks. **We highly encourage you to completely discard these and propose a third, superior paradigm if one exists.**

### Approach A: The Autonomous AI Agent (Dynamic, Just-In-Time Orchestration)
The LLM acts as the master orchestrator in real-time, functioning as an autonomous agent. When the user starts a lesson, the backend opens a WebSocket connection and prompts the LLM: 
*"You are an expert tutor teaching Chapter 3. The user is Intermediate. Guide them through the lesson using your available tools. Do not finish until you are satisfied they understand."*

The LLM is provided with **Function Calling Tools** mapped directly to our frontend UI components: `trigger_theory(text)`, `trigger_mcq(question, options, correct_answer)`, `trigger_voice_roleplay(scenario)`, `trigger_writing_prompt(scenario)`.

- **How it works:** 
  1. The LLM evaluates the state and decides the user needs context. It calls `trigger_theory("In business meetings, always...")`. 
  2. The backend intercepts the tool call and sends a JSON payload to the frontend. The frontend renders the Theory UI. 
  3. The user reads it and clicks "Next". The frontend pings the backend. 
  4. The LLM evaluates the state again and calls `trigger_mcq()`. 
  5. If the user fails the MCQ, the frontend sends the failure to the backend. The LLM dynamically decides to call `trigger_voice_roleplay()` to verbally practice the concept they just failed.
- **The Pros:** Incredibly adaptive. The AI acts exactly like a top-tier human tutor, pivoting the lesson structure based on real-time performance, emotional state, and immediate feedback.
- **The Cons:** 
  - **Catastrophic Latency:** Every transition between UI screens requires a round-trip to the LLM to decide the next step. Users will be staring at loading spinners between every single screen.
  - **Reliability & Hallucination:** High risk of the agent going rogue. The LLM might loop infinitely on MCQs, refuse to call the Voice tool, break the JSON schema of the tool call, or decide the lesson is over after 10 seconds.
  - **UX Nightmares:** We cannot show a "Progress Bar" (e.g., Step 2 of 5) on the frontend because the total number of steps is entirely unknown until the AI agent decides it is done. Users hate not knowing how long a task will take.

### Approach B: The Deterministic Backend State Machine (Static, Pre-generated Orchestration)
The backend completely orchestrates the flow. Before the user even clicks "Start", the backend defines a rigid, immutable path for the lesson: 
`[Node 1: Theory] -> [Node 2: Voice] -> [Node 3: MCQ] -> [Complete]`.

The backend calls the LLM asynchronously in the background to "fill in the blanks" for these predefined nodes. 
For example: *"Generate 1 Theory text, 1 Voice Scenario, and 1 MCQ for an Intermediate learner about Meeting Interruptions based on chapter 3 of the PDF."*

- **How it works:** When the user starts the lesson, the backend passes a massive array of pre-generated JSON nodes to the frontend all at once (or serves them instantly via REST). The frontend handles the transitions instantly on the client side.
- **The Pros:** 
  - 100% predictable. Highly reliable. 
  - **Zero latency** between screen transitions. 
  - Progress bars work perfectly (`currentIndex / totalNodes`). 
  - Easy to save user state in Supabase if they close the app mid-lesson. 
- **The Cons:** 
  - Rigid, dumb, and lacks the "magic" of AI. 
  - If a user completely bombs the Voice Node, the system cannot dynamically adapt and insert a remedial Theory Node to explain what they did wrong. It just blindly moves to the next predefined node. It acts like a standard Web 2.0 app with AI-generated text, losing the "Personal AI Tutor" value proposition.

### Approach C: The Hybrid / Alternative Paradigm (We need your help here)
Is there a way to combine the predictability, progress bars, and zero-latency of a Backend State Machine with the deeply adaptive, remedial capabilities of an Autonomous Agent? 
Should we pre-generate a "Happy Path" but allow the agent to intercept failures with pre-generated "Targeted Fix" components? 
Should the AI pre-generate a decision tree rather than a linear path? 
Should we use a Graph Database to handle curriculum nodes? 
We are looking for a groundbreaking architectural pattern here.

---

## Part 5: The "API Call Explosion" Dilemma

As we discussed the architecture, a glaring concern emerged: **Almost every single interaction in this application relies on an LLM inference call.**

Consider the sheer volume of AI invocations per user session:
1. **Lesson Generation**: AI must dynamically generate the titles and node content (Theory, MCQs, Scenarios) for a lesson before it starts.
2. **QnA Chat**: The user can ask questions during the lesson. This requires an STT call (if they use voice) and an LLM call to answer.
3. **Voice Exercise**: The user engages in a 5-minute back-and-forth roleplay. This is dozens of continuous STT -> LLM -> TTS loops.
4. **MCQ Evaluation**: If the user gets an MCQ wrong, the AI must instantly generate an explanation of *why* they got it wrong based on their specific incorrect choice.
5. **Writing Assessment**: The AI must ingest an entire email draft and output a massive JSON rubric of Tone, Clarity, and Structure, plus a rewritten draft.
6. **Assessment Complete Screen**: The AI must ingest the entirety of the user's performance across the whole lesson and generate an "AI Coach Summary" and a list of "Prioritized Fixes".
7. **Business Lexicon (SRS)**: The AI might need to generate fresh contextual business sentences for vocabulary words.

### The Financial & Rate-Limit Questions:
- **How do we reduce this massive explosion of API calls?**
- Should we pre-generate the *entire curriculum* (all units, all lessons, all possible MCQ explanations) for a specific user level upon signup and just store it in Supabase? Or does that defeat the purpose of an adaptive AI?
- How many API calls to Groq/Llama 70B can we realistically sustain per user session without going bankrupt or hitting severe rate limits?
- If we cache responses, how do we cache highly contextual things like Voice roleplays or Writing assessments?

### The AI Integration & Prompt Engineering Challenge
Beyond the cost and rate-limits, we have a massive technical skill gap: **We simply do not know how to reliably integrate the AI to function well across all these disparate tasks.**
This is arguably the most important part of the backend, yet the most ambiguous to us. How do we build the system prompts, function calling wrappers, and integration architecture to make Llama 70B perform all these tasks without hallucinating or breaking the required JSON schemas?
- How do we pass the user's specific context (Beginner level, struggles with past tense) into the system prompt for a Voice roleplay without exceeding context windows?
- How do we structure a prompt to reliably output the Writing Assessment rubric (Tone, Clarity, Structure, Rewrite) every single time?
- Should we use heavy abstraction frameworks like LangChain or LlamaIndex, or should we write raw API wrappers?
- We need you to provide the exact architectural pattern for managing these prompts and integrating the LLM into the FastAPI codebase safely.

---

## Part 6: Your Monumental Task (The Deliverables)

As our Principal Architect, you must provide a highly detailed, comprehensive, brilliantly reasoned response addressing the following 8 pillars. Do not skimp on technical depth. Use diagrams (mermaid if possible), code snippets, and deep architectural reasoning. Your response should be massive.

### 1. Critique & Resolve the Orchestration Dilemma
Critically analyze Approach A vs. Approach B. Discuss the specific trade-offs regarding EdTech UX, LLM token limits, WebSocket latency constraints, and database persistence. 
**Then, provide the definitive recommendation.** We are relying on you. If you recommend a Hybrid approach (Approach C), define the exact boundaries. What does the Backend control? What does the LLM control? How do we maintain zero-latency transitions while remaining deeply adaptive? How do we show a progress bar to the user if the path can change?

### 2. Solve the "API Call Explosion"
Address the massive volume of LLM calls detailed in Part 5. 
Provide a concrete strategy for what should be pre-generated (and when), what should be cached, and what *must* remain real-time Just-In-Time (JIT) generation. Defend your strategy from a cost-analysis and rate-limiting perspective when scaling to 10,000 users.

### 3. FastAPI Route Estimation & Blueprint
Given your proposed architecture, give us an estimation of exactly how many REST API routes and WebSocket routes the FastAPI backend will actually need. List out the core expected routes (e.g., `GET /api/curriculum`, `POST /api/lesson/complete`, `WS /ws/voice`). We need a structural map of the backend.

### 4. The Voice WebSocket Pipeline Architecture (Deep Dive)
The Voice Node is the most difficult feature. It requires routing: 
`User Audio Stream -> FastAPI WebSocket -> STT (Groq/Whisper) -> Groq Llama 70B -> ElevenLabs TTS -> FastAPI WebSocket -> Frontend Audio Player`.
- Outline the architecture for this specific pipeline. 
- How do we achieve sub-second latency? 
- How do we manage the conversational context in Redis? 
- How do we implement "barge-in" or interruption logic (killing the ElevenLabs stream mid-sentence if the user interrupts)?

### 5. Supabase Schema Design
Provide the essential Supabase (PostgreSQL) database schema (tables and relationships) required to support your recommended orchestration strategy. 
- We need tables for Users, Units, Lessons, Nodes, Progress, Stats, and SRS Vocabulary.
- Crucially: Explain how we save "User Progress" mid-lesson. If a user is on Node 3 of 5, and their browser crashes, how does your architecture ensure they resume exactly where they left off without regenerating the entire lesson?

### 6. Step-by-Step Data Flow Diagram
Walk through a highly specific example. 
- Scenario: User A (Intermediate level) clicks "Start Lesson 3 in Unit 2". 
- Trace the exact sequence of REST/WebSocket calls, LLM invocations, and database writes from the moment of the click until the lesson is completed and XP is awarded.

### 7. The Writing Assessment Grading Logic
Detail how the backend should handle the Writing Node submission. How do we construct a prompt that forces Llama 70B to return a strict JSON schema containing a Tone score, Clarity score, Structure score, explanations, and a rewritten draft? How do we handle parsing errors if the LLM hallucinates outside the JSON format?

### 8. Critical Pitfalls & Mitigation Strategies
Given our specific stack (FastAPI, Python, Groq Llama 70B, ElevenLabs, Supabase, Next.js, Redis), what are the 3 biggest technical landmines we will step on while implementing your architecture? (Think race conditions, socket timeouts, memory leaks in Uvicorn, context window exhaustion). Provide the exact engineering strategies to avoid them.
