import json
import logfire

from pathlib import Path
from langchain_core.messages import AIMessage
from app.agents.Deep_agent.travel_agent import  build_agent
import asyncio
from dotenv import load_dotenv
import os
from langgraph.checkpoint.memory import InMemorySaver
load_dotenv()
logfire.configure(token=os.getenv("LOGFIRE_TOKEN"))
config = {"configurable": {"thread_id": "Test_run_03"}}
memory = InMemorySaver() 
async def record_agent_run(User_input:str ) -> dict:
   agent= await build_agent(checkpointer=memory)
   result = await agent.ainvoke({'messages': [{"role" : "user", "content": User_input}]}, config=config)
   messages = result.get("messages", [])
   actual_output = ""
   for message in reversed(messages):
        if isinstance(message, AIMessage) and message.content:
            output = message.content
            break
   record = {
        "input": User_input,
        "output": actual_output,
    }
   path = Path("data/waynora_traces.jsonl")
   path.parent.mkdir(parents=True, exist_ok=True)

   with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
   return record

if __name__ == "__main__":
    print("reached till main")
    asyncio.run(record_agent_run("""My partner and I will arrive at Charles de Gaulle Airport in Paris at 09:00 on 14 November 2026 and leave from the same airport at 20:00 on 15 November 2026. We need accommodation costing no more than €150 per night, and we have €250 total for attraction tickets.

We want to see the Eiffel Tower, Louvre Museum, Notre-Dame Cathedral, Montmartre, Sacré-Cœur, Arc de Triomphe, and Champs-Élysées. We would also like to take a Seine river cruise if time and budget allow.

Create a two-day sightseeing plan with transport options, estimated journey times, meals, and approximate attraction costs. We want to experience the main highlights without rushing excessively. Please suggest which attractions are most worthwhile if we cannot comfortably fit everything into the available time. """ ))