import os
from sqlalchemy.engine import make_url
from app.database import DATABASE_URL
import sys
from app.database import engine, get_db
from app import models, security
from sqlalchemy.orm import Session
from sqlalchemy import text

def seed():
    if not make_url(DATABASE_URL).database.endswith(("_dev", "_test")):
        raise RuntimeError("Demo seeding is allowed only in a database ending in _dev or _test")
    demo_password = os.environ["DEMO_PASSWORD"]
    if len(demo_password) < 12 or len(demo_password.encode("utf-8")) > 72:
        raise RuntimeError("DEMO_PASSWORD must have at least 12 characters and at most 72 UTF-8 bytes")
    db: Session = next(get_db())

    # Verificam daca avem deja utilizatori de seed
    existing_alex = db.query(models.User).filter(models.User.email == "alex@example.com").first()
    if existing_alex:
        print("Datele de test există deja în baza de date.")
        return

    print("Populare baza de date cu conturi demonstrative și cărți...")

    # 1. Conturi demonstrative
    u1 = models.User(
        username="alex_iasi",
        email="alex@example.com",
        city="Iași",
        contact_info="Demo account",
        hashed_password=security.get_password_hash(demo_password)
    )
    u2 = models.User(
        username="elena_bucuresti",
        email="elena@example.com",
        city="București",
        contact_info="Demo account",
        hashed_password=security.get_password_hash(demo_password)
    )
    u3 = models.User(
        username="radubookworm",
        email="radu@example.com",
        city="Cluj-Napoca",
        contact_info="Demo account",
        hashed_password=security.get_password_hash(demo_password)
    )
    db.add_all([u1, u2, u3])
    db.commit()
    db.refresh(u1)
    db.refresh(u2)
    db.refresh(u3)

    # 2. Câte 3 Cărți reale per utilizator (total 9 cărți reale cu coperți)
    books = [
        # Carti Alex (Iași)
        models.Book(
            title="Dune (Trilogia Clasică)",
            author="Frank Herbert",
            genre="SF & Fantasy",
            condition="Ca nouă",
            city="Iași",
            is_series=True,
            volume_info="Vol. 1-3 (Pachet Nemira)",
            cover_url="https://covers.openlibrary.org/b/id/9121736-L.jpg",
            owner_id=u1.id
        ),
        models.Book(
            title="Frații Karamazov",
            author="Feodor Dostoievski",
            genre="Ficțiune",
            condition="Foarte bună",
            city="Iași",
            is_series=False,
            volume_info="Volum unic (Polirom Top 10+)",
            cover_url="https://covers.openlibrary.org/b/id/8231996-L.jpg",
            owner_id=u1.id
        ),
        models.Book(
            title="Gândire rapidă, gândire lentă",
            author="Daniel Kahneman",
            genre="Dezvoltare Personală",
            condition="Nouă",
            city="Iași",
            is_series=False,
            volume_info="Volum unic (Ed. Publica)",
            cover_url="https://covers.openlibrary.org/b/id/7265882-L.jpg",
            owner_id=u1.id
        ),

        # Carti Elena (București)
        models.Book(
            title="Fundătura (Seria Fundația)",
            author="Isaac Asimov",
            genre="SF & Fantasy",
            condition="Foarte bună",
            city="București",
            is_series=True,
            volume_info="Seria completă 7 volume",
            cover_url="https://covers.openlibrary.org/b/id/10524458-L.jpg",
            owner_id=u2.id
        ),
        models.Book(
            title="Magicianul",
            author="John Fowles",
            genre="Ficțiune",
            condition="Bună",
            city="București",
            is_series=False,
            volume_info="Volum unic",
            cover_url="https://covers.openlibrary.org/b/id/8228691-L.jpg",
            owner_id=u2.id
        ),
        models.Book(
            title="Sapiens: Scurtă istorie a omenirii",
            author="Yuval Noah Harari",
            genre="Istorie & Biografie",
            condition="Ca nouă",
            city="București",
            is_series=False,
            volume_info="Volum unic (Polirom)",
            cover_url="https://covers.openlibrary.org/b/id/8750891-L.jpg",
            owner_id=u2.id
        ),

        # Carti Radu (Cluj-Napoca)
        models.Book(
            title="Călătorie spre centrul Pământului",
            author="Jules Verne",
            genre="SF & Fantasy",
            condition="Bună",
            city="Cluj-Napoca",
            is_series=False,
            volume_info="Ediție ilustrată",
            cover_url="https://covers.openlibrary.org/b/id/8235116-L.jpg",
            owner_id=u3.id
        ),
        models.Book(
            title="Pacientul Tăcut",
            author="Alex Michaelides",
            genre="Thriller & Mister",
            condition="Ca nouă",
            city="Cluj-Napoca",
            is_series=False,
            volume_info="Volum unic (Litera)",
            cover_url="https://covers.openlibrary.org/b/id/8916382-L.jpg",
            owner_id=u3.id
        ),
        models.Book(
            title="Atomic Habits",
            author="James Clear",
            genre="Dezvoltare Personală",
            condition="Nouă",
            city="Cluj-Napoca",
            is_series=False,
            volume_info="Ediție română",
            cover_url="https://covers.openlibrary.org/b/id/12886416-L.jpg",
            owner_id=u3.id
        ),
    ]

    db.add_all(books)
    db.commit()
    print("Populare finalizată cu succes: 3 utilizatori și 9 cărți adăugate.")

if __name__ == "__main__":
    seed()
