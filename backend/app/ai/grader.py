"""
@ai-restriction
Primary Owner: Talha
Writing grader wrapper.
"""

from __future__ import annotations

from backend.models.schema import WritingRubric
from backend.prompts.grade import build_grade_messages
from backend.utils.llm import generate_validated

__all__ = ["grade_prompt", "grade_writing", "generate_validated"]


def grade_prompt(*, draft: str, coach_voice: str, concept_tags: list[str]) -> list[dict[str, str]]:
    lesson_context = {"concept_tags": concept_tags}
    return build_grade_messages(draft, coach_voice, lesson_context)


async def grade_writing(*, draft: str, coach_voice: str, concept_tags: list[str]) -> WritingRubric:
    return await generate_validated(
        messages=grade_prompt(draft=draft, coach_voice=coach_voice, concept_tags=concept_tags),
        schema=WritingRubric,
        task="grade",
    )
