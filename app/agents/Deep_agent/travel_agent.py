from deepagents import create_deep_agent ,HarnessProfile ,register_harness_profile
from app.portkey.llm import get_llm
from dotenv import load_dotenv
from app.agents.Deep_agent.Middleware import middleware ,PromptInjectionDetected
import asyncio
from langgraph.checkpoint.memory import InMemorySaver

load_dotenv()
SYSTEM_PROMPT="""You are a Travel agent name waynora
"""
register_harness_profile(
    "openai",  # e.g., "anthropic:claude-sonnet-4-6" or your specific provider key
    HarnessProfile(
        excluded_tools=frozenset(
            {"ls", "read_file", "write_file", "edit_file", "delete", "glob", "grep"}
        )
    ),
)
async def build_agent(checkpointer):
    return create_deep_agent(
            model=get_llm("heavy"),
            system_prompt=SYSTEM_PROMPT,
            middleware=middleware,
            checkpointer=checkpointer
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
          print("Sorry, I can't help with that request. Prompt injection detected ")
    except Exception as e:
        print(f"Agent error: {e}")   # log the real error for yourself
        reply = "Something went wrong. Please try again."

if __name__  == "__main__":
    asyncio.run(ask("""Plan a 5-day trip to Goa under 20000 rupees."""))

