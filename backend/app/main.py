from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, or_
from typing import List, Optional
from app.database import engine, get_db, Base
from app import models, schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Schimb de Cărți România API",
    description="API pentru platforma comunitară de schimb de volume de lectură.",
    version="2.3.0"
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
        "version": "2.3.0"
    }

@app.get("/api/books", response_model=List[schemas.BookResponse], tags=["Books"])
def get_books(
    q: Optional[str] = Query(None, description="Căutare după titlu sau autor"),
    genre: Optional[str] = Query(None, description="Filtrare după gen"),
    city: Optional[str] = Query(None, description="Filtrare după oraș"),
    available_only: bool = Query(True, description="Doar cărți disponibile"),
    db: Session = Depends(get_db)
):
    query = db.query(models.Book)
    if available_only:
        query = query.filter(models.Book.is_available == True)
    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.Book.title.ilike(search_pattern),
                models.Book.author.ilike(search_pattern)
            )
        )
    if genre:
        query = query.filter(models.Book.genre.ilike(f"%{genre.strip()}%"))
    if city:
        query = query.filter(models.Book.city.ilike(f"%{city.strip()}%"))

    return query.order_by(models.Book.id.desc()).all()

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

@app.get("/api/exchanges", response_model=List[schemas.ExchangeResponse], tags=["Exchanges"])
def get_exchanges(db: Session = Depends(get_db)):
    return db.query(models.Exchange).options(
        joinedload(models.Exchange.target_book),
        joinedload(models.Exchange.offered_book)
    ).order_by(models.Exchange.id.desc()).all()

@app.post("/api/exchanges", response_model=schemas.ExchangeResponse, status_code=status.HTTP_201_CREATED, tags=["Exchanges"])
def create_exchange(payload: schemas.ExchangeCreate, db: Session = Depends(get_db)):
    if payload.target_book_id == payload.offered_book_id:
        raise HTTPException(status_code=400, detail="Nu poți schimba o carte cu ea însăși.")

    target = db.query(models.Book).filter(models.Book.id == payload.target_book_id).first()
    offered = db.query(models.Book).filter(models.Book.id == payload.offered_book_id).first()

    if not target or not offered:
        raise HTTPException(status_code=404, detail="Una dintre cărți nu există.")

    if not target.is_available or not offered.is_available:
        raise HTTPException(status_code=400, detail="Una dintre cărți nu mai este disponibilă.")

    existing = db.query(models.Exchange).filter(
        models.Exchange.target_book_id == payload.target_book_id,
        models.Exchange.offered_book_id == payload.offered_book_id,
        models.Exchange.status == "pending"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Există deja o cerere în așteptare pentru aceste cărți.")

    new_exchange = models.Exchange(**payload.model_dump())
    db.add(new_exchange)
    db.commit()
    db.refresh(new_exchange)
    return new_exchange

@app.patch("/api/exchanges/{exchange_id}/status", response_model=schemas.ExchangeResponse, tags=["Exchanges"])
def update_exchange_status(exchange_id: int, update: schemas.ExchangeStatusUpdate, db: Session = Depends(get_db)):
    exchange = db.query(models.Exchange).filter(models.Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Cererea de schimb nu a fost găsită.")

    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail="Numai cererile în așteptare pot fi modificate.")

    exchange.status = update.status
    if update.status == "accepted":
        exchange.target_book.is_available = False
        exchange.offered_book.is_available = False

    db.commit()
    db.refresh(exchange)
    return exchange
