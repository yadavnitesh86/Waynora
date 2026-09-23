from dotenv import load_dotenv
import os
import json
import httpx
from typing import Optional
from datetime import datetime
from mcp.server.fastmcp import FastMCP
load_dotenv()

mcp = FastMCP("RailRadar-Train-Search")

API_KEY = os.getenv("RAILRADAR_API_KEY", "")
BASE_URL = "https://api.railradar.in/v1"

# Maps Python's weekday() number to the API's day-name format
WEEKDAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


@mcp.tool()
async def search_trains_between_stations(
    from_station: str,
    to_station: str,
    date: Optional[str] = None
) -> str:
    """
    Find trains between two railway stations, optionally filtered to a specific date.

    Args:
        from_station: Origin station code (e.g., 'NDLS', 'ADI').
        to_station: Destination station code (e.g., 'BCT', 'HWH').
        date: Optional travel date in YYYY-MM-DD format. If given, only trains
              that actually run on that day of the week are returned.

    Returns:
        A JSON string with the list of matching trains and their timings.
    """
    if not API_KEY:
        return "Error: API key not set."

    from_station = from_station.upper()
    to_station = to_station.upper()

    url = f"{BASE_URL}/trains/between/{from_station}/{to_station}"
    headers = {"Authorization": f"Bearer {API_KEY}"}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as e:
            return f"Error fetching train data: {e}"

    trains = data.get("data", {}).get("trains", [])

    # If a date was given, keep only trains that run on that weekday
    if date:
        weekday = WEEKDAYS[datetime.strptime(date, "%Y-%m-%d").weekday()]
        trains = [t for t in trains if weekday in t["train"]["runDays"]]

    return json.dumps({
        "from": from_station,
        "to": to_station,
        "date": date,
        "day_checked": weekday if date else None,
        "count": len(trains),
        "trains": trains
    }, indent=2)


if __name__ == "__main__":
    mcp.run(transport="stdio")