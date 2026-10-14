import base64
import hashlib
import hmac
import json
import time
from typing import Optional
import bcrypt
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User

# Password Hashing using native bcrypt
def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with salt."""
    if not password:
        raise ValueError("Password cannot be empty")
    # bcrypt max password length is 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a stored bcrypt hash."""
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

# HMAC-SHA256 Signed Session Token
def create_session_token(user_id: int, email: str, remember: bool = True) -> str:
    """Creates a tamper-proof signed session token."""
    duration = settings.SESSION_MAX_AGE if remember else 3600 * 24 # 1 day if not remember
    expires_at = int(time.time()) + duration
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expires_at
    }
    payload_json = json.dumps(payload, separators=(',', ':'))
    payload_b64 = base64.urlsafe_b64encode(payload_json.encode('utf-8')).decode('utf-8').rstrip('=')
    
    # Sign payload
    signature = hmac.new(
        settings.SECRET_KEY.encode('utf-8'),
        payload_b64.encode('utf-8'),
        hashlib.sha256
    ).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode('utf-8').rstrip('=')
    
    return f"{payload_b64}.{sig_b64}"

def verify_session_token(token: str) -> Optional[dict]:
    """Validates token signature and expiration, returning the payload if valid."""
    if not token or "." not in token:
        return None
    try:
        payload_b64, sig_b64 = token.split('.', 1)
        # Verify signature
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode('utf-8'),
            payload_b64.encode('utf-8'),
            hashlib.sha256
        ).digest()
        
        # Add padding back if necessary
        sig_padding = 4 - (len(sig_b64) % 4)
        if sig_padding and sig_padding < 4:
            sig_b64 += "=" * sig_padding
            
        actual_sig = base64.urlsafe_b64decode(sig_b64.encode('utf-8'))
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        # Decode payload
        payload_padding = 4 - (len(payload_b64) % 4)
        if payload_padding and payload_padding < 4:
            payload_b64 += "=" * payload_padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
        data = json.loads(payload_bytes.decode('utf-8'))
        
        # Check expiration
        if data.get("exp", 0) < int(time.time()):
            return None
            
        return data
    except Exception:
        return None

def extract_token_from_request(request: Request) -> Optional[str]:
    """Extracts session token from HTTP-only cookie or Authorization header."""
    # 1. Cookie
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        return token
    # 2. Authorization Header: Bearer <token>
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()
    return None

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """FastAPI dependency to extract and verify authenticated user. Raises 401 if unauthenticated."""
    token = extract_token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this feature."
        )
    
    payload = verify_session_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this session no longer exists."
        )
    return user

def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """FastAPI dependency that returns the User if authenticated, or None if guest."""
    token = extract_token_from_request(request)
    if not token:
        return None
    payload = verify_session_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    return db.query(User).filter(User.id == user_id).first()
