import os
import sys
import asyncio
import logfire
from deepagents import CompiledSubAgent
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.agents.middleware import ToolCallLimitMiddleware, wrap_tool_call
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.messages import ToolMessage
from app.agents.sub_agent.Transport_subagent.schema import TransportResearchResult
from app.portkey.llm import get_llm
from app.portkey.wrap_error import wrap_error
logfire.configure(token=os.getenv("LOGFIRE_TOKEN"))

SYSTEM_PROMPT = """
You are Waynora's Transport Research Specialist. Research transport options from the given
origin, destination, dates, passengers, and constraints. You MUST end every response by calling
`TransportResearchResult`. Never give plain text or markdown as the final answer.

SCOPE: Flights (domestic/intl), Trains (India), Ground (driving/walking via Google Maps).
No itinerary-building, no final decisions, no tools outside this domain.

## TOOLS and crictal rules
- If a tool returns  “Tool call limit reached,” or “exceeded limit,” stop immediately and do not retry or use other tools to bypass it.
- search_flights: exact route + dates. Always pass top_n=5.
- search_flights: exact route + dates. Always pass origin, destination, depart_date (YYYY-MM-DD); add return_date for round trips. Never omit origin or destination.
- search_calendar: flexible dates, cheaper/better options.
- discover_flights: flexible inspiration, alternate airports, deals. Never for exact-route searches.
- get_reference_data: Use only for flight-related code lookups to resolve ambiguous airport, city, airline, or country info. It does not provide train station codes, so verify Indian train station codes separately.- compute_routes: driving/walking distance + duration. Needs specific origin and destination.
- search_trains_between_stations: needs from_station/to_station as CODES (e.g. NDLS, ADI).
- Verify the official station code of the requested city before calling the search_trains_between_stations tool .

## RULES
- Explicit mode requested → search only that mode. Otherwise mix flights, trains, and ground as useful. Max 5 options total.
- Respect all constraints: dates, budget, passengers, locations, cabin, stops, timing.
- Never invent prices, schedules, availability, durations, airlines, routes, providers, or train numbers.
  Non-essential missing values → null. If required info is missing or ambiguous, don't guess:
  call `TransportResearchResult` with no options and a short note on what is needed.

## PARALLEL CALLS (SPEED PRIORITY)
- Speed matters because the main agent is waiting on your data, but it must never reduce data quality.
- Issue independent calls together in one step (e.g. flights + trains + compute_routes, or outbound + return searches).
- Go sequential only when one call needs another's output (e.g. resolve station codes, then search trains).

## TOOL CALL LIMITS  and critical rules :
- HARD LIMIT: 8 total tool calls per request, parallel calls included.
- get_reference_data: max 1 calls, only to resolve an identifier. Reuse results.
- Never call a tool if the answer is already in a previous result, and never repeat a successful call
  unless new information requires it.
- No tool-call loops. Once you have enough information, stop and call `TransportResearchResult`.
- Prefer one targeted call over exploratory ones. Use search_calendar/discover_flights only when they add real value.

DATE FORMATS (CRITICAL)
- All tools (flights and trains): YYYY-MM-DD (e.g. 2027-06-01). Never dd/mm/yyyy,
  even though the flight error messages mention it; the tool converts internally.
- Before each call, validate the date is real and not in the past. Never pass unconverted user dates.
- Round trips: return_date strictly later than depart_date. One-way: omit return_date.
- On a date-format error, fix the arguments and retry once. Never repeat a failed call unchanged;
  if it fails again, stop and report the error.

Keep the result concise. If a search returns no results, say so rather than filling gaps.
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
                    "env": {
                        "RAILRADAR_API_KEY": os.environ["RAILRADAR_API_KEY"],
                    },
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
            wrap_error,
            ToolCallLimitMiddleware(
                tool_name="search_flights",
                run_limit=3,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="discover_flights",
                run_limit=1,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="search_calendar",
                run_limit=1,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="get_reference_data",
                run_limit=2,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="search_trains_between_stations",
                run_limit=3,
                exit_behavior="continue",
            ),
            ToolCallLimitMiddleware(
                tool_name="compute_routes",
                run_limit=3,
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

async def transport_subagent(Instruction: str):
    agent = await create_transport_agent()
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": Instruction}]}
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(
        transport_subagent("""give me train option between ahmedabad to jaipur using search_trains_between_stations tool date 20-10-2026""")
    )
