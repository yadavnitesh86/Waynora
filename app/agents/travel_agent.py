from deepagents import create_deep_agent
from app.portkey.llm import get_llm
from dotenv import load_dotenv

load_dotenv()

agent = create_deep_agent(
    model=get_llm("heavy"),
    system_prompt="You are a helpful assistant",
)

# Run the agent
result = agent.invoke(
    {"messages": [{"role": "user", "content": "Hello tell me a joke"}]}
)
print(result['messages'][-1].content)