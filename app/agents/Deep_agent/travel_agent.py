from deepagents import create_deep_agent ,HarnessProfile ,register_harness_profile
from app.portkey.llm import get_llm
from dotenv import load_dotenv
from app.agents.Deep_agent.Middleware import middleware ,PromptInjectionDetected
import asyncio
from langgraph.checkpoint.memory import InMemorySaver
from app.agents.sub_agent.AccommodationWeather_subagent.AccommodationWeather import create_AW_subagent
from app.agents.sub_agent.Destination_subagent.Destination import create_Destination_subagent
from app.agents.sub_agent.Transport_subagent.Transport import create_transport_subagent

load_dotenv()
SYSTEM_PROMPT="""You are a Travel agent name waynora
"""
register_harness_profile(
    "openai",  
    HarnessProfile(
        excluded_tools=frozenset(
            {"ls", "read_file", "write_file", "edit_file", "delete", "glob", "grep"}
        )
    ),
)

async def get_subagents():
    return [
        await create_AW_subagent(),
        await create_Destination_subagent(),
        await create_transport_subagent()
    ]

async def build_agent(checkpointer):
    return create_deep_agent(
            model=get_llm("heavy"),
            system_prompt=SYSTEM_PROMPT,
            middleware=middleware,
            checkpointer=checkpointer,
            subagents=await get_subagents(),

        )

async def ask(question:str):
  
    config = {"configurable": {"thread_id":"yadavnitesh86"}}
    agent = await build_agent(InMemorySaver())

    # Run the agent
    try:
        result = await agent.ainvoke(
            {"messages": [{"role": "user", "content": question}]},
            config=config
        )
        print(result['messages'][-1].content)
    except PromptInjectionDetected:
          print("Sorry, I can't help with that request. I am happy to help with travel related request ")
    except Exception as e:
        print(f"Agent error: {e}")   
            

if __name__  == "__main__":
    asyncio.run(ask("""Plan a 5-day trip to Goa under 20000 rupees."""))

