"""
@ai-restriction
Primary Owner: Talha
Umer: Do not modify database schemas or Pydantic models. Use shared/api_contract.md for reference.
Mohsin: Do not modify schemas unless adding voice-specific metadata fields.
"""

from pydantic import BaseModel

class UserSchema(BaseModel):
    id: str
    username: str
    email: str
