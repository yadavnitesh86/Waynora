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
config = {"configurable": {"thread_id": "Test_run_01"}}
memory = InMemorySaver() 
async def record_agent_run(User_input:str ) -> dict:
   agent= await build_agent(checkpointer=memory)
   result = await agent.ainvoke({'messages': [{"role" : "user", "content": User_input}]}, config=config)
   messages = result.get("messages", [])
   actual_output = ""
   for message in reversed(messages):
        if isinstance(message, AIMessage) and message.content:
            actual_output = message.content
            break
   record = {
        "input": User_input,
        "actual_output": actual_output,
    }
   path = Path("data/waynora_traces.jsonl")
   path.parent.mkdir(parents=True, exist_ok=True)

   with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")
   return record

if __name__ == "__main__":
    print("reached till main")
    asyncio.run(record_agent_run("""Plan a budget-friendly 6-day trip from Delhi, India, to London, United Kingdom, for 2 adults. Assume travel dates are 10–15 November 2026, and the total budget is ₹2,50,000 for both travelers, including round-trip flights, accommodation, local transport, food, attractions, and a reasonable contingency. If these dates or costs cannot be verified, clearly state your assumptions and do not present estimates as confirmed prices.

Organize the itinerary day by day, with morning, afternoon, and evening activities. Recommend the cheapest practical round-trip flight options, including likely baggage restrictions, layovers, and total journey time where reliable data is available. Suggest affordable accommodation in a well-connected area, with the estimated total stay cost and transport access.

Include major London attractions, identify free attractions versus paid attractions, and note where advance booking is recommended. Recommend affordable places to eat or specific budget-friendly food areas. Estimate expenses in both INR and GBP, explain the exchange-rate assumption, and calculate the overall budget. Account for airport transfers, realistic travel time between activities, opening-day constraints where known, and rest time. If the budget is unrealistic, explain why and propose the most practical adjustments. """ ))