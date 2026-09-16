from bson import ObjectId
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from backend.auth import get_current_user

from backend.database import (
    chats_collection,
    messages_collection,
    sources_collection,
)

from backend.models.chat import ChatCreate


router = APIRouter(
    prefix="/api/chats",
    tags=["Chats"],
)


# =========================================================
# HELPER — VALIDATE CHAT ID
# =========================================================

def validate_chat_id(chat_id: str) -> ObjectId:
    """
    Convert a string chat ID into MongoDB ObjectId.
    """

    if not ObjectId.is_valid(chat_id):

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid chat ID.",
        )

    return ObjectId(chat_id)


# =========================================================
# CREATE CHAT
# =========================================================

@router.post("/")
async def create_chat(
    chat: ChatCreate,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Create a new chat for the authenticated user.
    """

    user_id = ObjectId(
        current_user_id
    )

    now = __import__(
        "datetime"
    ).datetime.now(
        __import__(
            "datetime"
        ).timezone.utc
    )

    result = await chats_collection.insert_one(
        {
            "user_id": user_id,
            "title": chat.title.strip(),
            "created_at": now,
            "updated_at": now,
        }
    )

    return {
        "id": str(
            result.inserted_id
        ),
        "title": chat.title.strip(),
        "created_at": now,
        "updated_at": now,
    }


# =========================================================
# GET ALL CHATS
# =========================================================

@router.get("/")
async def get_chats(
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Return all chats belonging to the
    authenticated user.
    """

    user_id = ObjectId(
        current_user_id
    )

    chats = []

    cursor = (
        chats_collection
        .find(
            {
                "user_id": user_id,
            }
        )
        .sort(
            "updated_at",
            -1,
        )
    )

    async for chat in cursor:

        chats.append(
            {
                "id": str(
                    chat["_id"]
                ),
                "title": chat.get(
                    "title",
                    "Untitled Research",
                ),
                "created_at": chat.get(
                    "created_at"
                ),
                "updated_at": chat.get(
                    "updated_at"
                ),
            }
        )

    return chats


# =========================================================
# RENAME CHAT
# =========================================================

@router.patch("/{chat_id}")
async def rename_chat(
    chat_id: str,
    chat: ChatCreate,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Rename an existing chat belonging to
    the authenticated user.
    """

    # -----------------------------------------------------
    # Validate chat ID
    # -----------------------------------------------------

    object_id = validate_chat_id(
        chat_id
    )

    user_id = ObjectId(
        current_user_id
    )

    # -----------------------------------------------------
    # Verify chat ownership
    # -----------------------------------------------------

    existing_chat = await chats_collection.find_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    if not existing_chat:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    # -----------------------------------------------------
    # Validate title
    # -----------------------------------------------------

    new_title = chat.title.strip()

    if not new_title:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat title cannot be empty.",
        )

    # -----------------------------------------------------
    # Update chat
    # -----------------------------------------------------

    now = __import__(
        "datetime"
    ).datetime.now(
        __import__(
            "datetime"
        ).timezone.utc
    )

    await chats_collection.update_one(
        {
            "_id": object_id,
            "user_id": user_id,
        },
        {
            "$set": {
                "title": new_title,
                "updated_at": now,
            }
        },
    )

    # -----------------------------------------------------
    # Return updated chat
    # -----------------------------------------------------

    return {
        "id": str(
            object_id
        ),
        "title": new_title,
        "created_at": existing_chat.get(
            "created_at"
        ),
        "updated_at": now,
    }


# =========================================================
# DELETE CHAT
# =========================================================

@router.delete("/{chat_id}")
async def delete_chat(
    chat_id: str,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Permanently delete a chat and all of its
    messages and sources for the authenticated user.
    """

    object_id = validate_chat_id(
        chat_id
    )

    user_id = ObjectId(
        current_user_id
    )

    # -----------------------------------------------------
    # Verify chat ownership
    # -----------------------------------------------------

    existing_chat = await chats_collection.find_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    if not existing_chat:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    # -----------------------------------------------------
    # Delete child documents first
    # -----------------------------------------------------

    messages_result = await messages_collection.delete_many(
        {
            "chat_id": object_id,
            "user_id": user_id,
        }
    )

    sources_result = await sources_collection.delete_many(
        {
            "chat_id": object_id,
            "user_id": user_id,
        }
    )

    # -----------------------------------------------------
    # Delete chat
    # -----------------------------------------------------

    await chats_collection.delete_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    return {
        "id": chat_id,
        "message": "Chat deleted successfully.",
        "deleted_messages": messages_result.deleted_count,
        "deleted_sources": sources_result.deleted_count,
    }


# =========================================================
# GET SINGLE CHAT
# =========================================================

@router.get("/{chat_id}")
async def get_chat(
    chat_id: str,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Return one chat only if it belongs
    to the authenticated user.
    """

    object_id = validate_chat_id(
        chat_id
    )

    chat = await chats_collection.find_one(
        {
            "_id": object_id,
            "user_id": ObjectId(
                current_user_id
            ),
        }
    )

    if not chat:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    return {
        "id": str(
            chat["_id"]
        ),
        "title": chat.get(
            "title",
            "Untitled Research",
        ),
        "created_at": chat.get(
            "created_at"
        ),
        "updated_at": chat.get(
            "updated_at"
        ),
    }


# =========================================================
# GET CHAT MESSAGES
# =========================================================

@router.get("/{chat_id}/messages")
async def get_chat_messages(
    chat_id: str,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Return all messages belonging to a
    specific authenticated user's chat.
    """

    object_id = validate_chat_id(
        chat_id
    )

    user_id = ObjectId(
        current_user_id
    )

    # -----------------------------------------------------
    # Verify chat ownership
    # -----------------------------------------------------

    chat = await chats_collection.find_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    if not chat:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    # -----------------------------------------------------
    # Get messages
    # -----------------------------------------------------

    messages = []

    cursor = (
        messages_collection
        .find(
            {
                "chat_id": object_id,
                "user_id": user_id,
            }
        )
        .sort(
            "created_at",
            1,
        )
    )

    async for message in cursor:

        messages.append(
            {
                "id": str(
                    message["_id"]
                ),
                "chat_id": str(
                    message["chat_id"]
                ),
                "role": message.get(
                    "role"
                ),
                "content": message.get(
                    "content",
                    "",
                ),
                "created_at": message.get(
                    "created_at"
                ),
            }
        )

    return messages


# =========================================================
# GET CHAT SOURCES
# =========================================================

@router.get("/{chat_id}/sources")
async def get_chat_sources(
    chat_id: str,
    current_user_id: str = Depends(
        get_current_user
    ),
):
    """
    Return all research sources belonging
    to a specific authenticated user's chat.
    """

    object_id = validate_chat_id(
        chat_id
    )

    user_id = ObjectId(
        current_user_id
    )

    # -----------------------------------------------------
    # Verify chat ownership
    # -----------------------------------------------------

    chat = await chats_collection.find_one(
        {
            "_id": object_id,
            "user_id": user_id,
        }
    )

    if not chat:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    # -----------------------------------------------------
    # Get sources
    # -----------------------------------------------------

    sources = []

    cursor = (
        sources_collection
        .find(
            {
                "chat_id": object_id,
                "user_id": user_id,
            }
        )
        .sort(
            "created_at",
            1,
        )
    )

    async for source in cursor:

        sources.append(
            {
                "id": str(
                    source["_id"]
                ),
                "title": source.get(
                    "title",
                    "",
                ),
                "url": source.get(
                    "url",
                    "",
                ),
                "snippet": source.get(
                    "snippet",
                    "",
                ),
                "created_at": source.get(
                    "created_at"
                ),
            }
        )

    return sources