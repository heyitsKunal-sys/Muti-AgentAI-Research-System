from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, HttpUrl

from backend.auth import get_current_user
from backend.database import users_collection
from backend.services.stripe_service import (
    create_customer_portal_session,
    create_checkout_session,
    get_checkout_session,
)


# =========================================================
# ROUTER
# =========================================================

router = APIRouter(
    prefix="/api/stripe",
    tags=["Stripe"],
)


# =========================================================
# CHECKOUT REQUEST
# =========================================================

class CheckoutRequest(BaseModel):

    success_url: HttpUrl

    cancel_url: HttpUrl


class CheckoutSyncRequest(BaseModel):

    session_id: str


class PortalRequest(BaseModel):

    return_url: HttpUrl


# =========================================================
# CREATE CHECKOUT SESSION
# =========================================================

@router.post("/create-checkout-session")
async def create_checkout(
    data: CheckoutRequest,
    current_user_id: str = Depends(get_current_user),
):
    """
    Create a Stripe Checkout Session for the
    currently authenticated user.
    """

    # -----------------------------------------------------
    # Find current user
    # -----------------------------------------------------

    from bson import ObjectId

    try:
        user = await users_collection.find_one(
            {
                "_id": ObjectId(current_user_id),
            }
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID.",
        )

    if not user:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    # -----------------------------------------------------
    # Already premium
    # -----------------------------------------------------

    if user.get("plan") == "premium":

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a Premium subscription.",
        )

    # -----------------------------------------------------
    # Create Stripe Checkout
    # -----------------------------------------------------

    try:

        checkout = create_checkout_session(
            user_id=current_user_id,
            customer_email=user["email"],
            success_url=str(data.success_url),
            cancel_url=str(data.cancel_url),
        )

        return checkout

    except Exception as error:

        print(
            "\nStripe Checkout error:",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create Stripe Checkout session.",
        )


@router.post("/sync-checkout-session")
async def sync_checkout_session(
    data: CheckoutSyncRequest,
    current_user_id: str = Depends(get_current_user),
):
    """Synchronize a completed Checkout Session for the current user."""

    from bson import ObjectId

    try:
        session = get_checkout_session(data.session_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not verify the Stripe Checkout session.",
        )

    metadata = getattr(session, "metadata", None)
    metadata_user_id = getattr(metadata, "user_id", None)

    if metadata_user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Checkout session does not belong to this user.",
        )

    if getattr(session, "payment_status", None) != "paid":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has not been completed.",
        )

    await users_collection.update_one(
        {"_id": ObjectId(current_user_id)},
        {
            "$set": {
                "plan": "premium",
                "stripe_customer_id": getattr(
                    session,
                    "customer",
                    None,
                ),
                "stripe_subscription_id": getattr(
                    session,
                    "subscription",
                    None,
                ),
                "subscription_status": "active",
            }
        },
    )

    return {"plan": "premium"}


@router.post("/customer-portal")
async def create_portal(
    data: PortalRequest,
    current_user_id: str = Depends(get_current_user),
):
    """Create a hosted Stripe page to manage billing."""

    from bson import ObjectId

    user = await users_collection.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    customer_id = user.get("stripe_customer_id") if user else None

    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe subscription is associated with this account.",
        )

    try:
        return create_customer_portal_session(
            customer_id=customer_id,
            return_url=str(data.return_url),
        )
    except Exception as error:
        print("\nStripe Customer Portal error:", str(error))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not open the billing portal.",
        )