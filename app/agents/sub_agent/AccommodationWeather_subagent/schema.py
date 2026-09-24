from pydantic import BaseModel, Field
from typing import Optional


class AccommodationOption(BaseModel):
    name: str
    location: str
    price_per_night: Optional[float] = None
    currency: Optional[str] = None
    rating: Optional[float] = None
    amenities: list[str] = Field(default_factory=list)
    suitability: str
    source: Optional[str] = None


class WeatherSummary(BaseModel):
    date: str
    condition: str
    temperature_min: Optional[float] = None
    temperature_max: Optional[float] = None
    precipitation_probability: Optional[float] = None
    travel_impact: str


class AccommodationWeatherResult(BaseModel):
    destination: str
    accommodations: list[AccommodationOption]
    weather: list[WeatherSummary]
    important_notes: list[str] = Field(default_factory=list)