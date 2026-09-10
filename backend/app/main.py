from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from app.database import engine, get_db, Base
from app import models, schemas

# Generăm tabelele în Postgres
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Schimb de Cărți România API",
    description="API pentru platforma comunitară de schimb de volume de lectură.",
    version="2.1.0"
)

@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unavailable: {str(e)}"
    return {
        "status": "healthy",
        "database": db_status,
        "version": "2.1.0"
    }

@app.get("/api/books", response_model=List[schemas.BookResponse], tags=["Books"])
def get_books(db: Session = Depends(get_db)):
    return db.query(models.Book).order_by(models.Book.id.desc()).all()

@app.post("/api/books", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED, tags=["Books"])
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    new_book = models.Book(
        title=book.title.strip(),
        author=book.author.strip(),
        genre=book.genre.strip(),
        condition=book.condition.strip(),
        city=book.city.strip()
    )
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book
