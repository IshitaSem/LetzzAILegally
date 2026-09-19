from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_chat_greeting_intent():
    for greeting in ["hi", "hello", "good morning", "hey"]:
        response = client.post("/api/chat", json={"message": greeting})
        assert response.status_code == 200
        data = response.json()
        assert "Hello! I am LetzAiLegally" in data["answer"]
        assert len(data["sources"]) == 0

def test_chat_thanks_intent():
    for thanks in ["thanks", "thank you", "ty"]:
        response = client.post("/api/chat", json={"message": thanks})
        assert response.status_code == 200
        data = response.json()
        assert "You're very welcome" in data["answer"]
        assert len(data["sources"]) == 0

def test_chat_goodbye_intent():
    for bye in ["bye", "goodbye", "take care"]:
        response = client.post("/api/chat", json={"message": bye})
        assert response.status_code == 200
        data = response.json()
        assert "Goodbye" in data["answer"]
        assert len(data["sources"]) == 0

def test_chat_doc_query_without_document():
    response = client.post("/api/chat", json={"message": "what is in my document?"})
    assert response.status_code == 200
    data = response.json()
    assert "haven't uploaded a document" in data["answer"].lower()
    assert len(data["sources"]) == 0

def test_chat_general_definition_question():
    response = client.post("/api/chat", json={"message": "What is force majeure?"})
    assert response.status_code == 200
    data = response.json()
    ans = data["answer"].lower()
    assert "force majeure" in ans
    assert "which country or state's law applies?" not in ans
    assert len(data["sources"]) == 0

def test_chat_contract_versus_agreement_question():
    response = client.post("/api/chat", json={"message": "What is the difference between a contract and an agreement?"})
    assert response.status_code == 200
    data = response.json()
    ans = data["answer"].lower()
    assert "agreement" in ans and "mutual understanding" in ans
    assert "contract" in ans and "enforceable" in ans
    assert "jurisdiction" in ans
    assert "what is the restricted time period?" not in ans
    assert len(data["sources"]) == 0

def test_chat_initial_non_compete_question():
    response = client.post("/api/chat", json={"message": "Is my non-compete enforceable?"})
    assert response.status_code == 200
    data = response.json()
    ans = data["answer"].lower()
    assert "cannot be answered definitively" in ans or "depends" in ans
    assert "jurisdiction" in ans
    assert len(data["sources"]) == 0

def test_chat_california_non_compete_followup():
    msg = "I am in California. It is an employment contract with a 2-year restriction covering the whole country."
    response = client.post("/api/chat", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    ans = data["answer"].lower()
    assert "california" in ans
    assert "16600" in ans or "generally void" in ans or "prohibits" in ans
    assert "california employment" in ans or "attorney" in ans or "lawyer" in ans
    assert len(data["sources"]) == 0

def test_chat_no_repeated_clarification_questions():
    msg = "I am in California. It is an employment contract with a 2-year restriction covering the whole country."
    response = client.post("/api/chat", json={"message": msg})
    assert response.status_code == 200
    data = response.json()
    ans = data["answer"].lower()
    assert "which country or state's law applies?" not in ans
    assert "what is the restricted time period?" not in ans

def test_chat_no_unsupported_sources():
    response = client.post("/api/chat", json={"message": "What are my rights as a tenant under residential lease laws?"})
    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) == 0

def test_chat_endpoint_empty_message():
    payload = {"message": ""}
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422 or response.status_code == 400
