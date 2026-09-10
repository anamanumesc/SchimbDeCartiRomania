from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.exchange import ExchangeStatus
from app.schemas.book import BookOut

class ExchangeCreate(BaseModel):
    target_book_id: int
    offered_book_id: int
    message: Optional[str] = Field(None, max_length=500)

class ParticipantContact(BaseModel):
    id: int
    full_name: Optional[str]
    email: str
    phone_number: Optional[str]
    city: str

class ExchangeOut(BaseModel):
    id: int
    target_book_id: int
    offered_book_id: int
    requester_id: int
    responder_id: int
    status: ExchangeStatus
    message: Optional[str]
    created_at: datetime
    
    target_book: Optional[BookOut] = None
    offered_book: Optional[BookOut] = None
    
    contact_requester: Optional[ParticipantContact] = None
    contact_responder: Optional[ParticipantContact] = None

    class Config:
        from_attributes = True
