# LetzAiLegally Backend API

**LetzAiLegally** is an AI-powered legal assistant designed to help users understand legal information, analyze legal documents, ask legal questions, and find supporting legal sources in an accessible way.

The backend is built with **Python**, **FastAPI**, **PyMuPDF**, and the **Google Gemini API** (`google-genai` SDK).

---

## 🚀 Key Features

* **General Legal Q&A (`POST /api/chat`):** Ask legal questions in natural language and receive plain-language answers, key takeaway points, verified legal citations, and safety disclaimers.
* **Document Processing & Parsing (`POST /api/documents/upload`):** Securely upload PDF, TXT, or DOCX documents up to 10MB with PyMuPDF text extraction.
* **AI Document Analysis (`POST /api/documents/{id}/analyze`):** Extract Plain-Language Overview, Risk Level (Low/Med/High), Key Clauses, Obligations, Important Dates, and Potential Legal Concerns.
* **Document Grounded Q&A (`POST /api/documents/{id}/ask`):** Ask questions about uploaded documents with grounded answers and page/section snippet references.
* **Actionable Legal Checklist (`POST /api/documents/{id}/checklist`):** Generate key review items, questions to ask a attorney, and critical dates to track.
* **Pluggable AI & Mock Provider:** Automatically falls back to high-quality structured legal responses when running offline or without an active API key.

---

## 🛠️ Setup & Installation (Windows PowerShell)

### 1. Navigate to the backend directory
```powershell
cd backend
```

### 2. Create and activate a Virtual Environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```

Open `.env` and set your `GEMINI_API_KEY`:
```text
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8443,http://127.0.0.1:5173,http://127.0.0.1:8443
```

---

## 💻 Running the Backend Server

Start the Uvicorn ASGI server:
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

The server will start at: `http://127.0.0.1:8000`
* Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
* ReDoc UI: `http://127.0.0.1:8000/redoc`
* Health Endpoint: `http://127.0.0.1:8000/api/health`

---

## 🧪 Running Automated Tests

Run pytest across all unit tests:
```powershell
pytest
```

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend status check |
| `POST` | `/api/chat` | Natural language legal Q&A |
| `POST` | `/api/documents/upload` | Secure document upload (PDF/TXT/DOCX, max 10MB) |
| `GET` | `/api/documents` | List uploaded documents |
| `GET` | `/api/documents/{id}` | Retrieve document metadata & snippet |
| `DELETE`| `/api/documents/{id}` | Delete uploaded document |
| `POST` | `/api/documents/{id}/analyze` | AI document overview & key clauses |
| `POST` | `/api/documents/{id}/ask` | Q&A grounded in document text |
| `POST` | `/api/documents/{id}/checklist` | Actionable review checklist |

---

## 🌍 Deployment Guide

### Backend (Render / Railway / Hugging Face / Vercel Python)
1. Push code to GitHub repository.
2. Link repository to hosting provider.
3. Set Environment Variables:
   * `GEMINI_API_KEY`
   * `ALLOWED_ORIGINS` (Set to your Vercel frontend domain URL)
4. Start Command:
   `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
1. Link Vercel project to `frontend/` subfolder.
2. Add Environment Variable:
   `VITE_API_BASE_URL=https://your-backend-service.onrender.com`
3. Deploy.
