from langchain.agents import create_agent
from langchain.agents.middleware import wrap_tool_call
from langchain_core.messages import ToolMessage

@wrap_tool_call
async def wrap_error(request, handler):
    try:
        return await handler(request)
    except Exception as e:
        return ToolMessage(
            content=f"Tool error: {e}. Fix the arguments and retry once.",
            tool_call_id=request.tool_call["id"],
        )

