from dotenv import load_dotenv
import os


load_dotenv()


# =========================================================
# DATABASE
# =========================================================

MONGO_URI = os.getenv("MONGO_URI")

DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "meridian",
)


# =========================================================
# JWT
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY")

ALGORITHM = "HS256"


# =========================================================
# BREVO
# =========================================================

BREVO_API_KEY = os.getenv("BREVO_API_KEY")

BREVO_SENDER_EMAIL = os.getenv(
    "BREVO_SENDER_EMAIL"
)

BREVO_SENDER_NAME = os.getenv(
    "BREVO_SENDER_NAME",
    "Meridian",
)


# =========================================================
# TAVILY
# =========================================================

TAVILY_API_KEY = os.getenv(
    "TAVILY_API_KEY"
)


# =========================================================
# GROQ
# =========================================================

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)


# =========================================================
# STRIPE
# =========================================================

STRIPE_SECRET_KEY = os.getenv(
    "STRIPE_SECRET_KEY"
)

STRIPE_PRICE_ID = os.getenv(
    "STRIPE_PRICE_ID"
)

# Added later when we create the webhook
STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET"
)


# =========================================================
# CONFIG VALIDATION
# =========================================================

def validate_config():
    """
    Validate required environment variables.

    This is called when Meridian starts so configuration
    problems are detected early.
    """

    required_variables = {
        "MONGO_URI": MONGO_URI,
        "SECRET_KEY": SECRET_KEY,
        "BREVO_API_KEY": BREVO_API_KEY,
        "BREVO_SENDER_EMAIL": BREVO_SENDER_EMAIL,
        "TAVILY_API_KEY": TAVILY_API_KEY,
        "GROQ_API_KEY": GROQ_API_KEY,

        # Stripe
        "STRIPE_SECRET_KEY": STRIPE_SECRET_KEY,
        "STRIPE_PRICE_ID": STRIPE_PRICE_ID,
    }

    missing_variables = [
        name
        for name, value in required_variables.items()
        if not value
    ]

    if missing_variables:

        raise RuntimeError(
            "Missing required environment variables: "
            + ", ".join(missing_variables)
        )


# =========================================================
# CONFIG SUMMARY
# =========================================================

def get_config_summary():
    """
    Return safe configuration information.

    Secret values are intentionally never returned.
    """

    return {
        "database_name": DATABASE_NAME,

        "jwt_algorithm": ALGORITHM,

        "brevo_configured": bool(
            BREVO_API_KEY
            and BREVO_SENDER_EMAIL
        ),

        "tavily_configured": bool(
            TAVILY_API_KEY
        ),

        "groq_configured": bool(
            GROQ_API_KEY
        ),

        "stripe_configured": bool(
            STRIPE_SECRET_KEY
            and STRIPE_PRICE_ID
        ),
    }