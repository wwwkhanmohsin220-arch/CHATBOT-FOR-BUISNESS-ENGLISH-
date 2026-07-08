"""
@ai-restriction
Primary Owner: Mohsin
Umer: Do not modify database schemas or Pydantic models. Use shared/api_contract.md for reference.
Talha: Do not modify backend schemas unless adding QA/deployment-specific test fixtures.
"""

from pydantic import BaseModel, Field

class UserSchema(BaseModel):
    id: str
    username: str
    email: str
    session_id: str


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=254)
    password: str = Field(..., min_length=8, max_length=128)


class AuthResponse(BaseModel):
    user: UserSchema
    access_token: str
    token_type: str = "bearer"


class LessonSchema(BaseModel):
    id: str
    title: str


class UnitSchema(BaseModel):
    id: str
    title: str
    lessons: list[LessonSchema] = []


class CurriculumResponse(BaseModel):
    units: list[UnitSchema]
