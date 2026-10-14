import datetime
import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from backend.app.models import User, Destination, Trip, ItineraryDay, Activity, Favorite
from backend.app.seed.seeder import seed_destinations

def test_table_creation(test_db_engine):
    """Verify that all 6 required tables are created in the SQLite database."""
    inspector = inspect(test_db_engine)
    table_names = inspector.get_table_names()
    
    expected_tables = {"users", "destinations", "trips", "itinerary_days", "activities", "favorites"}
    assert expected_tables.issubset(set(table_names)), f"Missing tables. Found: {table_names}"


def test_user_password_hash_only(db_session):
    """Verify user model stores password_hash only and not plaintext passwords."""
    user = User(
        full_name="Alexander Wright",
        email="alex@voyara.com",
        password_hash="$2b$12$e80yqR...mocked_hash_value..."
    )
    db_session.add(user)
    db_session.commit()

    saved_user = db_session.query(User).filter_by(email="alex@voyara.com").first()
    assert saved_user is not None
    assert saved_user.id is not None
    assert saved_user.password_hash.startswith("$2b$")
    assert not hasattr(saved_user, "password")


def test_unique_email_constraint(db_session):
    """Verify that duplicate user emails are strictly prohibited by SQLite constraint."""
    user1 = User(
        full_name="First User",
        email="duplicate@voyara.com",
        password_hash="hash1"
    )
    db_session.add(user1)
    db_session.commit()

    user2 = User(
        full_name="Second User",
        email="duplicate@voyara.com",
        password_hash="hash2"
    )
    db_session.add(user2)
    
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_destination_seeder_idempotency(db_session):
    """Verify destination seeder inserts records once and does not duplicate on repeat runs."""
    # First seed run
    count1 = seed_destinations(db_session)
    assert count1 == 8
    assert db_session.query(Destination).count() == 8

    # Second seed run (should be idempotent)
    count2 = seed_destinations(db_session)
    assert count2 == 0
    assert db_session.query(Destination).count() == 8


def test_favorites_unique_constraint(db_session):
    """Verify a user cannot favorite the exact same destination more than once."""
    seed_destinations(db_session)
    dest = db_session.query(Destination).first()

    user = User(full_name="Explorer", email="explorer@voyara.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    fav1 = Favorite(user_id=user.id, destination_id=dest.id)
    db_session.add(fav1)
    db_session.commit()

    fav2 = Favorite(user_id=user.id, destination_id=dest.id)
    db_session.add(fav2)

    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_trip_cascade_delete(db_session):
    """Verify deleting a trip cascades to delete all its itinerary days and activities."""
    seed_destinations(db_session)
    dest = db_session.query(Destination).first()
    user = User(full_name="Traveler", email="traveler@voyara.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    # Create trip with 2 days and 3 activities
    trip = Trip(
        user_id=user.id,
        destination_id=dest.id,
        title="Amalfi Odyssey",
        start_date=datetime.date(2026, 6, 1),
        end_date=datetime.date(2026, 6, 5),
        travellers=2,
        budget=350000, # $3,500.00
        status="Confirmed"
    )
    db_session.add(trip)
    db_session.commit()

    day1 = ItineraryDay(trip_id=trip.id, day_number=1, notes="Arrival Day")
    day2 = ItineraryDay(trip_id=trip.id, day_number=2, notes="Boat Tour")
    db_session.add_all([day1, day2])
    db_session.commit()

    act1 = Activity(itinerary_day_id=day1.id, title="Check-in", category="Relaxation", estimated_cost=0, sort_order=1)
    act2 = Activity(itinerary_day_id=day1.id, title="Seafood Dinner", category="Culinary", estimated_cost=12000, sort_order=2)
    act3 = Activity(itinerary_day_id=day2.id, title="Gozzo Charter", category="Adventure", estimated_cost=18000, sort_order=1)
    db_session.add_all([act1, act2, act3])
    db_session.commit()

    # Verify entities exist
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip.id).count() == 2
    assert db_session.query(Activity).count() == 3

    # Delete the trip
    db_session.delete(trip)
    db_session.commit()

    # Verify cascading delete
    assert db_session.query(Trip).filter_by(id=trip.id).first() is None
    assert db_session.query(ItineraryDay).filter_by(trip_id=trip.id).count() == 0
    assert db_session.query(Activity).count() == 0


def test_user_cascade_delete(db_session):
    """Verify deleting a user cascades to delete their trips and favorites."""
    seed_destinations(db_session)
    dest = db_session.query(Destination).first()

    user = User(full_name="Deletable User", email="delete_me@voyara.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    trip = Trip(
        user_id=user.id,
        destination_id=dest.id,
        title="Solo Trek",
        start_date=datetime.date(2026, 7, 1),
        end_date=datetime.date(2026, 7, 3),
        travellers=1,
        budget=100000,
        status="Draft"
    )
    fav = Favorite(user_id=user.id, destination_id=dest.id)
    db_session.add_all([trip, fav])
    db_session.commit()

    assert db_session.query(Trip).filter_by(user_id=user.id).count() == 1
    assert db_session.query(Favorite).filter_by(user_id=user.id).count() == 1

    # Delete user
    db_session.delete(user)
    db_session.commit()

    assert db_session.query(Trip).filter_by(user_id=user.id).count() == 0
    assert db_session.query(Favorite).filter_by(user_id=user.id).count() == 0
    # Destination remains intact
    assert db_session.query(Destination).filter_by(id=dest.id).first() is not None


def test_relationships_navigation(db_session):
    """Verify bi-directional navigation of SQLAlchemy relationships."""
    seed_destinations(db_session)
    dest = db_session.query(Destination).filter_by(name="Kyoto").first()

    user = User(full_name="Kenji Sato", email="kenji@voyara.com", password_hash="hash")
    db_session.add(user)
    db_session.commit()

    trip = Trip(
        user=user,
        destination=dest,
        title="Kyoto Autumn",
        start_date=datetime.date(2026, 10, 1),
        end_date=datetime.date(2026, 10, 5),
        travellers=2,
        budget=200000,
        status="Confirmed"
    )
    day = ItineraryDay(trip=trip, day_number=1, notes="Temples walk")
    act = Activity(itinerary_day=day, title="Fushimi Inari", category="Culture", estimated_cost=2000, sort_order=1)

    db_session.add_all([trip, day, act])
    db_session.commit()

    # Reload from fresh query
    loaded_user = db_session.query(User).filter_by(email="kenji@voyara.com").first()
    assert len(loaded_user.trips) == 1
    assert loaded_user.trips[0].destination.name == "Kyoto"
    assert len(loaded_user.trips[0].itinerary_days) == 1
    assert loaded_user.trips[0].itinerary_days[0].activities[0].title == "Fushimi Inari"
    assert loaded_user.trips[0].itinerary_days[0].activities[0].itinerary_day.day_number == 1
