from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
)

from backend.database import users_collection

from backend.models.user import (
    UserCreate,
    OTPVerify,
    UserLogin,
)

from backend.services.email_service import send_otp_email

from backend.services.otp_service import (
    generate_otp,
    save_otp,
    verify_otp,
    clear_otp,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# --------------------------------------------------
# REGISTER
# --------------------------------------------------

@router.post("/register")
async def register(user: UserCreate):

    # Check if user already exists
    existing_user = await users_collection.find_one(
        {"email": user.email}
    )

    # If already verified, don't create another account
    if existing_user and existing_user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists."
        )

    # Generate OTP
    otp = generate_otp()

    # Hash password
    password_hash = hash_password(user.password)

    # Current time
    now = datetime.now(timezone.utc)

    # Existing unverified user
    if existing_user:

        await users_collection.update_one(
            {"email": user.email},
            {
                "$set": {
                    "name": user.name,
                    "password_hash": password_hash,
                    "is_verified": False,
                    "updated_at": now,
                }
            },
        )

    # New user
    else:

        await users_collection.insert_one(
            {
                "name": user.name,
                "email": user.email,
                "password_hash": password_hash,
                "is_verified": False,
                "created_at": now,
                "updated_at": now,
            }
        )

    # Save OTP
    await save_otp(
        user.email,
        otp
    )

    # Send OTP email
    await send_otp_email(
        recipient_email=user.email,
        recipient_name=user.name,
        otp=otp,
    )

    return {
        "message": "Verification OTP sent to your email.",
        "email": user.email,
    }


# --------------------------------------------------
# VERIFY OTP
# --------------------------------------------------

@router.post("/verify-otp")
async def verify_user_otp(data: OTPVerify):

    # Find user
    user = await users_collection.find_one(
        {"email": data.email}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    # Check if already verified
    if user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is already verified."
        )

    # Verify OTP
    is_valid = await verify_otp(
        data.email,
        data.otp
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP."
        )

    # Mark account as verified
    await users_collection.update_one(
        {"email": data.email},
        {
            "$set": {
                "is_verified": True,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    # Remove OTP
    await clear_otp(data.email)

    return {
        "message": "Email verified successfully."
    }


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@router.post("/login")
async def login(user: UserLogin):

    # Find user by email
    existing_user = await users_collection.find_one(
        {"email": user.email}
    )

    # Don't reveal whether the email exists
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # User must verify email first
    if not existing_user.get("is_verified"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in."
        )

    # Verify password
    password_valid = verify_password(
        user.password,
        existing_user["password_hash"]
    )

    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Create JWT access token
    access_token = create_access_token(
        {
            "sub": str(existing_user["_id"]),
            "email": existing_user["email"],
        }
    )

    return {
        "message": "Login successful.",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(existing_user["_id"]),
            "name": existing_user["name"],
            "email": existing_user["email"],
            "is_verified": existing_user["is_verified"],
        }
    }