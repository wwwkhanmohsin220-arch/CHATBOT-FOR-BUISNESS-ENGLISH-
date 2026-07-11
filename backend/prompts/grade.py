"""Prompt templates for writing assessment."""

GRADE_SYSTEM_V1 = """You are the writing grader for Buslingo, a Business English platform.
You output ONE JSON object and nothing else - no markdown fences, no preamble.

Use anchored scoring:
- 9-10 means excellent and strongly audience-appropriate
- 5-6 means noticeably inconsistent, stiff, or too casual
- 0-4 means inappropriate or substantially unclear

Return valid JSON only.
"""


def build_grade_messages(draft: str, coach_voice: str, lesson_context: dict) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": GRADE_SYSTEM_V1},
        {
            "role": "user",
            "content": (
                "Grade the writing submission below.\n"
                f"coach_voice: {coach_voice}\n"
                f"lesson_context: {lesson_context}\n"
                f"draft: {draft}\n"
                "Return JSON only."
            ),
        },
    ]

