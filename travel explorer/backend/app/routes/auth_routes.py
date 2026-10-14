from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.auth import (
    hash_password,
    verify_password,
    create_session_token,
    get_current_user
)
from backend.app.schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    AuthSuccessResponse,
    MessageResponse
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register",
    response_model=AuthSuccessResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new explorer account"
)
def register_user(
    request: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    # 1. Duplicate email check (case-insensitive)
    existing_user = db.query(User).filter(
        func.lower(User.email) == request.email.lower()
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # 2. Hash password with bcrypt (never store plaintext)
    hashed_pwd = hash_password(request.password)

    # 3. Create user record
    new_user = User(
        full_name=request.full_name,
        email=request.email.lower(),
        password_hash=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Create secure signed session token
    token = create_session_token(new_user.id, new_user.email, remember=True)

    # 5. Set HTTP-only session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=settings.SESSION_MAX_AGE,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return AuthSuccessResponse(
        user=UserResponse.model_validate(new_user),
        token=token,
        message="Account created successfully"
    )

@router.post(
    "/login",
    response_model=AuthSuccessResponse,
    summary="Sign in with email and password"
)
def login_user(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    # 1. Look up user by email
    user = db.query(User).filter(
        func.lower(User.email) == request.email.lower()
    ).first()

    # 2. Verify password against bcrypt hash
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # 3. Create session token
    token = create_session_token(user.id, user.email, remember=request.remember)

    # 4. Set HTTP-only cookie
    max_age = settings.SESSION_MAX_AGE if request.remember else None
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/"
    )

    return AuthSuccessResponse(
        user=UserResponse.model_validate(user),
        token=token,
        message="Signed in successfully"
    )

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile"
)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)

@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out and invalidate session cookie"
)
def logout_user(response: Response):
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/"
    )
    return MessageResponse(message="Logged out successfully")
