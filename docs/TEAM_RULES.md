# AI IDE Initialization Prompts & Team Workflow

When you pull this skeleton to your local machine and switch to your branch (`umer`, `talha`, or `mohsin`), open your AI IDE (Cursor, GitHub Copilot, Gemini IDE, etc.).

## The Golden Rules of AI Pair Programming

Your AI acts as a **senior pair programmer**. Every implementation is reviewed by the developer before being committed. Do not ask it to "build the whole module". 

### General AI Rules
- Read roadmap first (`docs/ROADMAP.md`).
- Read API contract (`docs/api_contract.md`).
- Don't rename folders.
- Don't edit another person's files.
- Build one feature at a time.
- Explain before coding.
- Wait for confirmation.

### 🚨 Emergency Rule
If the AI suddenly says:
- *"I'm going to rename folders..."*
- *"Let's rewrite everything..."*
- *"Let's migrate the project..."*

**STOP. Open a new chat.** AI sometimes goes off the rails. Never let it refactor the whole project unless your team agrees.

### Never code before understanding
Every AI session begins with:
Read the repository.
↓
Read roadmap.
↓
Read API contract.
↓
Explain your understanding.
↓
Wait.
↓
Build.

---

## Daily Workflow
This is what all three of you should literally follow every day.

Open project
↓
`git checkout main`
↓
`git pull`
↓
`git checkout my-branch`
↓
`git merge main`
↓
Open AI
↓
AI reads repository, roadmap, api_contract, and TEAM_RULES
↓
AI explains plan
↓
You approve
↓
AI builds ONE feature
↓
You test locally
↓
`git add .`
↓
`git commit -m "feat: your feature"`
↓
`git push`
↓
Open Pull Request
↓
Merge to `main`
↓
Repeat

---

## The Initial Prompt (Copy-Paste this into your AI IDE)

When starting a new chat with your AI, use the prompt below for your specific role.

### Person 1 (AI & RAG Engineer)
> "I am Person 1 on a 3-person team building a Business English Tutor.
> Read the ENTIRE repository first. Read `docs/ROADMAP.md` and `docs/api_contract.md`. Understand the architecture.
> Explain what Person 1 is responsible for, based on the roadmap.
> Wait for my confirmation before writing any code.
> My responsibility is strictly the Intelligence layer: LLM integration, RAG pipeline, and ElevenLabs TTS integration.
> Do NOT touch the FastAPI routing (`routes.py`), Redis session logic, or the Frontend.
> Once I confirm, we will build ONE small feature at a time, starting with setting up a basic non-streaming Gemini call in `llm_service.py`."
(only for reference person 1 and 2. i am person 1 now only)
### Person 2 (Backend & Infrastructure Engineer)
> "I am Person 2 on a 3-person team building a Business English Tutor.
> Read the ENTIRE repository first. Read `docs/ROADMAP.md` and `docs/api_contract.md`. Understand the architecture.
> Explain what Person 2 is responsible for, based on the roadmap.
> Wait for my confirmation before writing any code.
> My responsibility is strictly the Infrastructure layer: FastAPI scaffolding, WebSocket management, Redis session memory, and PostgreSQL.
> Do NOT touch the LLM/RAG logic, TTS API calls, or the Frontend.
> Once I confirm, we will build ONE small feature at a time, starting with scaffolding the FastAPI app in `main.py`."

### Person 3 (Frontend & Integration Engineer)
> "I am Person 3 on a 3-person team building a Business English Tutor.
> Read the ENTIRE repository first. Read `docs/ROADMAP.md` and `docs/api_contract.md`. Understand the architecture.
> Explain what Person 3 is responsible for, based on the roadmap.
> Wait for my confirmation before writing any code.
> My responsibility is strictly the Interface layer: HTML, CSS, WebSocket Client, and Web Audio API playback.
> Do NOT touch any Python code in the `backend/` folder.
> Once I confirm, we will build ONE small feature at a time, starting with building a static chat UI in `index.html` and `style.css`."
