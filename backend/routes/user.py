from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from backend.auth import get_current_user
from backend.database import users_collection
from backend.services.usage_service import TOKEN_LIMITS


router = APIRouter(
    prefix="/api/users",
    tags=["Users"],
)


# =========================================================
# CURRENT USER PROFILE
# =========================================================

@router.get("/me")
async def get_my_profile(
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Return the profile of the currently
    authenticated user.
    """

    # -----------------------------------------------------
    # Validate ObjectId
    # -----------------------------------------------------

    if not ObjectId.is_valid(
        current_user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID.",
        )


    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    user = await users_collection.find_one(
        {
            "_id": ObjectId(
                current_user_id
            )
        }
    )


    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )


    # -----------------------------------------------------
    # Return safe user data
    # -----------------------------------------------------

    return {
        "id": str(
            user["_id"]
        ),

        "name": user.get(
            "name",
            "",
        ),

        "email": user.get(
            "email",
            "",
        ),

        "is_verified": user.get(
            "is_verified",
            False,
        ),

        "plan": user.get(
            "plan",
            "free",
        ),

        "subscription_status": user.get(
            "subscription_status"
        ),

        "subscription_current_period_end": user.get(
            "subscription_current_period_end"
        ),

        "created_at": user.get(
            "created_at"
        ),

        "updated_at": user.get(
            "updated_at"
        ),
    }


@router.get("/usage")
async def get_my_usage(
    current_user_id: str = Depends(get_current_user),
):
    """Return the current monthly token usage and tier limit."""

    if not ObjectId.is_valid(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID.",
        )

    user = await users_collection.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    now = datetime.now(timezone.utc)
    usage_month = now.strftime("%Y-%m")
    plan = user.get("plan", "free")
    limit = TOKEN_LIMITS.get(plan, TOKEN_LIMITS["free"])
    used = user.get("token_usage", 0)

    if user.get("token_usage_month") != usage_month:
        used = 0

    next_month = (now.replace(day=28) + timedelta(days=4)).replace(day=1)

    return {
        "plan": plan,
        "used_tokens": min(max(0, used), limit),
        "token_limit": limit,
        "remaining_tokens": max(0, limit - used),
        "usage_month": usage_month,
        "resets_at": next_month,
        "subscription_status": user.get("subscription_status"),
        "subscription_current_period_end": user.get(
            "subscription_current_period_end"
        ),
    }