from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="RESTRICT"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    travellers = Column(Integer, default=1, nullable=False)
    # Stored in integer minor units (cents): e.g. $3,500.00 = 350000
    budget = Column(Integer, nullable=False)
    status = Column(String(50), default="Draft", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="trips")
    destination = relationship("Destination", back_populates="trips")
    itinerary_days = relationship(
        "ItineraryDay",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="ItineraryDay.day_number",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<Trip id={self.id} title='{self.title}' status='{self.status}'>"
