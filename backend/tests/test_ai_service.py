import asyncio
from app.services.legal_ai_service import LegalAIService

def test_chat_mock_fallback():
    res = asyncio.run(LegalAIService.chat("What are tenant rights?"))
    assert "answer" in res
    assert "sources" in res
    assert len(res["key_points"]) > 0

def test_analyze_document_fallback():
    sample_text = "RESIDENTIAL LEASE AGREEMENT\nRent is $3200 per month."
    res = asyncio.run(LegalAIService.analyze_document(sample_text, "test.pdf"))
    assert "title" in res
    assert "overview" in res
    assert "key_clauses" in res
    assert "important_dates" in res

def test_ask_document_fallback():
    sample_text = "The security deposit is $2,000."
    res = asyncio.run(LegalAIService.ask_document(sample_text, "How much is the security deposit?"))
    assert "answer" in res
    assert res["found_in_document"] is True
