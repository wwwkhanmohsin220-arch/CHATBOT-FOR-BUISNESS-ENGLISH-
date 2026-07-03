# 🎓 The Business English Tutor: Master Class

Welcome to your AI crash course! Since you and your team are beginners, this document translates all the complex code we wrote into plain English. You can share this with Mohsin and Talha so everyone understands how the pieces fit together.

---

## Part 1: Umer's Domain (AI & Intelligence)

### 1. What is RAG? (Retrieval-Augmented Generation)
Imagine Gemini is a brilliant but isolated student taking an exam. **RAG** is basically slipping Gemini an open textbook right before it answers a question. 

Instead of relying purely on its pre-trained memory to guess how to teach Business English, we *Retrieve* specific grammar rules from our `sample_curriculum.txt`, *Augment* (inject) those rules into our prompt, and ask Gemini to *Generate* an answer based on those rules.

### 2. How does ChromaDB work? (`rag_service.py`)
Computers don't understand words; they understand numbers. 
1. **Chunking**: When you gave me `sample_curriculum.txt`, our script chopped it into small paragraphs (chunks).
2. **Embedding**: We passed those chunks to an "Embedding Model", which converted the sentences into long lists of numbers (Vectors) based on their underlying meaning. 
3. **Vector Database**: **ChromaDB** is the database that stores these number lists. 
4. **Retrieval**: When a user types *"I wants to schedules a meeting"*, we convert that sentence into numbers. ChromaDB measures the distance between the user's numbers and the database's numbers. It finds the closest match (the rule about scheduling) and returns the text!

### 3. What is Async Streaming? (`llm_service.py`)
Normally, if you ask an AI a question, your code freezes and waits 5 seconds for the entire paragraph to be generated, then returns it all at once. 

**Streaming** means we don't wait. As Google's servers calculate the very first word, they send it to us, and we instantly `yield` it. We used Python's `async` and `await` keywords to ensure our program can keep doing other tasks while it waits for the next word to arrive.

---

## Part 2: Mohsin's Domain (FastAPI & Infrastructure)

Mohsin is building the "Restaurant" where your AI is the Chef. 

### 1. What is FastAPI?
FastAPI is a Python framework used to build web servers. Right now, your AI code just runs locally on your laptop terminal. Mohsin is writing code that opens up a "port" on the internet so that other computers can send messages to your AI.

### 2. REST Endpoints (The standard way)
Mohsin is building an endpoint called `POST /chat`. 
Think of it like a waiter. Talha's frontend gives the waiter a ticket (the JSON containing the user's text). Mohsin's waiter walks into the kitchen, hands the ticket to Umer's AI, waits for the AI to finish cooking the response, and walks the response back to Talha.

### 3. WebSockets (The streaming way)
Because we want to stream text letter-by-letter (Phase 3), a standard REST endpoint won't work (waiters can't walk out of the kitchen with one grain of rice at a time). 

Mohsin will eventually build a **WebSocket**. A WebSocket is like a permanent, open pipe between Talha's frontend and Umer's AI kitchen. As soon as Umer's AI generates a single word, it gets instantly shoved down the pipe to Talha's screen.

---

## Part 3: Talha's Domain (Frontend)

Talha is building the User Interface. He writes HTML, CSS, and JavaScript. 
His job is to:
1. Capture the text the user types into the input box.
2. Package it into the exact JSON format we defined in `api_contract.md`.
3. Send it across the internet to Mohsin's FastAPI server.
4. Listen to the response coming back, and use JavaScript to update the screen so the user sees the chat bubbles appearing!
