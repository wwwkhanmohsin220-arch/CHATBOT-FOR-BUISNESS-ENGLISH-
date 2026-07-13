import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

TOC = """
Lesson 1 Introduction to Communication
Lesson 2 Flow of Communication
Lesson 3 Theories of Communication
Lesson 4 The Process of Communication and Misconceptions
Lesson 5 Barriers in Effective Communication
Lesson 6 Non-verbal Communication
Lesson 7 Non-verbal Communication
Lesson 8 Traits of Good Communicators
Lesson 9 Principles of Business Communication
Lesson 10 Concreteness
Lesson 11 Consideration
Lesson 12 Intercultural Communication
Lesson 13 Intercultural Communication
Lesson 14 Individual Cultural Variables
Lesson 15 Process of Preparing Effective Business Messages
Lesson 16 The Appearance and Design of Business Messages
Lesson 17 The Appearance and Design of Business Messages
Lesson 18 Communication through Technology
Lesson 19 Basic Organizational Plans
Lesson 20 Inquiries and General Requests
Lesson 21 Inquiries and General Requests
Lesson 22 Letter Writing (Placing Orders)
Lesson 23 Letter Writing (Claim Letter)
Lesson 24 Letter Writing (Adjustment Letter)
Lesson 25 Collection Letter
Lesson 26 Sales Letter
Lesson 27 Memorandum and Circular
Lesson 28 Minutes of the Meeting
Lesson 29 Business Reports
Lesson 30 Business Reports (Letter Reports)
Lesson 31 Business Reports (Formal Reports)
Lesson 32 Market Reports
Lesson 33 Job Search and Employment
Lesson 34 Resume Writing
Lesson 35 Resume and Application Letter
Lesson 36 Job Inquiry Letter and Interview
Lesson 37 Process of Preparing the Interview
Lesson 38 Oral Presentation
Lesson 39 Oral Presentation
Lesson 40 Language Practice and Negotiation Skill
Lesson 41 Negotiation and Listening
Lesson 42 Thesis Writing and Presentation
Lesson 43 Thesis Writing and Presentation
Lesson 44 Research Methodology
Lesson 45 Research Methodology
"""

async def generate():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"], statement_cache_size=0)
    
    print("Wiping old evaluations...")
    await conn.execute("DELETE FROM rag_evaluations;")
    
    lines = [line.strip() for line in TOC.strip().split("\n") if line.strip()]
    count = 0
    
    for line in lines:
        parts = line.split(" ", 2)
        if len(parts) < 3: continue
        lesson_id = parts[0] + " " + parts[1]
        title = parts[2]
        
        # Generate 3 deterministic questions per lesson
        questions = [
            f"What are the key concepts of {title}?",
            f"Can you explain {title} in the context of Business Communication?",
            f"What is the definition of {title}?"
        ]
        
        for q in questions:
            await conn.execute("""
                INSERT INTO rag_evaluations (question, expected_lesson, retrieved_chunks)
                VALUES ($1, $2, '[]'::jsonb)
            """, q, lesson_id)
            count += 1
            
    await conn.close()
    print(f"Generated {count} evaluation questions successfully.")

if __name__ == "__main__":
    asyncio.run(generate())
