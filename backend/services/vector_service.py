from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings


MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"

_embeddings = None
_vector_store = None


# =========================================================
# LAZY EMBEDDING MODEL
# =========================================================

def get_embeddings():
    """
    Create the embedding model only when the vector layer is first used.
    This avoids loading the large model during FastAPI startup,
    which is what typically triggers Render OOMs.
    """
    global _embeddings

    if _embeddings is None:
        _embeddings = HuggingFaceEmbeddings(
            model_name=MODEL_NAME,
        )

    return _embeddings


# =========================================================
# LAZY CHROMADB VECTOR STORE
# =========================================================

def get_vector_store():
    """Return the persisted Chroma collection, initializing it on first use."""
    global _vector_store

    if _vector_store is None:
        _vector_store = Chroma(
            collection_name="meridian_research",
            embedding_function=get_embeddings(),
            persist_directory="./chroma_db",
        )

    return _vector_store


# =========================================================
# CHUNK CONFIGURATION
# =========================================================

CHUNK_SIZE = 1200
CHUNK_OVERLAP = 200


# =========================================================
# TEXT CHUNKING
# =========================================================

def split_text(
    content: str,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[str]:
    """
    Split text into overlapping chunks.
    """

    if not content or not content.strip():
        return []

    content = content.strip()

    step = chunk_size - chunk_overlap

    chunks = []

    start = 0

    while start < len(content):

        end = start + chunk_size

        chunk = content[start:end].strip()

        if chunk:
            chunks.append(chunk)

        start += step

    return chunks


# =========================================================
# ADD RESEARCH DOCUMENTS
# =========================================================

def add_research_documents(
    user_id: str,
    chat_id: str,
    topic: str,
    content: str,
):
    """
    Split research content into chunks and store it
    in ChromaDB.

    Each chunk belongs to both a user and a chat.
    """

    if not content or not content.strip():
        return

    chunks = split_text(content)

    if not chunks:
        return

    metadatas = [
        {
            "user_id": user_id,
            "chat_id": chat_id,
            "topic": topic,
            "source": "research",
        }
        for _ in chunks
    ]

    ids = [
        f"{user_id}_{chat_id}_research_chunk_{index}"
        for index in range(len(chunks))
    ]

    store = get_vector_store()

    store.add_texts(
        texts=chunks,
        metadatas=metadatas,
        ids=ids,
    )


# =========================================================
# ADD PDF DOCUMENT
# =========================================================

def add_pdf_documents(
    user_id: str,
    chat_id: str,
    document_id: str,
    filename: str,
    pages: list[dict],
):
    """
    Add extracted PDF pages to ChromaDB.

    Each page is split into chunks and associated with:
    - user_id
    - chat_id
    - document_id
    - filename
    - page number
    """

    if not pages:
        return 0

    all_chunks = []
    all_metadatas = []
    all_ids = []

    chunk_index = 0

    for page in pages:

        page_number = page.get("page_number")
        content = page.get("content", "")

        if not content or not content.strip():
            continue

        chunks = split_text(content)

        for chunk in chunks:

            all_chunks.append(chunk)

            all_metadatas.append(
                {
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "document_id": document_id,
                    "filename": filename,
                    "page_number": page_number,
                    "source": "pdf",
                }
            )

            all_ids.append(
                f"{document_id}_chunk_{chunk_index}"
            )

            chunk_index += 1

    if not all_chunks:
        return 0

    store = get_vector_store()

    store.add_texts(
        texts=all_chunks,
        metadatas=all_metadatas,
        ids=all_ids,
    )

    return len(all_chunks)


# =========================================================
# RAG SEARCH
# =========================================================

def search_research(
    query: str,
    user_id: str,
    chat_id: str | None = None,
    k: int = 5,
):
    """
    Retrieve semantically relevant research/PDF chunks.

    Retrieval is isolated using user_id and optionally chat_id.

    This prevents one user's documents from being retrieved
    by another user.
    """

    if not query or not query.strip():
        return []

    k = max(
        1,
        min(k, 20),
    )

    # -----------------------------------------------------
    # USER + CHAT ISOLATION
    # -----------------------------------------------------

    store = get_vector_store()

    if chat_id:

        return store.similarity_search(
            query=query,
            k=k,
            filter={
                "$and": [
                    {
                        "user_id": user_id,
                    },
                    {
                        "chat_id": chat_id,
                    },
                ]
            },
        )

    # -----------------------------------------------------
    # USER-ONLY SEARCH
    # -----------------------------------------------------

    return store.similarity_search(
        query=query,
        k=k,
        filter={
            "user_id": user_id,
        },
    )


# =========================================================
# DELETE CHAT DOCUMENTS
# =========================================================

def delete_chat_documents(
    user_id: str,
    chat_id: str,
):
    """
    Delete all ChromaDB documents belonging to a
    specific user and chat.

    This keeps vector data isolated after chat deletion.
    """

    store = get_vector_store()
    collection = store._collection

    existing = collection.get(
        where={
            "$and": [
                {
                    "user_id": user_id,
                },
                {
                    "chat_id": chat_id,
                },
            ]
        }
    )

    ids = existing.get("ids", [])

    if ids:
        collection.delete(
            ids=ids
        )

    return len(ids)