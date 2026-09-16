import secrets
from datetime import datetime, timedelta, timezone

from backend.database import users_collection


# =========================================================
# CONFIGURATION
# =========================================================

OTP_EXPIRY_MINUTES = 10


# =========================================================
# GENERATE OTP
# =========================================================

def generate_otp() -> str:
    """
    Generate a cryptographically secure 6-digit OTP.
    """

    return f"{secrets.randbelow(1_000_000):06d}"


# =========================================================
# OTP EXPIRY
# =========================================================

def get_otp_expiry() -> datetime:
    """
    Return the UTC time at which the OTP expires.
    """

    return (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=OTP_EXPIRY_MINUTES
        )
    )


# =========================================================
# SAVE OTP
# =========================================================

async def save_otp(
    email: str,
    otp: str,
):
    """
    Save a new OTP and its expiry time.

    Saving a new OTP automatically replaces
    the previous OTP, making the previous one invalid.
    """

    expiry = get_otp_expiry()

    await users_collection.update_one(
        {
            "email": email,
        },
        {
            "$set": {
                "otp": otp,
                "otp_expires_at": expiry,
            }
        },
    )


# =========================================================
# VERIFY OTP
# =========================================================

async def verify_otp(
    email: str,
    otp: str,
) -> bool:
    """
    Verify that:

    1. User exists
    2. OTP exists
    3. OTP has not expired
    4. OTP matches
    """

    user = await users_collection.find_one(
        {
            "email": email,
        }
    )

    if not user:
        return False


    saved_otp = user.get(
        "otp"
    )

    otp_expires_at = user.get(
        "otp_expires_at"
    )


    # -----------------------------------------------------
    # OTP missing
    # -----------------------------------------------------

    if not saved_otp:
        return False

    if not otp_expires_at:
        return False


    # -----------------------------------------------------
    # MongoDB may return a naive datetime depending
    # on configuration. Treat it as UTC.
    # -----------------------------------------------------

    if otp_expires_at.tzinfo is None:

        otp_expires_at = (
            otp_expires_at.replace(
                tzinfo=timezone.utc
            )
        )


    # -----------------------------------------------------
    # Check expiry
    # -----------------------------------------------------

    now = datetime.now(
        timezone.utc
    )

    if now > otp_expires_at:

        return False


    # -----------------------------------------------------
    # Check OTP
    # -----------------------------------------------------

    if not secrets.compare_digest(
        str(saved_otp),
        str(otp),
    ):

        return False


    return True


# =========================================================
# CLEAR OTP
# =========================================================

async def clear_otp(
    email: str,
):
    """
    Remove the OTP after successful verification.

    This makes the OTP single-use.
    """

    await users_collection.update_one(
        {
            "email": email,
        },
        {
            "$unset": {
                "otp": "",
                "otp_expires_at": "",
            }
        },
    )