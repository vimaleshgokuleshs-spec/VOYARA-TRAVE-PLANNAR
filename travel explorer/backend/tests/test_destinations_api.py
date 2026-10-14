import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.seed.seeder import seed_destinations
from backend.app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_destinations(db)
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_get_all_destinations(client):
    """Verify that all 8 seeded destinations are retrieved with whole dollar pricing."""
    res = client.get("/api/destinations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 8
    
    first = data[0]
    assert first["id"] == 1
    assert first["name"] == "Bora Bora"
    assert first["country"] == "French Polynesia"
    assert first["estimated_daily_cost"] == 380 # $380.00 converted from 38000 cents
    assert "https://" in first["image_url"]


def test_get_single_destination(client):
    """Verify retrieving a single destination by ID."""
    res = client.get("/api/destinations/2")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 2
    assert data["name"] == "Amalfi Coast"
    assert data["estimated_daily_cost"] == 260 # $260.00 converted from 26000 cents


def test_get_nonexistent_destination(client):
    """Verify 404 for nonexistent destination ID."""
    res = client.get("/api/destinations/999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
