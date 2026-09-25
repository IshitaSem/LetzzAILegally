# LetzAiLegally - AI Legal Companion

**LetzAiLegally** is an AI-powered legal assistance platform designed to democratize legal access and make complex legal documents transparent, understandable, and verifiable for everyday individuals and small businesses.

Developed for the **Hack2Skill PromptWars AI Code Submission Challenge: "AI for Legal Assistance & Access"**.

* **Live Frontend:** [https://letzz-ai-legally.vercel.app/](https://letzz-ai-legally.vercel.app/)
* **Live API Backend:** [https://ishhhi.pythonanywhere.com](https://ishhhi.pythonanywhere.com)
* **API Health Check:** [https://ishhhi.pythonanywhere.com/api/health](https://ishhhi.pythonanywhere.com/api/health)
* **GitHub Repository:** [https://github.com/IshitaSem/LetzzAILegally](https://github.com/IshitaSem/LetzzAILegally)

> **Important Legal Disclaimer:** LetzAiLegally provides educational and informational legal assistance and document understanding. It is **not** a substitute for advice or representation from a licensed attorney or qualified legal professional.

---

## ⚡ Evaluator Quickstart (Test in 30 Seconds)

Evaluators do **not** need to prepare or upload a PDF to test the full pipeline:

1. **Open the Live App:** Navigate to [https://letzz-ai-legally.vercel.app/](https://letzz-ai-legally.vercel.app/).
2. **Click "Try Sample Lease":** Click the **"Try Sample Lease"** button on the home screen hero banner or on the Documents page.
3. **Inspect Structured Extraction:**
   - **Summary:** Residential Lease Agreement for 742 Evergreen Terrace.
   - **Key Dates:** Lease Start: August 1, 2024 | Rent Due: 1st of each month | Grace Period: 5 days.
   - **Financials:** Base Rent: $685/month | Security Deposit: $685 | Late Fee: $50 after 5th.
   - **Important Clauses:** Notice of Termination (30 days), Maintenance obligations, Pet restrictions.
   - **Action Checklist:** Inspection checklist, renter's insurance requirement, security deposit receipt.
4. **Ask Grounded Legal Questions:**
   - *"What is the monthly rent?"* &rarr; **$685 per month**, citing Section 3.
   - *"When is rent due?"* &rarr; **1st of each month**, citing Section 3.
   - *"What is the security deposit amount?"* &rarr; **$685**, citing Section 4.
   - *"Are pets allowed?"* &rarr; **No**, strictly prohibited without prior written consent (Section 8).
   - *"Who is responsible for repairing the refrigerator?"* &rarr; **Not specified in document**. The system cleanly reports absent clauses without hallucinating.

---

## 1. Problem Statement & Challenge Alignment

Legal documents such as residential lease agreements, employment non-compete clauses, and service contracts are often filled with dense legal jargon, convoluted phrasing, and hidden liabilities.

For regular citizens and small business owners:
* **Asymmetric Legal Knowledge:** Important penalty clauses, auto-renewals, or forfeiture terms are buried within pages of dense text.
* **Prohibitive Legal Costs:** Hiring an attorney to review standard agreements often costs $300-$500/hour, putting professional guidance out of reach.
* **Hallucination Risks in Generic LLMs:** Off-the-shelf generative AI models frequently hallucinate facts or conflate standard industry terms with the exact contract at hand.

### How LetzAiLegally Solves This:
1. **Strict Context Grounding:** Document queries extract candidate clauses and verify assertions against the source text before generating answers.
2. **Missing Information Transparency:** When an agreement omits a term (e.g., parking policies, appliance repair duties), the system explicitly flags that the information is absent rather than guessing.
3. **Accessibility-First Design:** Accessible to users with assistive technologies through WCAG AA compliance, semantic labels, screen reader text, and keyboard navigation.

---

## 2. Key Capabilities

### A. General Legal Information Assistant
* Real-time conversational interface for legal concepts, contract terminology, tenant rights, and employment law principles.
* Strict safety guardrails and legal educational disclaimers.

### B. PDF & Document Ingestion
* Native PDF parsing via PyMuPDF (`fitz`), handling multi-page contracts, formatted clauses, and tabular schedules.
* Defensive validation against corrupted files, spoofed extensions, and image-only scans.

### C. Automated Structured Document Analysis
Instant extraction of critical contract facets:
* **Plain-Language Summary:** Executive briefing of parties, premises, and purpose.
* **Clause-by-Clause Breakdown:** Termination, governing law, dispute resolution, indemnification.
* **Key Dates & Deadlines:** Execution date, commencement date, notice windows, grace periods.
* **Financial Obligations:** Base payments, deposits, late penalties, utility splits.
* **Potential Risks & Red Flags:** One-sided indemnity, short cure windows, automatic renewal traps.
* **Actionable Checklist:** Pre-signing and post-signing to-do lists for the user.

### D. Grounded Document Q&A with Evidence Snippets
* Pinpoint extraction citing exact clauses and verbatim snippets from the uploaded document.
* Fallback verification ensuring answers are anchored strictly in provided context.

---

## 3. Technology Stack

* **Frontend:** React 19, TypeScript, Vite, CSS Custom Properties, Accessible ARIA primitives.
* **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2.
* **PDF Processing:** PyMuPDF (`pymupdf` / `fitz`).
* **Generative AI:** Google Gemini API (`gemini-1.5-flash`) via the official Google GenAI Python SDK (`google-genai`).
* **Testing:** Pytest, AnyIO, FastAPI TestClient.
* **Hosting:** Vercel (Frontend CDN with automated edge rewrites), PythonAnywhere (Backend API).

---

## 4. Responsible AI & Architecture

```text
                  +------------------------------------------------+
                  |         User Interface (React / Vite)         |
                  +------------------------------------------------+
                                          |
                      HTTPS API / Vercel Edge Proxy
                                          v
                  +------------------------------------------------+
                  |              FastAPI Backend Router            |
                  |     /api/health  /api/chat  /api/documents     |
                  +------------------------------------------------+
                               /                      \
                              /                        \
                             v                          v
       +-------------------------------+      +-------------------------+
       |   Document Processing Engine  |      |   Legal AI Service      |
       | - PyMuPDF Text Extraction     |      | - Client Caching        |
       | - File Integrity Validation   |      | - Gemini 1.5 Flash      |
       | - Scanned Notice Generation   |      | - Grounded Context QA   |
       +-------------------------------+      +-------------------------+
                             \                          /
                              \                        /
                               v                      v
                  +------------------------------------------------+
                  |   Responsible AI & Grounding Safeguards        |
                  |   - Verbatim Evidence Citation Snippets        |
                  |   - Missing-Information Non-Hallucination      |
                  |   - Prompt Injection Defense Guardrails        |
                  +------------------------------------------------+
```

### Generative AI Model Configuration
* **Configured Model:** `gemini-1.5-flash` (specified via `GEMINI_MODEL` in backend configuration).
* **Client Caching:** The backend caches the `genai.Client` singleton instance per API key to eliminate connection overhead and improve response latency.
* **Mock Fallback:** Automated test suites run with high fidelity under mock mode when an external API key is not configured, guaranteeing reliable CI/CD pipelines.

---

## 5. Accessibility (WCAG AA / AAA Compliance)

The user interface was rigorously audited and upgraded to meet modern web accessibility standards:
* **Contrast Compliance:** All secondary text labels (`--fg3`) are styled with `rgba(240, 241, 255, 0.72)`, providing a **9.30:1** contrast ratio against the `#04060f` background—exceeding both WCAG AA (4.5:1) and WCAG AAA (7:1) requirements.
* **Skip to Main Content:** Accessible keyboard skip link (`.skip-link`) allows screen reader and keyboard users to bypass navigation directly to `#main-content`.
* **Semantic Form Labels:** Hidden screen-reader labels (`.sr-only`) on all form inputs and textareas ensure full assistive device announcements.
* **Accessible Buttons:** Explicit `aria-label` attributes on all icon-only buttons (Send, Mic, Upload, Close, Options).
* **Modal Semantics:** Upload modal configured with `role="dialog"`, `aria-modal="true"`, focus boundaries, and Escape key dismissal.
* **Tablist Semantics:** Document analysis views implement `role="tablist"` and `role="tab"` with `aria-selected` tracking.

---

## 6. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root service descriptor and link to documentation |
| `GET` | `/api/health` | Live service health check and version status |
| `POST` | `/api/chat` | General legal information chat endpoint |
| `POST` | `/api/documents/upload` | Upload PDF/TXT/DOCX file for text extraction and analysis |
| `GET` | `/api/documents` | List uploaded documents with status and metadata |
| `GET` | `/api/documents/{id}` | Retrieve document metadata, text, and extracted analysis |
| `DELETE` | `/api/documents/{id}` | Remove document and clean up local storage |
| `POST` | `/api/documents/{id}/analyze` | Trigger structured AI document analysis |
| `POST` | `/api/documents/{id}/ask` | Ask grounded legal questions against document context |
| `POST` | `/api/documents/{id}/checklist` | Generate actionable pre/post-signing compliance checklist |

---

## 7. Automated Testing & Verification

The backend includes a comprehensive automated test suite consisting of **54 passing tests** across 4 test suites:

```bash
backend/tests/test_ai_service.py     # 3 passed   (Client caching, mock fallback, analysis extraction)
backend/tests/test_chat.py           # 11 passed  (Intent routing, definitions, prompt injection, sources)
backend/tests/test_documents.py      # 38 passed  (Upload, validation, lease QA, absent clauses, checklist, CORS)
backend/tests/test_health.py         # 2 passed   (Root endpoint, health check)
===================================== 54 passed in 1.74s =====================================
```

### Key Test Coverage Highlights:
* **Grounded Clause Extraction:** Validates exact extraction of rent amount ($685), due date (1st), late fee ($50), and security deposit ($685).
* **Missing Information Detection:** Confirms system returns `is_found=False` and `snippet=None` when queried about absent clauses (e.g., parking, refrigerator repairs, pet fees).
* **Security & Prompt Injection:** Ensures adversarial user prompts attempting to override document grounding are treated strictly as questions.
* **Scanned PDF Detection:** Validates clear user feedback when image-only or zero-text documents are uploaded.
* **CORS Preflight:** Validates CORS options headers for cross-origin frontend requests.

### Running Backend Tests Locally:
```bash
# From repository root:
pytest backend/tests -v
```

### Running Frontend Production Build:
```bash
cd frontend
npm run build
```

---

## 8. Deployment & Environment Setup

### Production URLs
* **Frontend:** `https://letzz-ai-legally.vercel.app`
* **Backend:** `https://ishhhi.pythonanywhere.com`

### Environment Configuration
The backend accepts the following environment variables (configured via `.env` or cloud environment settings):

```env
# AI Service
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Server Configuration
ENV=production
DEBUG=False
PORT=8000
HOST=0.0.0.0

# CORS Allowed Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,https://letzz-ai-legally.vercel.app
```

---

## 9. Security & Privacy Safeguards

* **No Secret Leaks:** API keys are managed exclusively in backend environment variables and never exposed to client bundles.
* **CORS Whitelisting:** API access is strictly restricted to trusted frontend origins.
* **Input Sanitization:** Multi-part file uploads validate file extension and binary magic bytes to prevent renamed malicious payloads.
* **Temporary Processing:** Uploaded documents are stored locally for the duration of the analysis session and can be deleted immediately via the `/api/documents/{id}` DELETE endpoint.

---

## 10. Submission Summary

| Evaluation Criteria | Implementation Details |
|---|---|
| **Problem Statement Alignment** | End-to-end grounded legal assistance; instant 1-click sample lease demo; absent clause detection; clear legal disclaimers. |
| **Code Quality & Architecture** | Modular FastAPI routers, Pydantic v2 schemas, Vite + TypeScript frontend, zero debug clutter, clean git history. |
| **Accessibility (WCAG AA)** | 9.30:1 contrast ratio, skip link, semantic labels, keyboard navigable dialogs and tablists. |
| **Testing & Robustness** | **54 passing automated tests** with 100% pass rate covering edge cases, extraction, and security. |
| **Efficiency** | Singleton Gemini client caching, edge rewrite proxy, and fast bundle compilation. |
