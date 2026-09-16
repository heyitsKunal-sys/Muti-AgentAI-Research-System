from datetime import datetime
from pydantic import BaseModel, Field


class MessageCreate(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1)


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    role: str
    content: str
    created_at: datetime