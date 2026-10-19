import asyncio

import logfire
from deepagents import CompiledSubAgent
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_mcp_adapters.client import MultiServerMCPClient
from app.portkey.wrap_error import wrap_error
from langchain.agents.middleware import ToolCallLimitMiddleware

from app.agents.sub_agent.AccommodationWeather_subagent.schema import (
    AccommodationWeatherResult,
)
from app.portkey.llm import get_llm
import os
import sys
from pathlib import Path
load_dotenv()
logfire.configure(token=os.getenv("LOGFIRE_TOKEN"))



SYSTEM_PROMPT = """
You are Waynora's Accommodation & Weather Specialist. Research accommodation
and, when relevant, weather for the trip, then return structured information
for the main Travel Agent.

CRITICAL: When processing tool results, use only text/structured data. Do not
parse, render, or pass binary images, map blocks, thumbnails, or other media.

MUST end with `AccommodationWeatherResult` only — never plain text/markdown.
MUST use tools for research do not make assumptions using own knowledge 

## ACCOMMODATION
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

## WEATHER (only if relevant)
- `get_forecast`: future travel dates/forecast.
- `get_weather_summary`: broad weather overview.
- Skip weather entirely for accommodation-only requests.
- Never invent weather conditions or alerts.

## TOOLS and crictal rules
- If a tool returns  “Tool call limit reached,” or “exceeded limit,” stop immediately and do not retry or use other tools to bypass it.
- Use the minimum calls necessary; never repeat identical calls.
- Prefer `search_hotels` before any detailed hotel tool.
- Do not call detailed tools unless the user's request requires detailed data.
- Do not call every available weather tool; choose only what is relevant.
- Run independent research in parallel. Avoid duplicate searches, unnecessary dependencies, repeated summaries, and repeated reasoning.
- Perform one final consistency pass. Do not sacrifice critical checks for speed.

**STRICT CALL BUDGET**:
  - Maximum 2-3 call to `search_hotels` or `search_hotels_with_details`.
  - Maximum 2-3 calls to `get_hotel_details` (only for top shortlisted hotels; NEVER call it for all results).
  - Maximum 1-2 call to `get_forecast`.

## QUALITY
- Tool output is the source of truth. Mark unavailable information as unavailable.
- Never guess or make unsupported recommendations.
- Do not perform budget calculations; Python handles deterministic calculations.
- Provide factual pricing needed by the main agent.
- Do not build the full itinerary.

## OUTPUT
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
        venv_bin = Path(sys.executable).parent
        stays_executable = venv_bin / (
            "stays.exe" if sys.platform == "win32" else "stays"
        )

        client = MultiServerMCPClient(
            {
                "google_hotels": {
                    "transport": "stdio",
                    "command": str(stays_executable),
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

            logfire.info(
                f"Discovered MCP tools: {[tool.name for tool in tools]}"
            )

            selected_tools = [
                tool for tool in tools if tool.name in AW_tools
            ]

            logfire.info(
                f"Selected {len(selected_tools)} tools: "
                f"{[tool.name for tool in selected_tools]}"
            )

            return selected_tools

        except Exception:
            logfire.exception(
                "Failed to retrieve AccommodationWeather MCP tools"
            )
            return []


async def create_AW_agent():

    llm = await get_llm("lite")
    mcp_tools = await get_mcp_tools()

    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=AccommodationWeatherResult,
        middleware=[wrap_error,
        ToolCallLimitMiddleware(
                tool_name="search_hotels", run_limit=4, exit_behavior="continue"
            ),
         ToolCallLimitMiddleware(
                tool_name="get_hotel_details", run_limit=4, exit_behavior="continue"
            ),
         ToolCallLimitMiddleware(
                tool_name="get_forecast", run_limit=2, exit_behavior="continue"
            ),
        ToolCallLimitMiddleware(
                tool_name="search_hotels_with_details", run_limit=2, exit_behavior="continue"
            ),
       
        ]
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
            """
Research accommodation options and April weather for a 10-day trip to Japan during cherry blossom season (April 2027). The traveler will need hotels in Tokyo, Kyoto, and possibly Osaka. Research:
- Typical April weather in Tokyo, Kyoto, and Osaka (temperatures, rainfall)
- Cherry blossom peak bloom timing for April 2027 across key viewing spots
- Accommodation pricing during cherry blossom peak season (which is extremely busy) in Tokyo and Kyoto
- Overall budget accommodation vs mid-range hotel price points
Return structured data with hotel price ranges and April weather details. Please provide factual, tool-verified data on weather and accommodation pricing.
"""
        )
    )
