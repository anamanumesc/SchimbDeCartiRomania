from datetime import datetime
import enum
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from app.core.database import Base

class ExchangeStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Exchange(Base):
    __tablename__ = "exchanges"

    id = Column(Integer, primary_key=True, index=True)
    target_book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    offered_book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ExchangeStatus), nullable=False, default=ExchangeStatus.PENDING, index=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    target_book = relationship("Book", foreign_keys=[target_book_id])
    offered_book = relationship("Book", foreign_keys=[offered_book_id])
    requester = relationship("User", foreign_keys=[requester_id])
    responder = relationship("User", foreign_keys=[responder_id])
