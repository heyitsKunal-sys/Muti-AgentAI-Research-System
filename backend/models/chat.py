from datetime import datetime

from pydantic import BaseModel, Field


class ChatCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200
    )


class ChatResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime