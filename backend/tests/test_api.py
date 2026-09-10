import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

# folosim sqlite in-memory pentru testele automate rapide
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_auth_and_book_flow():
    # register user
    reg = client.post("/api/auth/register", json={
        "email": "dev@test.ro",
        "password": "Password123",
        "full_name": "Dev Tester",
        "city": "Iași"
    })
    assert reg.status_code == 201

    # login
    login = client.post("/api/auth/login", data={
        "username": "dev@test.ro",
        "password": "Password123"
    })
    assert login.status_code == 200
    token = login.json()["access_token"]

    # add book
    book = client.post("/api/books", headers={"Authorization": f"Bearer {token}"}, json={
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "genre": "Tech",
        "city": "Iași"
    })
    assert book.status_code == 201
    assert book.json()["status"] == "AVAILABLE"
