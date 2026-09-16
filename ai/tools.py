import os

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from langchain.tools import tool
from tavily import TavilyClient


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

TAVILY_API_KEY = os.getenv(
    "TAVILY_API_KEY"
)


# =========================================================
# TAVILY CLIENT
# =========================================================

if not TAVILY_API_KEY:
    raise RuntimeError(
        "TAVILY_API_KEY is not configured."
    )

tavily = TavilyClient(
    api_key=TAVILY_API_KEY
)


# =========================================================
# WEB SEARCH TOOL
# =========================================================

@tool
def web_search(query: str) -> str:
    """
    Search the web for recent and reliable information.

    Returns titles, URLs and snippets from relevant sources.
    """

    try:

        query = query.strip()

        if not query:
            return (
                "Search failed: "
                "query cannot be empty."
            )


        results = tavily.search(
            query=query,
            max_results=4,
            search_depth="advanced",
        )


        search_results = results.get(
            "results",
            [],
        )


        if not search_results:

            return (
                "No relevant search results "
                "were found."
            )


        output = []

        for result in search_results:

            title = result.get(
                "title",
                "Untitled source",
            )

            url = result.get(
                "url",
                "",
            )

            content = result.get(
                "content",
                "",
            )

            snippet = content[:500].strip()


            if not url:
                continue


            output.append(
                f"Title: {title}\n"
                f"URL: {url}\n"
                f"Snippet: {snippet}\n"
            )


        if not output:

            return (
                "Search returned results, "
                "but no usable URLs were found."
            )


        return "\n--\n".join(
            output
        )


    except Exception as error:

        return (
            "Web search failed: "
            f"{str(error)}"
        )


# =========================================================
# URL SCRAPER TOOL
# =========================================================

@tool
def scrape_url(url: str) -> str:
    """
    Scrape readable text from a webpage.

    Removes scripts, styles and navigation elements
    and returns a limited amount of clean text.
    """

    try:

        url = url.strip()

        if not url.startswith(
            (
                "http://",
                "https://",
            )
        ):

            return (
                "Scraping failed: "
                "invalid URL."
            )


        response = requests.get(
            url,
            timeout=15,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 "
                    "(Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 "
                    "(KHTML, like Gecko) "
                    "Chrome/120.0 Safari/537.36"
                )
            },
        )


        response.raise_for_status()


        soup = BeautifulSoup(
            response.text,
            "html.parser",
        )


        # -------------------------------------------------
        # Remove unwanted elements
        # -------------------------------------------------

        for tag in soup(
            [
                "script",
                "style",
                "nav",
                "footer",
                "header",
                "aside",
                "form",
                "noscript",
            ]
        ):

            tag.decompose()


        # -------------------------------------------------
        # Extract text
        # -------------------------------------------------

        text = soup.get_text(
            separator=" ",
            strip=True,
        )


        # -------------------------------------------------
        # Clean excessive whitespace
        # -------------------------------------------------

        text = " ".join(
            text.split()
        )


        if not text:

            return (
                "The webpage did not "
                "contain readable text."
            )


        # Keep context manageable for the LLM.
        return text[:8000]


    except requests.exceptions.Timeout:

        return (
            "Could not scrape URL: "
            "request timed out."
        )


    except requests.exceptions.RequestException as error:

        return (
            "Could not scrape URL: "
            f"{str(error)}"
        )


    except Exception as error:

        return (
            "Could not scrape URL: "
            f"{str(error)}"
        )