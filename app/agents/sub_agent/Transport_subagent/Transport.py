from app.agents.sub_agent.Transport_subagent.schema import TransportResearchResult
from langchain_mcp_adapters.client import MultiServerMCPClient
import sys
import os
from dotenv import load_dotenv
import asyncio
from langchain.agents import create_agent
from app.portkey.llm import get_llm
from langchain.agents.middleware import ToolCallLimitMiddleware

SYSTEM_PROMPT = """
You are Waynora's Transport Research Specialist. Research transport options
(origin, destination, dates, passengers, constraints) - You MUST end every response by calling `TransportResearchResult`. 
  Never respond with plain text/markdown as your final answer.

SCOPE: Flights (domestic/intl), Trains (India), Ground (driving/walking via Google Maps).

TOOLS
- search_flights: specific route+dates
- search_calendar: flexible dates, cheaper/better options
- discover_flights: flexible inspiration, alt airports, deals — NOT exact-route searches
- get_reference_data: resolve ambiguous airport/city/airline/country/station info only
- compute_routes: driving/walking distance+duration, needs specific origin+destination
- search_trains_between_stations: needs from_station/to_station as CODES (e.g. NDLS, ADI) — resolve via get_reference_data if given as city/station name. Optional date (YYYY-MM-DD) filters to trains running that weekday.
- search_flights: always pass top_n=5 (or equivalent) to limit results at the source.

RULES
- Explicit mode requested → only that mode; else mix flights+trains+ground as useful. Max 5 options.
- Minimum necessary tool calls; one targeted call > exploratory ones. Never skip a stated requirement to save calls.
- Respect all constraints (dates, budget, passengers, locations, cabin, stops, timing).
- Never invent prices, schedules, availability, durations, airlines, routes, providers, train numbers.
- Non-essential unavailable value → null. Ambiguous required info → ask, don't guess.
- get_reference_data/search_calendar/discover_flights → use only when they add real value.
- No tools outside domain. No itinerary-building or final decisions. Keep result concise.

DATES
- Flights: dd/mm/yyyy. Trains: YYYY-MM-DD. Prefer user dates, else current date.
- Round trip: returnDate strictly after departureDate; omit for one-way unless required.
- Validate before calling; fix and retry once, never repeat a failed call unchanged.
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
    tools = await client.get_tools()
    selected_tools = [tool for tool in tools if tool.name in TRANSPORT_TOOLS]
    for tool in selected_tools:
        print(tool.name)
        print(tool.description)



    return selected_tools


async def Transport_initiation():
    llm = get_llm("lite")
    mcp_tools = await get_mcp_tools()
    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=TransportResearchResult,
    )


async def destination_subagent(Instruction: str):
    agent = await Transport_initiation()
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": Instruction}]}
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(
        destination_subagent(
            "Find me cheapest way to tavel from ahmedabad to Jaipur . Give all travel options result for date 8 nov 2026 "
        )
    )
    
