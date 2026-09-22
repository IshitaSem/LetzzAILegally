# LetzAiLegally - AI Legal Companion

**LetzAiLegally** is an AI-powered legal assistance platform designed to help users understand legal information and navigate legal documents in a simpler and more accessible way.

The project was developed for the **AI for Legal Assistance & Access challenge**.

> **Disclaimer:** LetzAiLegally provides general legal information and document understanding assistance. It is not a replacement for a qualified lawyer or professional legal advice.

## 1. Problem Statement
Legal documents such as rental agreements, employment contracts, and property agreements can contain important information about payments, dates, responsibilities, penalties, and contractual obligations. 

For users without a legal background, finding and understanding these details can be difficult because:
* Legal documents can be lengthy and difficult to navigate.
* Important clauses may be buried inside large amounts of text.
* Users may not know which clauses are relevant to their question.
* AI systems can potentially provide unsupported answers if they are not grounded in the source document.
* Users need a simple interface rather than having to manually search through legal documents.

LetzAiLegally addresses these problems by combining an AI legal-information assistant with document analysis and grounded document question answering.

## 2. Goal
The goal of LetzAiLegally is to make legal information and legal-document understanding more accessible by allowing users to:
* Ask general legal-information questions.
* Upload legal PDF documents.
* Receive structured document analysis.
* Identify important clauses and dates.
* Understand financial obligations and concerns.
* Generate a checklist from a document.
* Ask questions specifically about an uploaded document.
* Verify document-based answers using supporting clauses.
* Clearly identify when requested information is not present in the document.

## 3. Key Features

### General Legal Chat
* Users can ask general legal-information questions through the AI Legal Companion.
* The system uses Google Gemini to generate responses while displaying a legal-information disclaimer.

### PDF Document Upload
* Users can upload a legal PDF for analysis.
* The backend extracts text from the uploaded document and makes it available for document processing.

### Structured Document Analysis
The system analyzes uploaded documents and provides information such as:
* Summary
* Important clauses
* Important dates
* Financial obligations
* Potential concerns
* Checklist items

### Grounded Document Q&A
Users can ask questions about the uploaded document. The system retrieves relevant document context before generating the response. 
* **For example**, for a rental agreement containing: `Security deposit: $685`
  * The user can ask: *"What is the security deposit amount?"*
  * The system returns the amount and provides the relevant supporting clause.

### Missing Information Handling
If the requested information is not contained in the uploaded document, the system does not invent an answer.
* **For example**, Question: *"Who is responsible for repairing the refrigerator?"*
  * Response: The system indicates that the information could not be found in the uploaded document.
This helps distinguish information supported by the document from information that cannot be determined from it.

### Conversations
The frontend supports:
* New Chat
* Separate conversations
* Recent conversations
* Conversation switching
* Persistent conversation state using browser storage

## 4. How the System Works
The application follows this architecture:

```text
User 
 | 
 v 
React / Vite Frontend 
 | 
 | HTTPS API Requests 
 v 
FastAPI Backend 
 +--------------------+ 
 |                    |
 v                    v 
Document Processing   Gemini API 
 |                    |
 v                    v
PDF Text / Context -> AI Response
                      |
                      v
Grounded Answer + Supporting Evidence
```

**General Chat Flow:**
`User Question` -> `React Frontend` -> `FastAPI /api/chat` -> `Google Gemini API` -> `AI Response` -> `Frontend`

**Document Q&A Flow:**
`PDF Upload` -> `FastAPI Backend` -> `PDF Text Extraction` -> `Relevant Document Context` -> `User's Question` -> `Gemini` -> `Grounded Answer` -> `Supporting Clause / Missing Information`

## 5. Technology Stack
* **Frontend:** React, TypeScript, Vite, CSS, Figma-generated UI, Vercel
* **Backend:** Python, FastAPI, Uvicorn, PyMuPDF (for PDF text extraction)
* **Generative AI:** Google Gemini API, Google GenAI Python SDK
* **Deployment:** Vercel (Frontend), PythonAnywhere (Backend), GitHub (Source Code)

## 6. Generative AI Usage
Google Gemini API is the primary Generative AI service used in LetzAiLegally.
Gemini is used for:
* General legal-information chat
* Legal document analysis
* Document summarization
* Clause identification
* Date extraction
* Concern identification
* Checklist generation
* Document-based question answering

For document Q&A, relevant document information is retrieved and provided as context before generating the answer. The system also contains application-level logic to avoid returning unrelated document clauses when information cannot be established from the uploaded document.

## 7. Responsible AI Approach
Legal assistance requires particular care because incorrect information can potentially mislead users. LetzAiLegally therefore follows several responsible-AI principles:
* **Document Grounding:** Document questions are answered using relevant information from the uploaded document rather than relying only on general model knowledge.
* **Evidence Visibility:** When information is found, the application can display a supporting clause so that users can verify where the answer came from.
* **No Unsupported Information:** If the requested information cannot be found in the uploaded document, the system indicates that it cannot be determined from the document instead of fabricating an answer.
* **Legal Disclaimer:** The application clearly communicates that it provides legal-information assistance and does not replace professional legal advice.

## 8. Example
Consider a rental agreement containing:
`SECURITY DEPOSIT: Tenants hereby agree to pay a security deposit of $685...`

The user asks: *"What is the security deposit amount?"*
The system identifies the relevant document information and returns: *"The security deposit amount is $685."* It also provides the relevant supporting clause.

If the user asks: *"Who is responsible for repairing the refrigerator?"* and the agreement does not specify this responsibility, the system responds that the information could not be found in the uploaded document rather than assigning responsibility without evidence.

## 9. Project Structure
```text
LetzzAILegally/
│
├── backend/
│   ├── app/
│   │   ├── apis/
│   │   ├── services/
│   │   ├── config.py
│   │   ├── schemas.py
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
│
├── .gitignore
└── README.md
```

## 10. API Endpoints
The FastAPI backend provides endpoints including:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| POST | `/api/chat` | General legal chat |
| POST | `/api/documents/upload` | Upload a PDF |
| GET | `/api/documents` | List uploaded documents |
| GET | `/api/documents/{document_id}` | Retrieve document information |
| DELETE | `/api/documents/{document_id}` | Delete a document |
| POST | `/api/documents/{document_id}/analyze` | Analyze a document |
| POST | `/api/documents/{document_id}/ask` | Ask a question about a document |
| POST | `/api/documents/{document_id}/checklist` | Generate a document checklist |

## 11. Testing
The backend includes automated tests covering important application behavior. The project currently has **41 backend tests passing**, covering:
* Document upload and processing
* Document analysis
* Document Q&A
* Security deposit retrieval
* Missing-information handling
* Other API functionality

The frontend production build was also tested successfully using the Vite build process.

## 12. Security
Security considerations include:
* API credentials are stored using environment variables.
* `.env` files are excluded from Git.
* API keys are not included in the public repository.
* Uploaded files and environment-specific files are excluded through `.gitignore`.
* CORS is configured for the deployed frontend.
* The application does not expose the Gemini API key to the frontend.

## 13. Assumptions and Limitations
**Assumptions**
* Users upload readable PDF legal documents.
* The document contains sufficient text for extraction.
* Gemini is available through the configured API.
* Users understand that AI-generated information should be verified when making important legal decisions.

**Limitations**
* The system does not replace a lawyer.
* It cannot determine information that is absent from an uploaded document.
* OCR for image-only/scanned documents may require additional processing.
* Legal rules can vary by jurisdiction and individual circumstances.
* AI-generated responses should be independently verified for important legal matters.

## 14. Deployment
**Frontend**
The React frontend is deployed on Vercel.
Live Application: [https://letzz-ai-legally.vercel.app/](https://letzz-ai-legally.vercel.app/)

**Backend**
The FastAPI backend is deployed separately on PythonAnywhere.
Backend Health Check: [https://ishhhi.pythonanywhere.com/api/health](https://ishhhi.pythonanywhere.com/api/health)

## 15. Repository
GitHub Repository: [https://github.com/IshitaSem/LetzzAILegally](https://github.com/IshitaSem/LetzzAILegally)
The repository is public and contains the project source code required to understand and evaluate the solution.

## 16. Challenge Alignment
LetzAiLegally was developed for the **AI for Legal Assistance & Access** challenge vertical. The project demonstrates:
* A dynamic AI assistant
* Context-aware document interaction
* Generative AI integration
* Practical legal-document assistance
* Grounded document question answering
* Evidence-based responses
* Explicit handling of missing information
* Accessible web-based interaction
* Automated backend testing
* Separation of frontend and AI backend responsibilities

## 17. Future Improvements
Potential future improvements include:
* Support for additional document formats
* Improved OCR for scanned documents
* Multi-language legal assistance
* More advanced citation and clause referencing
* Jurisdiction-aware legal information
* User authentication and secure document storage
* More detailed document comparison
* Additional legal-document templates

## 18. Disclaimer
LetzAiLegally is an AI-powered legal-information and document-understanding assistant. It is intended to improve access to and understanding of legal information. It does not provide legal representation or replace advice from a qualified legal professional. Users should consult a qualified lawyer for important legal decisions or situations requiring professional legal advice.
