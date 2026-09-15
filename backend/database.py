from motor.motor_asyncio import AsyncIOMotorClient
from backend.config import MONGO_URI, DATABASE_NAME

client = AsyncIOMotorClient(MONGO_URI)

db = client[DATABASE_NAME]

users_collection = db["users"]
chats_collection = db["chats"]
messages_collection = db["messages"]
sources_collection = db["sources"]