from sqlalchemy import Column, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False, index=True)
    country = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=False)
    best_travel_months = Column(String(120), nullable=False)
    # Stored in integer minor units (cents) to eliminate float precision errors: e.g. $260.00 = 26000
    estimated_daily_cost = Column(Integer, nullable=False)
    image_url = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    # Relationships
    trips = relationship("Trip", back_populates="destination")
    favorites = relationship("Favorite", back_populates="destination", cascade="all, delete-orphan", passive_deletes=True)

    def __repr__(self):
        return f"<Destination id={self.id} name='{self.name}' country='{self.country}'>"
