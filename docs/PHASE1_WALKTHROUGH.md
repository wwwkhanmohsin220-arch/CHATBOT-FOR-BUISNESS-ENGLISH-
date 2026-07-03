# Phase 1 Walkthrough (Intelligence Layer)

## What was built
During Phase 1, Umer (Person 1) laid the entire foundation for the Intelligence layer of the Business English Tutor:

### 1. Robust System Prompt (`llm_service.py`)
- Migrated to the modern `google-genai` SDK to avoid legacy Python 3.14 issues.
- Established the official **System Instruction** that enforces the AI to act as a strict but polite corporate English tutor.
- The AI is now instructed to identify errors, correct them, and provide 2-3 professional alternatives.
- Built logic to optionally accept `rag_context` and dynamically inject it into the System Prompt.

### 2. RAG Pipeline Foundation (`rag_service.py`)
- Installed and integrated **ChromaDB** for local vector storage.
- Used `langchain-text-splitters` (specifically `RecursiveCharacterTextSplitter`) to intelligently chunk large curriculum documents.
- Wrote an `embed_document()` function that takes a text file, splits it, and embeds it into ChromaDB.
- Wrote a `retrieve_context()` function to search the database using the user's query and pull the most relevant grammar rules.

### 3. Sample Curriculum (`sample_curriculum.txt`)
- Added a mock curriculum covering "Professional Scheduling" and "Email Sign-offs" so the RAG pipeline has real data to query and inject.

### 4. End-to-End Local Testing (`test_ai.py`)
- Wrote an isolated test script so Person 1 can verify the entire flow without needing FastAPI or the Frontend.
- The script automatically embeds the sample curriculum, retrieves context based on the user's bad grammar, and passes both the prompt and the context to Gemini.

## How to test it yourself
Run the following from the root directory:
```bash
pip install -r requirements.txt
python test_ai.py
```
