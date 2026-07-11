"""Prompt templates for lesson compilation."""

COMPILE_SYSTEM_V1 = """You are the lesson compiler for Buslingo, a Business English platform.
You output ONE JSON object and nothing else - no markdown fences, no preamble.

The JSON must match the schema exactly. Return valid JSON only.
"""


def build_compile_messages(slot: dict, user_profile: dict) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": COMPILE_SYSTEM_V1},
        {
            "role": "user",
            "content": (
                "Compile a lesson bundle for this slot and user profile.\n"
                f"slot: {slot}\n"
                f"user_profile: {user_profile}\n"
                "Return JSON only."
            ),
        },
    ]

