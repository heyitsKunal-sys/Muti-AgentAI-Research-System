import re
from typing import Callable

import tiktoken

from ai.agents import (
    build_reader_agent,
    build_search_agent,
    critic_chain,
    writer_chain,
)



# =========================================================
# CRITIC SCORE
# =========================================================

def extract_score(feedback: str) -> int:
    """Extract critic score from feedback. Expected format: Score: 8/10."""

    if not feedback:
        return 0

    match = re.search(
        r"Score:\s*(\d+)\s*/\s*10",
        feedback,
        re.IGNORECASE,
    )

    if not match:
        return 0

    score = int(match.group(1))

    return max(0, min(score, 10))


# =========================================================
# AGENT CONTENT
# =========================================================

def get_agent_content(result) -> str:
    """Extract text content from a LangChain agent result."""

    messages = result.get("messages", [])

    if not messages:
        return ""

    content = messages[-1].content

    if isinstance(content, str):
        return content

    if isinstance(content, list):

        parts = []

        for item in content:

            if isinstance(item, dict):

                text = item.get("text", "")

                if text:
                    parts.append(text)

            elif isinstance(item, str):

                parts.append(item)

        return "\n".join(parts)

    return str(content)


def count_tokens(*values: str) -> int:
    """Count text tokens consistently for monthly usage accounting."""

    try:
        encoding = tiktoken.get_encoding("cl100k_base")
    except Exception:
        return sum(len(value or "") for value in values) // 4

    return sum(
        len(encoding.encode(value or ""))
        for value in values
    )


# =========================================================
# MAIN RESEARCH PIPELINE
# =========================================================

def run_research_pipeline(
    topic: str,
    user_id: str | None = None,
    chat_id: str | None = None,
    progress_callback: Callable[[dict], None] | None = None,
) -> dict:
    """
    Main Meridian research pipeline.

    Pipeline:

    1. Search Agent
    2. Reader Agent
    3. Writer Agent
    4. Critic Agent

    The research pipeline intentionally skips ChromaDB/RAG so the
    agent answers are based on live search + reader analysis rather than
    vector retrieval. PDF uploads remain available as a separate feature
    that uses ChromaDB for document-grounded search.
    """

    topic = topic.strip()

    if not topic:
        raise ValueError(
            "Research topic cannot be empty."
        )

    state = {}

    # =====================================================
    # PROGRESS EVENT
    # =====================================================

    def emit(
        stage: str,
        status: str,
        message: str,
    ):
        if progress_callback:

            progress_callback(
                {
                    "type": "stage",
                    "stage": stage,
                    "status": status,
                    "message": message,
                }
            )

    # ============================================================
    # 1. SEARCH AGENT
    # ============================================================

    emit(
        "search",
        "running",
        "Searching the web for relevant sources...",
    )

    print(
        f"\n[1/5] Searching for: {topic}"
    )

    search_agent = build_search_agent()

    try:

        search_result = search_agent.invoke(
            {
                "messages": [
                    (
                        "user",
                        f"""
Research the following topic:

{topic}

Use the web search tool to find relevant, recent,
and reliable sources.

Return the useful search results with:
- Title
- URL
- Relevant information/snippet

Use multiple sources when appropriate.
Do not invent URLs or information.
""",
                    )
                ]
            }
        )

        state["search_results"] = get_agent_content(
            search_result
        )

        if not state["search_results"]:

            raise RuntimeError(
                "Search Agent returned no results."
            )

    except Exception:

        emit(
            "search",
            "failed",
            "Search Agent failed.",
        )

        raise

    print("[1/5] Search completed.")

    emit(
        "search",
        "completed",
        "Search completed.",
    )

    # ============================================================
    # 2. READER AGENT
    # ============================================================

    emit(
        "reader",
        "running",
        "Reading and analyzing the most relevant sources...",
    )

    print(
        "[2/5] Reading and analyzing sources..."
    )

    reader_agent = build_reader_agent()

    try:

        reader_result = reader_agent.invoke(
            {
                "messages": [
                    (
                        "user",
                        f"""
You are the Reader Agent.

Research topic:
{topic}

Below are the search results from the Search Agent:

{state["search_results"][:4000]}

Read the most relevant sources using the scraping tool.

Extract:
- Important facts
- Statistics
- Dates
- Key findings
- Relevant context
- Important details

Preserve the source URLs.

Do not invent facts or information.
Only use information supported by the sources.
""",
                    )
                ]
            }
        )

        state["scraped_content"] = get_agent_content(
            reader_result
        )

        if not state["scraped_content"]:

            state["scraped_content"] = (
                "No additional detailed source "
                "content was available."
            )

    except Exception:

        emit(
            "reader",
            "failed",
            "Reader Agent failed.",
        )

        raise

    print("[2/5] Reader completed.")

    emit(
        "reader",
        "completed",
        "Source analysis completed.",
    )

    research_combined = (
        "SEARCH RESULTS:\n\n"
        + state["search_results"]
        + "\n\n"
        + "DETAILED RESEARCH:\n\n"
        + state["scraped_content"]
    )

    state["combined_context"] = research_combined

    # ============================================================
    # 3. WRITER AGENT
    # ============================================================

    emit(
        "writer",
        "running",
        "Writing the final research report...",
    )

    print(
        "[3/5] Writing final research report..."
    )

    try:

        state["report"] = writer_chain.invoke(
            {
                "topic": topic,
                "research": state["combined_context"][:8000],
            }
        )

        if not state["report"]:

            raise RuntimeError(
                "Writer Agent returned an empty report."
            )

    except Exception:

        emit(
            "writer",
            "failed",
            "Writer Agent failed.",
        )

        raise

    print(
        "[3/5] Writer completed."
    )

    emit(
        "writer",
        "completed",
        "Final report drafted.",
    )

    # ============================================================
    # 4. CRITIC AGENT
    # ============================================================

    emit(
        "critic",
        "running",
        "Critic is reviewing the report...",
    )

    print(
        "[4/5] Critic reviewing the report..."
    )

    try:

        state["feedback"] = critic_chain.invoke(
            {
                "report": state["report"],
            }
        )

        state["critic_score"] = extract_score(
            state["feedback"]
        )

    except Exception:

        emit(
            "critic",
            "failed",
            "Critic Agent failed.",
        )

        raise

    print(
        f"[4/5] Critic completed. "
        f"Score: {state['critic_score']}/10"
    )

    emit(
        "critic",
        "completed",
        "Critic review completed.",
    )

    # ============================================================
    # FINAL PIPELINE RESULT
    # ============================================================

    state["final_report"] = state["report"]

    state["revision_count"] = 0

    state["revision_performed"] = False

    state["pipeline_status"] = "completed"

    state["token_usage"] = count_tokens(
        topic,
        state["search_results"],
        state["scraped_content"],
        state["combined_context"],
        state["report"],
        state["feedback"],
    )

    state["pipeline"] = {
        "search": "completed",
        "reader": "completed",
        "writer": "completed",
        "critic": "completed",
        "revisions": 0,
        "final_score": state["critic_score"],
    }

    return state