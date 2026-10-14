from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.destination import Destination
from backend.app.models.trip import Trip
from backend.app.models.itinerary import ItineraryDay, Activity
from backend.app.models.favorite import Favorite

__all__ = [
    "Base",
    "User",
    "Destination",
    "Trip",
    "ItineraryDay",
    "Activity",
    "Favorite",
]
