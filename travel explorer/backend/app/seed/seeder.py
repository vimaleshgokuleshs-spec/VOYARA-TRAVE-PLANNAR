import logging
from sqlalchemy.orm import Session
from backend.app.models.destination import Destination
from backend.app.seed.destinations_data import INITIAL_DESTINATIONS

logger = logging.getLogger(__name__)

def seed_destinations(db: Session) -> int:
    """
    Idempotent destination seeder.
    Only seeds if the destinations table is currently empty.
    Returns the number of destinations inserted (or 0 if already seeded).
    """
    existing_count = db.query(Destination).count()
    if existing_count > 0:
        logger.info(f"Destinations table already seeded with {existing_count} records. Skipping.")
        return 0

    inserted_count = 0
    for data in INITIAL_DESTINATIONS:
        dest = Destination(
            name=data["name"],
            country=data["country"],
            description=data["description"],
            best_travel_months=data["best_travel_months"],
            estimated_daily_cost=data["estimated_daily_cost"],
            image_url=data["image_url"],
            latitude=data["latitude"],
            longitude=data["longitude"],
        )
        db.add(dest)
        inserted_count += 1

    db.commit()
    logger.info(f"Successfully seeded {inserted_count} destinations.")
    return inserted_count
