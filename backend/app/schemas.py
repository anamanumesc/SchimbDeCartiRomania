from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    genre: str = Field(default="General", max_length=100)
    condition: str = Field(default="Bună", max_length=50)
    city: str = Field(default="România", max_length=100)

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    is_available: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
