from langchain.agents.middleware import SummarizationMiddleware
from langchain.agents.middleware import PIIMiddleware
from app.portkey.llm import get_llm


PASSWORD_SHARE_PATTERN = (r"(?i)\b(?:my\s+)?(?:password|passwrod|passwd|pwd)\s*(?:is|=|:)\s*\S+")
PASSWORD_IN_RESPONSE_PATTERN = (r'(?i)(?:password|passwrod|passwd|pwd)\s*["\']?[\w!@#$%^&*.-]{3,}["\']?')
middleware =[
    SummarizationMiddleware(model=get_llm("lite"),trigger=("tokens", 6000),keep=("messages", 10)),
    PIIMiddleware("password_share",detector=PASSWORD_SHARE_PATTERN,strategy="redact",apply_to_input=True,apply_to_output=True,),
    PIIMiddleware("password_output",detector=PASSWORD_IN_RESPONSE_PATTERN,strategy="redact",apply_to_output=True,apply_to_tool_results=True,),
    PIIMiddleware("credit_card", strategy="mask", apply_to_input=True),
    PIIMiddleware("email", strategy="redact", apply_to_input=True),
    PIIMiddleware("phone",detector=r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",strategy="redact",apply_to_input=True,),
]