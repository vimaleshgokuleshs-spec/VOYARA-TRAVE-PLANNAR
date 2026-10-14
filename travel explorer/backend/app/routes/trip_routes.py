from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.destination import Destination
from backend.app.models.trip import Trip
from backend.app.models.itinerary import ItineraryDay, Activity
from backend.app.schemas import (
    TripCreate,
    TripUpdate,
    TripSync,
    TripResponse,
    ItineraryDaySchema,
    ActivitySchema,
    MessageResponse
)

router = APIRouter(prefix="/trips", tags=["Trips & Itineraries"])

def parse_date(date_str: Optional[str]) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None

def format_trip(trip: Trip, db: Session) -> TripResponse:
    dest = trip.destination or db.query(Destination).filter(Destination.id == trip.destination_id).first()
    dest_name = f"{dest.name}, {dest.country}" if dest else "Unknown Destination"
    dest_img = dest.image_url if dest else ""

    days_list = []
    sorted_days = sorted(trip.itinerary_days or [], key=lambda d: d.day_number)
    for day in sorted_days:
        activities_list = []
        sorted_acts = sorted(day.activities or [], key=lambda a: a.sort_order)
        for act in sorted_acts:
            activities_list.append(ActivitySchema(
                id=act.id,
                title=act.title,
                category=act.category,
                cost=round(act.estimated_cost / 100), # cents to dollars
                time=act.start_time or "10:00 AM",
                desc=act.description,
                sort_order=act.sort_order
            ))
        days_list.append(ItineraryDaySchema(
            id=day.id,
            day_number=day.day_number,
            date=str(day.date) if day.date else None,
            notes=day.notes,
            activities=activities_list
        ))

    return TripResponse(
        id=trip.id,
        user_id=trip.user_id,
        title=trip.title,
        destination_id=trip.destination_id,
        destination_name=dest_name,
        destination_img=dest_img,
        start_date=str(trip.start_date),
        end_date=str(trip.end_date),
        travellers=trip.travellers,
        budget=round(trip.budget / 100), # cents to dollars
        status=trip.status,
        days_count=len(days_list) or 1,
        days=days_list,
        created_at=trip.created_at
    )


@router.get("", response_model=List[TripResponse], summary="List all saved trips for authenticated user")
def list_trips(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trips = db.query(Trip).filter(Trip.user_id == current_user.id).order_by(Trip.created_at.desc()).all()
    return [format_trip(t, db) for t in trips]


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED, summary="Create a new expedition")
def create_trip(
    request: TripCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify destination exists
    dest = db.query(Destination).filter(Destination.id == request.destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination with ID {request.destination_id} not found."
        )

    s_date = parse_date(request.start_date) or date.today()
    e_date = parse_date(request.end_date) or date.today()

    new_trip = Trip(
        user_id=current_user.id,
        destination_id=request.destination_id,
        title=request.title,
        start_date=s_date,
        end_date=e_date,
        travellers=request.travellers,
        budget=round(request.budget * 100), # dollars to cents
        status=request.status or "Draft"
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    # Add initial days & activities if provided
    if request.days:
        for day_data in request.days:
            itinerary_day = ItineraryDay(
                trip_id=new_trip.id,
                day_number=day_data.day_number,
                date=parse_date(day_data.date),
                notes=day_data.notes
            )
            db.add(itinerary_day)
            db.commit()
            db.refresh(itinerary_day)

            for idx, act_data in enumerate(day_data.activities or []):
                act = Activity(
                    itinerary_day_id=itinerary_day.id,
                    title=act_data.title,
                    category=act_data.category or "Culture",
                    estimated_cost=round((act_data.cost or 0) * 100),
                    start_time=act_data.time or "10:00 AM",
                    description=act_data.desc,
                    sort_order=act_data.sort_order if act_data.sort_order is not None else idx
                )
                db.add(act)
        db.commit()
        db.refresh(new_trip)

    return format_trip(new_trip, db)


@router.get("/{trip_id}", response_model=TripResponse, summary="Get full trip and itinerary details")
def get_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found."
        )
    # Enforce user ownership
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this trip."
        )
    return format_trip(trip, db)


@router.put("/{trip_id}", response_model=TripResponse, summary="Update trip parameters")
def update_trip(
    trip_id: int,
    request: TripUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found."
        )
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this trip."
        )

    if request.title is not None:
        trip.title = request.title
    if request.destination_id is not None:
        dest = db.query(Destination).filter(Destination.id == request.destination_id).first()
        if not dest:
            raise HTTPException(status_code=404, detail="Destination not found.")
        trip.destination_id = request.destination_id
    if request.start_date is not None:
        parsed = parse_date(request.start_date)
        if parsed:
            trip.start_date = parsed
    if request.end_date is not None:
        parsed = parse_date(request.end_date)
        if parsed:
            trip.end_date = parsed
    if request.travellers is not None:
        trip.travellers = request.travellers
    if request.budget is not None:
        trip.budget = round(request.budget * 100)
    if request.status is not None:
        trip.status = request.status

    db.commit()
    db.refresh(trip)
    return format_trip(trip, db)


@router.delete("/{trip_id}", response_model=MessageResponse, summary="Delete trip and all associated itinerary items")
def delete_trip(
    trip_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found."
        )
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this trip."
        )

    db.delete(trip)
    db.commit()
    return MessageResponse(message="Trip successfully deleted.")


@router.post("/{trip_id}/sync", response_model=TripResponse, summary="Atomically save and sync full itinerary hierarchy")
def sync_trip_itinerary(
    trip_id: int,
    sync_data: TripSync,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Trip with ID {trip_id} not found."
        )
    if trip.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this trip."
        )

    # Optional metadata updates
    if sync_data.title:
        trip.title = sync_data.title
    if sync_data.destination_id:
        trip.destination_id = sync_data.destination_id
    if sync_data.travellers:
        trip.travellers = sync_data.travellers
    if sync_data.budget is not None:
        trip.budget = round(sync_data.budget * 100)
    if sync_data.status:
        trip.status = sync_data.status
    if sync_data.start_date:
        parsed = parse_date(sync_data.start_date)
        if parsed:
            trip.start_date = parsed
    if sync_data.end_date:
        parsed = parse_date(sync_data.end_date)
        if parsed:
            trip.end_date = parsed

    # Delete existing days for this trip (cascades to activities)
    for existing_day in list(trip.itinerary_days):
        db.delete(existing_day)
    db.flush()

    # Insert incoming days and activities
    for day_in in sync_data.days:
        day_obj = ItineraryDay(
            trip_id=trip.id,
            day_number=day_in.day_number,
            date=parse_date(day_in.date),
            notes=day_in.notes
        )
        db.add(day_obj)
        db.flush()

        for idx, act_in in enumerate(day_in.activities or []):
            cost_cents = round((act_in.cost or 0) * 100)
            act_obj = Activity(
                itinerary_day_id=day_obj.id,
                title=act_in.title,
                category=act_in.category or "Culture",
                estimated_cost=cost_cents,
                start_time=act_in.time or "10:00 AM",
                description=act_in.desc,
                sort_order=act_in.sort_order if act_in.sort_order is not None else idx
            )
            db.add(act_obj)

    db.commit()
    db.refresh(trip)
    return format_trip(trip, db)
