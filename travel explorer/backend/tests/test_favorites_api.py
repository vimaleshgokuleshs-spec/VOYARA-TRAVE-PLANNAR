import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.models.destination import Destination
from backend.app.models.favorite import Favorite
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


def test_favorites_unauthenticated(client):
    """Verify unauthenticated requests are rejected with HTTP 401."""
    res_list = client.get("/api/favorites")
    assert res_list.status_code == 401

    res_add = client.post("/api/favorites/1")
    assert res_add.status_code == 401

    res_del = client.delete("/api/favorites/1")
    assert res_del.status_code == 401


def test_add_and_list_favorites(client):
    """Verify authenticated user can add destinations to wishlist and retrieve them."""
    # Register user
    reg = client.post("/api/auth/register", json={
        "full_name": "Wishlist Explorer",
        "email": "wishlist@voyara.com",
        "password": "Password123!"
    })
    assert reg.status_code == 201

    # Add Bora Bora (id 1) and Kyoto (id 3)
    res_add1 = client.post("/api/favorites/1")
    assert res_add1.status_code == 201
    assert res_add1.json()["destination_id"] == 1

    res_add2 = client.post("/api/favorites/3")
    assert res_add2.status_code == 201
    assert res_add2.json()["destination_id"] == 3

    # List favorites
    res_list = client.get("/api/favorites")
    assert res_list.status_code == 200
    favs = res_list.json()
    assert len(favs) == 2
    fav_dest_ids = [f["destination_id"] for f in favs]
    assert 1 in fav_dest_ids
    assert 3 in fav_dest_ids


def test_duplicate_favorite_idempotent(client, db_session):
    """Verify adding the same favorite twice is idempotent and does not create duplicate rows."""
    client.post("/api/auth/register", json={
        "full_name": "Unique Fav User",
        "email": "uniquefav@voyara.com",
        "password": "Password123!"
    })

    client.post("/api/favorites/2")
    client.post("/api/favorites/2") # Repeated call

    user = db_session.query(User).filter_by(email="uniquefav@voyara.com").first()
    count = db_session.query(Favorite).filter_by(user_id=user.id, destination_id=2).count()
    assert count == 1


def test_remove_favorite(client):
    """Verify removing a favorite deletes it from the wishlist."""
    client.post("/api/auth/register", json={
        "full_name": "Remove Fav User",
        "email": "removefav@voyara.com",
        "password": "Password123!"
    })

    client.post("/api/favorites/1")
    client.post("/api/favorites/2")

    del_res = client.delete("/api/favorites/1")
    assert del_res.status_code == 200

    list_res = client.get("/api/favorites")
    favs = list_res.json()
    assert len(favs) == 1
    assert favs[0]["destination_id"] == 2


def test_user_favorites_isolation(client):
    """Verify User A's favorites are completely invisible to User B."""
    # User A
    client.post("/api/auth/register", json={
        "full_name": "User Alpha",
        "email": "alpha@voyara.com",
        "password": "Password123!"
    })
    client.post("/api/favorites/1")
    client.post("/api/favorites/2")

    # Logout User A
    client.post("/api/auth/logout")
    client.cookies.clear()

    # User B
    client.post("/api/auth/register", json={
        "full_name": "User Beta",
        "email": "beta@voyara.com",
        "password": "Password123!"
    })

    # User B should have 0 favorites initially
    res_b = client.get("/api/favorites")
    assert res_b.status_code == 200
    assert len(res_b.json()) == 0

    # User B adds only destination 3
    client.post("/api/favorites/3")
    res_b_updated = client.get("/api/favorites")
    assert len(res_b_updated.json()) == 1
    assert res_b_updated.json()[0]["destination_id"] == 3
