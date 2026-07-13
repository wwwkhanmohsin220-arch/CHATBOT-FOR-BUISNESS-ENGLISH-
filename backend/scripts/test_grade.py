import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

from backend.prompts.grade import build_grade_messages
from backend.utils.llm import generate_validated
from backend.models.schema import WritingRubric, CANONICAL_TAGS

async def main():
    test_cases = [
        {
            "name": "Excellent Draft (Minor Typo)",
            "draft": "Dear Sarah, I hope this email finds you well. I am writing to respectfully propose a 10% discount on our up coming bulk order. We believe this arrangement would be mutually beneficial, allowing us to increase our order volume while ensuring a steady partnership moving foward. I look forward to your thoughts.",
            "coach_voice": "encouraging"
        },
        {
            "name": "Excellent Draft (Modern / Slightly Casual)",
            "draft": "Hi Sarah, Hope you are having a good week. I wanted to propose a 10% discount for our next bulk order. This would be a win-win for both of us, as it lets us scale up our orders with you over the next year. Let me know what you think!",
            "coach_voice": "balanced"
        }
    ]
    
    lesson_context = {
        "objectives": ["Negotiate pricing politely", "Use formal business language"],
        "concept_tags": ["negotiation_phrases", "tone_formality", "email_structure"],
        "scenario": "Write an email to a potential client proposing a discount for a larger order."
    }
    
    for i, case in enumerate(test_cases):
        print(f"\n{'='*50}\nTEST CASE {i+1}: {case['name']}\n{'='*50}")
        print(f"Draft: {case['draft']}")
        
        messages = build_grade_messages(case['draft'], case['coach_voice'], lesson_context)
        
        print("\nSending grade request to Groq...")
        try:
            result = await generate_validated(
                messages=messages,
                schema=WritingRubric,
                task="test_grade"
            )
            
            print(f"\n[PASS] GRADE SUCCESS for {case['name']}!")
            print(f"Tone: {result.tone.score}/10 -> {result.tone.explanation}")
            print(f"Clarity: {result.clarity.score}/10 -> {result.clarity.explanation}")
            print(f"Structure: {result.structure.score}/10 -> {result.structure.explanation}")
            print(f"\nOverall Comment: {result.overall_comment}")
            print(f"Suggested Rewrite:\n{result.suggested_rewrite}")
            print(f"\nDetected Concept Errors: {result.detected_concept_errors}")
            
            for tag in result.detected_concept_errors:
                if tag not in CANONICAL_TAGS:
                    print(f"  [FAIL] ERROR: Tag {tag} is not canonical!")
                    
        except Exception as e:
            print(f"\n[FAIL] GRADE FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
