from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1)
    thread_id: str | None = Field(default=None, examples=[None])


class AskResponse(BaseModel):
    answer: str
    thread_id: str
