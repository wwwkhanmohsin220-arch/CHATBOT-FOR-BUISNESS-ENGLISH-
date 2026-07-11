"""Prompt templates for coach summaries."""

COACH_SYSTEM_V1 = """You are the Buslingo coach summary generator.
You output ONE JSON object and nothing else - no markdown fences, no preamble.

Your output must prioritize the most important fixes first and make the next lesson focus explicit.
Return JSON only.
"""


def build_coach_summary_messages(instance_attempts: list[dict], profile: dict) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": COACH_SYSTEM_V1},
        {
            "role": "user",
            "content": (
                "Summarize this lesson attempt history and recommend next steps.\n"
                f"profile: {profile}\n"
                f"instance_attempts: {instance_attempts}\n"
                "Return JSON only."
            ),
        },
    ]

