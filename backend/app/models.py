from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    genre = Column(String(100), nullable=True, default="General")
    condition = Column(String(50), nullable=True, default="Bună")
    city = Column(String(100), nullable=True, default="România")
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Exchange(Base):
    __tablename__ = "exchanges"

    id = Column(Integer, primary_key=True, index=True)
    target_book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    offered_book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    contact_info = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    target_book = relationship("Book", foreign_keys=[target_book_id])
    offered_book = relationship("Book", foreign_keys=[offered_book_id])
