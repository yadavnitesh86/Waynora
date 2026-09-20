from pydantic import BaseModel , Field


class Cost(BaseModel):
    amount: float
    currency: str
    per_person: bool = True

class Duration(BaseModel):
    minutes: int

class Source(BaseModel):
    title: str
    url: str
    source_type: str

class Area(BaseModel):
    name :str 
    description :str 
    suitable_for : str 

class Attraction(BaseModel):
    name :str
    category:str
    description:str
    estimated_visit_duration : Duration
    estimated_cost : Cost
    suitable_for :int


class Activity(BaseModel):
    name: str
    category: str
    description: str
    estimated_duration: Duration
    estimated_cost: Cost
    suitable_for: list[str]

class DestinationResearchResult(BaseModel):
    destination: str
    summary: str
    areas: list[Area] = Field(max_length=5)
    attractions: list[Attraction] = Field(max_length=8)
    activities: list[Activity] = Field(max_length=5)
    practical_notes: list[str] = Field(max_length=3)
    sources: list[Source] = Field(max_length=5)
