"""Vision-related response schemas."""

from pydantic import BaseModel


class VisionResponse(BaseModel):
    """Response from the vision / image-analysis endpoint."""

    description: str
    has_sensitive_data: bool = False
    steps: list[str] | None = None
    suggested_video: dict | None = None
