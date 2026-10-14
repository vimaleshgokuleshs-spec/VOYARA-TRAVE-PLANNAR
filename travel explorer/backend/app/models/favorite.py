from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    destination_id = Column(Integer, ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Unique constraint on user_id + destination_id
    __table_args__ = (
        UniqueConstraint("user_id", "destination_id", name="uq_user_destination_favorite"),
    )

    # Relationships
    user = relationship("User", back_populates="favorites")
    destination = relationship("Destination", back_populates="favorites")

    def __repr__(self):
        return f"<Favorite id={self.id} user_id={self.user_id} destination_id={self.destination_id}>"
