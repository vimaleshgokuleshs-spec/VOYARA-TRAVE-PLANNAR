from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.auth import get_current_user
from backend.app.models.user import User
from backend.app.models.destination import Destination
from backend.app.models.favorite import Favorite
from backend.app.schemas import FavoriteResponse, MessageResponse, DestinationResponse
from backend.app.routes.destination_routes import format_destination

router = APIRouter(prefix="/favorites", tags=["Favorites & Wishlist"])

@router.get("", response_model=List[FavoriteResponse], summary="List authenticated user's wishlist favorites")
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favs = db.query(Favorite).filter(Favorite.user_id == current_user.id).order_by(Favorite.created_at.desc()).all()
    results = []
    for f in favs:
        dest = db.query(Destination).filter(Destination.id == f.destination_id).first()
        if dest:
            results.append(FavoriteResponse(
                id=f.id,
                destination_id=f.destination_id,
                destination=format_destination(dest),
                created_at=f.created_at
            ))
    return results

@router.post("/{destination_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED, summary="Add destination to wishlist")
def add_favorite(
    destination_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    dest = db.query(Destination).filter(Destination.id == destination_id).first()
    if not dest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Destination with ID {destination_id} does not exist."
        )

    # Check for existing favorite (idempotency)
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.destination_id == destination_id
    ).first()

    if existing:
        return FavoriteResponse(
            id=existing.id,
            destination_id=existing.destination_id,
            destination=format_destination(dest),
            created_at=existing.created_at
        )

    fav = Favorite(user_id=current_user.id, destination_id=destination_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)

    return FavoriteResponse(
        id=fav.id,
        destination_id=fav.destination_id,
        destination=format_destination(dest),
        created_at=fav.created_at
    )

@router.delete("/{destination_id}", response_model=MessageResponse, summary="Remove destination from wishlist")
def remove_favorite(
    destination_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fav = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.destination_id == destination_id
    ).first()

    if fav:
        db.delete(fav)
        db.commit()

    return MessageResponse(message="Removed from Saved Horizons wishlist")
