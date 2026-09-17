from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import (
    client,
    create_indexes,
)

from backend.routes.auth import (
    router as auth_router,
)

from backend.routes.user import (
    router as users_router,
)

from backend.routes.chat import (
    router as chats_router,
)

from backend.routes.research import (
    router as research_router,
)

from backend.routes.stripe import (
    router as stripe_router,
)

from backend.routes.stripe_webhook import (
    router as stripe_webhook_router,
)

# =========================================================
# APPLICATION LIFESPAN
# =========================================================


@asynccontextmanager
async def lifespan(app: FastAPI):

    # -----------------------------------------------------
    # Startup
    # -----------------------------------------------------

    print("\n" + "=" * 60)
    print("Starting Meridian API...")
    print("=" * 60)

    try:

        await client.admin.command("ping")

        print("✓ MongoDB connected.")

        await create_indexes()

        print("✓ MongoDB indexes ready.")

    except Exception as error:

        print(
            "⚠ Database startup error:",
            str(error),
        )

    print("✓ Meridian API started.")
    print("=" * 60 + "\n")

    yield

    # -----------------------------------------------------
    # Shutdown
    # -----------------------------------------------------

    print("\nShutting down Meridian API...")

    client.close()

    print("✓ MongoDB connection closed.")


# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="Meridian API",
    description=("Backend API for the Meridian " "Multi-Agent AI Research System."),
    version="1.0.0",
    lifespan=lifespan,
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://muti-agent-ai-research-system.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=[
        "*",
    ],
    allow_headers=[
        "*",
    ],
)


# =========================================================
# ROUTES
# =========================================================

app.router.routes.extend(auth_router.routes)
app.router.routes.extend(users_router.routes)
app.router.routes.extend(chats_router.routes)
app.router.routes.extend(research_router.routes)
app.router.routes.extend(stripe_router.routes)
app.router.routes.extend(stripe_webhook_router.routes)
# =========================================================
# ROOT
# =========================================================


@app.get("/")
async def root():

    return {
        "message": "Meridian API is running",
        "status": "online",
    }


# =========================================================
# HEALTH CHECK
# =========================================================


@app.get("/health")
async def health():

    try:

        await client.admin.command("ping")

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(error),
        }
