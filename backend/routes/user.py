from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId

from backend.auth import get_current_user
from backend.database import users_collection


router = APIRouter(
    prefix="/api/users",
    tags=["Users"]
)


@router.get("/me")
async def get_my_profile(
    current_user_id: str = Depends(get_current_user)
):

    # Find current user
    user = await users_collection.find_one(
        {"_id": ObjectId(current_user_id)}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )

    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "is_verified": user["is_verified"],
        "created_at": user["created_at"],
    }