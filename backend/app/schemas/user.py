from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    city: str = Field(default="București", min_length=2, max_length=100)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=100)
    phone_number: Optional[str] = None

class UserOut(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
