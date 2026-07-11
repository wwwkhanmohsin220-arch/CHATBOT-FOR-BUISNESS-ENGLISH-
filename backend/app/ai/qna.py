"""
@ai-restriction
Primary Owner: Talha
QnA wrapper.
"""

from __future__ import annotations

from backend.prompts.qna import build_qna_messages


def qna_prompt(*, question: str, current_node: dict, slot_context: dict) -> list[dict[str, str]]:
    return build_qna_messages(question, current_node, slot_context)

