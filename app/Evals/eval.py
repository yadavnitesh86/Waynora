from deepeval.metrics import AnswerRelevancyMetric, GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from deepeval.models import LangChainModel
from app.portkey.llm import get_llm
from langchain_openai import ChatOpenAI
import os 



def llm():
    return ChatOpenAI(
        model_name="sensenova-6.8-flash-lite",
        api_key=os.getenv("OPENAI_API_KEY1"),
        base_url="https://api.hcnsec.cn/v1",
    )

judge_model = LangChainModel(get_llm("heavy"))

request_satisfaction = GEval(
    name="Request Satisfaction",
    criteria=(
        "Evaluate whether the actual output satisfies the user's "
        "explicit travel-planning requirements. Identify missing "
        "requirements and unsupported claims."
    ),
    evaluation_params=[
        LLMTestCaseParams.INPUT,
        LLMTestCaseParams.ACTUAL_OUTPUT,
    ],
)

itinerary_coherence = GEval(
    name="Itinerary Coherence",
    criteria=(
        "Evaluate whether the itinerary is logically organized by day. "
        "Check activity order, schedule conflicts, travel-time "
        "plausibility, and whether the proposed activities fit "
        "reasonably into each day."
    ),
    evaluation_params=[
        LLMTestCaseParams.INPUT,
        LLMTestCaseParams.ACTUAL_OUTPUT,
    ],
)

answer_relevancy = AnswerRelevancyMetric()