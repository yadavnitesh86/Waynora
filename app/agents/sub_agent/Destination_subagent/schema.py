from typing import Literal

from pydantic import BaseModel, Field


class Cost(BaseModel):
    amount: float = Field(description="0 means free")
    currency: str = Field(description="ISO code, e.g. INR")
    per_person: bool = True
    basis: Literal["sourced", "estimated"] = "estimated"


class Duration(BaseModel):
    minutes: int
    basis: Literal["sourced", "estimated"] = "estimated"


class Area(BaseModel):
    name: str
    description: str
    suitable_for: list[str]
    latitude: float | None = None
    longitude: float | None = None


class Attraction(BaseModel):
    name: str
    category: str
    description: str
    area: str | None = Field(default=None, description="Name of one of the areas")
    latitude: float | None = None
    longitude: float | None = None
    duration: Duration | None = Field(default=None, description="None if unknown")
    cost: Cost | None = Field(default=None, description="None if unknown; never guess")
    suitable_for: list[str]


class Activity(BaseModel):
    name: str
    category: str
    description: str
    area: str | None = Field(default=None, description="Name of one of the areas")
    duration: Duration | None = Field(default=None, description="None if unknown")
    cost: Cost | None = Field(default=None, description="None if unknown; never guess")
    suitable_for: list[str]


class DestinationResearchResult(BaseModel):
    """Final research result. Call this once, when research is finished."""

    destination: str
    summary: str = Field(description="2-3 sentences")
    areas: list[Area] = Field(max_length=5)
    attractions: list[Attraction] = Field(max_length=5)
    activities: list[Activity] = Field(max_length=5)
    practical_notes: list[str] = Field(max_length=3)
    sources: list = Field(max_length=5)
