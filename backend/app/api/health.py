from fastapi import APIRouter
from app.schemas import HealthResponse
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint for status monitoring."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        version="1.0.0"
    )
