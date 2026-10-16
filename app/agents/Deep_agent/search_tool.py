# pip install parallel-web langchain-core
# env: PARALLEL_API_KEY=...
import os
import asyncio
from parallel import Parallel
from langchain_core.tools import tool
from dotenv import load_dotenv
load_dotenv()
client = Parallel(api_key=os.getenv("PARALLEL_API_KEY"))

@tool
async def web_search(objective: str, search_queries: list[str]) -> str:
    """
     FALLBACK ONLY. Search the live web ONLY when a subagent has explicitly failed or did not return required data.
    STRICT RULES:
    - NEVER call this tool on the first turn or in parallel with subagents.
    - NEVER use this tool for flight search, hotel booking, weather, or attraction research as a primary choice.
    - Specialized subagents (transport_research, etc.) MUST always be called first.
    - Use this tool ONLY if a subagent returns an error/failure or cannot provide essential information.
    objective: one concise, self-contained sentence describing what you want to find.
    search_queries: 3 diverse keyword queries (3-6 words each). No sentences, no site: operators.
    """
    try:
        # SDK call is sync, so run it in a thread to keep the agent's event loop free
        resp = await asyncio.to_thread(
            client.search,
            objective=objective,
            search_queries=search_queries,
        )
    except Exception as e:
        return f"Search failed: {e}"

    if not resp.results:
        return "No results found."

    return "\n\n".join(
        f"Title: {r.title}\nURL: {r.url}\nExcerpts:\n" + "\n".join((r.excerpts or [])[:3])
        for r in resp.results
    )
