"""Vision endpoint -- image analysis for elderly users."""

from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, status

from app.adapters.llm.registry import LLMRegistry
from app.dependencies import get_llm_registry
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.vision import VisionResponse
from app.services import vision_service

router = APIRouter(prefix="/vision", tags=["vision"])


class VisionRequest(BaseModel):
    """Payload for image analysis."""

    image: str = Field(
        ..., description="Base64-encoded image data"
    )
    media_type: str = Field(
        default="image/jpeg",
        description="MIME type of the image (e.g. image/jpeg, image/png)",
    )
    question: str | None = Field(
        default=None,
        description="Optional question about the image",
    )
    locale: str = Field(
        default="pt-BR",
        description="Response language locale (pt-BR or en)",
    )


@router.post("/analyze", response_model=VisionResponse)
async def analyze_image(
    body: VisionRequest,
    current_user: User = Depends(get_current_user),
    llm_registry: LLMRegistry = Depends(get_llm_registry),
) -> VisionResponse:
    """Analyze an image and return a description tailored for elderly users.

    Detects sensitive data in the image and provides step-by-step
    instructions when relevant.
    """
    if not body.image.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Image data cannot be empty",
        )

    return await vision_service.analyze_image(
        image_base64=body.image,
        media_type=body.media_type,
        llm_registry=llm_registry,
        question=body.question,
        locale=body.locale,
    )
