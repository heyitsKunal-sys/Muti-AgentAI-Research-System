from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)



class UserInDB(BaseModel):
    name: str
    email: EmailStr
    password_hash: str
    is_verified: bool = False

    otp: str | None = None
    otp_expires_at: datetime | None = None

    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_verified: bool
    created_at: datetime
    updated_at: datetime
