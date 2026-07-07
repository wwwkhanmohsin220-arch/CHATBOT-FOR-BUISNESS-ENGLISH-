# Team Roadmap

This document breaks down the project milestones across the three primary team members (Umer, Talha, and Mohsin). While everyone is expected to contribute across the full stack, the tasks below reflect primary ownership areas.

## Milestone 1: Foundation
**Umer:**
- Initialize Next.js frontend, install Tailwind CSS, shadcn/ui, and Framer Motion.
- Set up core routing (Splash, Login, Signup, Dashboard).
- Establish consistent frontend design system and global styles.

**Talha:**
- Initialize FastAPI backend with basic routing and configuration.
- Set up PostgreSQL and Redis connections.
- Scaffold basic authentication APIs (Login/Signup).

**Mohsin:**
- Set up GitHub Actions CI for both frontend and backend.
- Define testing strategy and configure initial test environments (e.g., Pytest, Jest).
- Prepare staging environment on Vercel and Render/Railway.

## Milestone 2: Learning Platform
**Umer:**
- Build Dashboard UI, Curriculum navigation, and Unit/Lesson layouts.
- Connect frontend components to backend API endpoints.

**Talha:**
- Design database schemas for Units, Lessons, and Curriculum.
- Build REST APIs for fetching curriculum and lesson details.
- Implement RAG integration (ChromaDB) for content retrieval.

**Mohsin:**
- Create and run integration tests for the curriculum fetching APIs.
- Assist Umer with UI polish and responsive layouts.
- Assist Talha in populating the database with mock/starter lesson content.

## Milestone 3: Voice Experience
**Umer:**
- Design and integrate the Voice Practice interface.
- Hook up live visualizer UI and coordinate states.

**Talha:**
- Extend WebSockets support for real-time streaming.
- Integrate the AI conversational logic and maintain conversation states.

**Mohsin:**
- Integrate ElevenLabs TTS and handle Web Speech API configuration.
- Build the Transcript management layer and Voice interruption logic.
- Conduct extensive testing on voice latency and robustness.

## Milestone 4: Writing
**Umer:**
- Build the Writing interface/editor.
- Implement UI for AI grammar feedback and rewrite suggestions.

**Talha:**
- Develop the AI coach prompts for writing evaluation.
- Build backend endpoints to assess grammar and provide suggestions.

**Mohsin:**
- Write QA tests for different writing inputs (good grammar, bad grammar, edge cases).
- Fine-tune prompting latency and ensure smooth AI fallback logic.

## Milestone 5: Progress
**Umer:**
- Build UI components for XP, Levels, Streaks, and Achievements.
- Integrate progress metrics into the Dashboard and Profile pages.

**Talha:**
- Architect the progress tracking engine (XP, streaks, levels) in PostgreSQL.
- Build backend APIs for logging progress and unlocking achievements.

**Mohsin:**
- Test streak edge cases (timezones, consecutive days).
- Help integrate progress milestones into the deployed staging app.

## Milestone 6: Analytics
**Umer:**
- Build the Performance Analytics Dashboard and Skill tracking UI.
- Implement personalized recommendation views.

**Talha:**
- Develop the analytics engine to aggregate student memory and weakness detection.
- Build API endpoints to serve performance metrics.

**Mohsin:**
- Write end-to-end (E2E) tests for the complete user journey through lessons to analytics.
- Ensure analytical data is accurately reflected in staging.

## Milestone 7: Deployment
**Umer:**
- Finalize responsive improvements and UI polish.
- Final portfolio presentation adjustments.

**Talha:**
- Optimize database queries and API response times.
- Ensure backend stability under simulated load.

**Mohsin:**
- Final production deployments (Docker, Render, Vercel).
- Set up monitoring and alerting (e.g., Sentry).
- Final bug fixing and overall Quality Assurance sign-off.
