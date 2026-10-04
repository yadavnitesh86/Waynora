
from pydantic import BaseModel, Field


class AccommodationOption(BaseModel):
    name: str
    location: str
    price_per_night: float | None = None
    currency: str | None = None
    rating: float | None = None
    amenities: list[str] = Field(default_factory=list)
    suitability: str
    source: str | None = None


class WeatherSummary(BaseModel):
    date: str
    condition: str
    temperature_min: float | None = None
    temperature_max: float | None = None
    precipitation_probability: float | None = None
    travel_impact: str


class AccommodationWeatherResult(BaseModel):
    destination: str
    accommodations: list[AccommodationOption]
    weather: list[WeatherSummary]
    important_notes: list[str] = Field(default_factory=list)
