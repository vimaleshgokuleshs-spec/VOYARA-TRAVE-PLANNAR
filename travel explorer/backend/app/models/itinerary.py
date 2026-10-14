from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ItineraryDay(Base):
    __tablename__ = "itinerary_days"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    day_number = Column(Integer, nullable=False)
    date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    trip = relationship("Trip", back_populates="itinerary_days")
    activities = relationship(
        "Activity",
        back_populates="itinerary_day",
        cascade="all, delete-orphan",
        order_by="Activity.sort_order",
        passive_deletes=True
    )

    def __repr__(self):
        return f"<ItineraryDay id={self.id} trip_id={self.trip_id} day_number={self.day_number}>"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    itinerary_day_id = Column(Integer, ForeignKey("itinerary_days.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False) # Culture, Adventure, Culinary, Relaxation
    # Stored in integer minor units (cents): e.g. $45.00 = 4500
    estimated_cost = Column(Integer, default=0, nullable=False)
    start_time = Column(String(20), nullable=True) # e.g. "09:00 AM"
    sort_order = Column(Integer, default=0, nullable=False)

    # Relationships
    itinerary_day = relationship("ItineraryDay", back_populates="activities")

    def __repr__(self):
        return f"<Activity id={self.id} title='{self.title}' category='{self.category}' cost={self.estimated_cost}>"
