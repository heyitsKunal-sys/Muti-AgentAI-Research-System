from datetime import datetime, timedelta, timezone

from fastapi import (
    Depends,
    HTTPException,
    status,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from jose import (
    JWTError,
    jwt,
)

from passlib.context import CryptContext

from backend.config import (
    SECRET_KEY,
    ALGORITHM,
)


# =========================================================
# PASSWORD HASHING
# =========================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# =========================================================
# PASSWORD HELPERS
# =========================================================

def hash_password(password: str) -> str:
    """
    Hash a user's password using bcrypt.
    """

    return pwd_context.hash(
        password
    )


def verify_password(
    password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain password against
    its bcrypt hash.
    """

    return pwd_context.verify(
        password,
        hashed_password,
    )


# =========================================================
# JWT CONFIGURATION
# =========================================================

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# =========================================================
# CREATE ACCESS TOKEN
# =========================================================

def create_access_token(
    data: dict,
    expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> str:
    """
    Create a signed JWT access token.
    """

    payload = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=expires_minutes
        )
    )

    payload.update(
        {
            "exp": expire,
        }
    )

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# =========================================================
# HTTP BEARER
# =========================================================

security = HTTPBearer(
    auto_error=True
)


# =========================================================
# GET CURRENT USER
# =========================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
):
    """
    Extract and validate the JWT from:

    Authorization: Bearer <token>

    Returns the authenticated user's ID.
    """

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = payload.get(
            "sub"
        )

        if not user_id:

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=(
                    "Invalid authentication token."
                ),
                headers={
                    "WWW-Authenticate": "Bearer"
                },
            )

        return user_id

    except JWTError:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Invalid or expired "
                "authentication token."
            ),
            headers={
                "WWW-Authenticate": "Bearer"
            },
        )