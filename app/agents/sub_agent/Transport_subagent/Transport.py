import os
import sys

import logfire
from deepagents import CompiledSubAgent
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ToolCallLimitMiddleware
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.agents.sub_agent.Transport_subagent.schema import TransportResearchResult
from app.portkey.llm import get_llm

SYSTEM_PROMPT = """
You are Waynora's Transport Research Specialist. Research transport options
(origin, destination, dates, passengers, constraints) - You MUST end every response by calling `TransportResearchResult`.
Never respond with plain text/markdown as your final answer.

SCOPE: Flights (domestic/intl), Trains (India), Ground (driving/walking via Google Maps).

TOOLS

* search_flights: specific route+dates
* search_calendar: flexible dates, cheaper/better options
* discover_flights: flexible inspiration, alt airports, deals — NOT exact-route searches
* get_reference_data: resolve ambiguous airport/city/airline/country/station info only
* compute_routes: driving/walking distance+duration, needs specific origin+destination
* search_trains_between_stations: needs from_station/to_station as CODES (e.g. NDLS, ADI) — resolve via get_reference_data if given as city/station name
* search_flights: always pass top_n=5 (or equivalent) to limit results at the source

RULES

* Explicit mode requested → only that mode; else mix flights+trains+ground as useful. Max 5 options.
* Use the minimum necessary tool calls. One targeted call > exploratory calls.
* HARD LIMIT: maximum 6 total tool calls per request.
* get_reference_data: maximum 2 calls and only when an identifier must be resolved. Reuse its result; never call it again for the same information.
* Never call a tool when the required information is already available from a previous tool result.
* Never repeat the same successful tool call unless new information or user requirements require it.
* Never enter a tool-call loop. Once sufficient information is available, stop using tools and call `TransportResearchResult`.
* Respect all constraints (dates, budget, passengers, locations, cabin, stops, timing).
* Never invent prices, schedules, availability, durations, airlines, routes, providers, train numbers.
* Non-essential unavailable value → null. Ambiguous required info → ask, don't guess.
* get_reference_data/search_calendar/discover_flights → use only when they add real value.
* No tools outside domain. No itinerary-building or final decisions. Keep result concise.

DATES

* Flights: dd/mm/yyyy. Trains: YYYY-MM-DD. Prefer user dates, else current date.
* Round trip: returnDate strictly after departureDate; omit for one-way unless required.
* Validate before calling; fix and retry once, never repeat a failed call unchanged.

"""

load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
TRANSPORT_TOOLS = [
    "search_flights",
    "search_calendar",
    "get_reference_data",
    "discover_flights",
    "compute_routes",
    "search_trains_between_stations",
]


async def get_mcp_tools():
    with logfire.span("Getting MCP tools for AccommodationWeather subagent"):
        client = MultiServerMCPClient(
            {
                "flight_search": {
                    "transport": "stdio",
                    "command": "npx",
                    "args": ["-y", "mcp-remote", "https://flights.fctolabs.com/mcp"],
                },
                "RailRadar-Train-Search": {
                    "transport": "stdio",
                    "command": sys.executable,
                    "args": [
                        "-m",
                        "app.agents.sub_agent.Transport_subagent.server",
                    ],
                },
                "google_maps": {
                    "transport": "streamable_http",
                    "url": "https://mapstools.googleapis.com/mcp",
                    "headers": {
                        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
                        "Content-Type": "application/json",
                        "Accept": "application/json, text/event-stream",
                    },
                },
            }
        )
        try:
            tools = await client.get_tools()
            selected_tools = [tool for tool in tools if tool.name in TRANSPORT_TOOLS]
            logfire.info(
                f"Selected {len(selected_tools)} tools: "
                f"{[t.name for t in selected_tools]}"
            )
        except Exception as e:
            logfire.error(f"Error getting Transport's MCP tools: {e}")
            return []

        return selected_tools


async def create_transport_agent():
    llm = await get_llm("lite")
    mcp_tools = await get_mcp_tools()
    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=TransportResearchResult,
        middleware=[
            ToolCallLimitMiddleware(
                tool_name="get_reference_data",
                run_limit=2,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                run_limit=8,
                exit_behavior="continue",
            ),
        ],
    )


async def create_transport_subagent():
    transport_agent = await create_transport_agent()

    return CompiledSubAgent(
        name="transport_research",
        description=(
            "Research current transportation options for a route: flights, Indian trains, "
            "and driving/walking. Use for prices, schedules, availability, routes, duration, "
            "and transport constraints. Returns up to 5 factual options; does not build "
            "itineraries or make final transport decisions."
        ),
        runnable=transport_agent,
    )


# Bellow code is for Testing while developing the sub agent

# async def transport_subagent(Instruction: str):
#     agent = await create_transport_agent()
#     result = await agent.ainvoke(
#         {"messages": [{"role": "user", "content": Instruction}]}
#     )
#     print(result["messages"][-1].content)


# if __name__ == "__main__":
#     asyncio.run(
#         get_mcp_tools()
#     )
