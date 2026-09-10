from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    genre: Optional[str] = Field("General", max_length=100)
    condition: Optional[str] = Field("Bună", max_length=50)
    city: Optional[str] = Field("România", max_length=100)

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ExchangeCreate(BaseModel):
    target_book_id: int
    offered_book_id: int
    contact_info: str = Field(..., min_length=3, max_length=255)
    notes: Optional[str] = Field(None, max_length=500)

class ExchangeResponse(BaseModel):
    id: int
    target_book_id: int
    offered_book_id: int
    status: str
    contact_info: str
    notes: Optional[str]
    created_at: datetime
    target_book: Optional[BookResponse] = None
    offered_book: Optional[BookResponse] = None

    class Config:
        from_attributes = True

class ExchangeStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|declined|cancelled)$")
