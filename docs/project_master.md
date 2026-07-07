# 1. Project Overview

We are building an **AI-native Business English learning platform** that helps learners improve their professional English through a structured curriculum, adaptive learning, real-time voice conversations, writing exercises, assessments, and personalized feedback. Unlike a traditional AI chatbot, the platform is organized into units and lessons that guide users through a complete learning journey. The AI acts as a personal coach, teaching concepts, conducting realistic business conversations, evaluating performance, identifying strengths and weaknesses, and adapting future lessons based on each learner's progress. The goal is to create a polished, startup-quality educational product that combines the best aspects of structured learning platforms like Duolingo and Coursera with the conversational capabilities of modern AI voice agents.

---

# 2. Vision

Our vision is to create an AI-first learning experience where users feel like they have a personal Business English coach available anytime. Existing solutions either provide structured lessons without personalization or offer AI conversations without a clear learning path. We want to bridge that gap by combining a well-designed curriculum, adaptive learning, voice interaction, writing practice, and meaningful progress tracking into one cohesive platform. The product should feel like a premium educational experience rather than an AI wrapper, demonstrating how AI can be integrated into a thoughtfully designed learning system instead of simply acting as a chatbot.

# 3. Current Status

The project originally started as an AI Business English chatbot with RAG and voice capabilities. During development, we realized the product lacked a structured learning experience and behaved more like an AI wrapper than an educational platform.

Instead of restarting, we will reuse the existing backend infrastructure and build a proper AI-native learning platform on top of it.

### Existing Backend

- FastAPI backend
- WebSocket communication
- Google Gemini integration
- RAG using ChromaDB
- Redis session memory
- PostgreSQL
- ElevenLabs streaming TTS
- Real-time text streaming
- Real-time voice streaming

### Existing Frontend

- Around 20 Stitch-generated UI screens
- HTML exports
- Voice prototype
- Basic chat interface

The current frontend will serve as inspiration only and will be rebuilt using a consistent design system.

# 4. Goal

The goal is to build a portfolio-quality AI-native Business English learning platform that demonstrates:

- Modern frontend architecture
- Real-time AI voice interaction
- Adaptive learning
- Structured curriculum
- Learning analytics
- Clean UI/UX
- Full-stack engineering

The application should feel like a real SaaS startup product instead of an AI chatbot.

# 5. Target Users

Primary users include:

- University students
- Fresh graduates
- Software engineers
- Remote workers
- Freelancers
- Customer support professionals
- Sales professionals
- Anyone preparing for international jobs

Users want to improve their Business English through practical learning rather than memorization.

# 6. Core Features

- Structured curriculum
- Units & lessons
- Voice-first learning
- Writing practice
- AI explanations
- Grammar feedback
- Vocabulary suggestions
- Pronunciation feedback
- Business communication scenarios
- Adaptive learning
- XP & leveling
- Streaks
- Achievements
- Progress tracking
- Assessments
- Analytics dashboard
- Personalized recommendations
- User profiles

# 7. Pages

- Splash
- Login
- Signup
- Onboarding
- Placement Test
- Dashboard
- Curriculum
- Unit Details
- Lesson
- Voice Practice
- Writing Practice
- Quiz
- Assessment
- Review
- Vocabulary
- Progress
- Achievements
- Analytics
- Profile
- Settings

# 8. Learning Flow

User signs in
↓
Onboarding
↓
Placement Test
↓
Dashboard
↓
Choose Unit
↓
Choose Lesson
↓
Learn
↓
Voice Practice
↓
Writing Practice
↓
Assessment
↓
Feedback
↓
XP Reward
↓
Dashboard
↓
Next Lesson

# 9. Old Backend

Already present in folder: old/backend

- FastAPI
- WebSockets
- Gemini
- ElevenLabs
- Redis
- PostgreSQL
- ChromaDB
- Streaming responses
- Session memory
- Curriculum retrieval (RAG)

These components should be reused wherever possible.
# 10. Old Frontend
in old folder old/frontend, we wont be using it anymore

# 11. Needs To Build

## Frontend
Present in folder: references/references_frontend
Current assets include:

- Approximately 20 generated UI screens
- HTML exports
- PNG screenshots
- Initial voice interface

These files are visual references only.

The implementation should improve consistency while maintaining the overall product vision.
Use these screens as visual inspiration. Maintain the overall layout and UX where appropriate, but prioritize consistency, reusable components, and good design over copying every detail.

- Consistent design system
- Responsive layouts
- Navigation
- Dashboard
- Lesson pages
- Voice practice interface
- Writing interface
- Assessment screens
- Analytics
- Settings
- Profile

## Backend

- Lesson engine
- Progress tracking
- XP system
- Achievements
- Assessment engine
- Student profile
- Adaptive learning logic

## AI

- Coach prompts
- Lesson orchestration
- Assessment evaluation
- Personalized feedback
- Student memory
- Weakness detection

## Voice

- Voice practice flow
- Conversation states
- Transcript management
- Voice interruption handling

## Deployment

- Production hosting
- CI/CD
- Monitoring

# 12. Tech Stack

Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
```

Backend

```text
FastAPI
Python
WebSockets
```

AI

```text
Google Gemini
ChromaDB
Sentence Transformers
```

Voice

```text
ElevenLabs
Web Speech API (optional)
React Bits Strands
```

Database

```text
PostgreSQL
Redis
```

Deployment

```text
Vercel
Railway / Render
Docker
```
# 13. Milestones

## Milestone 1 — Foundation

- Project setup
- Routing
- Authentication UI
- Design system

---

## Milestone 2 — Learning Platform

- Dashboard
- Curriculum
- Units
- Lessons

---

## Milestone 3 — Voice Experience

- Voice interface
- Transcript
- Visualizer
- AI conversation

---

## Milestone 4 — Writing

- Writing editor
- Grammar feedback
- Rewrite suggestions

---

## Milestone 5 — Progress

- XP
- Levels
- Streaks
- Achievements

---

## Milestone 6 — Analytics

- Performance dashboard
- Skill tracking
- Recommendations

---

## Milestone 7 — Deployment

- Testing
- Bug fixing
- Responsive improvements
- Production deployment

# 14. Team

## Umer

**Primary Ownership**
- Product Management
- Frontend Architecture
- AI Integration

**Secondary Responsibilities**
- Backend development
- UI/UX implementation
- Prompt engineering
- Code reviews
- Feature integration
- Documentation

---

## Mohsin

**Primary Ownership**
- Backend Architecture
- Database
- API Development

**Secondary Responsibilities**
- Frontend development
- AI integration
- Voice features
- Testing
- Code reviews
- Documentation

---

## Talha

**Primary Ownership**
- Voice Experience
- Testing & Quality Assurance
- Deployment

**Secondary Responsibilities**
- Frontend development
- Backend development
- AI integration
- Database tasks
- UI polish
- Code reviews

---

# Collaboration Rules

- Every major feature should involve at least **two team members**.
- No one should work exclusively on one part of the stack.
- Everyone should contribute to both frontend and backend throughout the project.
- Every Pull Request should be reviewed by at least one teammate.
- Major architectural decisions should be discussed together before implementation.
- Rotate responsibilities periodically so everyone gains experience across the full stack.

# Goal

By the end of the project, every team member should understand:

- Frontend architecture
- Backend architecture
- Database design
- API development
- AI integration
- Voice pipeline
- Authentication
- Deployment
- Git & collaboration
- Debugging and testing

The objective is not only to ship a great product but also for every team member to finish the project as a significantly stronger full-stack AI-assisted developer.

# 15. Daily Workflow

Each day:

1. Morning planning (10 minutes)
2. Pick assigned tasks
3. Build independently
4. Commit code frequently
5. Push to GitHub
6. Evening sync (15–20 minutes)

Daily stand-up:

- What did I complete?
- What am I working on next?
- What is blocking me?

16. Folder Structure

# 16. Folder Structure

project/

docs/
references/
frontend/
backend/
shared/
assets/

references/

screens/
html/
competitors/
voice/
design/

# 17. AI Development Rules

- PROJECT_MASTER.md is the source of truth.
- Reuse existing backend whenever possible.
- Do not redesign architecture unless requested.
- Build reusable components.
- Maintain design consistency.
- Explain major implementation decisions.
- Prefer incremental changes over large rewrites.
- Keep code modular and well documented.

# 18. Frontend Rules

- Stitch designs are references, not final designs.
- Improve inconsistencies rather than copying them exactly.
- Reuse components across screens.
- Keep navigation consistent.
- Follow the design system.
- Prioritize usability over visual complexity.
- Ensure responsive behavior.
# 19. Definition of Done

The MVP is complete when:

- Authentication works
- Curriculum navigation works
- Lessons function correctly
- Voice practice is operational
- Writing practice is operational
- AI provides meaningful feedback
- XP and progress tracking work
- Assessments function correctly
- Analytics are available
- Responsive design is complete
- Application is deployed
- Portfolio presentation quality is achieved

# 20. Project Principles

- Reuse before rebuilding.
- One feature at a time.
- Consistency over perfection.
- AI assists; humans make product decisions.
- Always ship a working version before adding new features.