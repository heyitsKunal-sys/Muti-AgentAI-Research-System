from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import client
from backend.routes.auth import router as auth_router
from backend.routes.user import router as users_router


app = FastAPI(
    title="Meridian API",
    description="Backend API for Meridian Multi-Agent Research System",
    version="1.0.0",
)


# ================= CORS =================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================= ROUTES =================

app.include_router(auth_router)
app.include_router(users_router)


# ================= HEALTH =================

@app.get("/")
def root():
    return {
        "message": "Meridian API is running"
    }


@app.get("/health")
async def health():
    try:
        await client.admin.command("ping")

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }