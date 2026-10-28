from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    city: Optional[str] = Field(default="Iași", max_length=100)
    contact_info: Optional[str] = Field(default=None, max_length=255)

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)
    city: Optional[str] = Field(default="Iași", max_length=100)
    contact_info: Optional[str] = Field(default=None, max_length=255)

    @field_validator("password")
    @classmethod
    def password_bytes(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes")
        return value

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PublicUserResponse(BaseModel):
    id: int
    username: str
    city: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BookBase(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    author: str = Field(min_length=1, max_length=255)
    genre: str = Field(default="Beletristică", max_length=100)
    condition: str = Field(default="Foarte bună", max_length=50)
    city: str = Field(default="Iași", max_length=100)
    description: Optional[str] = Field(default=None, max_length=10000)
    cover_url: Optional[str] = Field(default=None, max_length=500)
    is_series: bool = False
    volume_info: str = Field(default="Volum unic", max_length=100)

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    is_available: bool
    owner_id: int
    created_at: datetime
    owner: PublicUserResponse
    model_config = ConfigDict(from_attributes=True)

class ExchangeCreate(BaseModel):
    target_book_id: int
    offered_book_ids: List[int] = Field(min_length=1, max_length=20)
    notes: Optional[str] = Field(default=None, max_length=500)

class ExchangeResponse(BaseModel):
    id: int
    target_book_id: int
    target_owner_id: int
    requester_id: int
    offered_book_ids: List[int]
    status: str
    notes: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime
    target_book: Optional[BookResponse] = None
    requester: Optional[PublicUserResponse] = None
    target_owner: Optional[PublicUserResponse] = None
    offered_books: List[BookResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

class ExchangeAction(BaseModel):
    action: Literal["accept", "reject"]

class EmailRequest(BaseModel):
    email: EmailStr

class VerificationRequest(BaseModel):
    token: str = Field(max_length=2048)
