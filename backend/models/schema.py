"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify backend schemas without coordination.
Talha: You may add schemas here for AI output validation.
"""

from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# The canonical tags allowed in the system.
CANONICAL_TAGS = [
    "polite_disagreement",
    "tone_formality",
    "tense_past_perfect",
    "email_structure",
    "meeting_vocabulary",
    "negotiation_phrases",
    "conditionals",
    "active_listening_phrases",
    "small_talk",
    "clarifying_questions",
    "numbers_and_dates",
    "closing_language",
]


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=128)


class UserSchema(BaseModel):
    id: str
    username: str
    email: str
    session_id: str


class AuthResponse(BaseModel):
    user: UserSchema
    access_token: str


class SlotContext(BaseModel):
    objectives: list[str] = Field(min_length=2, max_length=5)
    concept_tags: list[str]
    key_vocabulary: list[str] = Field(min_length=4, max_length=12)
    grammar_points: list[str] = Field(min_length=1, max_length=4)
    example_phrases: list[str] = Field(min_length=2, max_length=8)

    @field_validator("concept_tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        for tag in v:
            if tag not in CANONICAL_TAGS:
                raise ValueError(f"Tag {tag} is not a canonical tag.")
        return v


class LessonNode(BaseModel):
    node_type: Literal["theory", "mcq", "voice", "writing", "targeted_fix"]
    concept_tag: str
    content: dict[str, Any]


class LessonBranch(BaseModel):
    content: dict[str, Any]


class LessonBundle(BaseModel):
    title: str
    spine: list[LessonNode]
    branches: dict[str, LessonBranch]


class RubricAxis(BaseModel):
    score: int = Field(ge=0, le=10)
    explanation: str = Field(min_length=20, max_length=500)


class WritingRubric(BaseModel):
    tone: RubricAxis
    clarity: RubricAxis
    structure: RubricAxis
    overall_comment: str
    suggested_rewrite: str = Field(min_length=40)
    detected_concept_errors: list[str] = Field(default_factory=list)

    @field_validator("detected_concept_errors")
    @classmethod
    def canonical_only(cls, v: list[str]) -> list[str]:
        return [tag for tag in v if tag in CANONICAL_TAGS]


class VoiceScore(BaseModel):
    tone: int = Field(ge=0, le=100)
    fluency: int = Field(ge=0, le=100)
    vocabulary: int = Field(ge=0, le=100)
    grammar: int = Field(ge=0, le=100)
    listening: int = Field(ge=0, le=100)
    objectives_met: list[str]
    notable_errors: list[str]
    one_line_feedback: str


class QnAResponse(BaseModel):
    answer_markdown: str = Field(min_length=10, max_length=2500)
    scope: Literal["core", "adjacent", "off_topic"]
    related_concept_tag: Optional[str] = None
    bridge_line: Optional[str] = None

    @field_validator("related_concept_tag")
    @classmethod
    def valid_tag(cls, v: Optional[str]) -> Optional[str]:
        if v and v not in CANONICAL_TAGS:
            return None
        return v


class AttemptIn(BaseModel):
    answer_index: Optional[int] = None
    draft: Optional[str] = None
    read_ack: Optional[bool] = None


class AttemptOut(BaseModel):
    correct: bool
    progress: Optional[dict[str, Any]] = None
    explanation: Optional[str] = None
    injected_node: Optional[dict[str, Any]] = None
    advance_to: Optional[float] = None


class UserProfileSchema(BaseModel):
    user_id: str
    display_name: Optional[str] = None
    level: str
    coach_voice: str
    timezone: str
    daily_goal_min: int
    weakness_tags: list[Any] = Field(default_factory=list)
    strength_tags: list[Any] = Field(default_factory=list)


class AuthSyncResponse(BaseModel):
    synced: bool
    profile: UserProfileSchema


class SRSReviewItem(BaseModel):
    card_id: str
    rating: Literal[0, 1]


class SRSDueCard(BaseModel):
    card_id: str
    term_id: int
    term: str
    phonetic: Optional[str] = None
    definition: Optional[str] = None
    context_sentences: Optional[dict[str, Any]] = None
    concept_tags: list[str] = Field(default_factory=list)
    ease_factor: float
    interval_days: int
    repetitions: int
    due_at: str
    lapses: int


class SRSReviewResultSchema(BaseModel):
    card_id: str
    rating: int
    interval_before: int
    interval_after: int
    due_at: str
    ease_factor: float
    repetitions: int
    lapses: int


class SRSReviewResponse(BaseModel):
    reviewed: int
    results: list[SRSReviewResultSchema]


class SRSStatsResponse(BaseModel):
    due_count: int
    total_count: int
    next_due: Optional[str] = None


class DailyGoalSchema(BaseModel):
    minutes: int
    target: int


class StreakDaySchema(BaseModel):
    day: str
    minutes: int
    xp: int
    active: bool


class StreakSchema(BaseModel):
    count: int
    week_days: list[StreakDaySchema] = Field(default_factory=list)


class NextLessonSchema(BaseModel):
    instance_id: Optional[str] = None
    slot_key: Optional[str] = None
    title: Optional[str] = None
    status: Optional[str] = None
    current_node_index: Optional[float] = None
    lesson_position: Optional[int] = None


class DashboardResponse(BaseModel):
    daily_goal: DailyGoalSchema
    streak: StreakSchema
    next_lesson: Optional[NextLessonSchema] = None
    srs_due_count: int


class WritingSubmitRequest(BaseModel):
    draft: str = Field(min_length=1, max_length=5000)


class WritingSubmitResponse(BaseModel):
    status: Literal["graded", "delayed"]
    rubric: Optional[WritingRubric] = None


class TranscribeResponse(BaseModel):
    transcript: str


class VoiceTurnResponse(BaseModel):
    transcript: str
    reply_text: str
    reply_audio_b64: Optional[str] = None
    objectives_hit: list[str] = Field(default_factory=list)
    turn_count: int
    session_key: str


class VoiceFinishResponse(BaseModel):
    status: Literal["finished", "already_finished"]
    background_scoring_scheduled: bool
    instance_id: str
    node_id: str
    advance_to: Optional[float] = None
    transcript_turns: int = 0
