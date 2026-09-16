from motor.motor_asyncio import AsyncIOMotorClient

from backend.config import (
    MONGO_URI,
    DATABASE_NAME,
)


# =========================================================
# MONGODB CLIENT
# =========================================================

client = AsyncIOMotorClient(
    MONGO_URI
)

db = client[
    DATABASE_NAME
]


# =========================================================
# COLLECTIONS
# =========================================================

users_collection = db["users"]

chats_collection = db["chats"]

messages_collection = db["messages"]

sources_collection = db["sources"]

documents_collection = db["documents"]


# =========================================================
# DATABASE INDEXES
# =========================================================

async def create_indexes():
    """
    Create MongoDB indexes used by Meridian.

    Indexes improve lookup speed for authentication,
    chat history, messages, sources and documents.
    """

    # -----------------------------------------------------
    # USERS
    # -----------------------------------------------------

    await users_collection.create_index(
        "email",
        unique=True,
        name="unique_user_email",
    )


    # -----------------------------------------------------
    # CHATS
    # -----------------------------------------------------

    await chats_collection.create_index(
        [
            ("user_id", 1),
            ("updated_at", -1),
        ],
        name="user_chats_updated",
    )


    # -----------------------------------------------------
    # MESSAGES
    # -----------------------------------------------------

    await messages_collection.create_index(
        [
            ("chat_id", 1),
            ("created_at", 1),
        ],
        name="chat_messages_created",
    )

    await messages_collection.create_index(
        [
            ("user_id", 1),
            ("created_at", -1),
        ],
        name="user_messages_created",
    )


    # -----------------------------------------------------
    # SOURCES
    # -----------------------------------------------------

    await sources_collection.create_index(
        [
            ("chat_id", 1),
            ("created_at", 1),
        ],
        name="chat_sources_created",
    )

    await sources_collection.create_index(
        [
            ("user_id", 1),
            ("created_at", -1),
        ],
        name="user_sources_created",
    )


    # -----------------------------------------------------
    # DOCUMENTS
    # -----------------------------------------------------

    await documents_collection.create_index(
        [
            ("user_id", 1),
            ("chat_id", 1),
            ("created_at", -1),
        ],
        name="user_chat_documents_created",
    )

    await documents_collection.create_index(
        [
            ("user_id", 1),
            ("created_at", -1),
        ],
        name="user_documents_created",
    )


# =========================================================
# DATABASE HEALTH CHECK
# =========================================================

async def check_database_connection():
    """
    Check whether MongoDB is reachable.
    """

    await client.admin.command(
        "ping"
    )

    return True