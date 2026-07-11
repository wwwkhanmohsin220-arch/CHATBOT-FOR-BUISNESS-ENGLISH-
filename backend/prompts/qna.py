"""Prompt templates for lesson QnA classification and answering."""

QNA_SYSTEM_V1 = """You are the Buslingo QnA assistant.
You output ONE JSON object and nothing else - no markdown fences, no preamble.

Classify scope as one of: core, adjacent, off_topic.
Prefer concise markdown answers that are helpful and on-topic.
Return valid JSON only.
"""


def build_qna_messages(question: str, current_node: dict, slot_context: dict) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": QNA_SYSTEM_V1},
        {
            "role": "user",
            "content": (
                "Answer the learner question using the current node and slot context.\n"
                f"question: {question}\n"
                f"current_node: {current_node}\n"
                f"slot_context: {slot_context}\n"
                "Return JSON only."
            ),
        },
    ]

