from datetime import datetime
import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base

class BookCondition(str, enum.Enum):
    NEW = "NEW"
    AS_NEW = "AS_NEW"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"

class BookStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    EXCHANGE_PENDING = "EXCHANGE_PENDING"
    EXCHANGED = "EXCHANGED"
    ARCHIVED = "ARCHIVED"

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    genre = Column(String(100), nullable=False, index=True)
    condition = Column(Enum(BookCondition), nullable=False, default=BookCondition.GOOD)
    description = Column(Text, nullable=True)
    city = Column(String(100), nullable=False, index=True)
    status = Column(Enum(BookStatus), nullable=False, default=BookStatus.AVAILABLE, index=True)
    
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    owner = relationship("User", back_populates="books")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
