import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

from backend.prompts.coach import build_coach_summary_messages
from backend.utils.llm import generate_validated
from backend.models.schema import CoachSummary, CANONICAL_TAGS

async def main():
    # Mock profile
    profile = {
        "level": "intermediate",
        "coach_voice": "encouraging",
        "weakness_tags": ["tense_past_perfect"]
    }
    
    # Mock attempt history simulating a lesson on Negotiation and Past Perfect
    instance_attempts = [
        {
            "node_type": "mcq",
            "concept_tag": "negotiation_phrases",
            "attempts": 1,
            "passed": True
        },
        {
            "node_type": "mcq",
            "concept_tag": "tone_formality",
            "attempts": 2,
            "passed": False,
            "context": "User selected 'Hey give me a discount' instead of 'I would like to propose a discount'."
        },
        {
            "node_type": "targeted_fix",
            "concept_tag": "tone_formality",
            "attempts": 1,
            "passed": True
        },
        {
            "node_type": "writing",
            "concept_tag": "email_structure",
            "passed": True,
            "scores": {"tone": 6, "clarity": 8, "structure": 5},
            "user_draft": "Hi. We buy a lot so give us 10% off."
        },
        {
            "node_type": "voice",
            "concept_tag": "negotiation_phrases",
            "passed": True,
            "scores": {"tone": 75, "fluency": 80, "grammar": 90},
            "transcript": "Uh, I was wondering if we could get a lower price on the big order?"
        }
    ]

    messages = build_coach_summary_messages(instance_attempts, profile)
    
    print("Sending coach summary request to Groq...")
    try:
        result = await generate_validated(
            messages=messages,
            schema=CoachSummary,
            task="test_coach"
        )
        
        print("\n[PASS] COACH SUMMARY SUCCESS! Payload generated and validated successfully.")
        
        print(f"\nOverall Scores: {result.overall_scores}")
        print(f"\nSummary Markdown:\n{result.summary_markdown}")
        
        print("\nPrioritized Fixes:")
        for fix in result.prioritized_fixes:
            print(f"  - [{fix.concept_tag}] Why: {fix.why} (Example: {fix.example_from_user})")
            if fix.concept_tag not in CANONICAL_TAGS:
                print(f"    [FAIL] ERROR: Tag {fix.concept_tag} is not canonical!")
                
        print(f"\nNext Lesson Focus:\n{result.next_lesson_focus}")
        
        print("\nRaw JSON written to coach_output.json")
        with open("coach_output.json", "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))
        
    except Exception as e:
        print(f"\n[FAIL] COACH SUMMARY FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
