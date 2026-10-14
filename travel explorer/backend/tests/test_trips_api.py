import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.models.user import User
from backend.app.models.destination import Destination
from backend.app.models.trip import Trip
from backend.app.models.itinerary import ItineraryDay, Activity
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


def test_trips_unauthenticated(client):
    """Verify unauthenticated requests are rejected with HTTP 401."""
    res_list = client.get("/api/trips")
    assert res_list.status_code == 401

    res_create = client.post("/api/trips", json={
        "title": "Unauthorized Trip",
        "destination_id": 1,
        "start_date": "2026-07-01",
        "end_date": "2026-07-06"
    })
    assert res_create.status_code == 401


def test_trip_crud_and_cascade(client, db_session):
    """Verify full trip CRUD lifecycle and SQLite cascading deletion."""
    # 1. Register & authenticate
    client.post("/api/auth/register", json={
        "full_name": "Expedition Architect",
        "email": "architect@voyara.com",
        "password": "Password123!"
    })

    # 2. Create Trip with 2 days and 3 activities
    payload = {
        "title": "Bora Bora Lagoon Retreat",
        "destination_id": 1,
        "start_date": "2026-08-10",
        "end_date": "2026-08-16",
        "travellers": 2,
        "budget": 3500, # $3,500 USD
        "status": "Confirmed",
        "days": [
            {
                "day_number": 1,
                "date": "2026-08-10",
                "notes": "Arrival & Welcome",
                "activities": [
                    {"title": "Check-in Overwater Villa", "category": "Relaxation", "cost": 0, "time": "02:00 PM"},
                    {"title": "Sunset Motu Dinner", "category": "Culinary", "cost": 150, "time": "07:00 PM"}
                ]
            },
            {
                "day_number": 2,
                "date": "2026-08-11",
                "notes": "Snorkel Adventures",
                "activities": [
                    {"title": "Manta Ray Safari", "category": "Adventure", "cost": 120, "time": "09:30 AM"}
                ]
            }
        ]
    }

    res_create = client.post("/api/trips", json=payload)
    assert res_create.status_code == 201
    trip_data = res_create.json()
    trip_id = trip_data["id"]
    assert trip_data["title"] == "Bora Bora Lagoon Retreat"
    assert trip_data["budget"] == 3500
    assert len(trip_data["days"]) == 2
    assert len(trip_data["days"][0]["activities"]) == 2
    assert len(trip_data["days"][1]["activities"]) == 1

    # Verify database cents storage
    db_trip = db_session.query(Trip).filter_by(id=trip_id).first()
    assert db_trip.budget == 350000 # 3500 * 100 cents
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip_id).count() == 2
    assert db_session.query(Activity).count() == 3

    # 3. Read single trip
    res_get = client.get(f"/api/trips/{trip_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == trip_id

    # 4. Update trip metadata
    res_update = client.put(f"/api/trips/{trip_id}", json={
        "title": "Bora Bora Ultra Luxury Horizon",
        "budget": 4500,
        "travellers": 3
    })
    assert res_update.status_code == 200
    assert res_update.json()["title"] == "Bora Bora Ultra Luxury Horizon"
    assert res_update.json()["budget"] == 4500
    assert res_update.json()["travellers"] == 3

    # Verify in DB
    db_session.refresh(db_trip)
    assert db_trip.budget == 450000

    # 5. Delete trip & verify cascading deletion
    res_del = client.delete(f"/api/trips/{trip_id}")
    assert res_del.status_code == 200

    # Confirm cascade deletion
    assert db_session.query(Trip).filter_by(id=trip_id).first() is None
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip_id).count() == 0
    assert db_session.query(Activity).count() == 0


def test_itinerary_sync_no_duplicates(client, db_session):
    """Verify atomic itinerary sync replaces schedule without orphan or duplicate records."""
    client.post("/api/auth/register", json={
        "full_name": "Sync Master",
        "email": "sync@voyara.com",
        "password": "Password123!"
    })

    # Create empty initial trip
    res_create = client.post("/api/trips", json={
        "title": "Amalfi Explorer",
        "destination_id": 2,
        "start_date": "2026-09-01",
        "end_date": "2026-09-05",
        "budget": 2000
    })
    trip_id = res_create.json()["id"]

    # First sync: 2 days, 3 activities
    sync_payload_1 = {
        "title": "Amalfi Explorer Rev 1",
        "days": [
            {
                "day_number": 1,
                "notes": "Day 1 Notes",
                "activities": [
                    {"title": "Act 1", "category": "Culture", "cost": 50},
                    {"title": "Act 2", "category": "Culinary", "cost": 75}
                ]
            },
            {
                "day_number": 2,
                "notes": "Day 2 Notes",
                "activities": [
                    {"title": "Act 3", "category": "Adventure", "cost": 100}
                ]
            }
        ]
    }
    res_sync1 = client.post(f"/api/trips/{trip_id}/sync", json=sync_payload_1)
    assert res_sync1.status_code == 200
    assert len(res_sync1.json()["days"]) == 2
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip_id).count() == 2
    assert db_session.query(Activity).count() == 3

    # Second sync: Modify to 1 day with 1 activity
    sync_payload_2 = {
        "title": "Amalfi Streamlined",
        "days": [
            {
                "day_number": 1,
                "notes": "Consolidated Day",
                "activities": [
                    {"title": "Single Signature Activity", "category": "Relaxation", "cost": 150}
                ]
            }
        ]
    }
    res_sync2 = client.post(f"/api/trips/{trip_id}/sync", json=sync_payload_2)
    assert res_sync2.status_code == 200
    assert len(res_sync2.json()["days"]) == 1
    # Verify no duplicate or orphan rows
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip_id).count() == 1
    assert db_session.query(Activity).count() == 1


def test_user_trip_isolation_and_forbidden_access(client):
    """Verify User A cannot view, update, sync or delete User B's trip."""
    # User A creates a trip
    client.post("/api/auth/register", json={
        "full_name": "User Alpha",
        "email": "alpha_trips@voyara.com",
        "password": "Password123!"
    })
    res_a = client.post("/api/trips", json={
        "title": "Alpha Secret Journey",
        "destination_id": 3,
        "start_date": "2026-10-01",
        "end_date": "2026-10-06",
        "budget": 3000
    })
    trip_id = res_a.json()["id"]

    # User A logs out
    client.post("/api/auth/logout")
    client.cookies.clear()

    # User B logs in
    client.post("/api/auth/register", json={
        "full_name": "User Beta",
        "email": "beta_trips@voyara.com",
        "password": "Password123!"
    })

    # User B tries to view User A's trip -> 403 Forbidden
    res_b_view = client.get(f"/api/trips/{trip_id}")
    assert res_b_view.status_code == 403

    # User B tries to update User A's trip -> 403 Forbidden
    res_b_update = client.put(f"/api/trips/{trip_id}", json={"title": "Hacked Title"})
    assert res_b_update.status_code == 403

    # User B tries to sync User A's trip -> 403 Forbidden
    res_b_sync = client.post(f"/api/trips/{trip_id}/sync", json={"days": []})
    assert res_b_sync.status_code == 403

    # User B tries to delete User A's trip -> 403 Forbidden
    res_b_del = client.delete(f"/api/trips/{trip_id}")
    assert res_b_del.status_code == 403
