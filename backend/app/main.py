from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, or_
from typing import List, Optional
from app.database import engine, get_db, Base
from app import models, schemas, security

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Schimb de Cărți API", version="3.1.0")

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "healthy", "database": "connected", "version": "3.1.0"}

# --- AUTH ---
@app.post("/api/auth/register", response_model=schemas.UserResponse, tags=["Auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email-ul este deja folosit.")
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Numele de utilizator este deja luat.")
    
    hashed_pwd = security.get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_pwd)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token, tags=["Auth"])
def login_user(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not security.verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă.")
    
    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Auth"])
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- BOOKS ---
@app.get("/api/books", response_model=List[schemas.BookResponse], tags=["Books"])
def get_books(
    q: Optional[str] = None, city: Optional[str] = None, 
    owner_id: Optional[int] = None, available_only: bool = True, 
    db: Session = Depends(get_db)
):
    query = db.query(models.Book).options(joinedload(models.Book.owner))
    if available_only:
        query = query.filter(models.Book.is_available == True)
    if owner_id:
        query = query.filter(models.Book.owner_id == owner_id)
    if q:
        query = query.filter(or_(models.Book.title.ilike(f"%{q}%"), models.Book.author.ilike(f"%{q}%")))
    if city:
        query = query.filter(models.Book.city.ilike(f"%{city}%"))
    
    return query.order_by(models.Book.id.desc()).all()

@app.post("/api/books", response_model=schemas.BookResponse, tags=["Books"])
def create_book(book: schemas.BookCreate, db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    new_book = models.Book(**book.model_dump(), owner_id=current_user.id)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

# --- EXCHANGES ---
@app.post("/api/exchanges", response_model=schemas.ExchangeResponse, tags=["Exchanges"])
def create_exchange(
    req: schemas.ExchangeCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    target_book = db.query(models.Book).filter(models.Book.id == req.target_book_id).first()
    if not target_book or not target_book.is_available:
        raise HTTPException(status_code=404, detail="Cartea solicitată nu este disponibilă.")
    if target_book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Nu poți propune schimb pentru propria carte.")

    offered_books = db.query(models.Book).filter(
        models.Book.id.in_(req.offered_book_ids),
        models.Book.owner_id == current_user.id,
        models.Book.is_available == True
    ).all()

    if len(offered_books) != len(req.offered_book_ids):
        raise HTTPException(status_code=400, detail="Una sau mai multe cărți oferite nu sunt disponibile sau nu îți aparțin.")

    exchange = models.Exchange(
        target_book_id=req.target_book_id,
        requester_id=current_user.id,
        offered_book_ids=req.offered_book_ids,
        notes=req.notes
    )
    db.add(exchange)
    db.commit()
    db.refresh(exchange)
    
    res = schemas.ExchangeResponse.model_validate(exchange)
    res.offered_books = [schemas.BookResponse.model_validate(b) for b in offered_books]
    return res

@app.get("/api/exchanges", response_model=List[schemas.ExchangeResponse], tags=["Exchanges"])
def get_user_exchanges(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    exchanges = db.query(models.Exchange).join(models.Book, models.Exchange.target_book_id == models.Book.id).filter(
        or_(
            models.Exchange.requester_id == current_user.id,
            models.Book.owner_id == current_user.id
        )
    ).order_by(models.Exchange.id.desc()).all()

    results = []
    for ex in exchanges:
        item = schemas.ExchangeResponse.model_validate(ex)
        if ex.offered_book_ids:
            books = db.query(models.Book).filter(models.Book.id.in_(ex.offered_book_ids)).all()
            item.offered_books = [schemas.BookResponse.model_validate(b) for b in books]
        results.append(item)
    return results

@app.patch("/api/exchanges/{exchange_id}/status", response_model=schemas.ExchangeResponse, tags=["Exchanges"])
def update_exchange_status(
    exchange_id: int, 
    status_update: schemas.ExchangeStatusUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    if status_update.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Status invalid.")

    exchange = db.query(models.Exchange).filter(models.Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Schimbul nu a fost găsit.")

    target_book = db.query(models.Book).filter(models.Book.id == exchange.target_book_id).first()
    if target_book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Doar proprietarul cărții solicitate poate aproba sau respinge schimbul.")

    if exchange.status != "pending":
        raise HTTPException(status_code=400, detail=f"Schimbul este deja {exchange.status}.")

    exchange.status = status_update.status

    if status_update.status == "accepted":
        target_book.is_available = False
        db.query(models.Book).filter(models.Book.id.in_(exchange.offered_book_ids)).update({"is_available": False}, synchronize_session=False)

    db.commit()
    db.refresh(exchange)

    res = schemas.ExchangeResponse.model_validate(exchange)
    books = db.query(models.Book).filter(models.Book.id.in_(exchange.offered_book_ids)).all()
    res.offered_books = [schemas.BookResponse.model_validate(b) for b in books]
    return res
