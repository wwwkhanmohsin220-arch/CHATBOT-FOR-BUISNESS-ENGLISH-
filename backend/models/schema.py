"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify database schemas or Pydantic models.
Talha: You may add schemas here for AI output validation.

Note: This schema file has been updated for Phase 1 (Compiler->Runtime) Architecture.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Literal, Dict, List, Optional, Any

# The canonical tags allowed in the system. 
CANONICAL_TAGS = [
    "polite_disagreement", "tone_formality", "tense_past_perfect",
    "email_structure", "meeting_vocabulary", "negotiation_phrases",
    "conditionals", "active_listening_phrases", "small_talk",
    "clarifying_questions", "numbers_and_dates", "closing_language"
]

# ==========================================
# CURRICULUM SEEDING (Ingestion phase)
# ==========================================
class SlotContext(BaseModel):
    objectives: list[str] = Field(min_length=2, max_length=5)
    concept_tags: list[str]
    key_vocabulary: list[str] = Field(min_length=4, max_length=12)
    grammar_points: list[str] = Field(min_length=1, max_length=4)
    example_phrases: list[str] = Field(min_length=2, max_length=8)

    @field_validator("concept_tags")
    @classmethod
    def validate_tags(cls, v):
        for tag in v:
            if tag not in CANONICAL_TAGS:
                raise ValueError(f"Tag {tag} is not a canonical tag.")
        return v


# ==========================================
# THE LESSON BUNDLE (Compiler Output)
# ==========================================
class LessonNode(BaseModel):
    node_type: Literal["theory", "mcq", "voice", "writing", "targeted_fix"]
    concept_tag: str
    content: dict

class LessonBranch(BaseModel):
    content: dict

class LessonBundle(BaseModel):
    title: str
    spine: list[LessonNode]
    branches: dict[str, LessonBranch]


# ==========================================
# JIT EVALUATIONS (Runtime Assessment)
# ==========================================
class RubricAxis(BaseModel):
    score: int = Field(ge=0, le=10)
    explanation: str = Field(min_length=20, max_length=500)

class WritingRubric(BaseModel):
    tone: RubricAxis
    clarity: RubricAxis
    structure: RubricAxis
    overall_comment: str
    suggested_rewrite: str = Field(min_length=40)
    detected_concept_errors: list[str] = []

    @field_validator("detected_concept_errors")
    @classmethod
    def canonical_only(cls, v):
        # Drop hallucinated tags silently
        return [t for t in v if t in CANONICAL_TAGS]

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
    def valid_tag(cls, v):
        if v and v not in CANONICAL_TAGS:
            return None # Ignore hallucinated tags
        return v


# ==========================================
# API IN/OUT (Runtime REST)
# ==========================================
class AttemptIn(BaseModel):
    answer_index: Optional[int] = None
    draft: Optional[str] = None
    read_ack: Optional[bool] = None

class AttemptOut(BaseModel):
    correct: bool
    progress: Optional[dict] = None
    explanation: Optional[str] = None
    injected_node: Optional[dict] = None
    advance_to: Optional[float] = None
