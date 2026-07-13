"""Prompt templates for post-lesson Coach Summary generation."""

import json
from typing import Any
from backend.models.schema import CANONICAL_TAGS

SUMMARY_SYSTEM_V1 = """You are the AI Director for Buslingo, generating the final Coach Summary after a user completes a lesson.
You must output ONE JSON object matching the `CoachSummary` schema and nothing else.

A CoachSummary has exactly four fields:
1. "overall_scores": A dictionary mapping axes ("Tone", "Diplomacy", "Fluency", "Grammar") to an integer score from 0 to 100. Calculate these based on the user's attempt history.
2. "summary_markdown": A 2-3 sentence markdown summary of the user's performance. Focus on what they did well and what needs work. Use the designated coach_voice.
3. "prioritized_fixes": A list of up to 3 PrioritizedFix objects. Each fix must highlight a specific mistake the user made during the lesson.
4. "next_lesson_focus": A single sentence telling the user what the next lesson will focus on to bridge the gap.

## Constraints for Prioritized Fixes
- `concept_tag` MUST be selected from the provided canonical list.
- `why` is a 1-2 sentence explanation of the error and the rule.
- `example_from_user` MUST be an exact quote from the user's text or speech if available, or a close approximation of their mistake.

You MUST choose the concept tag ONLY from this exact list:
<CANONICAL_TAGS_PLACEHOLDER>

## JSON Format Example (Structure only, not content)
{
  "overall_scores": {"Tone": 85, "Diplomacy": 70, "Fluency": 90, "Grammar": 80},
  "summary_markdown": "Your ability to soften direct statements has improved. However, you rushed the explanation of the timeline. Review the fixes below.",
  "prioritized_fixes": [
    {
      "concept_tag": "tone_formality",
      "why": "You used very direct phrasing. Soften it using mitigation.",
      "example_from_user": "I think that's bad."
    }
  ],
  "next_lesson_focus": "In our next lesson, we will focus on diplomatic disagreement."
}

Return valid JSON matching this schema exactly.
"""

def build_summary_messages(
    profile: dict[str, Any],
    attempts_history: list[dict[str, Any]],
) -> list[dict[str, str]]:
    
    user_msg = (
        "Generate a Coach Summary based on the following lesson performance.\n"
        f"Learner Profile: {json.dumps(profile, indent=1)}\n\n"
        f"Attempt History (Ordered chronologically):\n"
    )
    
    for i, attempt in enumerate(attempts_history):
        user_msg += f"--- Node {i+1} ---\n"
        user_msg += json.dumps(attempt, indent=1) + "\n"
        
    user_msg += "\nReturn JSON only."
    
    system_prompt = SUMMARY_SYSTEM_V1.replace("<CANONICAL_TAGS_PLACEHOLDER>", str(CANONICAL_TAGS))
    
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_msg},
    ]
