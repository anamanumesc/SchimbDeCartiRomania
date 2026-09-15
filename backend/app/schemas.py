from pydantic import BaseModel, EmailStr, Field 
from typing import Optional, List 
from datetime import datetime 

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr 
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr 
    password: str 

class UserResponse(BaseModel):
    id: int 
    username: str 
    created_at: datetime 
    class Config: from_attributes = True 

class Token(BaseModel):
    access_token: str 
    token_type: str 
    user: UserResponse 

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1)
    author: str = Field(..., min_length=1)
    genre: Optional[str] = "General"
    condition: Optional[str] = "Bună"
    city: Optional[str] = "România"

class BookResponse(BaseModel):
    id: int 
    title: str 
    author: str 
    genre: str 
    condition: str 
    city: str 
    is_available: bool 
    owner_id: int 
    owner: Optional[UserResponse] = None 
    created_at: datetime 
    class Config: from_attributes = True 

class ExchangeCreate(BaseModel):
    target_book_id: int 
    offered_book_ids: List[int] = Field(..., min_length=1) 
    notes: Optional[str] = None 

class ExchangeStatusUpdate(BaseModel):
    status: str 

class ExchangeResponse(BaseModel):
    id: int 
    target_book_id: int 
    requester_id: int 
    offered_book_ids: List[int] 
    status: str 
    notes: Optional[str] = None 
    created_at: datetime 
    target_book: Optional[BookResponse] = None 
    requester: Optional[UserResponse] = None 
    offered_books: Optional[List[BookResponse]] = [] 
    class Config: from_attributes = True
