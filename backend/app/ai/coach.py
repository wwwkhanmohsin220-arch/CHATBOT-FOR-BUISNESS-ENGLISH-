"""
@ai-restriction
Primary Owner: Talha
Coach summary wrapper.
"""

from __future__ import annotations

from backend.prompts.coach import build_coach_summary_messages


def coach_prompt(*, instance_attempts: list[dict], profile: dict) -> list[dict[str, str]]:
    return build_coach_summary_messages(instance_attempts, profile)

