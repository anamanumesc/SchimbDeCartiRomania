from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    contact_info = Column(String(255), nullable=True) # Telefon / Telegram / Detalii contact
    city = Column(String(100), default="Iași")
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    books = relationship("Book", back_populates="owner", cascade="all, delete-orphan")

class Book(Base):
    __tablename__ = "books"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    author = Column(String(255), index=True, nullable=False)
    genre = Column(String(100), default="Beletristică", index=True)
    condition = Column(String(50), default="Foarte bună", index=True)
    city = Column(String(100), default="Iași", index=True)
    description = Column(Text, nullable=True)
    cover_url = Column(String(500), nullable=True)

    # Optimizare serie / volum
    is_series = Column(Boolean, default=False)
    volume_info = Column(String(100), default="Volum unic") # Ex: "Vol. 1-3 (Serie completă)", "Volumul 2"

    is_available = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="books")

class Exchange(Base):
    __tablename__ = "exchanges"
    id = Column(Integer, primary_key=True, index=True)
    target_book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    target_owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    offered_book_ids = Column(JSON, nullable=False) # ID-urile cartilor oferite
    status = Column(String(20), default="pending") # pending, accepted, rejected, cancelled
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    target_book = relationship("Book", foreign_keys=[target_book_id])
    requester = relationship("User", foreign_keys=[requester_id])
    target_owner = relationship("User", foreign_keys=[target_owner_id])

class MailOutbox(Base):
    __tablename__ = "mail_outbox"
    id = Column(Integer, primary_key=True)
    recipient = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    next_attempt_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    sent_at = Column(DateTime(timezone=True), nullable=True)
