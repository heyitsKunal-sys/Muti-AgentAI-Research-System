import stripe

from backend.config import (
    STRIPE_SECRET_KEY,
    STRIPE_PRICE_ID,
)


# =========================================================
# STRIPE CONFIGURATION
# =========================================================

stripe.api_key = STRIPE_SECRET_KEY


# =========================================================
# CREATE CHECKOUT SESSION
# =========================================================

def create_checkout_session(
    user_id: str,
    customer_email: str,
    success_url: str,
    cancel_url: str,
):
    """
    Create a Stripe Checkout Session for the
    Meridian Premium subscription.
    """

    if not STRIPE_SECRET_KEY:
        raise ValueError(
            "Stripe secret key is not configured."
        )

    if not STRIPE_PRICE_ID:
        raise ValueError(
            "Stripe price ID is not configured."
        )

    session = stripe.checkout.Session.create(
        mode="subscription",

        line_items=[
            {
                "price": STRIPE_PRICE_ID,
                "quantity": 1,
            }
        ],

        customer_email=customer_email,

        client_reference_id=user_id,

        success_url=success_url,

        cancel_url=cancel_url,

        metadata={
            "user_id": user_id,
        },

        subscription_data={
            "metadata": {
                "user_id": user_id,
            }
        },
    )

    return {
        "session_id": session.id,
        "checkout_url": session.url,
    }


def get_checkout_session(session_id: str):
    """Retrieve a Checkout Session after Stripe redirects the user."""

    if not STRIPE_SECRET_KEY:
        raise ValueError(
            "Stripe secret key is not configured."
        )

    return stripe.checkout.Session.retrieve(
        session_id,
    )


def create_customer_portal_session(
    customer_id: str,
    return_url: str,
):
    """Create a Stripe Billing Portal session for a customer."""

    if not STRIPE_SECRET_KEY:
        raise ValueError(
            "Stripe secret key is not configured."
        )

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )

    return {
        "portal_url": session.url,
    }