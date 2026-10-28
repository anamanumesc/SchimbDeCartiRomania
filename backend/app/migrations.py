"""Additive legacy-schema migration, serialized across simultaneous app starts.

Never downgrade PostgreSQL or perform destructive schema changes at startup.
Future incompatible changes require a separate reviewed migration and backup.
"""
from sqlalchemy import text
from app.database import Base, engine
from app import models  # Register ORM metadata before creating tables.


def initialize_database():
    with engine.begin() as connection:
        connection.execute(text('SELECT pg_advisory_xact_lock(72643182)'))
        Base.metadata.create_all(bind=connection)
        connection.execute(text('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())'))
        if not connection.execute(text('SELECT 1 FROM schema_migrations WHERE version = 1')).scalar():
            for statement in (
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_info VARCHAR(255)',
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Iași'",
                'ALTER TABLE books ADD COLUMN IF NOT EXISTS is_series BOOLEAN DEFAULT FALSE',
                "ALTER TABLE books ADD COLUMN IF NOT EXISTS volume_info VARCHAR(100) DEFAULT 'Volum unic'",
                'ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT',
                'ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500)',
                'ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS target_owner_id INTEGER REFERENCES users(id)',
                'UPDATE exchanges SET target_owner_id = books.owner_id FROM books WHERE exchanges.target_book_id = books.id AND exchanges.target_owner_id IS NULL',
                'ALTER TABLE exchanges ALTER COLUMN target_owner_id SET NOT NULL',
            ):
                connection.execute(text(statement))
            connection.execute(text('INSERT INTO schema_migrations(version) VALUES (1)'))
        if not connection.execute(text('SELECT 1 FROM schema_migrations WHERE version = 2')).scalar():
            connection.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE'))
            connection.execute(text('INSERT INTO schema_migrations(version) VALUES (2)'))
