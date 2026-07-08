# Mohsin's Phase Tracking (Backend Architecture + APIs)

*(Project: Buslingo structured AI-native Business English platform)*

**Team ownership**
- Umer: Frontend Architecture, UI/UX, frontend AI integration
- Mohsin: Backend Architecture, FastAPI, PostgreSQL, Redis, REST APIs
- Talha: Voice Experience, QA testing, Deployment

**Mohsin file boundaries**
- Work in: `backend/main.py`, `backend/api/routes.py`, `backend/models/schema.py`
- May work in: backend database/Redis integration files when they exist
- Coordinate with Talha in: `backend/api/websockets.py`
- Do not modify: `old/`, frontend UI components, or Talha's voice QA/deployment code
- Respect all `@ai-restriction` headers before editing any file

---

## Current Skeleton Status

- [x] `docs/project_master.md` exists and defines the new AI-native learning platform
- [x] `docs/ROADMAP.md` exists and assigns team milestones
- [x] `.agents/AGENTS.md` exists and defines agent/team restrictions
- [x] `shared/api_contract.md` exists and defines REST + WebSocket contracts
- [x] `backend/main.py` exists as basic FastAPI app skeleton
- [x] `backend/api/routes.py` exists as REST skeleton owned by Mohsin
- [x] `backend/api/websockets.py` exists as voice WebSocket skeleton owned by Mohsin & Talha
- [x] `backend/models/schema.py` exists as schema skeleton owned by Mohsin
- [ ] Voice WebSocket implementation is not built yet
- [x] WebSocket router is mounted in `backend/main.py`
- [x] REST API router is mounted in `backend/main.py`
- [x] Initial PostgreSQL integration completed by Mohsin
- [x] Initial Redis integration completed by Mohsin
- [x] Auth schemas are scaffolded
- [x] Login/signup REST endpoints are scaffolded
- [x] Auth persistence store added with PostgreSQL + in-memory fallback
- [x] Auth routes moved into `backend/api/auth.py`
- [x] Signup/login return one stable `session_id` per user
- [x] User `id` is PostgreSQL primary key
- [x] User `session_id` is unique
- [x] Username uniqueness is enforced

---

## Phase 1: Foundation

### Umer
- [ ] Initialize/clean Next.js frontend structure
- [ ] Set up Tailwind CSS, shadcn/ui, and Framer Motion
- [ ] Build base routing for Splash, Login, Signup, Dashboard
- [ ] Establish global design system

### Mohsin
- [x] Basic FastAPI app skeleton exists in `backend/main.py`
- [x] REST router skeleton exists in `backend/api/routes.py`
- [x] PostgreSQL connection setup
- [x] Redis connection setup
- [x] Authentication API scaffold
- [x] `/api/auth/signup` scaffold
- [x] `/api/auth/login` scaffold
- [x] Login/signup wired to auth store
- [x] Auth route file separated from main REST aggregator
- [x] Stable user `session_id` stored in PostgreSQL/fallback memory
- [x] User IDs, session IDs, emails, and usernames are unique

### Talha
- [x] Read `docs/project_master.md`
- [x] Read `docs/ROADMAP.md`
- [x] Read `.agents/AGENTS.md`
- [x] Read `shared/api_contract.md`
- [x] Scan and enforce `@ai-restriction` comments
- [x] Create `phases.md` tracking file
- [ ] Define initial QA/testing strategy
- [ ] Set up initial backend test environment
- [ ] Set up initial frontend test environment
- [ ] Prepare staging plan for Vercel + Render/Railway

**Mohsin hold / wait**
- Wait for Umer before changing frontend UI layout/design.
- Coordinate with Talha before changing ElevenLabs or voice QA behavior.

---

## Phase 2: Learning Platform

### Umer
- [ ] Build Dashboard UI
- [ ] Build Curriculum navigation
- [ ] Build Unit/Lesson layouts
- [ ] Connect frontend components to backend APIs

### Mohsin
- [ ] Design Units, Lessons, and Curriculum database schemas
- [ ] Build curriculum REST APIs
- [ ] Build lesson detail REST APIs
- [ ] Implement RAG/content retrieval integration

### Talha
- [ ] Create curriculum API integration tests
- [ ] Run curriculum API QA checks
- [ ] Help populate starter lesson content if Mohsin requests support
- [ ] Assist UI polish only after Umer's layout is ready

**Mohsin hold / wait**
- Coordinate with Talha for curriculum API integration tests.
- Wait for Umer's lesson UI before testing frontend-to-backend learning flow.

---

## Phase 3: Voice Experience

### Umer
- [ ] Design Voice Practice interface
- [ ] Add live voice visualizer UI
- [ ] Connect UI states to backend voice events

### Mohsin
- [ ] Define conversation state model
- [ ] Coordinate backend state needed by voice sessions
- [ ] Assist with WebSocket state persistence if needed

### Talha
- [x] Implement `/ws/voice` session lifecycle in `backend/api/websockets.py`
- [x] Support client event: `start_session`
- [x] Support transcript server events
- [ ] Integrate ElevenLabs streaming TTS
- [x] Send `ai_response_audio` event placeholder over WebSocket
- [ ] Add disconnect handling
- [ ] Add voice interruption handling
- [ ] Add transcript management layer
- [ ] Test voice latency and robustness

**Mohsin first build step**
- Finish auth scaffold, then move into curriculum schemas/routes.
- Keep payloads aligned with `shared/api_contract.md`.

**Mohsin hold / wait**
- Coordinate with Talha before changing ElevenLabs or voice QA behavior.
- Wait for Umer's Voice Practice UI before doing full browser UI integration.
- Can test WebSocket manually before frontend is ready.

---

## Phase 4: Writing

### Umer
- [ ] Build writing editor UI
- [ ] Build grammar feedback UI
- [ ] Build rewrite suggestion UI

### Mohsin
- [ ] Build writing assessment endpoints
- [ ] Develop AI coach prompts for writing
- [ ] Return grammar and rewrite suggestions

### Talha
- [ ] Write QA tests for strong writing inputs
- [ ] Write QA tests for weak grammar inputs
- [ ] Write QA tests for edge cases and empty/invalid inputs
- [ ] Test AI fallback behavior and latency

**Mohsin hold / wait**
- Coordinate with Talha for writing QA automation.
- Wait for Umer's writing UI before E2E writing tests.

---

## Phase 5: Progress

### Umer
- [ ] Build XP, Levels, Streaks, and Achievements UI
- [ ] Integrate progress metrics into Dashboard/Profile

### Mohsin
- [ ] Architect progress tracking in PostgreSQL
- [ ] Build progress APIs
- [ ] Build achievement unlock logic

### Talha
- [ ] Test streak timezone edge cases
- [ ] Test consecutive-day behavior
- [ ] Test progress milestone behavior in staging

**Mohsin hold / wait**
- Coordinate with Talha for progress edge-case testing.
- Wait for Umer's progress UI before frontend QA.

---

## Phase 6: Analytics

### Umer
- [ ] Build analytics dashboard UI
- [ ] Build skill tracking UI
- [ ] Build recommendation views

### Mohsin
- [ ] Build analytics aggregation engine
- [ ] Build student weakness detection
- [ ] Build analytics API endpoints

### Talha
- [ ] Write E2E tests from lesson flow to analytics
- [ ] Validate analytics data accuracy in staging
- [ ] Report mismatches between backend data and frontend display

**Mohsin hold / wait**
- Coordinate with Talha for analytics E2E coverage.
- Wait for Umer's analytics UI before full E2E.

---

## Phase 7: Deployment + Final QA

### Umer
- [ ] Final responsive improvements
- [ ] Final UI polish
- [ ] Portfolio presentation adjustments

### Mohsin
- [ ] Optimize database queries
- [ ] Optimize API response times
- [ ] Run backend stability checks

### Talha
- [ ] Set up GitHub Actions CI
- [ ] Configure Docker deployment path
- [ ] Prepare Render/Railway backend deployment
- [ ] Prepare Vercel frontend deployment support
- [ ] Add monitoring/alerting plan
- [ ] Run final full-product QA pass
- [ ] Sign off on production readiness

**Mohsin hold / wait**
- Coordinate with Talha before final production deployment.
- Ensure backend stability before production sign-off.

---

## Immediate Next Step For Mohsin

- [x] Correct backend ownership headers
- [x] Mount REST API router in `backend/main.py`
- [x] Add `SignupRequest`, `LoginRequest`, and `AuthResponse`
- [x] Add `/api/auth/signup`
- [x] Add `/api/auth/login`
- [x] Add PostgreSQL auth store with in-memory fallback
- [x] Split auth endpoints into `backend/api/auth.py`
- [x] Add stable `session_id` to auth user flow
- [x] Enforce unique user id, session id, email, and username
- [ ] Add curriculum database schemas
- [ ] Add lesson detail endpoint
