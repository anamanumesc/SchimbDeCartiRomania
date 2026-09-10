from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.book import Book, BookStatus
from app.schemas.book import BookCreate, BookOut

router = APIRouter(prefix="/api/books", tags=["books"])

@router.get("", response_model=List[BookOut])
def list_books(
    city: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    status: BookStatus = BookStatus.AVAILABLE,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Book).filter(Book.status == status)
    if city:
        query = query.filter(Book.city.ilike(f"%{city}%"))
    if genre:
        query = query.filter(Book.genre.ilike(f"%{genre}%"))
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    book_in: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    book = Book(
        **book_in.model_dump(),
        owner_id=current_user.id,
        status=BookStatus.AVAILABLE
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@router.get("/{book_id}", response_model=BookOut)
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return book
