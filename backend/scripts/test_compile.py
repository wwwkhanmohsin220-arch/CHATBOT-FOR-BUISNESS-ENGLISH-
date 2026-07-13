import asyncio
import os
import json
from dotenv import load_dotenv

load_dotenv('backend/.env')

from backend.prompts.compile import build_compile_messages
from backend.utils.llm import generate_validated
from backend.models.schema import LessonBundle, CANONICAL_TAGS

async def main():
    # Mock slot
    slot = {
        "objectives": ["Negotiate pricing politely", "Use conditionals to make offers"],
        "concept_tags": ["negotiation_phrases", "conditionals"],
        "key_vocabulary": ["discount", "concession", "bottom line", "win-win"],
        "grammar_points": ["First conditional: 'If we agree to X, will you do Y?'"],
        "example_phrases": ["We might be able to offer a discount if...", "That's a bit beyond our budget."]
    }
    
    # Mock profile
    user_profile = {
        "level": "advanced",
        "coach_voice": "direct_professional",
        "weak": [{"tag": "conditionals", "acc": 0.50}],
        "strong": ["negotiation_phrases"]
    }
    
    # Mock rag context
    rag_context = "[Context: Lesson 1 - Introduction to Communication] Communication is key in business..."

    messages = build_compile_messages(slot, user_profile, rag_context)
    
    print("Sending compile request to Groq...")
    try:
        result = await generate_validated(
            messages=messages,
            schema=LessonBundle,
            task="test_compile"
        )
        
        print("\n[PASS] COMPILE SUCCESS! Payload generated and validated successfully.")
        print(f"Title: {result.title}")
        print(f"Spine length: {len(result.spine)}")
        for idx, node in enumerate(result.spine):
            print(f"  Node {idx+1}: {node.node_type} (tag: {node.concept_tag})")
            
            if node.node_type == "mcq":
                opts = node.content.get("options", [])
                expls = node.content.get("explanations", {})
                print(f"    -> MCQ Options: {len(opts)}, Explanations: {len(expls)}")
                if len(opts) != 3 or len(expls) != 3:
                    print("    [FAIL] ERROR: MCQ does not have exactly 3 options/explanations!")
                    
        print(f"\nBranches generated: {len(result.branches)}")
        for tag, branch in result.branches.items():
            print(f"  Branch tag: {tag}")
            if tag not in CANONICAL_TAGS:
                print(f"    [FAIL] ERROR: Branch tag {tag} is not canonical!")
                
            drill_mcq = branch.content.get("drill_mcq", {})
            opts = drill_mcq.get("options", [])
            if len(opts) != 3:
                print(f"    [FAIL] ERROR: Targeted fix MCQ does not have exactly 3 options (got {len(opts)})!")
        
        # Verify spine tags exist in branches
        spine_tags = set(node.concept_tag for node in result.spine)
        branch_tags = set(result.branches.keys())
        missing = spine_tags - branch_tags
        if missing:
            print(f"\n[FAIL] ERROR: Missing branches for spine tags: {missing}")
        else:
            print("\n[PASS] All spine tags have a corresponding targeted fix branch.")
            
        print("\nRaw JSON written to compile_output.json")
        with open("compile_output.json", "w", encoding="utf-8") as f:
            f.write(result.model_dump_json(indent=2))
        
    except Exception as e:
        print(f"\n[FAIL] COMPILE FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(main())
