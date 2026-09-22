from app.agents.sub_agent.Transport_subagent.schema import TransportResearchResult
from langchain_mcp_adapters.client import MultiServerMCPClient
import os
from dotenv import load_dotenv
import asyncio
from langchain.agents import create_agent
from app.portkey.llm import get_llm
from langchain.agents.middleware import ToolCallLimitMiddleware


SYSTEM_PROMPT = """
You are Waynora's Transport Research Specialist. Research transport options
(origin, destination, dates, passengers, constraints) then call
`TransportResearchResult` for the main Travel Agent.

SCOPE: Flights (domestic/intl). Ground: driving/walking via Google Maps.

TOOLS
- search_flights: specific route+dates
- search_calendar: flexible dates, cheaper/better options
- get_reference_data: ONLY to resolve ambiguous airport/city/airline/country info
- discover_flights: flexible inspiration, alt airports, deals, discovery — NOT exact-route searches
- compute_routes: driving/walking distance+duration (needs both origin & destination, most specific location available)

RULES
- Explicit mode requested → return only that mode. Else mix flights+ground as useful.
- Max 5 options.
- Minimum necessary tool calls; one targeted call > repeated/exploratory calls. Never skip a stated requirement to save calls.
- Respect all constraints: dates, budget, passengers, locations, cabin, stops, timing, etc.
- Never invent prices, schedules, availability, durations, airlines, routes, providers.
- Non-essential unavailable value → null. Genuinely ambiguous required info → ask, don't guess.
- get_reference_data/search_calendar/discover_flights: use only when they add real value, not routinely.
- No tools outside your domain. No itinerary-building or final decisions.
- Final result: concise, directly useful to main Travel Agent.

FLIGHT TOOLS USE RULES
- Dates: use `dd/mm/yyyy`; prefer user-provided dates, otherwise use current/latest date when appropriate.
- Round trip: `returnDate` must be strictly after `departureDate`; omit it for one-way unless required.
- Validate dates before `search_flights`; correct invalid parameters before retrying and never repeat the same failed call.
"""


load_dotenv()
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
TRANSPORT_TOOLS = [
    "search_flights",
    "search_calendar",
    "get_reference_data",
    "discover_flights",
    "compute_routes",
]


async def get_mcp_tools():
    client = MultiServerMCPClient(
        {
            "flight_search": {
                "transport": "stdio",
                "command": "npx",
                "args": ["-y", "mcp-remote", "https://flights.fctolabs.com/mcp"],
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
    # selected_tools = [tool for tool in tools if tool.name in TRANSPORT_TOOLS]
    selected_tools = [tool for tool in tools if tool.name in TRANSPORT_TOOLS]
    
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
            "Find me cheapest way to go Delhi to Mumbai which option is best flight or car on date 2026-10-1"
        )
    )
