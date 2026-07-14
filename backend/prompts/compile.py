"""Prompt templates for lesson compilation."""

from backend.models.schema import CANONICAL_TAGS

COMPILE_SYSTEM_V1 = """You are the AI compiler for Buslingo, a Business English platform.
You output ONE JSON object matching the `LessonBundle` schema and nothing else - no markdown fences, no preamble.

A LessonBundle has exactly three fields:
1. "title": A concise string title for the lesson.
2. "spine": A list of 7-11 LessonNode objects representing the main path of the lesson.
3. "branches": A dictionary mapping concept_tags to remedial "targeted_fix" LessonNode objects.

## Spine Structure Constraints
The "spine" array MUST contain nodes in this exact order:
1. `node_type: "theory"`: A brief explanation of the slot's primary objective (Exactly 1 node).
   - `content`: { "text": "...", "example": "..." }
2. `node_type: "mcq"`: Multiple choice questions testing the theory. You MUST autonomously decide how many MCQ nodes to generate (between 4 and 6) based on the difficulty of the material.
   - `content`: { "question": "...", "options": ["...", "...", "..."], "correct_index": 0, "explanations": {"0":"...", "1":"...", "2":"..."} }
     - MUST have EXACTLY 3 options.
     - MUST have an explanation for EVERY option.
3. `node_type: "writing"`: Interactive Q&A written exercises. You MUST autonomously decide how many writing (QnA) nodes to generate (between 1 and 3).
   - `content`: { "scenario": "A brief business scenario requiring a written response." }
4. `node_type: "voice"`: A spoken walkie-talkie scenario (Exactly 1 node - MUST BE THE VERY LAST NODE IN THE SPINE).
   - `content`: { "scenario": "...", "ai_persona": "...", "objectives": ["...", "..."], "opening_line": "..." }

## Concept Tags
Every node in the spine must have a `concept_tag` assigned to it.
You MUST choose the concept tag ONLY from this exact list:
<CANONICAL_TAGS_PLACEHOLDER>

## Branches Constraints
For EVERY unique `concept_tag` you used in the spine, you MUST generate exactly one key in the "branches" dictionary.
The value for that key must be a `node_type: "targeted_fix"` node.
- `content`: { "text": "A brief reminder of what they did wrong.", "micro_theory": "One sentence explaining the rule.", "drill_mcq": { "question": "...", "options": ["...", "...", "..."], "correct_index": 0, "explanations": {"0":"...", "1":"...", "2":"..."} } }

Return valid JSON matching this schema exactly.
"""

def build_compile_messages(slot: dict, user_profile: dict, rag_context: str = "") -> list[dict[str, str]]:
    user_msg = (
        "Compile a lesson bundle for this slot and user profile.\n"
        f"User Profile: {user_profile}\n"
        f"Slot Data: {slot}\n"
    )
    if rag_context:
        user_msg += f"\nReference Material (RAG Context):\n{rag_context}\n"
        
    user_msg += "\nReturn JSON only."
    
    system_prompt = COMPILE_SYSTEM_V1.replace("<CANONICAL_TAGS_PLACEHOLDER>", str(CANONICAL_TAGS))
    
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]
