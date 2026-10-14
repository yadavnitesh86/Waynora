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
    Search the live web for current events, prices, and recent facts.

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
