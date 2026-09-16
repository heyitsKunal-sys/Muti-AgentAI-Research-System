import stripe

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from backend.config import (
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
)

from backend.database import users_collection


router = APIRouter(
    prefix="/api/stripe",
    tags=["Stripe"],
)


stripe.api_key = STRIPE_SECRET_KEY


def stripe_value(resource, key, default=None):
    """Read a field from either a Stripe resource or a plain mapping."""

    if isinstance(resource, dict):
        return resource.get(key, default)

    return getattr(resource, key, default)


# =========================================================
# HELPER
# =========================================================

async def update_user_subscription(
    user_id: str,
    subscription,
):
    """
    Update Meridian user's Stripe subscription information.
    """

    subscription_status = stripe_value(subscription, "status")

    current_period_end = stripe_value(subscription, "current_period_end")

    period_end = None

    if current_period_end:
        period_end = datetime.fromtimestamp(
            current_period_end,
            tz=timezone.utc,
        )

    is_active = subscription_status in {
        "active",
        "trialing",
    }

    await users_collection.update_one(
        {
            "_id": __import__("bson").ObjectId(user_id)
        },
        {
            "$set": {
                "plan": "premium" if is_active else "free",
                "stripe_customer_id": stripe_value(
                    subscription,
                    "customer",
                ),
                "stripe_subscription_id": stripe_value(
                    subscription,
                    "id",
                ),
                "subscription_status": subscription_status,
                "subscription_current_period_end": period_end,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )


# =========================================================
# STRIPE WEBHOOK
# =========================================================

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
):
    """
    Receive and process Stripe webhook events.
    """

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Stripe webhook secret is not configured.",
        )

    payload = await request.body()

    signature = request.headers.get(
        "stripe-signature"
    )

    if not signature:
        raise HTTPException(
            status_code=400,
            detail="Missing Stripe signature.",
        )

    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            STRIPE_WEBHOOK_SECRET,
        )

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload.",
        )

    except stripe.error.SignatureVerificationError:
        raise HTTPException(
            status_code=400,
            detail="Invalid Stripe webhook signature.",
        )

    # =====================================================
    # CHECKOUT COMPLETED
    # =====================================================

    if event["type"] == "checkout.session.completed":

        session = event["data"]["object"]

        metadata = stripe_value(session, "metadata", {})
        user_id = stripe_value(metadata, "user_id")

        subscription_id = stripe_value(session, "subscription")

        customer_id = stripe_value(session, "customer")

        if user_id:

            update_data = {
                "plan": "premium",
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "subscription_status": "active",
                "updated_at": datetime.now(timezone.utc),
            }

            try:
                from bson import ObjectId

                await users_collection.update_one(
                    {
                        "_id": ObjectId(user_id)
                    },
                    {
                        "$set": update_data
                    },
                )

            except Exception as error:
                print(
                    "Checkout user update error:",
                    str(error),
                )

    # =====================================================
    # SUBSCRIPTION UPDATED
    # =====================================================

    elif event["type"] == "customer.subscription.updated":

        subscription = event["data"]["object"]

        metadata = stripe_value(subscription, "metadata", {})
        user_id = stripe_value(metadata, "user_id")

        if user_id:

            try:
                await update_user_subscription(
                    user_id=user_id,
                    subscription=subscription,
                )

            except Exception as error:
                print(
                    "Subscription update error:",
                    str(error),
                )

    # =====================================================
    # SUBSCRIPTION DELETED
    # =====================================================

    elif event["type"] == "customer.subscription.deleted":

        subscription = event["data"]["object"]

        metadata = stripe_value(subscription, "metadata", {})
        user_id = stripe_value(metadata, "user_id")

        if user_id:

            try:
                from bson import ObjectId

                await users_collection.update_one(
                    {
                        "_id": ObjectId(user_id)
                    },
                    {
                        "$set": {
                            "plan": "free",
                            "subscription_status": "canceled",
                            "subscription_current_period_end": None,
                            "updated_at": datetime.now(
                                timezone.utc
                            ),
                        }
                    },
                )

            except Exception as error:
                print(
                    "Subscription deletion error:",
                    str(error),
                )

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "received": True
    }