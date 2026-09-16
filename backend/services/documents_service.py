from io import BytesIO
import re
from datetime import datetime, timezone

from bson import ObjectId
from pypdf import PdfReader

from backend.database import documents_collection
from backend.services.vector_service import add_pdf_documents


# =========================================================
# PDF CONFIGURATION
# =========================================================

MAX_FILE_SIZE = 10 * 1024 * 1024

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


# =========================================================
# FILENAME CLEANING
# =========================================================

def clean_filename(filename: str) -> str:
    """
    Remove unsafe characters from the uploaded filename.
    """

    name = (
        filename or "document.pdf"
    ).strip()

    name = re.sub(
        r"[^A-Za-z0-9._ -]",
        "",
        name,
    )

    return (
        name[:180]
        or "document.pdf"
    )


# =========================================================
# PDF TEXT EXTRACTION
# =========================================================

def extract_pdf_chunks(
    file_bytes: bytes,
) -> list[dict]:
    """
    Extract readable text from every PDF page.

    Each page is split into overlapping chunks.
    """

    reader = PdfReader(
        BytesIO(file_bytes)
    )

    chunks = []

    step = (
        CHUNK_SIZE
        - CHUNK_OVERLAP
    )

    for page_number, page in enumerate(
        reader.pages,
        start=1,
    ):

        text = (
            page.extract_text()
            or ""
        ).strip()

        if not text:
            continue

        for start in range(
            0,
            len(text),
            step,
        ):

            chunk = text[
                start : start + CHUNK_SIZE
            ].strip()

            if chunk:

                chunks.append(
                    {
                        "page_number": page_number,
                        "content": chunk,
                    }
                )

    return chunks


# =========================================================
# SAVE PDF DOCUMENT
# =========================================================

async def save_document(
    user_id: str,
    chat_id: str,
    filename: str,
    file_bytes: bytes,
):
    """
    Extract, store and embed an uploaded PDF.

    MongoDB stores document metadata.

    ChromaDB stores the actual text chunks and embeddings.
    """

    # -----------------------------------------------------
    # Validate user
    # -----------------------------------------------------

    if not ObjectId.is_valid(
        user_id
    ):
        raise ValueError(
            "Invalid user ID."
        )

    # -----------------------------------------------------
    # Validate chat
    # -----------------------------------------------------

    if not ObjectId.is_valid(
        chat_id
    ):
        raise ValueError(
            "Invalid chat ID."
        )

    # -----------------------------------------------------
    # Validate file size
    # -----------------------------------------------------

    if len(file_bytes) > MAX_FILE_SIZE:

        raise ValueError(
            "PDF must be 10 MB or smaller."
        )

    if not file_bytes:

        raise ValueError(
            "Uploaded PDF is empty."
        )

    # -----------------------------------------------------
    # Clean filename
    # -----------------------------------------------------

    safe_filename = clean_filename(
        filename
    )

    # -----------------------------------------------------
    # Extract PDF chunks
    # -----------------------------------------------------

    chunks = extract_pdf_chunks(
        file_bytes
    )

    if not chunks:

        raise ValueError(
            "No readable text was found in this PDF."
        )

    # -----------------------------------------------------
    # Create MongoDB document record
    # -----------------------------------------------------

    now = datetime.now(
        timezone.utc
    )

    document_result = await documents_collection.insert_one(
        {
            "user_id": ObjectId(
                user_id
            ),

            "chat_id": ObjectId(
                chat_id
            ),

            "filename": safe_filename,

            "size": len(
                file_bytes
            ),

            "pages": len(
                {
                    chunk["page_number"]
                    for chunk in chunks
                }
            ),

            "chunks": len(
                chunks
            ),

            "created_at": now,
        }
    )

    document_id = str(
        document_result.inserted_id
    )

    # -----------------------------------------------------
    # Add chunks to ChromaDB
    # -----------------------------------------------------

    try:

        stored_chunks = add_pdf_documents(
            user_id=user_id,
            chat_id=chat_id,
            document_id=document_id,
            filename=safe_filename,
            pages=chunks,
        )

        if stored_chunks == 0:

            await documents_collection.delete_one(
                {
                    "_id": document_result.inserted_id
                }
            )

            raise ValueError(
                "The PDF did not contain usable text chunks."
            )

    except Exception:

        await documents_collection.delete_one(
            {
                "_id": document_result.inserted_id
            }
        )

        raise

    # -----------------------------------------------------
    # Fetch saved document
    # -----------------------------------------------------

    document = await documents_collection.find_one(
        {
            "_id": document_result.inserted_id
        }
    )

    # -----------------------------------------------------
    # Return document information
    # -----------------------------------------------------

    return {
        "id": document_id,

        "chat_id": chat_id,

        "filename": safe_filename,

        "size": document["size"],

        "pages": document["pages"],

        "chunks": document["chunks"],

        "created_at": document["created_at"],
    }


# =========================================================
# UPLOAD PDF
# =========================================================

async def upload_pdf(
    user_id: str,
    chat_id: str | None,
    filename: str,
    file,
):
    """
    Read an uploaded PDF and save it.

    A chat_id is required because PDF documents are
    associated with a specific research conversation.
    """

    if not chat_id:

        raise ValueError(
            "A chat must be selected before uploading a PDF."
        )

    file_bytes = await file.read()

    return await save_document(
        user_id=user_id,
        chat_id=chat_id,
        filename=filename,
        file_bytes=file_bytes,
    )