from datetime import datetime, date
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

# ==============================================================================
# AUTH SCHEMAS
# ==============================================================================
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120, description="User's full name")
    email: EmailStr = Field(..., description="Valid unique email address")
    password: str = Field(..., min_length=8, max_length=72, description="Password (at least 8 characters)")

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Full name must contain at least 2 non-whitespace characters.")
        return cleaned

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., min_length=1, description="Account password")
    remember: bool = Field(default=True, description="Remember session for 30 days")

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    created_at: Optional[datetime] = None

class AuthSuccessResponse(BaseModel):
    user: UserResponse
    token: str
    message: str

class MessageResponse(BaseModel):
    message: str


# ==============================================================================
# DESTINATION SCHEMAS
# ==============================================================================
class DestinationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: str
    description: str
    best_travel_months: str
    estimated_daily_cost: int # In whole USD dollars for frontend
    image_url: str
    latitude: float
    longitude: float


# ==============================================================================
# ITINERARY & ACTIVITY SCHEMAS
# ==============================================================================
class ActivitySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(default="Culture", max_length=50)
    cost: int = Field(default=0, ge=0) # Whole dollars
    time: Optional[str] = "10:00 AM"
    desc: Optional[str] = None
    sort_order: int = 0

class ItineraryDaySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    day_number: int = Field(..., ge=1)
    date: Optional[str] = None
    notes: Optional[str] = None
    activities: List[ActivitySchema] = []


# ==============================================================================
# TRIP SCHEMAS
# ==============================================================================
class TripCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    destination_id: int
    start_date: str # YYYY-MM-DD
    end_date: str # YYYY-MM-DD
    travellers: int = Field(default=2, ge=1, le=50)
    budget: int = Field(default=1000, ge=0) # In whole USD dollars
    status: str = Field(default="Draft", max_length=50)
    days: Optional[List[ItineraryDaySchema]] = None

class TripUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    destination_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travellers: Optional[int] = Field(None, ge=1, le=50)
    budget: Optional[int] = Field(None, ge=0) # In whole USD dollars
    status: Optional[str] = Field(None, max_length=50)

class TripSync(BaseModel):
    title: Optional[str] = None
    destination_id: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    travellers: Optional[int] = None
    budget: Optional[int] = None # In whole USD dollars
    status: Optional[str] = None
    days: List[ItineraryDaySchema] = []

class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    destination_id: int
    destination_name: str
    destination_img: str
    start_date: str
    end_date: str
    travellers: int
    budget: int # In whole USD dollars
    status: str
    days_count: int
    days: List[ItineraryDaySchema] = []
    created_at: Optional[datetime] = None


# ==============================================================================
# FAVORITE SCHEMAS
# ==============================================================================
class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    destination_id: int
    destination: DestinationResponse
    created_at: Optional[datetime] = None
