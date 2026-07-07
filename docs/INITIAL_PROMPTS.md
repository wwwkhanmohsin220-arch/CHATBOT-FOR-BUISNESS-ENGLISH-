# Initial AI Prompts for the Team

When pulling this branch for the first time, copy and paste the corresponding prompt into your AI IDE (Cursor, Copilot, etc.) to ensure it understands the new structure, its boundaries, and the current state of the project.

---

## 👨‍💻 For Talha (Backend Architecture & APIs)

**Copy and paste this prompt to your AI:**

> "I am Talha. We have just completed a major restructuring of the Buslingo project. We are pivoting to a structured AI-native learning platform. Please read `docs/project_master.md` and `docs/ROADMAP.md` to understand my role and the new architecture. Also read `.agents/AGENTS.md` and enforce all `@ai-restriction` comments found in the `backend/` files. My primary focus is FastAPI backend architecture, PostgreSQL, and API development. The `old/` directory contains legacy code for reference only—do not modify it. I need you to help me start scaffolding the database models in `backend/models/schema.py` and the curriculum REST endpoints in `backend/api/routes.py` based on `shared/api_contract.md`. Do not modify frontend UI components. Let me know when you've read the docs and are ready to start."

---

## 🎧 For Mohsin (Voice Experience, QA, & Deployment)

**Copy and paste this prompt to your AI:**

> "I am Mohsin. We have just completed a major restructuring of the Buslingo project. We are pivoting to a structured AI-native learning platform. Please read `docs/project_master.md` and `docs/ROADMAP.md` to understand my role and the new architecture. Also read `.agents/AGENTS.md` and enforce all `@ai-restriction` comments found in the codebase. My primary focus is Voice Experience (ElevenLabs, WebRTC/WebSockets), QA testing, and Deployment. The `old/` directory contains legacy code for reference only—do not modify it. I need you to help me set up the WebSockets voice streaming endpoints in `backend/api/websockets.py` and prepare our testing strategy. Do not modify standard REST routes or frontend UI components unless they are specifically for voice integration. Let me know when you've read the docs and are ready to start."

---

## 🎨 For Umer (Frontend Architecture & AI Integration)

**Copy and paste this prompt to your AI:**

> "I am Umer. We have just completed a major restructuring of the Buslingo project. We are pivoting to a structured AI-native learning platform. Please read `docs/project_master.md` and `docs/ROADMAP.md` to understand my role and the new architecture. Also read `.agents/AGENTS.md` and enforce all `@ai-restriction` comments found in the codebase. My primary focus is Frontend Architecture (Next.js, Tailwind), UI/UX, and AI integration into the frontend. The `old/` directory contains legacy code for reference only—do not modify it. We have scaffolding in `frontend/` and our API shape defined in `shared/api_contract.md`. I need you to help me start building out the global design system and routing layout in Next.js. Do not make architectural changes to the FastAPI backend. Let me know when you've read the docs and are ready to start."
