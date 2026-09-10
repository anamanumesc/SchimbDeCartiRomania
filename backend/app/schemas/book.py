from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.book import BookCondition, BookStatus

class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    genre: str = Field(min_length=2, max_length=100)
    condition: BookCondition = BookCondition.GOOD
    description: Optional[str] = None
    city: str = Field(min_length=2, max_length=100)

class BookCreate(BookBase):
    pass

class BookOut(BookBase):
    id: int
    status: BookStatus
    owner_id: int
    created_at: datetime

    class Config:
        from_attributes = True
