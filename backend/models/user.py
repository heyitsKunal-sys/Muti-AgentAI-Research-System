from datetime import datetime

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
)


# =========================================================
# REGISTER
# =========================================================

class UserCreate(BaseModel):

    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# =========================================================
# VERIFY OTP
# =========================================================

class OTPVerify(BaseModel):

    email: EmailStr

    otp: str = Field(
        ...,
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
    )


# =========================================================
# LOGIN
# =========================================================

class UserLogin(BaseModel):

    email: EmailStr

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )


# =========================================================
# USER DATABASE MODEL
# =========================================================

class UserInDB(BaseModel):

    name: str

    email: EmailStr

    password_hash: str

    is_verified: bool = False

    otp: str | None = None

    otp_expires_at: datetime | None = None

    # =====================================================
    # STRIPE / SUBSCRIPTION
    # =====================================================

    plan: str = "free"

    stripe_customer_id: str | None = None

    stripe_subscription_id: str | None = None

    subscription_status: str | None = None

    subscription_current_period_end: datetime | None = None

    # =====================================================
    # TIMESTAMPS
    # =====================================================

    created_at: datetime

    updated_at: datetime


# =========================================================
# USER RESPONSE
# =========================================================

class UserResponse(BaseModel):

    id: str

    name: str

    email: EmailStr

    is_verified: bool

    # Stripe plan information
    plan: str = "free"

    subscription_status: str | None = None

    subscription_current_period_end: datetime | None = None

    created_at: datetime

    updated_at: datetime