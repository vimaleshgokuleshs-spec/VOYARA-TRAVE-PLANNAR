from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.destination import Destination
from backend.app.schemas import DestinationResponse

router = APIRouter(prefix="/destinations", tags=["Destinations"])

def format_destination(dest: Destination) -> DestinationResponse:
    return DestinationResponse(
        id=dest.id,
        name=dest.name,
        country=dest.country,
        description=dest.description,
        best_travel_months=dest.best_travel_months,
        estimated_daily_cost=round(dest.estimated_daily_cost / 100), # Convert cents to standard dollars
        image_url=dest.image_url,
        latitude=dest.latitude,
        longitude=dest.longitude
    )

@router.get("", response_model=List[DestinationResponse], summary="List all curated destinations")
def list_destinations(db: Session = Depends(get_db)):
    destinations = db.query(Destination).order_by(Destination.id).all()
    return [format_destination(d) for d in destinations]

@router.get("/{destination_id}", response_model=DestinationResponse, summary="Get single destination details")
def get_destination(destination_id: int, db: Session = Depends(get_db)):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination with ID {destination_id} not found."
        )
    return format_destination(dest)
