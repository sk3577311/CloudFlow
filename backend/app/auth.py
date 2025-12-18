from fastapi import APIRouter, HTTPException, Depends, Security, status,Header
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from pydantic import BaseModel
import secrets
import time
from typing import Optional
from datetime import datetime,timedelta

from app.redis_client import redis_client

from .database import get_db
from .models import User
from .config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])

# --------------------------------------
# CONFIG
# --------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = settings.JWT_SECRET
JWT_ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# --------------------------------------
# SCHEMAS
# --------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str

class RegisterResponse(BaseModel):
    username: str
    api_key: str

# --------------------------------------
# API KEY DEPENDENCY
# --------------------------------------
api_key_header = APIKeyHeader(name="x-api-key", auto_error=True)

async def verify_api_key(x_api_key: str = Security(api_key_header)):
    """
    Verify API key header for secured routes.
    """
    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key"
        )
    return True

# --------------------------------------
# JWT UTILITIES
# --------------------------------------
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(db: Session = Depends(get_db), token: str = None):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_optional(db: Session = Depends(get_db), token: Optional[str] = None) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        username = payload.get("sub")
        if not username:
            return None
        return db.query(User).filter(User.username == username).first()
    except Exception:
        return None

# --------------------------------------
# ROUTES
# --------------------------------------
@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = pwd_context.hash(payload.password)
    api_key = secrets.token_hex(16)  # 32 chars

    user = User(username=payload.username, password_hash=hashed_pw, api_key=api_key)
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(username=user.username, api_key=user.api_key)

@router.post("/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.username})
    return {
        "access_token": token,
        "token_type": "bearer",
        "api_key": user.api_key,
        "username": user.username
    }

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = authorization.split(" ", 1)[1]

    try:
        # If you have the token expiry, set TTL accordingly. Here we set a 1 hour fallback.
        await redis_client.setex(f"blacklist:{token}", 3600, "1")
    except Exception as e:
        # Log and return 500 — you can optionally fallback to client-side logout instead of failing
        # (but failing explicitly helps detect issues).
        # Replace print with your logger as needed.
        print("redis setex failed:", e)
        raise HTTPException(status_code=500, detail="Failed to record logout")

    return {"message": "Logged out"}