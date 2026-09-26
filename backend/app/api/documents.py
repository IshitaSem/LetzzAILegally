import logging
from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from app.schemas import (
    DocumentUploadResponse,
    DocumentMetadata,
    DocumentDetail,
    DocumentAnalysisResponse,
    DocumentAskRequest,
    DocumentAskResponse,
    DocumentChecklistResponse,
    LEGAL_DISCLAIMER,
)
from app.services.document_service import DocumentService
from app.services.legal_ai_service import LegalAIService

router = APIRouter(prefix="/documents", tags=["Legal Documents"])

@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """Upload legal document (PDF, TXT, DOCX), extract text securely, and save record."""
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided in request."
        )

    doc_record = await DocumentService.process_and_save_upload(file)

    return DocumentUploadResponse(
        id=doc_record["id"],
        filename=doc_record["filename"],
        file_type=doc_record["file_type"],
        file_size_bytes=doc_record["file_size_bytes"],
        char_count=doc_record["char_count"],
        extracted_text_status="success",
        message="Document successfully uploaded and processed."
    )

@router.get("", response_model=List[DocumentMetadata])
async def list_documents():
    """List all uploaded documents."""
    docs = DocumentService.list_documents()
    return [
        DocumentMetadata(
            id=d["id"],
            filename=d["filename"],
            file_type=d["file_type"],
            file_size_bytes=d["file_size_bytes"],
            char_count=d["char_count"],
            created_at=d["created_at"],
        )
        for d in docs
    ]

@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str):
    """Retrieve document metadata and extracted text snippet."""
    doc = DocumentService.get_document(document_id)
    snippet = doc.get("extracted_text", "")[:500] + "..." if len(doc.get("extracted_text", "")) > 500 else doc.get("extracted_text", "")
    return DocumentDetail(
        id=doc["id"],
        filename=doc["filename"],
        file_type=doc["file_type"],
        file_size_bytes=doc["file_size_bytes"],
        char_count=doc["char_count"],
        created_at=doc["created_at"],
        extracted_text_snippet=snippet,
    )

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete uploaded document."""
    DocumentService.delete_document(document_id)
    return {"message": f"Document '{document_id}' deleted successfully."}

@router.post("/{document_id}/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(document_id: str):
    """Perform AI document analysis (plain-language overview, key clauses, dates, concerns)."""
    doc = DocumentService.get_document(document_id)
    cached = DocumentService.get_cached_analysis(document_id)

    if cached:
        res = cached
    else:
        extracted_text = doc.get("extracted_text", "")
        res = await LegalAIService.analyze_document(extracted_text, doc.get("filename", "document.pdf"))
        # Cache when valid structured analysis is returned
        if res.get("key_clauses") or (res.get("overview") and not res.get("overview", "").startswith("Document analysis is not available")):
            DocumentService.set_cached_analysis(document_id, res)

    return DocumentAnalysisResponse(
        document_id=doc["id"],
        filename=doc["filename"],
        title=res.get("title", f"Analysis: {doc['filename']}"),
        overview=res.get("overview", "Document analysis is not available."),
        risk_level=res.get("risk_level", "Not available"),
        total_clauses_identified=res.get("total_clauses_identified", len(res.get("key_clauses", []))),
        key_clauses=res.get("key_clauses", []),
        obligations=res.get("obligations", []),
        important_dates=res.get("important_dates", []),
        potential_concerns=res.get("potential_concerns", []),
        disclaimer=LEGAL_DISCLAIMER
    )

logger = logging.getLogger(__name__)

@router.post("/{document_id}/ask", response_model=DocumentAskResponse)
async def ask_document_question(document_id: str, request: DocumentAskRequest):
    """Ask a question grounded strictly in the contents of the uploaded document."""
    if not request.question or not request.question.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question cannot be empty."
        )

    doc = DocumentService.get_document(document_id)
    extracted_text = doc.get("extracted_text", "")

    logger.info(f"Received Q&A Request for Doc '{document_id}' ({doc.get('filename')})")

    res = await LegalAIService.ask_document(extracted_text, request.question)

    logger.info(f"Q&A Response for Doc '{document_id}' | Found: {res.get('found_in_document')} | AnsLen: {len(res.get('answer', ''))} | SnipLen: {len(res.get('reference_snippet') or '')}")

    return DocumentAskResponse(
        document_id=doc["id"],
        question=request.question,
        answer=res.get("answer", "No answer could be determined from document."),
        reference_snippet=res.get("reference_snippet"),
        found_in_document=res.get("found_in_document", False),
        disclaimer=LEGAL_DISCLAIMER
    )

@router.post("/{document_id}/checklist", response_model=DocumentChecklistResponse)
async def get_document_checklist(document_id: str):
    """Generate actionable legal review checklist for the document."""
    doc = DocumentService.get_document(document_id)
    cached = DocumentService.get_cached_checklist(document_id)

    if cached:
        res = cached
    else:
        extracted_text = doc.get("extracted_text", "")
        res = await LegalAIService.checklist_document(extracted_text, doc.get("filename", "document.pdf"))
        if res.get("important_items_to_review"):
            DocumentService.set_cached_checklist(document_id, res)

    return DocumentChecklistResponse(
        document_id=doc["id"],
        filename=doc["filename"],
        important_items_to_review=res.get("important_items_to_review", []),
        questions_for_legal_professional=res.get("questions_for_legal_professional", []),
        action_items_and_deadlines=res.get("action_items_and_deadlines", []),
        disclaimer=LEGAL_DISCLAIMER
    )
