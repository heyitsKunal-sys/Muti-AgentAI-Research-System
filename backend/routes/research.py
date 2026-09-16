from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
)

from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

import asyncio
import json

from backend.auth import get_current_user
from backend.services.research_service import (
    TokenQuotaExceeded,
    create_research,
)
from backend.services.documents_service import upload_pdf


router = APIRouter(
    prefix="/api/research",
    tags=["Research"],
)


class ResearchRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=2,
        max_length=5000,
    )
    chat_id: str | None = None


# =========================================================
# NORMAL RESEARCH
# =========================================================

@router.post("/")
async def start_research(
    data: ResearchRequest,
    current_user_id: str = Depends(get_current_user),
):
    question = data.question.strip()

    if len(question) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research question must contain at least 2 characters.",
        )

    try:
        result = await create_research(
            user_id=current_user_id,
            question=question,
            chat_id=data.chat_id,
        )

        return result

    except TokenQuotaExceeded as error:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(error),
        )

    except Exception as error:
        print(
            "\nResearch request failed:",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Research could not be completed. Please try again.",
        )


# =========================================================
# STREAMING RESEARCH
# =========================================================

@router.post("/stream")
async def stream_research(
    data: ResearchRequest,
    current_user_id: str = Depends(get_current_user),
):
    question = data.question.strip()

    if len(question) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Research question must contain at least 2 characters.",
        )

    queue = asyncio.Queue()

    loop = asyncio.get_running_loop()

    def progress_callback(event: dict):
        loop.call_soon_threadsafe(
            queue.put_nowait,
            event,
        )

    async def run_job():

        try:

            result = await create_research(
                user_id=current_user_id,
                question=question,
                chat_id=data.chat_id,
                progress_callback=progress_callback,
            )

            await queue.put(
                {
                    "type": "result",
                    "data": result,
                }
            )

        except Exception as error:

            if isinstance(error, TokenQuotaExceeded):
                await queue.put(
                    {
                        "type": "error",
                        "message": str(error),
                    }
                )
                return

            print(
                "\nStreaming research failed:",
                str(error),
            )

            await queue.put(
                {
                    "type": "error",
                    "message": (
                        "Research could not be completed. "
                        "Please try again."
                    ),
                }
            )

    async def event_generator():

        task = asyncio.create_task(
            run_job()
        )

        try:

            while True:

                event = await queue.get()

                yield (
                    f"data: "
                    f"{json.dumps(event, default=str)}"
                    f"\n\n"
                )

                if event.get("type") in {
                    "result",
                    "error",
                }:
                    break

        finally:

            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# =========================================================
# PDF DOCUMENT UPLOAD
# =========================================================

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    chat_id: str | None = None,
    current_user_id: str = Depends(get_current_user),
):
    """
    Upload a PDF document for the current user.

    The document can optionally be associated with
    an existing research chat.
    """

    # -----------------------------------------------------
    # Validate file
    # -----------------------------------------------------

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file was selected.",
        )

    filename = file.filename.strip()

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )

    # -----------------------------------------------------
    # Validate content type when available
    # -----------------------------------------------------

    if file.content_type not in {
        "application/pdf",
        "application/octet-stream",
        None,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF file.",
        )

    # -----------------------------------------------------
    # Upload + extract + embed
    # -----------------------------------------------------

    try:

        result = await upload_pdf(
            user_id=current_user_id,
            chat_id=chat_id,
            filename=filename,
            file=file,
        )

        return result

    except ValueError as error:

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except Exception as error:

        print(
            "\nPDF upload failed:",
            str(error),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PDF could not be processed. Please try again.",
        )