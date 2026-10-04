import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from portkey_ai import PORTKEY_GATEWAY_URL, createHeaders

load_dotenv()


async def get_llm(model_type: str) -> ChatOpenAI:
    """
    Return a LangChain chat model configured through Portkey.

    model_type:
        - "heavy"
        - "lite"
        "lite-A"
        "lite-T"
    """

    configs = {
        "heavy": os.getenv("PORTKEY_HEAVY_CONFIG"),
        "lite": os.getenv("PORTKEY_LITE_CONFIG"),
    }

    if model_type not in configs:
        raise ValueError(f"Invalid model_type: {model_type}. ")

    config = configs[model_type]

    if not config:
        raise ValueError(f"Portkey config for '{model_type}' is not configured.")
    if model_type == "heavy":
        streamingH = True
    else:
        streamingH = False

    return ChatOpenAI(
        model="default",
        api_key="dummy",
        model_kwargs={
            "parallel_tool_calls": True,
        },
        base_url=PORTKEY_GATEWAY_URL,
        streaming=streamingH,
        default_headers=createHeaders(
            api_key=os.getenv("PORTKEY_API_KEY"), config=config, request_timeout=900000
        ),
    )


def get_llm_for_summarization():
    return ChatOpenAI(
        model_name="sensenova-6.8-flash-lite",
        api_key=os.getenv("OPENAI_API_KEY1"),
        base_url="https://api.hcnsec.cn/v1",
    )
