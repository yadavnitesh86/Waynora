import asyncio

import logfire
from deepagents import CompiledSubAgent
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from app.portkey.wrap_error import wrap_error

from app.agents.sub_agent.AccommodationWeather_subagent.schema import (
    AccommodationWeatherResult,
)
from app.portkey.llm import get_llm

load_dotenv()


SYSTEM_PROMPT = """
You are Waynora's Accommodation & Weather Specialist. Research accommodation
and, when relevant, weather for the trip, then return structured information
for the main Travel Agent.

CRITICAL: When processing tool results, use only text/structured data. Do not
parse, render, or pass binary images, map blocks, thumbnails, or other media.

MUST end with `AccommodationWeatherResult` only — never plain text/markdown.
MUST use tools for research do not make assumptions using own knowledge 

ACCOMMODATION
- Use destination, dates, guests, rooms, budget, and preferences from the request.
- Return at most 5 relevant accommodation options.
- `search_hotels`: ALWAYS use first for normal hotel discovery. Returns candidates
  and `entity_key`.
- `get_hotel_details`: use only for detailed information about ONE hotel; the
  `entity_key` must come from `search_hotels`.
- `search_hotels_with_details`: use when comparing rooms, rates, or cancellation
  policies across multiple hotels.
- Apply relevant filters for budget, hotel class, amenities, cancellation, etc.
- Never invent prices, availability, ratings, amenities, or hotel information.

WEATHER (only if relevant)
- `get_forecast`: future travel dates/forecast.
- `get_weather_summary`: broad weather overview.
- Skip weather entirely for accommodation-only requests.
- Never invent weather conditions or alerts.

TOOLS
- Use the minimum calls necessary; never repeat identical calls.
- Prefer `search_hotels` before any detailed hotel tool.
- Do not call detailed tools unless the user's request requires detailed data.
- Do not call every available weather tool; choose only what is relevant.

QUALITY
- Tool output is the source of truth. Mark unavailable information as unavailable.
- Never guess or make unsupported recommendations.
- Do not perform budget calculations; Python handles deterministic calculations.
- Provide factual pricing needed by the main agent.
- Do not build the full itinerary.

OUTPUT
- Help the main agent evaluate accommodation, pricing, location, and weather impact.
- Before returning: verify relevance, remove unsupported claims, include no invented
  values, and return at most 5 accommodations.
- Return ONLY `AccommodationWeatherResult`.
"""

AW_tools = [
    "search_hotels",
    "get_hotel_details",
    "search_hotels_with_details",
    "get_forecast",
]


async def get_mcp_tools():

    with logfire.span("Getting MCP tools for AccommodationWeather subagent"):
        client = MultiServerMCPClient(
            {
                "google_hotels": {
                    "transport": "stdio",
                    "command": "stays",
                    "args": ["mcp"],
                },
                "weather": {
                    "transport": "stdio",
                    "command": "npx",
                    "args": [
                        "-y",
                        "@dangahagan/weather-mcp@latest",
                        "--preset",
                        "basic",
                    ],
                },
            }
        )

        try:
            tools = await client.get_tools()

            selected_tools = [tool for tool in tools if tool.name in AW_tools]

            logfire.info(
                f"Selected {len(selected_tools)} tools: "
                f"{[t.name for t in selected_tools]}"
            )

            return selected_tools

        except Exception as e:
            logfire.error(f"Error getting AccommodationWeather's MCP tools: {e}")
            return []


async def create_AW_agent():

    llm = await get_llm("lite")
    mcp_tools = await get_mcp_tools()

    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=AccommodationWeatherResult,
        middleware=[wrap_error]
    )


async def create_AW_subagent():
    AW_agent = await create_AW_agent()

    return CompiledSubAgent(
        name="Accommodation_Weather_research",
        description=(
            """
            Specialist for accommodation and weather research. Use this agent when
            the trip requires hotel/accommodation options, accommodation pricing or
            details, or weather information for the destination and travel dates.
            It returns structured, tool-verified accommodation and weather data for
            the main Travel Agent and does not create the final itinerary.
    """
        ),
        runnable=AW_agent,
    )


# Bellow code is for Testing while developing the sub agent


async def AW_subagent(Instruction: str):

    agent = await create_AW_agent()
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": Instruction}]}
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(
        AW_subagent(
            "I want to go to manali from 15/11/2026 to 20/11/2026 for 2 adults and 1 child"
        )
    )
