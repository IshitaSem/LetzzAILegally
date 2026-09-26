import io
import os
import pymupdf as fitz
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.legal_ai_service import LegalAIService
from app.config import settings

client = TestClient(app)

RENT_DEED_PATH = r"C:\Users\ISHITA SEMWAL\Downloads\Rent deed Lease Agreement.pdf"

def test_rent_deed_pdf_upload_and_analysis():
    """Verify that 'Rent deed Lease Agreement.pdf' produces dynamic, structured analysis and NOT 'Analysis unavailable'."""
    assert os.path.exists(RENT_DEED_PATH), f"File {RENT_DEED_PATH} does not exist"

    with open(RENT_DEED_PATH, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("Rent deed Lease Agreement.pdf", io.BytesIO(file_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    doc_id = data["id"]
    assert data["filename"] == "Rent deed Lease Agreement.pdf"
    assert data["char_count"] > 4000

    # Detail check
    detail_res = client.get(f"/api/documents/{doc_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["char_count"] > 4000

    # Analyze call
    analyze_res = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    # Verify that 'Analysis unavailable' is NOT returned
    assert not analysis["title"].startswith("Analysis unavailable")
    assert "RENT DEED" in analysis["title"].upper() or "LEASE" in analysis["title"].upper()
    assert analysis["total_clauses_identified"] >= 10
    assert len(analysis["key_clauses"]) >= 10
    assert len(analysis["obligations"]) > 0
    assert len(analysis["important_dates"]) > 0
    assert len(analysis["potential_concerns"]) > 0

    # Verify clause structure
    for clause in analysis["key_clauses"]:
        assert "clause_number" in clause
        assert "title" in clause
        assert "summary" in clause
        assert "original_snippet" in clause
        assert clause["category"] in ("clauses", "concerns")
        assert len(clause["title"]) > 0
        assert len(clause["summary"]) > 0

    # Verify dates
    for d in analysis["important_dates"]:
        assert "label" in d
        assert "date_or_period" in d
        assert "icon" in d

def test_normal_text_based_pdf():
    """Test standard 1-page text-based PDF."""
    doc = fitz.open()
    page = doc.new_page()
    text = (
        "CONSULTING SERVICES AGREEMENT\n\n"
        "This Agreement is made between Alpha Corp and Jane Consultant.\n\n"
        "1. Scope of Work. Consultant shall perform software advisory services.\n"
        "2. Payment Terms. Alpha Corp shall pay $150 per hour within 30 days of invoice.\n"
        "3. Term of Agreement. This contract takes effect September 1, 2026 for a duration of 1 year.\n"
        "4. Confidentiality. Both parties shall maintain strict confidentiality.\n"
        "5. Termination. Either party may terminate with 14 days written notice.\n"
    )
    page.insert_text((50, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("consulting_agreement.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    analyze_res = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    assert not analysis["title"].startswith("Analysis unavailable")
    assert "CONSULTING" in analysis["title"].upper() or "AGREEMENT" in analysis["title"].upper()
    assert analysis["total_clauses_identified"] >= 4
    assert len(analysis["key_clauses"]) >= 4

def test_multipage_pdf():
    """Test multi-page text-based PDF (3 pages)."""
    doc = fitz.open()
    # Page 1
    p1 = doc.new_page()
    p1.insert_text((50, 72), "MASTER SERVICES AGREEMENT\nBetween BigCorp Inc. and Vendor LLC.\n1. Services provided by Vendor LLC.\n2. Term of 2 years.")
    # Page 2
    p2 = doc.new_page()
    p2.insert_text((50, 72), "3. Fees. BigCorp shall pay $50,000 annually.\n4. Subletting and Assignment is prohibited.\n5. Taxes paid by Vendor.")
    # Page 3
    p3 = doc.new_page()
    p3.insert_text((50, 72), "6. Early Termination with 60 days notice.\n7. Indemnity and Liability limitations apply.")
    pdf_bytes = doc.tobytes()
    doc.close()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("master_agreement_3pages.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    data = upload_res.json()
    doc_id = data["id"]

    analyze_res = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    assert not analysis["title"].startswith("Analysis unavailable")
    assert analysis["total_clauses_identified"] >= 5
    assert len(analysis["key_clauses"]) >= 5

def test_empty_or_scanned_pdf_rejected_before_gemini():
    """Verify that an empty or image-only PDF is rejected before calling Gemini with clear 400 error."""
    doc = fitz.open()
    doc.new_page()  # Empty page without text
    pdf_bytes = doc.tobytes()
    doc.close()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("blank_scanned.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Analysis must reject empty extracted text with 400
    analyze_res = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_res.status_code == 400
    assert "no extractable text" in analyze_res.json()["detail"].lower()

def test_corrupted_pdf_upload_rejection():
    """Verify corrupted PDF bytes are rejected on upload."""
    corrupted_bytes = b"%PDF-1.4\nCorrupted binary content with broken xref table and no pages\n%%EOF"
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("corrupt.pdf", io.BytesIO(corrupted_bytes), "application/pdf")}
    )
    # fitz fails to open or find pages in corrupted PDF, returning 400
    assert upload_res.status_code == 400
    assert "corrupted" in upload_res.json()["detail"].lower() or "failed" in upload_res.json()["detail"].lower()

def test_gemini_failure_returns_clear_502_error(monkeypatch):
    """Verify that if Gemini analysis fails when an API key is configured, backend returns 502 with clear error message instead of silently producing 'Analysis unavailable'."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIzaSyFakeKeyForTestTestingFailureHandling")

    def mock_call_error(prompt):
        return None, "Resource exhausted (quota exceeded 429)"

    monkeypatch.setattr(LegalAIService, "_call_gemini_with_error", mock_call_error)

    # Upload valid text doc
    content = b"COMMERCIAL LEASE AGREEMENT\n1. Rent is $5,000 per month.\n2. Term: 3 years."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("commercial.txt", io.BytesIO(content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    analyze_res = client.post(f"/api/documents/{doc_id}/analyze")
    assert analyze_res.status_code == 502
    err_detail = analyze_res.json()["detail"]
    assert "Gemini document analysis failed" in err_detail
    assert "Resource exhausted" in err_detail
    # Must NOT return 200 with "Analysis unavailable"
    assert analyze_res.status_code != 200

def test_pythonanywhere_proxy_auto_detection(monkeypatch):
    """Verify that settings.effective_proxy detects PythonAnywhere environment automatically."""
    from app.config import Settings

    monkeypatch.setenv("PYTHONANYWHERE_SITE", "www.pythonanywhere.com")
    monkeypatch.delenv("HTTP_PROXY", raising=False)
    monkeypatch.delenv("HTTPS_PROXY", raising=False)
    monkeypatch.delenv("http_proxy", raising=False)
    monkeypatch.delenv("https_proxy", raising=False)

    s = Settings()
    assert s.effective_proxy == "http://proxy.server:3128"

def test_pythonanywhere_uvicorn_domain_socket_auto_detection(monkeypatch):
    """Verify that settings.effective_proxy detects PythonAnywhere from Uvicorn's DOMAIN_SOCKET."""
    from app.config import Settings

    monkeypatch.delenv("PYTHONANYWHERE_SITE", raising=False)
    monkeypatch.delenv("PYTHONANYWHERE_DOMAIN", raising=False)
    monkeypatch.delenv("HTTP_PROXY", raising=False)
    monkeypatch.delenv("HTTPS_PROXY", raising=False)
    monkeypatch.delenv("http_proxy", raising=False)
    monkeypatch.delenv("https_proxy", raising=False)
    monkeypatch.setenv("DOMAIN_SOCKET", "/var/sockets/ishhhi.pythonanywhere.com/socket")

    s = Settings()
    assert s.effective_proxy == "http://proxy.server:3128"

def test_genai_client_initialization_with_proxy(monkeypatch):
    """Verify LegalAIService._get_genai_client creates client with explicit proxy transport when proxy is active."""
    monkeypatch.setattr(settings, "HTTPS_PROXY", "http://proxy.server:3128")
    monkeypatch.setattr(LegalAIService, "_genai_client", None)
    monkeypatch.setattr(LegalAIService, "_cached_api_key", None)

    client_instance = LegalAIService._get_genai_client("test_api_key_123")
    assert client_instance is not None

    # Verify httpx client has explicit transport proxy configured
    httpx_client = client_instance._api_client._httpx_client
    assert httpx_client is not None
    transport = httpx_client._transport
    proxy_url = getattr(getattr(transport, "_pool", None), "_proxy_url", None)
    assert proxy_url is not None
    assert b"proxy.server" in proxy_url.host

    # Reset cached client
    LegalAIService._genai_client = None
    LegalAIService._cached_api_key = None

def test_gemini_rest_call_with_proxy(monkeypatch):
    """Verify that _call_gemini_with_error routes through the proxy and parses responses correctly."""
    import requests
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIzaSyTestKeyForRestCall")
    monkeypatch.setattr(settings, "HTTPS_PROXY", "http://proxy.server:3128")

    captured_requests = []

    class MockResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json = json_data
            self.text = str(json_data)
        def json(self):
            return self._json

    def mock_post(url, headers=None, json=None, proxies=None, timeout=None):
        captured_requests.append({
            "url": url,
            "proxies": proxies,
            "json": json
        })
        return MockResponse(200, {
            "candidates": [{
                "content": {
                    "parts": [{"text": '{"title": "Commercial Lease", "risk_level": "Low"}'}]
                }
            }]
        })

    monkeypatch.setattr(requests, "post", mock_post)

    text, err = LegalAIService._call_gemini_with_error("Summarize this lease")
    assert err is None
    assert "Commercial Lease" in text
    assert len(captured_requests) > 0
    assert captured_requests[0]["proxies"] == {
        "http": "http://proxy.server:3128",
        "https": "http://proxy.server:3128"
    }


def test_gemini_candidate_models_sanitizes_obsolete_model(monkeypatch):
    """Verify that obsolete gemini-1.5-flash is sanitized and excluded from candidate models."""
    from app.config import Settings
    custom_settings = Settings(GEMINI_MODEL="gemini-1.5-flash")
    assert custom_settings.GEMINI_MODEL == "gemini-2.5-flash"
    assert "gemini-1.5-flash" not in custom_settings.candidate_gemini_models
    assert "gemini-2.5-flash" in custom_settings.candidate_gemini_models


def test_gemini_rest_fallback_on_404(monkeypatch):
    """Verify that if the first model returns HTTP 404, it seamlessly falls back to the next candidate model."""
    import requests
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "AIzaSyValidKey")
    monkeypatch.setattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
    monkeypatch.setattr(settings, "GEMINI_FALLBACK_MODELS", ["gemini-2.0-flash"])

    call_history = []

    class MockResponse:
        def __init__(self, status_code, json_data):
            self.status_code = status_code
            self._json = json_data
            self.text = str(json_data)
        def json(self):
            return self._json

    def mock_post(url, headers=None, json=None, proxies=None, timeout=None):
        call_history.append(url)
        # First model returns 404 Not Found
        if "gemini-2.5-flash" in url:
            return MockResponse(404, {
                "error": {
                    "code": 404,
                    "message": "models/gemini-2.5-flash is not found for API version v1beta",
                    "status": "NOT_FOUND"
                }
            })
        # Second fallback model returns 200 OK
        return MockResponse(200, {
            "candidates": [{
                "content": {
                    "parts": [{"text": '{"title": "Fallback Success", "risk_level": "Low"}'}]
                }
            }]
        })

    monkeypatch.setattr(requests, "post", mock_post)

    text, err = LegalAIService._call_gemini_with_error("Analyze document")
    assert err is None
    assert "Fallback Success" in text
    assert len(call_history) == 2
    assert "gemini-2.5-flash" in call_history[0]
    assert "gemini-2.0-flash" in call_history[1]

