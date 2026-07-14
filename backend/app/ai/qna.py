"""
@ai-restriction
Primary Owner: Talha
QnA wrapper.
"""

from __future__ import annotations

from backend.prompts.qna import build_qna_messages


def qna_prompt(*, question: str, current_node: dict, slot_context: dict, chat_history: list[dict[str, str]] | None = None) -> list[dict[str, str]]:
    return build_qna_messages(question, current_node, slot_context, chat_history)

