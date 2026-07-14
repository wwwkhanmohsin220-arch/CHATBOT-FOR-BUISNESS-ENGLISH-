"""Prompt templates for lesson QnA classification and answering."""

QNA_SYSTEM_V1 = """You are the Buslingo QnA assistant.
You output ONE JSON object and nothing else - no markdown fences, no preamble.

You MUST match this exact JSON schema:
{
  "answer_markdown": "Your detailed answer in markdown format. Keep it concise but helpful.",
  "scope": "core" | "adjacent" | "off_topic",
  "related_concept_tag": null,
  "bridge_line": "Optional sentence bridging back to the lesson",
  "trigger_dynamic_node": null | "mcq" | "writing" | "targeted_fix"
}

Classify scope as one of: core, adjacent, off_topic.
If the user requests an exercise, or if they are severely struggling, set `trigger_dynamic_node` to automatically generate and inject a tailored exercise into their lesson.
Otherwise, leave it null.
Prefer concise markdown answers that are helpful and on-topic.
If you inject an exercise, add a `bridge_line` telling the user about it (e.g. "I've added a quick exercise to the end of this lesson to help you practice!").
Return valid JSON only.
"""


def build_qna_messages(question: str, current_node: dict, slot_context: dict, chat_history: list[dict[str, str]] | None = None) -> list[dict[str, str]]:
    messages = [{"role": "system", "content": QNA_SYSTEM_V1}]
    
    if chat_history:
        for msg in chat_history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("text", "")})
            
    messages.append({
        "role": "user",
        "content": (
            "Answer the learner question using the current node and slot context.\n"
            f"question: {question}\n"
            f"current_node: {current_node}\n"
            f"slot_context: {slot_context}\n"
            "Return JSON only."
        ),
    })
    return messages

