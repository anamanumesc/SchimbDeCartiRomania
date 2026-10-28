"""Run only against a disposable PostgreSQL database ending in _test."""
import os
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
import pytest
from fastapi.testclient import TestClient
if not urlparse(os.environ['DATABASE_URL']).path.endswith('_test'):
    raise RuntimeError('Tests require a disposable database ending in _test')
from app.main import app
from app.database import Base, engine, SessionLocal, get_db
from app import models, security
from sqlalchemy.exc import OperationalError
from sqlalchemy import text, inspect
client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(engine)
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE IF EXISTS schema_migrations"))
    Base.metadata.create_all(engine)
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def participants():
    with SessionLocal() as db:
        users = [models.User(username=f'user{i}', email=f'user{i}@example.com',
                 hashed_password=security.get_password_hash('long-password-123'),
                 contact_info=f'private-phone-{i}') for i in range(3)]
        db.add_all(users)
        db.flush()
        books = [models.Book(title=f'Book {i}', author='Author', owner_id=user.id) for i, user in enumerate(users)]
        db.add_all(books)
        db.commit()
        return [(user.id, book.id, {'Authorization': 'Bearer ' + security.create_access_token({'sub': str(user.id)})})
                for user, book in zip(users, books)]

def propose(participants, index=1):
    response = client.post('/api/exchanges', headers=participants[index][2], json={
        'target_book_id': participants[0][1], 'offered_book_ids': [participants[index][1]]})
    assert response.status_code == 200, response.text
    return response.json()['id']

def test_health_check():
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['database'] == 'connected'

def test_health_database_failure():
    class BrokenDatabase:
        def execute(self, *args):
            raise OperationalError('SELECT 1', {}, Exception('offline'))
    app.dependency_overrides[get_db] = lambda: BrokenDatabase()
    assert client.get('/health').status_code == 503

def test_public_responses_hide_contact_and_credentials(participants):
    for path in ['/api/books', f'/api/books/{participants[0][1]}', f'/api/users/{participants[0][0]}/profile']:
        response = client.get(path)
        assert response.status_code == 200
        for secret in ['email', 'contact_info', 'hashed_password', 'private-phone']:
            assert secret not in response.text
    propose(participants)
    response = client.get('/api/exchanges/incoming', headers=participants[0][2])
    assert 'email' not in response.text
    assert 'contact_info' not in response.text

def test_contact_requires_acceptance_and_participation(participants):
    exchange = propose(participants)
    path = f'/api/exchanges/{exchange}/contact'
    assert client.get(path, headers=participants[1][2]).status_code == 403
    assert client.post(f'/api/exchanges/{exchange}/respond', headers=participants[0][2], json={'action': 'accept'}).status_code == 200
    assert client.get(path, headers=participants[2][2]).status_code == 403
    response = client.get(path, headers=participants[1][2])
    assert response.status_code == 200
    assert response.json()['email'] == 'user0@example.com'

def test_concurrent_acceptance_locks_shared_book(participants):
    exchanges = [propose(participants, i) for i in (1, 2)]
    def accept(exchange):
        with TestClient(app) as connection:
            return connection.post(f'/api/exchanges/{exchange}/respond', headers=participants[0][2], json={'action': 'accept'}).status_code
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(accept, exchanges))
    assert sorted(results) == [200, 409]
    with SessionLocal() as db:
        assert db.query(models.Exchange).filter_by(status='accepted').count() == 1
        assert db.query(models.Book).filter_by(is_available=False).count() == 2

def test_exchange_transition_cannot_be_replayed(participants):
    exchange = propose(participants)
    path = f'/api/exchanges/{exchange}/respond'
    assert client.post(path, headers=participants[0][2], json={'action': 'reject'}).status_code == 200
    assert client.post(path, headers=participants[0][2], json={'action': 'accept'}).status_code == 409
    assert client.get(f'/api/exchanges/{exchange}/contact', headers=participants[1][2]).status_code == 403

def test_non_owner_cannot_respond(participants):
    exchange = propose(participants)
    assert client.post(f'/api/exchanges/{exchange}/respond', headers=participants[2][2], json={'action': 'accept'}).status_code == 404

def test_malformed_jwt_subject_is_unauthorized():
    token = security.create_access_token({'sub': 'not-an-integer'})
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + token}).status_code == 401

def test_registration_and_login():
    user = {'username': 'reader', 'email': 'reader@example.com', 'password': 'long-password-123'}
    assert client.post('/api/auth/register', json=user).status_code == 200
    login = client.post('/api/auth/login', json={'email': user['email'], 'password': user['password']})
    assert login.status_code == 200
    assert 'hashed_password' not in login.text
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + login.json()['access_token']}).status_code == 200
    assert client.post('/api/auth/register', json=user).status_code == 400
    assert client.post('/api/auth/login', json={'email': user['email'], 'password': 'wrong'}).status_code == 401

def test_invalid_book_offer_rejected(participants):
    response = client.post('/api/exchanges', headers=participants[1][2], json={
        'target_book_id': participants[0][1], 'offered_book_ids': [participants[2][1]]})
    assert response.status_code == 400


def test_migration_is_idempotent_and_preserves_data(participants):
    from app.migrations import initialize_database
    initialize_database()
    initialize_database()
    with SessionLocal() as db:
        assert db.query(models.User).count() == 3
        assert db.query(models.Book).count() == 3


def test_email_verification_cannot_be_used_as_access_token(participants):
    with SessionLocal() as db:
        user = db.get(models.User, participants[0][0])
        token = security.create_verification_token(user)
    assert client.get('/api/auth/me', headers={'Authorization': 'Bearer ' + token}).status_code == 401
    response = client.post('/api/auth/verify-email', json={'token': token})
    assert response.status_code == 200
    with SessionLocal() as db:
        assert db.get(models.User, participants[0][0]).email_verified is True


def test_access_token_cannot_verify_email(participants):
    token = participants[0][2]['Authorization'].split()[1]
    assert client.post('/api/auth/verify-email', json={'token': token}).status_code == 400


def test_email_verification_blocks_login_when_enabled(participants, monkeypatch):
    monkeypatch.setenv('EMAIL_VERIFICATION_REQUIRED', 'true')
    response = client.post('/api/auth/login', json={'email': 'user0@example.com', 'password': 'long-password-123'})
    assert response.status_code == 403


def test_smtp_delivery_failure_retries_and_success_clears_private_body(monkeypatch):
    import smtplib
    from app import mailer
    monkeypatch.setenv('SMTP_HOST', 'smtp.invalid')
    monkeypatch.setenv('SMTP_FROM', 'noreply@example.com')
    class FailedSMTP:
        def __init__(self, *args, **kwargs):
            raise smtplib.SMTPException('offline')
    monkeypatch.setattr(mailer.smtplib, 'SMTP', FailedSMTP)
    with SessionLocal() as db:
        mailer.enqueue(db, 'reader@example.com', 'Subject', 'private verification link')
        db.commit()
    mailer.deliver_pending()
    with SessionLocal() as db:
        message = db.query(models.MailOutbox).one()
        assert message.sent_at is None
        assert message.attempts == 1
        from datetime import datetime, timezone
        message.next_attempt_at = datetime.now(timezone.utc)
        db.commit()
    class WorkingSMTP:
        def __init__(self, *args, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def starttls(self, **kwargs): pass
        def send_message(self, message):
            assert message['To'] == 'reader@example.com'
    monkeypatch.setattr(mailer.smtplib, 'SMTP', WorkingSMTP)
    mailer.deliver_pending()
    with SessionLocal() as db:
        message = db.query(models.MailOutbox).one()
        assert message.sent_at is not None
        assert message.body == ''
        assert message.recipient == ''


def test_enabling_verification_also_blocks_previously_issued_tokens(participants, monkeypatch):
    monkeypatch.setenv('EMAIL_VERIFICATION_REQUIRED', 'true')
    assert client.get('/api/auth/me', headers=participants[0][2]).status_code == 403


def test_legacy_migration_backfills_owner_and_keeps_json_offers(participants):
    from app.migrations import initialize_database
    exchange_id = propose(participants)
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE exchanges DROP COLUMN target_owner_id"))
        connection.execute(text("ALTER TABLE users DROP COLUMN email_verified"))
    initialize_database()
    with SessionLocal() as db:
        exchange = db.get(models.Exchange, exchange_id)
        assert exchange.target_owner_id == participants[0][0]
        assert exchange.offered_book_ids == [participants[1][1]]
        assert db.query(models.Book).count() == 3
    columns = {column['name']: column for column in inspect(engine).get_columns('exchanges')}
    assert str(columns['offered_book_ids']['type']) == 'JSON'
    assert columns['target_owner_id']['nullable'] is False
