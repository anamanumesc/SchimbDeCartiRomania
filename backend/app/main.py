import os
import jwt
from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, text
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
from app.database import engine, get_db, Base
from app import models, schemas, security, mailer

from contextlib import asynccontextmanager
from app.migrations import initialize_database

@asynccontextmanager
async def lifespan(app):
    if os.getenv("EMAIL_VERIFICATION_REQUIRED", "false").lower() == "true":
        if not mailer.enabled() or not os.getenv("PUBLIC_BASE_URL", "").startswith("https://"):
            raise RuntimeError("Email verification requires SMTP and an HTTPS PUBLIC_BASE_URL")
    initialize_database()
    yield

app = FastAPI(title="Schimb de Cărți API", version="3.3.0", lifespan=lifespan)

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "healthy", "database": "connected", "version": "3.3.0"}

def queue_verification(db, user):
    base_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    if mailer.enabled() and base_url.startswith("https://"):
        token = security.create_verification_token(user)
        mailer.enqueue(db, user.email, "Confirmă adresa de email", f"Confirmă adresa în următoarea oră: {base_url}/#verify-email={token}")

@app.post("/api/auth/verify-email", tags=["Auth"])
def verify_email(request: schemas.VerificationRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        if payload.get("purpose") != "verify_email":
            raise ValueError("Wrong token purpose")
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Link invalid sau expirat.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or user.email != payload.get("email"):
        raise HTTPException(status_code=400, detail="Link invalid sau expirat.")
    user.email_verified = True
    db.commit()
    return {"status": "verified"}

@app.post("/api/auth/resend-verification", tags=["Auth"])
def resend_verification(request: schemas.EmailRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if user and not user.email_verified:
        queue_verification(db, user)
        db.commit()
    return {"status": "If the account needs verification, an email will be sent when email is configured"}

# --- AUTH ---
@app.post("/api/auth/register", response_model=schemas.UserResponse, tags=["Auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email-ul este deja folosit.")
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Numele de utilizator este deja luat.")

    hashed_pwd = security.get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pwd,
        city=user.city or "Iași",
        contact_info=user.contact_info
    )
    db.add(new_user)
    db.flush()
    queue_verification(db, new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login", response_model=schemas.Token, tags=["Auth"])
def login_user(creds: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not security.verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email sau parolă incorectă.")

    if os.getenv("EMAIL_VERIFICATION_REQUIRED", "false").lower() == "true" and not user.email_verified:
        raise HTTPException(status_code=403, detail="Verifică adresa de email înainte de autentificare.")

    access_token = security.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@app.get("/api/auth/me", response_model=schemas.UserResponse, tags=["Auth"])
def get_me(current_user: models.User = Depends(security.get_current_user)):
    return current_user

# --- BOOKS CATALOG & FILTERS ---
@app.get("/api/books", response_model=List[schemas.BookResponse], tags=["Books"])
def get_books(
    q: Optional[str] = Query(None, description="Cautare titlu sau autor"),
    city: Optional[str] = Query(None),
    genre: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    series_only: Optional[bool] = Query(None),
    owner_id: Optional[int] = Query(None),
    available_only: bool = Query(True),
    db: Session = Depends(get_db)
):
    query = db.query(models.Book).options(joinedload(models.Book.owner))
    if available_only:
        query = query.filter(models.Book.is_available == True)
    if q:
        search = f"%{q.strip()}%"
        query = query.filter(or_(models.Book.title.ilike(search), models.Book.author.ilike(search)))
    if city and city != "all":
        query = query.filter(models.Book.city.ilike(f"%{city}%"))
    if genre and genre != "all":
        query = query.filter(models.Book.genre.ilike(f"%{genre}%"))
    if condition and condition != "all":
        query = query.filter(models.Book.condition == condition)
    if series_only is not None:
        query = query.filter(models.Book.is_series == series_only)
    if owner_id:
        query = query.filter(models.Book.owner_id == owner_id)

    return query.order_by(models.Book.id.desc()).all()

@app.post("/api/books", response_model=schemas.BookResponse, tags=["Books"])
def create_book(
    book_in: schemas.BookCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    book = models.Book(
        **book_in.model_dump(),
        owner_id=current_user.id
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return book

@app.get("/api/books/{book_id}", response_model=schemas.BookResponse, tags=["Books"])
def get_book(book_id: int, db: Session = Depends(get_db)):
    book = db.query(models.Book).options(joinedload(models.Book.owner)).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Cartea nu a fost găsită.")
    return book

# --- USER PUBLIC PROFILE ---
@app.get("/api/users/{user_id}/profile", tags=["Users"])
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilizatorul nu există.")
    books = db.query(models.Book).filter(models.Book.owner_id == user_id, models.Book.is_available == True).all()
    return {
        "id": user.id,
        "username": user.username,
        "city": user.city,
        "created_at": user.created_at,
        "books_count": len(books),
        "books": [schemas.BookResponse.model_validate(book).model_dump() for book in books]
    }

# --- EXCHANGES (PROPOSE & MANAGE) ---
@app.post("/api/exchanges", response_model=schemas.ExchangeResponse, tags=["Exchanges"])
def propose_exchange(
    req: schemas.ExchangeCreate,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    target = db.query(models.Book).filter(models.Book.id == req.target_book_id).first()
    if not target or not target.is_available:
        raise HTTPException(status_code=400, detail="Cartea dorită nu mai este disponibilă.")
    if target.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Nu poți propune un schimb pentru propria carte.")

    if not req.offered_book_ids:
        raise HTTPException(status_code=400, detail="Selectează cel puțin o carte pe care o oferi la schimb.")

    # Validare ca toate cartile oferite apartin utilizatorului si sunt disponibile
    user_books = db.query(models.Book).filter(
        models.Book.id.in_(req.offered_book_ids),
        models.Book.owner_id == current_user.id,
        models.Book.is_available == True
    ).all()
    if len(user_books) != len(req.offered_book_ids):
        raise HTTPException(status_code=400, detail="Una sau mai multe cărți oferite nu sunt disponibile sau nu îți aparțin.")

    exchange = models.Exchange(
        target_book_id=target.id,
        target_owner_id=target.owner_id,
        requester_id=current_user.id,
        offered_book_ids=req.offered_book_ids,
        notes=req.notes,
        status="pending"
    )
    db.add(exchange)
    mailer.enqueue(db, target.owner.email, "Propunere nouă de schimb", "Ai primit o propunere nouă. Deschide aplicația pentru a o verifica.")
    db.commit()
    db.refresh(exchange)

    exchange.target_book = target
    exchange.requester = current_user
    exchange.offered_books = user_books
    return exchange

@app.get("/api/exchanges/incoming", response_model=List[schemas.ExchangeResponse], tags=["Exchanges"])
def get_incoming_exchanges(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    exchanges = db.query(models.Exchange).options(
        joinedload(models.Exchange.target_book),
        joinedload(models.Exchange.requester)
    ).filter(models.Exchange.target_owner_id == current_user.id).order_by(models.Exchange.id.desc()).all()

    for ex in exchanges:
        if ex.offered_book_ids:
            ex.offered_books = db.query(models.Book).filter(models.Book.id.in_(ex.offered_book_ids)).all()
    return exchanges

@app.get("/api/exchanges/outgoing", response_model=List[schemas.ExchangeResponse], tags=["Exchanges"])
def get_outgoing_exchanges(
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    exchanges = db.query(models.Exchange).options(
        joinedload(models.Exchange.target_book),
        joinedload(models.Exchange.target_owner)
    ).filter(models.Exchange.requester_id == current_user.id).order_by(models.Exchange.id.desc()).all()

    for ex in exchanges:
        if ex.offered_book_ids:
            ex.offered_books = db.query(models.Book).filter(models.Book.id.in_(ex.offered_book_ids)).all()
    return exchanges

@app.post("/api/exchanges/{exchange_id}/respond", tags=["Exchanges"])
def respond_exchange(
    exchange_id: int,
    action_in: schemas.ExchangeAction,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    exchange = db.query(models.Exchange).filter(models.Exchange.id == exchange_id).with_for_update().first()
    if not exchange or exchange.target_owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="Cererea de schimb nu a fost găsită.")

    if exchange.status != "pending":
        raise HTTPException(status_code=409, detail="Cererea a fost deja procesată.")
    if action_in.action == "accept":
        book_ids = sorted(set([exchange.target_book_id] + exchange.offered_book_ids))
        books = db.query(models.Book).filter(models.Book.id.in_(book_ids)).order_by(models.Book.id).with_for_update().all()
        if len(books) != len(book_ids) or any(not book.is_available for book in books):
            raise HTTPException(status_code=409, detail="O carte nu mai este disponibilă.")
        for book in books:
            expected_owner = exchange.target_owner_id if book.id == exchange.target_book_id else exchange.requester_id
            if book.owner_id != expected_owner:
                raise HTTPException(status_code=409, detail="Proprietarul cărții s-a schimbat.")
            book.is_available = False
        exchange.status = "accepted"
        # Other proposals remain pending but cannot be accepted once their books are locked.
    else:
        exchange.status = "rejected"

    mailer.enqueue(db, exchange.requester.email, "Răspuns la propunerea de schimb", "Propunerea ta a fost " + exchange.status + ". Deschide aplicația pentru detalii.")
    db.commit()
    return {"status": "success", "exchange_status": exchange.status}

@app.get("/api/exchanges/{exchange_id}/contact", tags=["Exchanges"])
def get_exchange_contact(
    exchange_id: int,
    current_user: models.User = Depends(security.get_current_user),
    db: Session = Depends(get_db)
):
    exchange = db.query(models.Exchange).filter(models.Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="Cererea nu există.")
    if current_user.id not in [exchange.target_owner_id, exchange.requester_id]:
        raise HTTPException(status_code=403, detail="Nu ai permisiunea de a vizualiza aceste date de contact.")

    if exchange.status != "accepted":
        raise HTTPException(status_code=403, detail="Contactul este disponibil doar după acceptarea schimbului.")

    other_user_id = exchange.requester_id if current_user.id == exchange.target_owner_id else exchange.target_owner_id
    other = db.query(models.User).filter(models.User.id == other_user_id).first()
    return {
        "username": other.username,
        "email": other.email,
        "city": other.city,
        "contact_info": other.contact_info or "Email principal: " + other.email
    }
