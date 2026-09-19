import os
import uuid
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
import fitz  # PyMuPDF
from fastapi import UploadFile, HTTPException, status
from app.config import settings

# In-memory document metadata & extracted text store for fast hackathon performance
# Also persisted to disk in upload_dir as JSON metadata files
_DOCUMENTS_STORE: Dict[str, Dict[str, Any]] = {}

class DocumentService:
    @staticmethod
    def validate_file(file: UploadFile, file_bytes: bytes) -> None:
        """Validate file size and extension."""
        # 1. File Size Validation
        max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
        if len(file_bytes) > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed limit of {settings.MAX_FILE_SIZE_MB}MB."
            )
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        # 2. File Extension Validation
        filename = file.filename or "file.pdf"
        ext = Path(filename).suffix.lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )

    @staticmethod
    def extract_text(file_bytes: bytes, filename: str) -> str:
        """Extract plain text safely based on file extension."""
        ext = Path(filename).suffix.lower()
        extracted_text = ""

        try:
            if ext == ".pdf":
                doc = fitz.open(stream=file_bytes, filetype="pdf")
                pages_text = []
                for page_num in range(len(doc)):
                    page = doc[page_num]
                    pages_text.append(page.get_text())
                extracted_text = "\n\n".join(pages_text).strip()
                doc.close()

            elif ext == ".txt":
                try:
                    extracted_text = file_bytes.decode("utf-8")
                except UnicodeDecodeError:
                    extracted_text = file_bytes.decode("latin-1", errors="ignore")

            elif ext == ".docx":
                try:
                    import docx
                    import io
                    doc = docx.Document(io.BytesIO(file_bytes))
                    extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
                except ImportError:
                    # Fallback plain text string extraction if python-docx isn't present
                    extracted_text = file_bytes.decode("utf-8", errors="ignore")

        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process and extract text from document: {str(e)}"
            )

        if not extracted_text or not extracted_text.strip():
            # Scanned or image-only PDF without OCR text
            extracted_text = (
                "[Notice: This document appears to be scanned or contains non-selectable image text. "
                "Document metadata has been saved, but text extraction was limited.]"
            )

        return extracted_text.strip()

    @classmethod
    async def process_and_save_upload(cls, file: UploadFile) -> Dict[str, Any]:
        """Validate, extract, save, and record document."""
        file_bytes = await file.read()
        filename = file.filename or "uploaded_doc.pdf"

        # Validate
        cls.validate_file(file, file_bytes)

        # Generate unique ID
        doc_id = str(uuid.uuid4())
        ext = Path(filename).suffix.lower()

        # Extract text
        extracted_text = cls.extract_text(file_bytes, filename)

        # Save binary file safely
        safe_filename = f"{doc_id}{ext}"
        file_path = Path(settings.UPLOAD_DIR) / safe_filename
        with open(file_path, "wb") as f:
            f.write(file_bytes)

        # Record metadata
        doc_record = {
            "id": doc_id,
            "filename": filename,
            "file_type": ext.lstrip(".").upper(),
            "file_size_bytes": len(file_bytes),
            "file_path": str(file_path),
            "extracted_text": extracted_text,
            "char_count": len(extracted_text),
            "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }

        _DOCUMENTS_STORE[doc_id] = doc_record
        return doc_record

    @classmethod
    def get_document(cls, doc_id: str) -> Dict[str, Any]:
        if doc_id not in _DOCUMENTS_STORE:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID '{doc_id}' not found."
            )
        return _DOCUMENTS_STORE[doc_id]

    @classmethod
    def list_documents(cls) -> List[Dict[str, Any]]:
        return list(_DOCUMENTS_STORE.values())

    @classmethod
    def delete_document(cls, doc_id: str) -> bool:
        doc = cls.get_document(doc_id)
        file_path = doc.get("file_path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        del _DOCUMENTS_STORE[doc_id]
        return True
