# BusLingo

BusLingo is an AI-powered Business English learning platform built as a portfolio project by Mohsin, Umer, and Talha. The project is designed to help learners improve professional communication through interactive lessons, voice practice, writing tasks, progress tracking, and adaptive feedback.

Live project: [buslingo.vercel.app](https://buslingo.vercel.app)

## Overview

BusLingo combines a modern frontend with an AI-enabled backend to deliver guided Business English practice. The platform focuses on practical workplace communication such as professional tone, negotiation, meetings, vocabulary, writing, and spoken fluency.

At a high level, the product includes:

- Guided lesson flows with theory, MCQs, writing, voice, and review experiences
- AI-assisted question answering and coaching
- Adaptive lesson progression and targeted remediation
- Vocabulary and SRS-based review support
- Progress analytics and learner dashboards
- Authentication and user profile management

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Supabase SSR/Auth integration

### Backend

- FastAPI
- Python
- Pydantic
- AsyncPG
- WebSockets
- HTTPX

### Database and Auth

- Supabase
- PostgreSQL

### AI and Voice

- Groq for LLM responses and transcription
- Whisper-based speech-to-text through Groq
- ElevenLabs for text-to-speech fallback/support
- Fish Audio references in the UI/backend voice pipeline

## Key Features

- Business English onboarding and learner-level setup
- Personalized lesson runtime with resumable progress
- Interactive theory, assessment, and review flows
- Voice lesson support and conversational coaching
- Writing evaluation and feedback generation
- Ask-anything QnA support around lesson content
- Dashboard metrics, activity tracking, and progress views
- Vocabulary practice and spaced repetition support

## Project Structure

```text
.
|-- backend/      FastAPI API, AI logic, lesson services, schema, scripts
|-- frontend/     Next.js app, UI components, auth flows, dashboard, lessons
|-- docs/         Architecture, roadmap, implementation notes, planning docs
|-- old/          Older prototype code kept for reference
`-- .env.example  Example backend environment variables
```

## Architecture Summary

BusLingo follows a split frontend/backend architecture:

- The `frontend` app provides the learner experience, onboarding, dashboard, lesson pages, and authenticated flows.
- The `backend` app provides APIs for lessons, progress, voice, QnA, auth-related sync, and AI-powered evaluation.
- Supabase is used for authentication and PostgreSQL-backed persistence.
- AI services are used to support lesson generation, grading, summaries, transcription, and coaching.

The docs folder also shows that the project is structured around a lesson compiler/runtime approach, where lesson content, remediation, and learner progress are coordinated through backend services and database state.

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd CHATBOT-FOR-BUISNESS-ENGLISH--1
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Create a backend `.env` file based on the project needs. Current code references values such as:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_JWT_SECRET=
SUPABASE_JWT_AUD=
SUPABASE_JWT_ISSUER=
GROQ_API_KEY=
GROQ_MODEL=
ELEVENLABS_API_KEY=
TTS_PROVIDER=
CORS_ORIGINS=
```

Run the API:

```bash
uvicorn backend.main:app --reload
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a frontend `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
BACKEND_API_URL=http://127.0.0.1:8000
```

Run the frontend:

```bash
npm run dev
```

### 4. Database

The repository includes a database schema at `backend/schema.sql`. Supabase/Postgres tables cover:

- user profiles
- lesson units and lesson slots
- lesson instances and lesson nodes
- progress and stats
- spaced repetition cards
- AI failure logging
- RAG-related document storage

## Documentation

Important project documentation is available in `docs/`, including:

- implementation blueprint
- roadmap and phases
- project planning notes
- curriculum/content references

## Why This Project

BusLingo was built as a portfolio project to showcase practical full-stack product development across:

- modern frontend engineering
- API and backend system design
- Supabase auth and database integration
- AI-assisted learning workflows
- voice and language-learning experiences

## Authors

Developed by Mohsin, Umer, and Talha as a portfolio project.
