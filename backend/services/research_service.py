import asyncio
import re
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Callable

from bson import ObjectId

from backend.database import (
    chats_collection,
    messages_collection,
    sources_collection,
    users_collection,
)
from backend.services.usage_service import TOKEN_LIMITS

from ai.pipeline import run_research_pipeline


executor = ThreadPoolExecutor(max_workers=4)

RESEARCH_TOKEN_RESERVATION = 9_000


class TokenQuotaExceeded(ValueError):
    """Raised when a user has no monthly research-token budget left."""


async def reserve_token_budget(user_id: str) -> tuple[int, int]:
    """Reserve enough budget for one research run before starting it."""

    now = datetime.now(timezone.utc)
    usage_month = now.strftime("%Y-%m")
    user = await users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise ValueError("User not found.")

    plan = user.get("plan", "free")
    token_limit = TOKEN_LIMITS.get(plan, TOKEN_LIMITS["free"])

    if user.get("token_usage_month") != usage_month:
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "token_usage_month": usage_month,
                    "token_usage": 0,
                }
            },
        )

    result = await users_collection.update_one(
        {
            "_id": ObjectId(user_id),
            "token_usage_month": usage_month,
            "$expr": {
                "$lte": [
                    {
                        "$add": [
                            {"$ifNull": ["$token_usage", 0]},
                            RESEARCH_TOKEN_RESERVATION,
                        ]
                    },
                    token_limit,
                ]
            },
        },
        {"$inc": {"token_usage": RESEARCH_TOKEN_RESERVATION}},
    )

    if result.modified_count != 1:
        raise TokenQuotaExceeded(
            f"You have reached your {token_limit:,} token monthly limit."
        )

    return RESEARCH_TOKEN_RESERVATION, token_limit


async def settle_token_budget(
    user_id: str,
    reserved_tokens: int,
    actual_tokens: int,
    token_limit: int,
):
    """Replace the reservation with the measured text-token usage."""

    actual_tokens = min(
        max(0, actual_tokens),
        token_limit,
    )
    await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"token_usage": actual_tokens - reserved_tokens}},
    )


# =========================================================
# RUN AI PIPELINE
# =========================================================

def run_ai_pipeline(
    topic: str,
    user_id: str,
    chat_id: str,
    progress_callback: Callable[[dict], None] | None = None,
):
    """
    Run the synchronous AI pipeline inside the thread pool.
    """

    return run_research_pipeline(
        topic=topic,
        user_id=user_id,
        chat_id=chat_id,
        progress_callback=progress_callback,
    )


# =========================================================
# EXTRACT SOURCES
# =========================================================

def extract_sources(search_results: str) -> list:
    """
    Extract source title, URL and snippet from search output.

    The search tool returns labeled blocks, but the agent may
    reformat those blocks before returning its final message.
    URLs are therefore the source of truth.
    """

    sources = []

    if not search_results:
        return sources

    blocks = search_results.split("\n--\n")
    url_pattern = re.compile(
        r"https?://[^\s<>\]\[)\"']+",
        re.IGNORECASE,
    )

    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        urls = url_pattern.findall(block)

        for url in urls:
            url = url.rstrip(".,;:")
            url_line_index = next(
                (
                    index
                    for index, line in enumerate(lines)
                    if url in line
                ),
                0,
            )

            title_match = re.search(
                r"Title:\s*(.+)",
                block,
                re.IGNORECASE,
            )
            snippet_match = re.search(
                r"Snippet:\s*(.+)",
                block,
                re.IGNORECASE,
            )

            title = (
                title_match.group(1).strip()
                if title_match
                else lines[max(0, url_line_index - 1)]
                if url_line_index > 0
                else "Untitled source"
            )

            snippet = (
                snippet_match.group(1).strip()
                if snippet_match
                else " ".join(
                    lines[url_line_index + 1 : url_line_index + 3]
                )
            )

            sources.append(
                {
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                }
            )

    # -----------------------------------------------------
    # Remove duplicate URLs
    # -----------------------------------------------------

    unique_sources = []

    seen_urls = set()

    for source in sources:

        if source["url"] in seen_urls:
            continue

        seen_urls.add(source["url"])

        unique_sources.append(source)

    return unique_sources


# =========================================================
# CREATE RESEARCH
# =========================================================

async def create_research(
    user_id: str,
    question: str,
    progress_callback: Callable[[dict], None] | None = None,
):
    """
    Create a research conversation, execute the pipeline,
    and save the result.
    """

    # -----------------------------------------------------
    # Validate user
    # -----------------------------------------------------

    if not ObjectId.is_valid(user_id):
        raise ValueError(
            "Invalid user ID."
        )

    object_user_id = ObjectId(user_id)

    reserved_tokens, token_limit = await reserve_token_budget(user_id)

    # -----------------------------------------------------
    # Validate question
    # -----------------------------------------------------

    question = question.strip()

    if not question:
        raise ValueError(
            "Research question cannot be empty."
        )

    # -----------------------------------------------------
    # Create chat
    # -----------------------------------------------------

    now = datetime.now(timezone.utc)

    chat_result = await chats_collection.insert_one(
        {
            "user_id": object_user_id,
            "title": question[:80],
            "created_at": now,
            "updated_at": now,
        }
    )

    chat_id = chat_result.inserted_id

    # -----------------------------------------------------
    # Save user message
    # -----------------------------------------------------

    message_result = await messages_collection.insert_one(
        {
            "chat_id": chat_id,
            "user_id": object_user_id,
            "role": "user",
            "content": question,
            "created_at": now,
        }
    )

    # -----------------------------------------------------
    # Run AI pipeline
    # -----------------------------------------------------

    loop = asyncio.get_running_loop()

    try:

        pipeline_result = await loop.run_in_executor(
            executor,
            run_ai_pipeline,
            question,
            str(user_id),
            str(chat_id),
            progress_callback,
        )

    except Exception as error:

        await settle_token_budget(
            user_id,
            reserved_tokens,
            0,
            token_limit,
        )

        print("\n" + "=" * 60)
        print("RESEARCH PIPELINE ERROR")
        print(str(error))
        print("=" * 60)

        await chats_collection.update_one(
            {
                "_id": chat_id,
                "user_id": object_user_id,
            },
            {
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        raise

    # =====================================================
    # PIPELINE RESULT
    # =====================================================

    search_results = pipeline_result.get(
        "search_results",
        "",
    )

    report = pipeline_result.get(
        "final_report",
        pipeline_result.get(
            "report",
            "The research pipeline did not return a report.",
        ),
    )

    feedback = pipeline_result.get(
        "feedback",
        "",
    )

    critic_score = pipeline_result.get(
        "critic_score",
        0,
    )

    revision_count = pipeline_result.get(
        "revision_count",
        0,
    )

    pipeline_status = pipeline_result.get(
        "pipeline_status",
        "completed",
    )

    actual_tokens = pipeline_result.get(
        "token_usage",
        reserved_tokens,
    )

    await settle_token_budget(
        user_id,
        reserved_tokens,
        actual_tokens,
        token_limit,
    )

    pipeline_details = pipeline_result.get(
        "pipeline",
        {},
    )

    # =====================================================
    # SAVE SOURCES
    # =====================================================

    extracted_sources = extract_sources(
        search_results
    )

    if extracted_sources:

        source_created_at = datetime.now(
            timezone.utc
        )

        source_documents = [
            {
                "chat_id": chat_id,
                "user_id": object_user_id,
                "title": source["title"],
                "url": source["url"],
                "snippet": source["snippet"],
                "created_at": source_created_at,
            }
            for source in extracted_sources
        ]

        await sources_collection.insert_many(
            source_documents
        )

    # =====================================================
    # SAVE ASSISTANT MESSAGE
    # =====================================================

    assistant_now = datetime.now(
        timezone.utc
    )

    assistant_result = await messages_collection.insert_one(
        {
            "chat_id": chat_id,
            "user_id": object_user_id,
            "role": "assistant",
            "content": report,
            "created_at": assistant_now,
        }
    )

    # =====================================================
    # UPDATE CHAT
    # =====================================================

    await chats_collection.update_one(
        {
            "_id": chat_id,
            "user_id": object_user_id,
        },
        {
            "$set": {
                "updated_at": assistant_now,
            }
        },
    )

    # =====================================================
    # RETURN RESULT
    # =====================================================

    return {
        "chat_id": str(chat_id),

        "user_message_id": str(
            message_result.inserted_id
        ),

        "assistant_message_id": str(
            assistant_result.inserted_id
        ),

        "question": question,

        "answer": report,

        "feedback": feedback,

        "critic_score": critic_score,

        "revision_count": revision_count,

        "token_usage": actual_tokens,

        "token_limit": token_limit,

        "revision_performed": revision_count > 0,

        "pipeline_status": pipeline_status,

        "sources": extracted_sources,

        "pipeline": {
            "search": pipeline_details.get(
                "search",
                "completed",
            ),

            "reader": pipeline_details.get(
                "reader",
                "completed",
            ),

            "rag": pipeline_details.get(
                "rag",
                "completed",
            ),

            "writer": pipeline_details.get(
                "writer",
                "completed",
            ),

            "critic": pipeline_details.get(
                "critic",
                "completed",
            ),

            "revisions": revision_count,

            "final_score": critic_score,
        },

        "created_at": assistant_now,
    }