import random
from datetime import datetime, timedelta, timezone

from backend.database import users_collection


OTP_EXPIRY_MINUTES = 10


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def get_otp_expiry() -> datetime:
    return datetime.now(timezone.utc) + timedelta(
        minutes=OTP_EXPIRY_MINUTES
    )


async def save_otp(email: str, otp: str):
    expiry = get_otp_expiry()

    await users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "otp": otp,
                "otp_expires_at": expiry,
            }
        },
    )


async def verify_otp(email: str, otp: str) -> bool:
    user = await users_collection.find_one(
        {"email": email}
    )

    if not user:
        return False

    saved_otp = user.get("otp")
    otp_expires_at = user.get("otp_expires_at")

    if not saved_otp or not otp_expires_at:
        return False

    # MongoDB may return a naive datetime.
    # Treat it as UTC.
    if otp_expires_at.tzinfo is None:
        otp_expires_at = otp_expires_at.replace(
            tzinfo=timezone.utc
        )

    now = datetime.now(timezone.utc)

    # Check expiry
    if now > otp_expires_at:
        return False

    # Check OTP
    if saved_otp != otp:
        return False

    return True


async def clear_otp(email: str):
    await users_collection.update_one(
        {"email": email},
        {
            "$unset": {
                "otp": "",
                "otp_expires_at": "",
            }
        },
    )