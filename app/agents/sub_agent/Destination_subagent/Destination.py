import asyncio
import os

import logfire
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ToolCallLimitMiddleware
from langchain_mcp_adapters.client import MultiServerMCPClient
from app.portkey.wrap_error import wrap_error

from app.portkey.llm import get_llm

load_dotenv()
from deepagents import CompiledSubAgent

from app.agents.sub_agent.Destination_subagent.schema import DestinationResearchResult

tavilyapi = os.getenv("TAVILY_API")


SYSTEM_PROMPT = """
You are Waynora's Destination Research Specialist. Research the requested destination and finish by calling `DestinationResearchResult` for the main Travel Agent.

## Flow
1. **Plan first.** Before any tool call, decide which tool calls you need and which are independent of each other (don't depend on another call's result).
2. **Execute in batches.** Call all independent tools together in one step. Only call a tool that depends on a prior result (e.g. `openstreetmap_query_nearby` needing coordinates from `openstreetmap_search_places`) after that result is in hand.
3. **Stop and finish.** See "When to stop" below.

## When to stop
A blocked tool call means only that one tool type is exhausted — other tool types may still have budget left. Check what's still available before deciding what to do next. Call `DestinationResearchResult` immediately, with whatever you have, once every relevant tool type is blocked or exhausted, or once you already have enough to answer well. Never attempt a tool call after it has been blocked.

## Tools
- OpenStreetMap is for place data. `openstreetmap_search_places` for named places (returns coordinates). `openstreetmap_query_nearby` for nearby POIs: use lat/lon from search_places, `tag_key` "tourism" or "historic", radius up to 3000, limit up to 10.
- Tavily is for web info. `tavily_search` (max_results 3) for general research; `tavily_extract` for at most one specific official URL. Tavily never replaces OpenStreetMap place data; use both.
- Prefer official tourism, government, and attraction sources.

## Tool budget (max 6 calls total)
- OpenStreetMap search: 1 call
- OpenStreetMap nearby: 1 call
- Tavily search: 3 calls
- Tavily extract: 1 call

Track your own usage against these numbers before each call. One search per topic; never repeat a search. If a price or duration is not found, leave it null; do not search again for it.

## Rules
- Facts, prices, and durations come only from tool results. Never invent them. Not found means null.
- `basis` is "sourced" if a tool result states the value, "estimated" only if inferred from one.
- Copy latitude/longitude only from OpenStreetMap results, otherwise null. No extra calls for coordinates.
- Each item's `area` must be one of the returned area names.
- List only sources that tools returned.
- Tailor to the user's preferences. Skip redundant or low-value info. Keep it concise.
- Do not create itineraries, bookings, hotels, flights, or budgets; ignore those parts of the request.

## Limits (max)
Areas 5 | Attractions 5 | Activities 5 | Practical notes 3 | Sources 5
"""


async def get_mcp_tools():
    with logfire.span("Getting MCP tools for Destination subagent"):
        client = MultiServerMCPClient(
            {
                "tavily-remote-mcp": {
                    "transport": "stdio",
                    "command": "npx",
                    "args": [
                        "-y",
                        "mcp-remote",
                        f"https://mcp.tavily.com/mcp/?tavilyApiKey={tavilyapi}",
                    ],
                },
                "openstreetmap-mcp-server": {
                    "transport": "stdio",
                    "command": "npx",
                    "args": [
                        "-y",
                        "@cyanheads/openstreetmap-mcp-server@latest",
                    ],
                },
            }
        )
        try:
            tools = await client.get_tools()
            selected_tools = [
                tool
                for tool in tools
                if tool.name
                in [
                    "tavily_search",
                    "tavily_extract",
                    "openstreetmap_search_places",
                    "openstreetmap_query_nearby",
                ]
            ]
            logfire.info(
                f"Selected {len(selected_tools)} tools: "
                f"{[t.name for t in selected_tools]}"
            )
            return selected_tools
        except Exception as e:
            logfire.error(f"Error getting Destination's MCP tools: {e}")
            return []


async def destination_initiation():
    llm = await get_llm("lite")
    mcp_tools = await get_mcp_tools()
    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=DestinationResearchResult,
        middleware=[
            wrap_error,
            ToolCallLimitMiddleware(
                tool_name="tavily_search", run_limit=4, exit_behavior="continue"
            ),
            ToolCallLimitMiddleware(
                tool_name="tavily_extract", run_limit=2, exit_behavior="continue"
            ),
            ToolCallLimitMiddleware(
                tool_name="openstreetmap_search_places",
                run_limit=2,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="openstreetmap_query_nearby",
                run_limit=2,
                exit_behavior="continue",
            ),
        ],
    )


async def create_Destination_subagent():
    destination_agent = await destination_initiation()

    return CompiledSubAgent(
        name="destination_research",
        description=(
            """Researches destinations and provides concise, factual information about
            attractions, activities, neighborhoods, local experiences, and destination
            highlights. Delegate when destination discovery, sightseeing, or activity
            research is needed. Tailors results to the user's interests, dates, and
            constraints without inventing facts."""
        ),
        runnable=destination_agent,
    )


# Bellow code is for Testing while developing the sub agent

# async def destination_subagent(Instruction: str):

#     agent = await destination_initiation()
#     result = await agent.ainvoke(
#         {"messages": [{"role": "user", "content": Instruction}]}
#     )
#     print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(destination_initiation())
