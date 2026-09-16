import os

from dotenv import load_dotenv

from langchain.agents import create_agent
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from ai.tools import scrape_url, web_search


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not configured.")


# ============================================================
# MODELS
# ============================================================

# Used for Search, Reader and Critic.
# Smaller output limits keep the request safely below
# the current Groq TPM limit.
fast_llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0,
    max_tokens=1200,
    reasoning_effort="low",
    api_key=GROQ_API_KEY,
)


# Stronger model for the final research report.
writer_llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0,
    max_tokens=2200,
    reasoning_effort="low",
    api_key=GROQ_API_KEY,
)


# ============================================================
# SEARCH AGENT
# ============================================================

SEARCH_SYSTEM_PROMPT = """
You are the Search Agent for Meridian.

Find reliable and relevant web information about the user's topic.

Use the web_search tool.

Rules:
- Search the web.
- Prefer reliable and authoritative sources.
- Use multiple sources when useful.
- Return useful facts and source URLs.
- Do not invent facts.
- Do not invent URLs.
- Stay focused on the user's topic.
- Keep your response concise.
"""


def build_search_agent():
    return create_agent(
        model=fast_llm,
        tools=[web_search],
        system_prompt=SEARCH_SYSTEM_PROMPT,
    )


# ============================================================
# READER AGENT
# ============================================================

READER_SYSTEM_PROMPT = """
You are the Reader Agent for Meridian.

Analyze the search results provided to you.

Use the scrape_url tool to inspect the most relevant sources.

Extract only useful information:

- Important facts
- Statistics
- Dates
- Key findings
- Important context

Rules:
- Do not invent information.
- Do not invent statistics.
- Preserve source URLs.
- Ignore irrelevant content.
- Keep the research notes concise.
"""


def build_reader_agent():
    return create_agent(
        model=fast_llm,
        tools=[scrape_url],
        system_prompt=READER_SYSTEM_PROMPT,
    )


# ============================================================
# WRITER
# ============================================================

WRITER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Writer Agent for Meridian.

Create a factual research report from the supplied research.

Use ONLY the supplied research.

Do not invent:
- Facts
- Statistics
- Dates
- Sources
- Claims

Keep the report concise but useful.

Use this structure:

# Introduction

# Key Findings

# Important Details

# Conclusion

# Sources

Only include source URLs that exist in the research.
""",
        ),
        (
            "human",
            """
Research Topic:

{topic}

Research:

{research}

Write the final research report.
""",
        ),
    ]
)

writer_chain = WRITER_PROMPT | writer_llm | StrOutputParser()


# ============================================================
# CRITIC
# ============================================================

CRITIC_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Critic Agent for Meridian.

Review the research report.

Check:

- Factual support
- Completeness
- Clarity
- Structure
- Source usage
- Unsupported claims
- Whether the report answers the topic

Return ONLY a concise review using:

Score: X/10

Strengths:
- ...

Areas to Improve:
- ...

Verdict:
...
""",
        ),
        (
            "human",
            """
Research Report:

{report}

Review this report.
""",
        ),
    ]
)

critic_chain = (
    CRITIC_PROMPT
    | ChatGroq(
        model="openai/gpt-oss-20b",
        temperature=0,
        max_tokens=700,
        reasoning_effort="low",
        api_key=GROQ_API_KEY,
    )
    | StrOutputParser()
)


# ============================================================
# REVISION CHAIN
# ============================================================
#
# Kept only for compatibility with the existing project.
#
# IMPORTANT:
# pipeline.py DOES NOT call this.
#
# There is NO automatic revision loop.
# ============================================================

REVISION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are the Revision Agent for Meridian.

Improve the report according to the critic feedback.

Do not invent facts or sources.
Only use the supplied research.
""",
        ),
        (
            "human",
            """
Research Topic:

{topic}

Current Report:

{report}

Critic Feedback:

{feedback}

Research:

{research}

Improve the report.
""",
        ),
    ]
)

revision_chain = (
    REVISION_PROMPT
    | ChatGroq(
        model="openai/gpt-oss-20b",
        temperature=0,
        max_tokens=2200,
        reasoning_effort="low",
        api_key=GROQ_API_KEY,
    )
    | StrOutputParser()
)