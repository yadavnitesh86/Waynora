import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from portkey_ai import PORTKEY_GATEWAY_URL, createHeaders

load_dotenv()


def get_llm(model_type: str) -> ChatOpenAI:
    """
    Return a LangChain chat model configured through Portkey.

    model_type:
        - "heavy"
        - "lite"
    """

    configs = {
        "heavy": os.getenv("PORTKEY_HEAVY_CONFIG"),
        "lite": os.getenv("PORTKEY_LITE_CONFIG"),
    }

    if model_type not in configs:
        raise ValueError(
            f"Invalid model_type: {model_type}. "
            "Expected 'heavy' or 'lite'."
        )

    config = configs[model_type]

    if not config:
        raise ValueError(
            f"Portkey config for '{model_type}' is not configured."
        )

    return ChatOpenAI(
        # Portkey Config determines the actual model.
        # This value is not your real provider model.
        model="default",

        # Authentication is handled by Portkey.
        api_key="dummy",
        streaming=True,

        # Send the request through Portkey.
        base_url=PORTKEY_GATEWAY_URL,

        # Tell Portkey which Config to use.
        default_headers=createHeaders(
            api_key=os.getenv("PORTKEY_API_KEY"),
            config=config,
        ),
    )