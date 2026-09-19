import uuid
from fastapi import APIRouter, HTTPException, status
from app.schemas import ChatRequest, ChatResponse, LEGAL_DISCLAIMER
from app.services.legal_ai_service import LegalAIService

router = APIRouter(prefix="/chat", tags=["General Legal Chat"])

@router.post("", response_model=ChatResponse)
async def process_chat_message(request: ChatRequest):
    """Process natural language legal question and return structured answer with citations."""
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chat message cannot be empty."
        )

    conv_id = request.conversation_id or str(uuid.uuid4())
    result = await LegalAIService.chat(request.message)

    return ChatResponse(
        conversation_id=conv_id,
        answer=result.get("answer", ""),
        key_points=result.get("key_points", []),
        sources=result.get("sources", []),
        disclaimer=LEGAL_DISCLAIMER
    )
