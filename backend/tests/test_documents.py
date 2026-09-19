import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_document_upload_success():
    file_content = b"RESIDENTIAL LEASE AGREEMENT\nRent is $685 per month due on the 1st."
    response = client.post(
        "/api/documents/upload",
        files={"file": ("sample_lease.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["filename"] == "sample_lease.txt"
    assert data["file_type"] == "TXT"

def test_document_upload_unsupported_file_type():
    file_content = b"executable binary mock"
    response = client.post(
        "/api/documents/upload",
        files={"file": ("malicious_file.exe", io.BytesIO(file_content), "application/octet-stream")}
    )
    assert response.status_code == 415
    assert "Unsupported file format" in response.json()["detail"]

def test_document_list_and_detail():
    file_content = b"EMPLOYMENT AGREEMENT\nEffective Date: September 1, 2026."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("employment_agreement.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    list_res = client.get("/api/documents")
    assert list_res.status_code == 200
    assert any(d["id"] == doc_id for d in list_res.json())

    detail_res = client.get(f"/api/documents/{doc_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["filename"] == "employment_agreement.txt"

def test_exact_monthly_rent_amount():
    file_content = b"RESIDENTIAL LEASE AGREEMENT\nRent is $685 per month due on the 1st of each month."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_685.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the monthly rent?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "$685" in data["answer"]
    assert data["answer"].startswith("The monthly rent is")
    assert data["found_in_document"] is True

def test_rent_due_date_extraction():
    file_content = b"RESIDENTIAL LEASE\nRent is due on the 1st day of each month. A late fee applies after the 5th."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_due_date.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "When is rent due?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    ans = data["answer"].lower()
    assert "1st" in ans or "due" in ans
    assert data["reference_snippet"] is not None

def test_late_fee_extraction():
    file_content = b"RESIDENTIAL LEASE AGREEMENT\nLate fee of $150 applies after the 5-day grace period."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("late_fee_lease.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the late fee?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "late fee" in data["answer"].lower() or "$150" in data["answer"]
    assert data["reference_snippet"] is not None

def test_security_deposit_extraction():
    file_content = b"RESIDENTIAL LEASE\nSecurity Deposit: $1,370 held in non-interest-bearing trust account."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("deposit_lease.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the security deposit?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "$1,370" in data["answer"]
    assert data["reference_snippet"] is not None

def test_lease_duration_extraction():
    file_content = b"RESIDENTIAL LEASE\nTerm: September 1, 2026 - August 31, 2027 (12 months)."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("term_lease.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the lease duration?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    ans = data["answer"].lower()
    assert "12 months" in ans or "september" in ans
    assert data["reference_snippet"] is not None

def test_missing_information():
    file_content = b"NON-DISCLOSURE AGREEMENT\nBoth parties agree to maintain strict confidentiality."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("nda_no_rent.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the monthly rent?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "couldn't find" in data["answer"].lower() or "not found" in data["answer"].lower()
    assert data["found_in_document"] is False
    assert data["reference_snippet"] is None

def test_unrelated_question():
    file_content = b"RESIDENTIAL LEASE\nNo pets allowed without written consent."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_pets.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the stock ticker symbol for Apple?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "couldn't find" in data["answer"].lower() or "not found" in data["answer"].lower()
    assert data["found_in_document"] is False

def test_document_checklist_and_delete():
    file_content = b"COMMERCIAL LEASE\nMaintenance fee is $500 per month."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("commercial_lease.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    checklist_res = client.post(f"/api/documents/{doc_id}/checklist")
    assert checklist_res.status_code == 200
    assert "important_items_to_review" in checklist_res.json()

    del_res = client.delete(f"/api/documents/{doc_id}")
    assert del_res.status_code == 200

def test_lease_duration_with_address_line():
    file_content = b"PREMISES: 123 Main Street, Apt 12, San Francisco, CA 94105.\nTERM: The lease duration is 12 months starting September 1, 2026."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_with_addr.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "How long is the lease?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "12 months" in data["answer"].lower()
    assert "Main Street" not in data["reference_snippet"]
    assert "12 months" in data["reference_snippet"].lower()

def test_late_fee_without_dollar_amount():
    file_content = b"RESIDENTIAL LEASE\nRent is due on the 1st of each month. A late fee applies after the 5th."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_no_fee_amount.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the late fee?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "does not specify the exact fee amount" in data["answer"] or "applies after the 5th" in data["answer"]
    assert "A late fee applies after the 5th" in data["reference_snippet"]

def test_rent_due_with_separate_amount_line():
    file_content = b"LEASE AGREEMENT\nMonthly Rent: $685 per month.\nPayment Schedule: Rent is due on the 1st day of each month."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_separate_lines.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "When is rent due?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "1st day of each month" in data["answer"].lower() or "due" in data["answer"].lower()
    assert "Monthly Rent: $685" not in data["reference_snippet"]

def test_when_do_i_have_to_pay_rent_variation():
    file_content = b"RESIDENTIAL LEASE\nPayment Terms: Rent is due on the 1st of each month. A 5-day grace period applies."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_timing_variation.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "When do I have to pay rent?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "1st" in data["answer"].lower() or "due" in data["answer"].lower()
    assert "1st of each month" in data["reference_snippet"].lower()

def test_multiple_dollar_amounts_selection():
    file_content = (
        b"LEGAL LEASE AGREEMENT\n"
        b"Premises Address: 742 Evergreen Terrace, Suite 100.\n"
        b"Monthly Base Rent: $1,500 per month.\n"
        b"Security Deposit: $1,500 held in trust.\n"
        b"Late Fee: $50 charge for payments received after the 5th day of the month.\n"
        b"Maintenance Fee: $200 per quarter."
    )
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_multiple_amounts.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    # Ask for rent
    rent_res = client.post(f"/api/documents/{doc_id}/ask", json={"question": "What is the monthly rent?"})
    assert rent_res.status_code == 200
    assert "$1,500" in rent_res.json()["answer"]
    assert "Base Rent" in rent_res.json()["reference_snippet"]

    # Ask for late fee
    late_res = client.post(f"/api/documents/{doc_id}/ask", json={"question": "What is the late fee?"})
    assert late_res.status_code == 200
    assert "$50" in late_res.json()["answer"]
    assert "Late Fee" in late_res.json()["reference_snippet"]

    # Ask for security deposit
    dep_res = client.post(f"/api/documents/{doc_id}/ask", json={"question": "What is the security deposit?"})
    assert dep_res.status_code == 200
    assert "$1,500" in dep_res.json()["answer"]
    assert "Security Deposit" in dep_res.json()["reference_snippet"]

def test_unmentioned_pets_question_does_not_return_address():
    file_content = (
        b"LEGAL LEASE AGREEMENT\n"
        b"Premises: located at 9876 Cherry Avenue, Apartment 426 under the following terms and conditions.\n"
        b"Term: 12 months starting September 1, 2026.\n"
        b"Rent: $685 per month due on 1st. Late fee applies after 5th."
    )
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_cherry_addr.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "Does this document mention pets?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "couldn't find" in data["answer"].lower() or "does not specify" in data["answer"].lower()
    assert data["found_in_document"] is False
    assert data["reference_snippet"] is None
    assert "Cherry Avenue" not in str(data["answer"])

def test_rent_due_does_not_return_base_rent_sentence():
    file_content = (
        b"RESIDENTIAL LEASE AGREEMENT\n"
        b"Tenant agrees to pay Landlord as base rent the sum of $685 per month, due and payable monthly in advance.\n"
        b"Payment Terms: Rent due on 1st. Late fee applies after 5th."
    )
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_due_vs_base.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "When is rent due?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert "1st" in data["answer"].lower() or "due" in data["answer"].lower()
    assert "Rent due on 1st" in data["reference_snippet"]
    assert "base rent the sum of $685" not in data["reference_snippet"]

def test_pets_question_with_pet_clause_present():
    file_content = (
        b"RESIDENTIAL LEASE AGREEMENT\n"
        b"Premises: 123 Main Street.\n"
        b"Pet Policy: One small dog under 25 lbs is allowed with a $250 non-refundable pet deposit."
    )
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_with_pets.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "Does this document mention pets?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["found_in_document"] is True
    assert "dog" in data["answer"].lower() or "pet" in data["answer"].lower()
    assert "Pet Policy:" in data["reference_snippet"]

def test_absent_parking_question():
    file_content = b"RESIDENTIAL LEASE AGREEMENT\nRent is $1,200 due on 1st."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_no_parking.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "Does the agreement mention parking?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["found_in_document"] is False
    assert data["reference_snippet"] is None
    assert "couldn't find" in data["answer"].lower()


def test_security_deposit_amount_missing():
    file_content = b"RESIDENTIAL LEASE\nThey specifically authorize Landlord to deduct amounts of unpaid bills from their Security Deposits in the event they remain unpaid after termination of this agreement."
    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("lease_deposit_no_amount.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["id"]

    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What is the security deposit amount mentioned in this agreement?"}
    )
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["found_in_document"] is False
    assert "does not specify" in data["answer"].lower() or "not stated" in data["answer"].lower() or "couldn't find" in data["answer"].lower()
