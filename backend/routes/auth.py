from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

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
    tags=["Authentication"],
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
    )
    new_password: str = Field(
        ...,
        min_length=8,
    )


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
async def register(user: UserCreate):

    email = str(user.email).strip().lower()

    existing_user = await users_collection.find_one(
        {
            "email": email,
        }
    )

    # -----------------------------------------------------
    # Existing verified account
    # -----------------------------------------------------

    if existing_user and existing_user.get(
        "is_verified",
        False,
    ):

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )


    # -----------------------------------------------------
    # Generate OTP
    # -----------------------------------------------------

    otp = generate_otp()

    password_hash = hash_password(
        user.password
    )

    now = datetime.now(
        timezone.utc
    )


    # -----------------------------------------------------
    # Existing unverified account
    # -----------------------------------------------------

    if existing_user:

        await users_collection.update_one(
            {
                "email": email,
            },
            {
                "$set": {
                    "name": user.name,
                    "password_hash": password_hash,
                    "is_verified": False,
                    "updated_at": now,
                }
            },
        )


    # -----------------------------------------------------
    # New account
    # -----------------------------------------------------

    else:

        await users_collection.insert_one(
            {
                "name": user.name,
                "email": email,
                "password_hash": password_hash,
                "is_verified": False,
                "plan": "free",
                "token_usage": 0,
                "token_usage_month": now.strftime("%Y-%m"),
                "created_at": now,
                "updated_at": now,
            }
        )


    # -----------------------------------------------------
    # Save OTP
    # -----------------------------------------------------

    await save_otp(
        email,
        otp,
    )


    # -----------------------------------------------------
    # Send OTP
    # -----------------------------------------------------

    try:
        await send_otp_email(
            recipient_email=email,
            recipient_name=user.name,
            otp=otp,
        )
    except Exception as error:
        await clear_otp(email)
        print("Signup verification email failed:", str(error))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We could not send the verification email. Please try again.",
        ) from error


    return {
        "message": (
            "Verification OTP sent "
            "to your email."
        ),
        "email": email,
    }


# =========================================================
# VERIFY SIGNUP OTP
# =========================================================

@router.post("/verify-otp")
async def verify_user_otp(
    data: OTPVerify,
):

    email = str(data.email).strip().lower()

    user = await users_collection.find_one(
        {
            "email": email,
        }
    )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )


    if user.get("is_verified"):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Account is already verified."
            ),
        )


    # -----------------------------------------------------
    # Verify OTP
    # -----------------------------------------------------

    is_valid = await verify_otp(
        email,
        data.otp,
    )

    if not is_valid:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid or expired OTP."
            ),
        )


    # -----------------------------------------------------
    # Verify account
    # -----------------------------------------------------

    await users_collection.update_one(
        {
            "email": email,
        },
        {
            "$set": {
                "is_verified": True,
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )


    # -----------------------------------------------------
    # Remove OTP
    # -----------------------------------------------------

    await clear_otp(
        email
    )


    return {
        "message": (
            "Email verified successfully."
        )
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
async def login(
    user: UserLogin,
):

    email = str(user.email).strip().lower()

    existing_user = await users_collection.find_one(
        {
            "email": email,
        }
    )


    # -----------------------------------------------------
    # User not found
    # -----------------------------------------------------

    if not existing_user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid email or password."
            ),
        )


    # -----------------------------------------------------
    # Email not verified
    # -----------------------------------------------------

    if not existing_user.get(
        "is_verified",
        False,
    ):

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Please verify your email "
                "before logging in."
            ),
        )


    # -----------------------------------------------------
    # Verify password
    # -----------------------------------------------------

    password_valid = verify_password(
        user.password,
        existing_user["password_hash"],
    )

    if not password_valid:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid email or password."
            ),
        )


    # -----------------------------------------------------
    # Create JWT
    # -----------------------------------------------------

    access_token = create_access_token(
        {
            "sub": str(
                existing_user["_id"]
            ),
            "email": existing_user["email"],
        }
    )


    return {
        "message": "Login successful.",

        "access_token": access_token,

        "token_type": "bearer",

        "user": {
            "id": str(
                existing_user["_id"]
            ),
            "name": existing_user["name"],
            "email": existing_user["email"],
            "is_verified": existing_user[
                "is_verified"
            ],
            "plan": existing_user.get(
                "plan",
                "free",
            ),
            "subscription_status": existing_user.get(
                "subscription_status"
            ),
        },
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
):

    email = str(data.email).strip().lower()

    user = await users_collection.find_one(
        {
            "email": email,
        }
    )


    # -----------------------------------------------------
    # Don't reveal whether an account exists.
    # -----------------------------------------------------

    if not user:

        return {
            "message": (
                "If an account exists with "
                "this email, a password reset "
                "OTP has been sent."
            )
        }


    # -----------------------------------------------------
    # Only verified users can reset password
    # -----------------------------------------------------

    if not user.get(
        "is_verified",
        False,
    ):

        return {
            "message": (
                "If an account exists with "
                "this email, a password reset "
                "OTP has been sent."
            )
        }


    # -----------------------------------------------------
    # Generate reset OTP
    # -----------------------------------------------------

    otp = generate_otp()


    # -----------------------------------------------------
    # Save OTP
    # -----------------------------------------------------

    await save_otp(
        email,
        otp,
    )


    # -----------------------------------------------------
    # Send reset OTP
    # -----------------------------------------------------

    try:
        await send_otp_email(
            recipient_email=email,
            recipient_name=user.get(
                "name",
                "Meridian User",
            ),
            otp=otp,
            purpose="password_reset",
        )
    except Exception as error:
        await clear_otp(email)
        print("Password reset email failed:", str(error))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="We could not send the reset email. Please try again.",
        ) from error


    return {
        "message": (
            "If an account exists with "
            "this email, a password reset "
            "OTP has been sent."
        )
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
):

    email = str(data.email).strip().lower()
    otp = data.otp.strip()

    user = await users_collection.find_one(
        {
            "email": email,
        }
    )


    if not user:

        print("Password reset rejected: account not found")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid or expired reset OTP."
            ),
        )


    if not user.get(
        "is_verified",
        False,
    ):

        print("Password reset rejected: account is not verified")

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Account email is not verified."
            ),
        )


    # -----------------------------------------------------
    # Verify reset OTP
    # -----------------------------------------------------

    is_valid = await verify_otp(
        email,
        otp,
    )

    if not is_valid:

        print(
            "Password reset rejected: invalid or expired OTP",
            {
                "has_saved_otp": bool(user.get("otp")),
                "submitted_length": len(otp),
                "saved_length": len(str(user.get("otp", ""))),
            },
        )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid or expired reset OTP."
            ),
        )


    # -----------------------------------------------------
    # Hash new password
    # -----------------------------------------------------

    new_password_hash = hash_password(
        data.new_password
    )


    # -----------------------------------------------------
    # Update password
    # -----------------------------------------------------

    await users_collection.update_one(
        {
            "email": email,
        },
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.now(
                    timezone.utc
                ),
            }
        },
    )


    # -----------------------------------------------------
    # Clear OTP
    # -----------------------------------------------------

    await clear_otp(
        email
    )


    return {
        "message": (
            "Password reset successfully."
        )
    }