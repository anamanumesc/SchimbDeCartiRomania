from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, BigInteger, TEXT 
from sqlalchemy.dialects.postgresql import ARRAY 
from sqlalchemy.orm import relationship 
from datetime import datetime, timezone 
from app.database import Base 

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    books = relationship("Book", back_populates="owner")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), index=True, nullable=False)
    genre = Column(String(100), default="General")
    condition = Column(String(50), default="Bună")
    city = Column(String(100), default="România")
    is_available = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    owner = relationship("User", back_populates="books")

class Exchange(Base):
    __tablename__ = "exchanges"
    id = Column(Integer, primary_key=True, index=True)
    target_book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offered_book_ids = Column(ARRAY(Integer), nullable=False)
    status = Column(String(20), default="pending")
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
