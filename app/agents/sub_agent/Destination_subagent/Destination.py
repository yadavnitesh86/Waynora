from langchain_mcp_adapters.client import MultiServerMCPClient
import os
from dotenv import load_dotenv
import asyncio
from langchain.agents import create_agent
from app.portkey.llm import get_llm

load_dotenv()
from app.agents.sub_agent.Destination_subagent.schema import DestinationResearchResult

tavilyapi = os.getenv("TAVILY_API")


SYSTEM_PROMPT = """You are Waynora's Destination Research Specialist. Research the requested destination and return a `DestinationResearchResult` for the main Travel Agent.

## Tools
- OpenStreetMap is for all place/geographic data: `openstreetmap_search_places` for named places, `openstreetmap_query_nearby` for nearby POIs.
- Tavily is for web info: `tavily_search` for general research, `tavily_extract` only when a specific URL needs detailed reading. Tavily never replaces OpenStreetMap place data; use both when appropriate.
- Use the minimum number of tool calls needed. Never repeat a search for information already obtained. Cross-check important facts when practical.

## Rules
- Facts, prices, and durations must come from tool results. Never invent them.
- Prefer official tourism, government, and attraction sources.
- Tailor everything to the user's preferences. Skip redundant or low-value info.
- Do not create the itinerary, book anything, or handle hotels, flights, or final budget.

## Output
Return only `DestinationResearchResult`: destination, summary, areas, attractions and activities (each with category, description, duration, cost, suitability), practical notes, sources. Use the `Cost`, `Duration`, and `Source` models consistently. Keep it concise and useful to the Travel Agent.

## Research Limits (maximum)
Areas: 5 | Attractions: 8 | Activities: 5 | Practical notes: 3 | Sources: 5
Prioritize the most relevant information based on the user's preferences.
Avoid redundant or low-value information.
"""


async def get_mcp_tools():
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
    for tool in selected_tools:
        print(tool.name)
        print(tool.description)
        print()
    return tools


async def destination_initiation():
    llm = get_llm("heavy")
    mcp_tools = await get_mcp_tools()
    return create_agent(
        model=llm,
        tools=mcp_tools,
        system_prompt=SYSTEM_PROMPT,
        response_format=DestinationResearchResult,
    )


async def destination_subagent(Instruction: str):
    """Use this agent when destination-specific research is needed.

    Provide:
    - destination
    - travel dates/season if known
    - trip duration if relevant
    - traveler type
    - interests/preferences
    - the specific information you need researched

    Ask it to research relevant areas, attractions, activities, and destination-specific
    constraints that may affect itinerary planning.

    Do not delegate full trip planning, itinerary creation, flights, hotels,
    transportation planning, or final budget calculations to this agent."""

    agent = await destination_initiation()
    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": Instruction}]}
    )
    print(result["messages"][-1].content)


if __name__ == "__main__":
    asyncio.run(
        destination_subagent("Research Jaipur for a 3-day family trip with kids.   ")
    )
