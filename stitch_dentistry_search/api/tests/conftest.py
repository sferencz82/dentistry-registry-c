import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"
os.environ.setdefault("API_DATABASE_URL", f"sqlite:///{TEST_DB_PATH}")


@pytest.fixture(scope="session", autouse=True)
def cleanup_db():
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    yield
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture()
def client():
    from stitch_dentistry_api.main import app

    return TestClient(app)
