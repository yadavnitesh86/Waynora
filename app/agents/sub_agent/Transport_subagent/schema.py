from datetime import datetime

from pydantic import BaseModel, Field


class TransportOption(BaseModel):
    mode: str = Field(description="Transportation mode: flight, train, or car.")

    origin: str
    destination: str

    departure: datetime | None = None
    arrival: datetime | None = None

    duration_minutes: int | None = Field(
        default=None,
        ge=0,
        description="Total travel duration in minutes, if available.",
    )

    price: float | None = Field(
        default=None, ge=0, description="Price of the transport option, if available."
    )

    currency: str | None = Field(
        default=None, description="Currency of the price, if available."
    )

    stops: int | None = Field(
        default=None, ge=0, description="Number of stops or connections, if applicable."
    )

    provider: str | None = Field(
        default=None,
        description="Airline, railway provider, or other transport provider.",
    )

    availability: str | None = Field(
        default=None, description="Availability information, if available."
    )

    source: str | None = Field(
        default=None, description="Source used to obtain this information."
    )


class TransportResearchResult(BaseModel):
    """Final transport research result. Call this once, when research is finished"""

    origin: str
    destination: str

    departure_date: str | None = None
    return_date: str | None = None

    options: list[TransportOption] = Field(default_factory=list)

    research_notes: list[str] = Field(default_factory=list)
