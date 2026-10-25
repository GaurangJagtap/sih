from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user
from app.models.entities import User, AuditEvent
from app.schemas.schemas import LoginRequest, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalars().first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account")

    token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})

    # Record login audit event
    audit = AuditEvent(
        actor_id=user.id,
        actor_name=user.full_name,
        actor_role=user.role,
        action="USER_LOGIN",
        target_entity="User",
        target_id=user.id,
        details={"email": user.email, "role": user.role}
    )
    db.add(audit)
    await db.commit()

    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        region=user.region,
        institution_id=user.institution_id
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
