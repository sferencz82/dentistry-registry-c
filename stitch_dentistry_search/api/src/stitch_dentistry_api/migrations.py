from __future__ import annotations

from sqlmodel import Session

from . import models  # noqa: F401 - ensures models are registered
from .db import create_db_and_tables, engine
from .models import SchemaMigration


CORE_MIGRATION = "0001_core_tables"


def run_migrations() -> None:
    """Apply idempotent schema migrations for the embedded SQLite database."""

    create_db_and_tables()
    with Session(engine) as session:
        existing = session.get(SchemaMigration, CORE_MIGRATION)
        if existing:
            return

        migration = SchemaMigration(version=CORE_MIGRATION)
        session.add(migration)
        session.commit()
