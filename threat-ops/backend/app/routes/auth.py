import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import hash_password, require_user
from app.models import User
from app.schemas import MessageResponse, PasswordChangeRequest, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(
        username=body.username,
        password_hash=hash_password(body.password),
        token=secrets.token_hex(32),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=UserResponse)
async def login(body: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user or user.password_hash != hash_password(body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return user


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: PasswordChangeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user),
):
    if current_user.password_hash != hash_password(body.old_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if body.old_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must differ from the current one")

    current_user.password_hash = hash_password(body.new_password)
    await db.commit()
    return MessageResponse(message="Password updated")
