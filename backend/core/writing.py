"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify writing grading logic.
Talha: Do not modify writing prompts or AI grader hookup without coordinating backend integration.
"""

from __future__ import annotations

import asyncio
import importlib
from collections import Counter
from typing import Any

from backend.models.schema import WritingRubric


GRAMMAR_TAGS = {"tense_past_perfect", "conditionals"}


def _score_axis(text: str, low_terms: list[str], high_terms: list[str]) -> int:
    normalized = text.lower()
    if any(term in normalized for term in high_terms):
        return 9
    if any(term in normalized for term in low_terms):
        return 3
    if len(text.split()) < 6:
        return 4
    if len(text.split()) > 40:
        return 7
    return 6


def _fallback_grade(draft: str, coach_voice: str, concept_tags: list[str]) -> WritingRubric:
    tone_score = _score_axis(
        draft,
        low_terms=["hey", "wanna", "gonna", "dude", "yo"],
        high_terms=["please", "would you", "i would like", "could we", "kindly"],
    )
    clarity_score = 6 if len(draft.split()) >= 12 else 4
    structure_score = 7 if any(mark in draft for mark in ["\n", ".", "!", "?"]) else 5

    detected_errors = [tag for tag in concept_tags if tag in GRAMMAR_TAGS and "error" in draft.lower()]
    overall_comment = (
        f"Your draft reads as {coach_voice.replace('_', ' ')}. "
        "It is readable, but it could be sharper and more specific."
    )
    if len(draft.split()) < 8:
        overall_comment = "This answer is too short to fully show your intent. Add one or two more concrete details."

    suggested_rewrite = draft.strip()
    if len(suggested_rewrite) < 40:
        suggested_rewrite = (
            suggested_rewrite + " "
            "I would like to hear your thoughts on this in a professional setting."
        ).strip()

    return WritingRubric(
        tone={"score": tone_score, "explanation": "Tone was judged from the directness and politeness of the draft."},
        clarity={"score": clarity_score, "explanation": "Clarity was estimated from length and whether the draft stays focused."},
        structure={"score": structure_score, "explanation": "Structure was estimated from punctuation and sentence breaks."},
        overall_comment=overall_comment,
        suggested_rewrite=suggested_rewrite,
        detected_concept_errors=detected_errors,
    )


async def grade_writing_draft(
    draft: str,
    coach_voice: str,
    concept_tags: list[str],
) -> WritingRubric:
    try:
        grader_module = importlib.import_module("backend.app.ai.grader")
    except Exception:
        return _fallback_grade(draft, coach_voice, concept_tags)

    grade_writing = getattr(grader_module, "grade_writing", None)
    if grade_writing is None:
        return _fallback_grade(draft, coach_voice, concept_tags)

    try:
        async with asyncio.timeout(30):
            maybe_result = grade_writing(
                draft=draft,
                coach_voice=coach_voice,
                concept_tags=concept_tags,
            )
            if hasattr(maybe_result, "__await__"):
                result = await maybe_result
            else:
                result = maybe_result
    except Exception:
        return _fallback_grade(draft, coach_voice, concept_tags)

    if isinstance(result, WritingRubric):
        return result

    if isinstance(result, dict):
        return WritingRubric.model_validate(result)

    return _fallback_grade(draft, coach_voice, concept_tags)


def writing_radar_events(rubric: WritingRubric) -> list[tuple[str, int]]:
    writing_score = round(((rubric.clarity.score + rubric.structure.score) / 2) * 10)
    tone_score = rubric.tone.score * 10
    grammar_score = 100 if not rubric.detected_concept_errors else 0
    return [
        ("writing", writing_score),
        ("tone", tone_score),
        ("grammar", grammar_score),
    ]
