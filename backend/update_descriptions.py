from app.database import engine, get_db
from app import models
from sqlalchemy.orm import Session

descriptions = {
    "Dune (Trilogia Clasică)": "Pachetul conține primele trei romane fundamentale din universul creat de Frank Herbert: Dune, Mântuitorul Dunei și Copiii Dunei. Traducere impecabilă în limba română la Editura Nemira, supracoperte păstrate perfect, cotor intact.",
    "Frații Karamazov": "Capodopera dostoievskiană despre credință, îndoială și natura morală a omului. Ediție completă în două volume comasate, din colecția Top 10+ a Editurii Polirom. Fără sublinieri sau pagini îndoite.",
    "Gândire rapidă, gândire lentă": "Lucrarea laureatului Nobel Daniel Kahneman care analizează Sistemul 1 (intuitiv, emoțional) și Sistemul 2 (deliberativ, logic). Carte nouă, necitită, cumpărată de la Editura Publica.",
    "Fundătura (Seria Fundația)": "Seria legendară completă a lui Isaac Asimov (Fundația, Fundația și Imperiul, A doua Fundație etc.). Toate volumele sunt în stare excelentă, păstrate în bibliotecă fără expunere directă la soare.",
    "Magicianul": "Unul dintre cele mai enigmatice romane ale secolului XX. Nicholas Urfe ajunge pe o insulă grecească unde este prins într-un joc psihologic amețitor regizat de excentricul Maurice Conchis.",
    "Sapiens: Scurtă istorie a omenirii": "Cartea care a fascinat milioane de cititori: o panoramă curajoasă a speciei noastre de la vânători-culegători din Epoca de Piatră până la revoluția biotehnologică.",
    "Călătorie spre centrul Pământului": "Clasicul Jules Verne într-o ediție ilustrată cu coperți cartonate. Perfectă pentru pasionații de aventură retro și SF clasic.",
    "Pacientul Tăcut": "Un thriller psihologic tensionat despre Alicia Berenson, o pictoriță celebră care își împușcă soțul și refuză să mai rostească vreun cuvânt timp de ani de zile.",
    "Atomic Habits": "Ghidul practic al lui James Clear despre construirea obiceiurilor productive și eliminarea celor nocive prin schimbări microscopice de 1% în fiecare zi."
}

def main():
    import argparse
    from sqlalchemy.engine import make_url
    from app.database import DATABASE_URL, SessionLocal
    parser = argparse.ArgumentParser(description="Update descriptions in a disposable demo database")
    parser.add_argument("--apply", action="store_true", required=True)
    parser.parse_args()
    if not make_url(DATABASE_URL).database.endswith(("_dev", "_test")):
        raise RuntimeError("Description seeding is allowed only in a database ending in _dev or _test")
    with SessionLocal() as db:
        for title, description in descriptions.items():
            book = db.query(models.Book).filter(models.Book.title == title).first()
            if book:
                book.description = description
        db.commit()
    print("Demo descriptions updated")

if __name__ == "__main__":
    main()
