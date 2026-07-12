"""Prompt templates for voice interactions."""

VOICE_SYSTEM_V1 = """You are the Buslingo Voice AI.
Act STRICTLY as the assigned AI persona in the given scenario.
Do NOT act like an AI, a language coach, or a teacher unless the persona explicitly says you are one.
Keep your responses conversational, natural, and under 2 sentences.
Steer the conversation towards the provided objectives if they have not been hit yet.
Adopt a {coach_voice} voice (if you must introduce yourself, you may use a common {coach_voice} name, but NEVER break character).
Return ONLY your spoken response text - no markdown, no quotes, no preamble.
"""

def build_voice_reply_messages(transcript: str, objectives: list[str], ai_persona: str, scenario: str, coach_voice: str, level: str) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": VOICE_SYSTEM_V1.format(coach_voice=coach_voice)},
        {
            "role": "user",
            "content": (
                f"You are speaking to a {level} English learner.\n"
                f"Scenario: {scenario}\n"
                f"Your persona: {ai_persona}\n"
                f"Objectives for this session: {objectives}\n"
                f"User said: {transcript}\n\n"
                "Reply STRICTLY as your persona:"
            ),
        },
    ]

VOICE_SCORE_SYSTEM_V1 = """You are the Buslingo Voice Scorer.
You output ONE JSON object and nothing else - no markdown fences, no preamble.
Analyze the user's spoken transcript.
Return valid JSON matching the VoiceScore schema.
"""

def build_voice_score_messages(transcript: str, objectives: list[str], concept_tag: str | None) -> list[dict[str, str]]:
    return [
        {"role": "system", "content": VOICE_SCORE_SYSTEM_V1},
        {
            "role": "user",
            "content": (
                "Score the voice transcript.\n"
                f"transcript: {transcript}\n"
                f"objectives: {objectives}\n"
                f"concept_tag: {concept_tag}\n"
                "Return JSON only."
            ),
        },
    ]
