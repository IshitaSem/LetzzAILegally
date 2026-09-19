from typing import Optional, List
from pydantic import BaseModel, Field

# Legal Safety Disclaimer Constant
LEGAL_DISCLAIMER = (
    "LetzAiLegally provides AI-generated legal information for informational purposes only "
    "and does not constitute formal legal advice. Please consult a qualified legal professional for specific guidance."
)

# -----------------------------------------------------------------------------
# Health Schema
# -----------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str = "ok"
    app: str = "LetzAiLegally"
    version: str = "1.0.0"

# -----------------------------------------------------------------------------
# General Chat Schemas
# -----------------------------------------------------------------------------
class SourceCitation(BaseModel):
    title: str = Field(..., description="Title or name of legal source/statute")
    reference: str = Field(..., description="Section, code number, or authority reference")
    relevance: str = Field(..., description="Jurisdiction or explanation of relevance")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4090, description="Legal question or prompt")
    conversation_id: Optional[str] = Field(None, description="Optional conversation session ID")

class ChatResponse(BaseModel):
    conversation_id: str
    answer: str
    key_points: List[str] = []
    sources: List[SourceCitation] = []
    disclaimer: str = LEGAL_DISCLAIMER

# -----------------------------------------------------------------------------
# Document Upload & Listing Schemas
# -----------------------------------------------------------------------------
class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    char_count: int
    extracted_text_status: str = "success"
    message: str = "Document successfully uploaded and processed."

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size_bytes: int
    char_count: int
    created_at: str

class DocumentDetail(DocumentMetadata):
    extracted_text_snippet: str

# -----------------------------------------------------------------------------
# Document Analysis Schemas
# -----------------------------------------------------------------------------
class KeyClause(BaseModel):
    clause_number: Optional[str] = None
    title: str
    summary: str
    original_snippet: Optional[str] = None
    category: str = "general"  # summary, clauses, dates, concerns

class ImportantDate(BaseModel):
    label: str
    date_or_period: str
    icon: str = "📅"

class PotentialConcern(BaseModel):
    title: str
    description: str
    severity: str = "Review"  # Review, High Priority, Caution
    legal_reference: Optional[str] = None

class DocumentAnalysisResponse(BaseModel):
    document_id: str
    filename: str
    title: str
    overview: str
    risk_level: str = "Low"  # Low, Med, High
    total_clauses_identified: int = 0
    key_clauses: List[KeyClause] = []
    obligations: List[str] = []
    important_dates: List[ImportantDate] = []
    potential_concerns: List[PotentialConcern] = []
    disclaimer: str = LEGAL_DISCLAIMER

# -----------------------------------------------------------------------------
# Document Ask / Q&A Schemas
# -----------------------------------------------------------------------------
class DocumentAskRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000, description="Question about the uploaded document")

class DocumentAskResponse(BaseModel):
    document_id: str
    question: str
    answer: str
    reference_snippet: Optional[str] = None
    found_in_document: bool = True
    disclaimer: str = LEGAL_DISCLAIMER

# -----------------------------------------------------------------------------
# Document Checklist Schemas
# -----------------------------------------------------------------------------
class ChecklistItem(BaseModel):
    category: str
    item: str
    priority: str = "Normal"  # High, Normal, Optional

class DocumentChecklistResponse(BaseModel):
    document_id: str
    filename: str
    important_items_to_review: List[ChecklistItem] = []
    questions_for_legal_professional: List[str] = []
    action_items_and_deadlines: List[str] = []
    disclaimer: str = LEGAL_DISCLAIMER
