from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.book import Book, BookStatus
from app.models.exchange import Exchange, ExchangeStatus
from app.schemas.exchange import ExchangeCreate, ExchangeOut, ParticipantContact

router = APIRouter(prefix="/api/exchanges", tags=["exchanges"])

@router.post("", response_model=ExchangeOut, status_code=status.HTTP_201_CREATED)
def propose_exchange(
    payload: ExchangeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_book = db.query(Book).filter(Book.id == payload.target_book_id).first()
    offered_book = db.query(Book).filter(Book.id == payload.offered_book_id).first()

    if not target_book or not offered_book:
        raise HTTPException(status_code=404, detail="book not found")

    if target_book.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="cant swap with yourself")

    if offered_book.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="must offer own book")

    if target_book.status != BookStatus.AVAILABLE or offered_book.status != BookStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail="both books must be available")

    exchange = Exchange(
        target_book_id=target_book.id,
        offered_book_id=offered_book.id,
        requester_id=current_user.id,
        responder_id=target_book.owner_id,
        status=ExchangeStatus.PENDING,
        message=payload.message
    )
    db.add(exchange)
    db.commit()
    db.refresh(exchange)
    return exchange

@router.get("/my", response_model=List[ExchangeOut])
def get_my_exchanges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exchanges = db.query(Exchange).filter(
        (Exchange.requester_id == current_user.id) | (Exchange.responder_id == current_user.id)
    ).order_by(Exchange.created_at.desc()).all()

    results = []
    for ex in exchanges:
        item = ExchangeOut.model_validate(ex)
        if ex.status == ExchangeStatus.ACCEPTED:
            item.contact_requester = ParticipantContact(
                id=ex.requester.id,
                full_name=ex.requester.full_name,
                email=ex.requester.email,
                phone_number=ex.requester.phone_number,
                city=ex.requester.city
            )
            item.contact_responder = ParticipantContact(
                id=ex.responder.id,
                full_name=ex.responder.full_name,
                email=ex.responder.email,
                phone_number=ex.responder.phone_number,
                city=ex.responder.city
            )
        results.append(item)
    return results

@router.post("/{exchange_id}/accept", response_model=ExchangeOut)
def accept_exchange(
    exchange_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    exchange = db.query(Exchange).filter(Exchange.id == exchange_id).first()
    if not exchange:
        raise HTTPException(status_code=404, detail="proposal not found")

    if exchange.responder_id != current_user.id:
        raise HTTPException(status_code=403, detail="not allowed")

    if exchange.status != ExchangeStatus.PENDING:
        raise HTTPException(status_code=400, detail="only pending swaps can be accepted")

    # blocam cartile
    exchange.target_book.status = BookStatus.EXCHANGE_PENDING
    exchange.offered_book.status = BookStatus.EXCHANGE_PENDING
    exchange.status = ExchangeStatus.ACCEPTED

    db.commit()
    db.refresh(exchange)

    res = ExchangeOut.model_validate(exchange)
    res.contact_requester = ParticipantContact(
        id=exchange.requester.id,
        full_name=exchange.requester.full_name,
        email=exchange.requester.email,
        phone_number=exchange.requester.phone_number,
        city=exchange.requester.city
    )
    res.contact_responder = ParticipantContact(
        id=exchange.responder.id,
        full_name=exchange.responder.full_name,
        email=exchange.responder.email,
        phone_number=exchange.responder.phone_number,
        city=exchange.responder.city
    )
    return res
