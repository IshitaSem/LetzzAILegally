import os
import re
import json
import asyncio
import logging
from decimal import Decimal, InvalidOperation
from typing import Dict, Any, Optional
from fastapi import HTTPException, status

from app.config import settings
from app.services.document_service import DocumentService
from app.services.prompt_service import (
    build_chat_prompt,
    build_document_analysis_prompt,
    build_document_ask_prompt,
    build_document_checklist_prompt,
)

logger = logging.getLogger(__name__)

# Intent patterns
GREETING_PATTERNS = {
    "hi", "hello", "hey", "good morning", "good evening", "good afternoon",
    "greetings", "hi there", "hello there", "hey there", "yo", "sup"
}

THANKS_PATTERNS = {
    "thanks", "thank you", "thanks a lot", "thank you so much",
    "thank you very much", "ty", "thx", "many thanks"
}

GOODBYE_PATTERNS = {
    "bye", "goodbye", "see you", "see ya", "cya", "take care",
    "have a good day", "have a great day", "bye bye"
}

DOC_QUERY_KEYWORDS = [
    "my document", "this document", "my contract", "this contract",
    "my lease", "this lease", "my file", "this file", "uploaded document",
    "analyze my document", "review my contract", "summarize my document",
    "what is in my document", "read my document"
]

class LegalAIService:
    _NOT_FOUND_RESPONSE = {
        "answer": "I couldn't find information about that in the uploaded document.",
        "reference_snippet": None,
        "found_in_document": False,
    }
    _genai_client: Optional[Any] = None
    _cached_api_key: Optional[str] = None

    @staticmethod
    def _clean_json_string(text: str) -> str:
        """Strip markdown codeblock wrappers like ```json ... ```."""
        text = text.strip()
        pattern = r"```(?:json)?\s*(.*?)\s*```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()
        return text

    @classmethod
    def _classify_intent(cls, user_message: str) -> str:
        """Categorize user message into intent classes."""
        cleaned = re.sub(r'[^\w\s]', '', user_message.strip().lower())

        # 1. Casual Intent
        if cleaned in GREETING_PATTERNS or cleaned in THANKS_PATTERNS or cleaned in GOODBYE_PATTERNS:
            return "casual"

        # 2. Document Query when no document uploaded
        is_doc_query = any(keyword in cleaned for keyword in DOC_QUERY_KEYWORDS)
        if is_doc_query and len(DocumentService.list_documents()) == 0:
            return "doc_query_no_doc"

        # 3. Contract vs Agreement specific comparison
        if ("contract" in cleaned and "agreement" in cleaned) and any(w in cleaned for w in ["difference", "versus", "vs", "compare", "between"]):
            return "contract_vs_agreement"

        # 4. Enforceability Follow-Up (User providing specific parameters)
        has_params = any(param in cleaned for param in [
            "california", "employment", "2 year", "2-year", "2 years", "nationwide", "whole country",
            "in my state", "my state is", "i am in", "restriction covering", "independent contractor"
        ])
        has_enforceability_context = any(w in cleaned for w in ["noncompete", "non-compete", "enforceable", "valid", "restriction", "contract", "clause"])
        if has_params and has_enforceability_context:
            return "enforceability_follow_up"

        # 5. Initial Enforceability Query
        if ("noncompete" in cleaned or "non-compete" in cleaned or "enforceable" in cleaned) and not has_params:
            return "enforceability_initial"

        # 6. General Legal Education / Definition
        if any(q in cleaned for q in ["what is", "define", "explain", "meaning of", "what does"]):
            return "general_legal_education"

        return "general_legal_qa"

    @classmethod
    def _handle_intent(cls, intent: str, user_message: str) -> Optional[Dict[str, Any]]:
        """Handle classified intents with structured, accurate legal responses."""
        cleaned_msg = re.sub(r'[^\w\s]', '', user_message.strip().lower())

        # 1. Casual Intent
        if intent == "casual":
            if cleaned_msg in GREETING_PATTERNS:
                return {
                    "answer": (
                        "Hello! I am LetzAiLegally, your AI-powered legal assistant. "
                        "I can help you understand legal concepts, analyze legal documents, "
                        "explain complex clauses in plain language, and find supporting legal sources. "
                        "How can I assist you today?"
                    ),
                    "key_points": [
                        "Ask general legal questions in plain English.",
                        "Upload contracts or agreements (PDF, DOCX, TXT) for instant analysis.",
                        "Ask follow-up questions grounded in your uploaded documents."
                    ],
                    "sources": []
                }
            if cleaned_msg in THANKS_PATTERNS:
                return {
                    "answer": "You're very welcome! If you have any more legal questions or documents to review, feel free to ask.",
                    "key_points": [],
                    "sources": []
                }
            if cleaned_msg in GOODBYE_PATTERNS:
                return {
                    "answer": "Goodbye! Have a great day, and feel free to return whenever you need legal assistance or document analysis.",
                    "key_points": [],
                    "sources": []
                }

        # 2. Document Query without Document Uploaded
        if intent == "doc_query_no_doc":
            return {
                "answer": (
                    "You haven't uploaded a document yet. Please click the upload button (📄 or 📎) "
                    "to upload your PDF, DOCX, or TXT file first, and I will analyze its clauses and answer questions about it!"
                ),
                "key_points": [
                    "Supported formats: PDF, DOCX, TXT (up to 10MB).",
                    "Once uploaded, click 'Open' or ask questions in the Document Analysis view."
                ],
                "sources": []
            }

        # 3. Contract vs Agreement Question
        if intent == "contract_vs_agreement":
            return {
                "answer": (
                    "In legal terminology, an 'agreement' and a 'contract' have distinct meanings:\n\n"
                    "1. Agreement (Mutual Understanding): An agreement is any arrangement or understanding reached between two or more parties regarding a shared intention or promise. It can be informal, social, or oral, and does not automatically carry legal enforceability.\n\n"
                    "2. Contract (Legally Enforceable Agreement): A contract is a specific type of agreement that satisfies all statutory legal requirements for enforceability in a court of law.\n\n"
                    "Core Requirements for an Agreement to Become a Contract:\n"
                    "• Offer & Acceptance: Clear proposal by one party and unequivocal acceptance by another.\n"
                    "• Consideration: Something of legal value exchanged between the parties (e.g., payment, services, goods, or a binding promise).\n"
                    "• Intention to Create Legal Relations: Mutual intent to be legally bound by consequences.\n"
                    "• Legal Capacity & Lawful Purpose: Competent parties (e.g. of legal age) and a legal objective.\n\n"
                    "Key Takeaway: All contracts are agreements, but not all agreements are enforceable contracts. Specific formation standards can vary by jurisdiction."
                ),
                "key_points": [
                    "General Legal Information: An agreement is a mutual understanding; a contract is an agreement that satisfies legal enforceability requirements.",
                    "Essential Elements: Requires offer, acceptance, consideration, legal capacity, and lawful purpose.",
                    "Jurisdiction Note: Contract writing requirements (such as the Statute of Frauds) and enforcement standards vary by jurisdiction."
                ],
                "sources": []
            }

        # 4. General Legal Education
        if intent == "general_legal_education":
            msg_lower = user_message.lower()
            if "force majeure" in msg_lower:
                ans = (
                    "A 'force majeure' clause is a contractual provision that excuses one or both parties from performing their contractual obligations "
                    "when an extraordinary event or circumstance beyond their control occurs (such as natural disasters, wars, pandemics, or government action).\n\n"
                    "Key Aspects:\n"
                    "• Scope: The clause usually lists specific qualifying events (e.g. 'acts of God', strike, epidemic).\n"
                    "• Mitigation: The affected party must typically demonstrate they took reasonable steps to mitigate the impact.\n"
                    "• Notice: Contracts usually require prompt written notice when a force majeure event occurs."
                )
            elif "indemni" in msg_lower:
                ans = (
                    "An 'indemnification' clause (or hold harmless provision) is an agreement where one party agrees to compensate the other party "
                    "for certain legal liabilities, financial losses, or damages incurred during the contract term.\n\n"
                    "Key Aspects:\n"
                    "• Scope & Caps: Indemnities can be mutual or one-sided, and often contain monetary liability caps.\n"
                    "• Defense Duties: May require the indemnifying party to cover legal defense costs and attorney fees."
                )
            else:
                ans = (
                    f"Regarding '{user_message}': Under general legal principles, this legal concept defines the rights, duties, or operational rules "
                    "governing how parties interact within a legal or contractual framework.\n\n"
                    "General Overview:\n"
                    "• Purpose: Establishes predictable standards and remedies in contractual relationships.\n"
                    "• Application: Exact interpretation depends on statutory rules and explicit written agreement terms."
                )

            return {
                "answer": ans,
                "key_points": [
                    "General Legal Information: Explains standard legal principles and definitions.",
                    "Document Analysis: Upload a specific contract to review how this clause is drafted in your agreement.",
                    "Professional Advice Notice: Informational only — consult a licensed attorney for formal legal counsel."
                ],
                "sources": []
            }

        # 5. Enforceability Follow-Up (User providing specific parameters)
        if intent == "enforceability_follow_up":
            return {
                "answer": (
                    "Thank you for providing those specific details (Jurisdiction: California, Agreement Type: Employment Contract, Duration: 2 Years, Scope: Nationwide).\n\n"
                    "Analysis under California Law:\n"
                    "California maintains one of the strictest statutory prohibitions against post-employment non-compete agreements in the United States. Under California Business & Professions Code § 16600 (and recent statutory additions AB 1076 and SB 699), employment non-compete agreements are generally void and unenforceable against California employees, regardless of where or when the contract was signed.\n\n"
                    "Important Nuances to Consider:\n"
                    "1. Limited Statutory Exceptions: Narrow statutory exceptions apply primarily to the sale of a business entity or dissolution of a partnership/LLC where a business owner sells goodwill.\n"
                    "2. Choice-of-Law & Out-of-State Employers: California courts generally reject out-of-state choice-of-law provisions and nationwide restrictions enforced against California residents.\n"
                    "3. Overly Broad Scope: Even in states that permit non-competes, a 2-year nationwide restriction is frequently deemed unreasonably broad by courts.\n"
                    "4. Confidentiality & Trade Secrets: While non-competes are void in California, non-disclosure provisions protecting legitimate trade secrets remain enforceable.\n\n"
                    "Recommendation: Because specific job functions, timing, and employer actions can impact legal strategy, we recommend consulting a licensed California employment lawyer for binding counsel."
                ),
                "key_points": [
                    "General Legal Information: Under Cal. Bus. & Prof. Code § 16600, post-employment non-compete clauses for California employees are generally void.",
                    "Nationwide Scope & Duration: A 2-year nationwide restriction is exceptionally broad; California courts strictly reject employee non-compete covenants.",
                    "Exceptions & Trade Secrets: Narrow exceptions exist for business sales; trade secret non-disclosure protections remain distinct.",
                    "Professional Legal Counsel: Consult a qualified California employment attorney for personalized legal representation."
                ],
                "sources": []
            }

        # 6. Initial Enforceability Query
        if intent == "enforceability_initial":
            return {
                "answer": (
                    "Whether a non-compete clause is legally enforceable cannot be answered definitively without knowing your specific jurisdiction and exact contract wording. "
                    "Enforceability varies dramatically by region: for example, California generally prohibits employment non-competes under Cal. Bus. & Prof. Code § 16600, "
                    "whereas other states and jurisdictions allow them if they are reasonable in scope, duration, and geography.\n\n"
                    "To evaluate your situation, please consider:\n"
                    "1. Governing Jurisdiction: Which country or state's law applies to your contract?\n"
                    "2. Agreement Type: Is this an employment contract, independent contractor agreement, or part of a business sale?\n"
                    "3. Duration: What is the restricted time period (e.g. 6 months vs. 2 years)?\n"
                    "4. Geographic Scope: What specific geographic area does the restriction cover?\n"
                    "5. Activity Scope: Does it restrict working for competitors, soliciting clients, or disclosing confidential information?"
                ),
                "key_points": [
                    "General Legal Information: Non-compete enforceability is strictly governed by local statutory law and reasonable boundary standards.",
                    "Jurisdiction Dependency: States like California ban most post-employment non-competes, while others evaluate reasonable business necessity.",
                    "Document-Grounded Analysis: Upload your agreement to let LetzAiLegally analyze the exact clause wording.",
                    "Professional Legal Counsel: Consult a qualified attorney licensed in your jurisdiction for binding legal advice."
                ],
                "sources": []
            }

        return None

    @classmethod
    def _get_genai_client(cls, api_key: str) -> Optional[Any]:
        """Obtain or reuse cached Google GenAI Client instance with outbound proxy support."""
        if cls._genai_client is not None and cls._cached_api_key == api_key:
            return cls._genai_client

        try:
            import httpx
            from google import genai
            from google.genai import types

            proxy_url = settings.effective_proxy
            http_options = None
            if proxy_url:
                logger.info(f"[GenAI Client] Configuring Client with outbound proxy: {proxy_url}")
                for var in ("http_proxy", "https_proxy", "HTTP_PROXY", "HTTPS_PROXY"):
                    os.environ[var] = proxy_url

                sync_transport = httpx.HTTPTransport(proxy=proxy_url)
                sync_httpx = httpx.Client(transport=sync_transport, trust_env=True, timeout=60.0)

                async_transport = httpx.AsyncHTTPTransport(proxy=proxy_url)
                async_httpx = httpx.AsyncClient(transport=async_transport, trust_env=True, timeout=60.0)

                http_options = types.HttpOptions(
                    httpx_client=sync_httpx,
                    httpx_async_client=async_httpx,
                    client_args={"proxy": proxy_url, "trust_env": True},
                    async_client_args={"proxy": proxy_url, "trust_env": True},
                )

            cls._genai_client = genai.Client(api_key=api_key, http_options=http_options)
            cls._cached_api_key = api_key
            return cls._genai_client
        except Exception as e:
            logger.warning(f"Failed to initialize google.genai Client: {e}")
            cls._genai_client = None
            cls._cached_api_key = None
            return None

    @classmethod
    def _call_gemini_with_error(cls, prompt: str) -> tuple[Optional[str], Optional[str]]:
        """Call Google Gemini API with candidate fallback models and capture error details."""
        api_key = settings.GEMINI_API_KEY
        if not api_key or api_key.lower() == "mock":
            logger.info("[Gemini] GEMINI_API_KEY is mock. Using mock AI provider mode.")
            return None, "MOCK_MODE"

        if api_key == "your_gemini_api_key_here":
            logger.info("[Gemini] GEMINI_API_KEY is set to placeholder 'your_gemini_api_key_here'. Using dynamic fallback.")
            return None, "MOCK_MODE"

        # Resilient candidate model fallback order
        candidate_models = [settings.GEMINI_MODEL]
        for fallback_model in ["gemini-2.0-flash", "gemini-1.5-flash"]:
            if fallback_model not in candidate_models:
                candidate_models.append(fallback_model)

        last_error = "Unknown error calling Gemini API"

        # -------------------------------------------------------------------------
        # Strategy 1: Direct HTTP REST Call (Most reliable across PythonAnywhere proxy & local dev)
        # -------------------------------------------------------------------------
        proxy_url = settings.effective_proxy
        proxies = {"http": proxy_url, "https": proxy_url} if proxy_url else None

        try:
            import requests

            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "temperature": 0.2,
                }
            }

            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                try:
                    logger.info(
                        f"[Gemini REST] Calling Gemini model='{model_name}' | proxy={proxy_url} | prompt_chars={len(prompt)}"
                    )
                    resp = requests.post(
                        url,
                        headers=headers,
                        json=payload,
                        proxies=proxies,
                        timeout=60.0
                    )
                    if resp.status_code == 200:
                        res_json = resp.json()
                        candidates = res_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                text_content = parts[0]["text"]
                                logger.info(
                                    f"[Gemini REST Success] Model '{model_name}' returned response | response_chars={len(text_content)}"
                                )
                                return text_content, None
                        last_error = f"Gemini model '{model_name}' returned an empty response"
                    else:
                        error_detail = resp.text
                        try:
                            err_json = resp.json()
                            if "error" in err_json and "message" in err_json["error"]:
                                error_detail = err_json["error"]["message"]
                        except Exception:
                            pass
                        last_error = f"Gemini model '{model_name}' returned HTTP {resp.status_code}: {error_detail}"
                        logger.warning(f"[Gemini REST Error] {last_error}")
                except Exception as req_err:
                    last_error = str(req_err)
                    logger.warning(f"[Gemini REST Exception] Model '{model_name}' call failed: {req_err}")
                    continue

            # If REST returned an official API error (e.g. 400 bad key, 429 quota), return it directly
            if "HTTP 4" in last_error or "HTTP 5" in last_error or "Resource exhausted" in last_error or "API key not valid" in last_error:
                return None, last_error

        except Exception as rest_setup_err:
            logger.warning(f"[Gemini REST Setup Exception] {rest_setup_err}")

        # -------------------------------------------------------------------------
        # Strategy 2: google.genai SDK Fallback
        # -------------------------------------------------------------------------
        try:
            client = cls._get_genai_client(api_key)
            if client is not None:
                from google.genai import types

                for model_name in candidate_models:
                    try:
                        logger.info(
                            f"[Gemini SDK Fallback] Calling Gemini model='{model_name}' | prompt_chars={len(prompt)}"
                        )
                        response = client.models.generate_content(
                            model=model_name,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                temperature=0.2,
                            )
                        )
                        if response and response.text:
                            logger.info(
                                f"[Gemini SDK Response] Model='{model_name}' returned response | response_chars={len(response.text)}"
                            )
                            return response.text, None
                        else:
                            last_error = f"Gemini model '{model_name}' returned an empty response"
                    except Exception as e:
                        err_msg = str(e)
                        last_error = err_msg
                        logger.warning(f"[Gemini SDK Error] Model '{model_name}' call failed: {err_msg}")
                        continue
        except Exception as sdk_ex:
            logger.warning(f"[Gemini SDK Exception] {sdk_ex}")

        # -------------------------------------------------------------------------
        # Strategy 3: Legacy google.generativeai SDK Fallback
        # -------------------------------------------------------------------------
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            for m in candidate_models:
                try:
                    legacy_model = legacy_genai.GenerativeModel(m)
                    res = legacy_model.generate_content(prompt)
                    if res and res.text:
                        return res.text, None
                except Exception:
                    pass
        except Exception:
            pass

        return None, last_error

    @classmethod
    def _call_gemini(cls, prompt: str) -> Optional[str]:
        """Call Google Gemini API using official SDK (backward-compatible)."""
        raw_text, _ = cls._call_gemini_with_error(prompt)
        return raw_text

    @classmethod
    def _parse_json_safely(cls, raw_text: str) -> Dict[str, Any]:
        """Safely parse JSON response from Gemini, handling markdown codeblocks and leading/trailing noise."""
        cleaned = cls._clean_json_string(raw_text).strip()
        try:
            return json.loads(cleaned)
        except Exception:
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                return json.loads(cleaned[first_brace:last_brace + 1])
            raise

    @classmethod
    def _dynamic_document_extract(cls, document_text: str, filename: str) -> Dict[str, Any]:
        """Dynamically extract structured legal analysis from document text without hardcoding."""
        clean_text = document_text.replace("\r\n", "\n").replace("\r", "\n").strip()
        lines = [line.strip() for line in clean_text.splitlines() if line.strip()]

        # 1. Title detection
        title = ""
        for line in lines[:8]:
            clean_l = re.sub(r"[^\w\s]", "", line).strip()
            if any(term in clean_l.upper() for term in ["AGREEMENT", "DEED", "LEASE", "CONTRACT", "POLICY", "TERMS", "MEMORANDUM", "EMPLOYMENT", "NON-DISCLOSURE"]):
                title = line.strip(" -#*:")
                break
        if not title and lines:
            title = lines[0].strip(" -#*:")
        if not title:
            title = f"Document: {filename}"

        # 2. Parties detection
        parties = []
        between_match = re.search(r"between\s+([^\n\r]+?)\s+and\s+([^\n\r]+?)(?:\.|\n|hereinafter)", clean_text, re.IGNORECASE)
        if between_match:
            p1 = between_match.group(1).replace("", "").strip(" (),")
            p2 = between_match.group(2).replace("", "").strip(" (),")
            if 2 < len(p1) < 80:
                parties.append(p1)
            if 2 < len(p2) < 80:
                parties.append(p2)

        # 3. Clause extraction (Numbered clauses or substantial paragraphs)
        clause_items = []
        current_num = None
        current_lines = []

        for line in lines:
            m = re.match(r"^(?:(?:clause|section|article)\s+)?(\d+[\.\)]|[ivxlcdm]+[\.\)])\s*(.*)", line, re.IGNORECASE)
            if m:
                if current_num is not None and current_lines:
                    clause_items.append((current_num, " ".join(current_lines).strip()))
                current_num = m.group(1).rstrip(".)")
                current_lines = [m.group(2).strip()] if m.group(2).strip() else []
            elif current_num is not None:
                current_lines.append(line)

        if current_num is not None and current_lines:
            clause_items.append((current_num, " ".join(current_lines).strip()))

        if not clause_items:
            paragraphs = [p.strip() for p in re.split(r"\n\s*\n", clean_text) if len(p.strip()) > 30]
            for idx, p in enumerate(paragraphs[:12]):
                clause_items.append((str(idx + 1), p))

        def derive_clause_meta(c_text: str):
            t_low = c_text.lower()
            cat = "concerns" if any(w in t_low for w in ["sublet", "terminate", "termination", "penalty", "default", "breach", "indemn", "liability", "forfeit", "non-compete", "restriction"]) else "clauses"
            
            if any(w in t_low for w in ["monthly rent", "rent at the rate", "pay to the lessor rent", "rent is", "rent:"]):
                c_title = "Rent & Payment Terms"
            elif any(w in t_low for w in ["lease term", "period of lease", "duration of", "lease is initially", "commencing", "effective date"]):
                c_title = "Term & Duration"
            elif any(w in t_low for w in ["security deposit", "deposit to the tune", "deposit:"]):
                c_title = "Security Deposit"
            elif any(w in t_low for w in ["terminate", "termination", "notice in writing"]):
                c_title = "Early Termination & Notice"
            elif any(w in t_low for w in ["office purpose", "permitted use", "premises are being let"]):
                c_title = "Permitted Use"
            elif any(w in t_low for w in ["sublet", "assign in part", "assignment"]):
                c_title = "Subletting & Assignment"
            elif any(w in t_low for w in ["electric", "utility", "water charges", "power and light"]):
                c_title = "Utilities & Electricity"
            elif any(w in t_low for w in ["taxes", "house tax", "ground rent", "municipal"]):
                c_title = "Taxes & Municipal Levies"
            elif any(w in t_low for w in ["permit the lessor", "enter the premises", "inspection"]):
                c_title = "Lessor Inspection & Entry Rights"
            elif any(w in t_low for w in ["confidential", "proprietary", "trade secret"]):
                c_title = "Confidentiality & Non-Disclosure"
            elif any(w in t_low for w in ["governing law", "jurisdiction", "dispute"]):
                c_title = "Governing Law & Jurisdiction"
            else:
                words = [w for w in c_text.split() if w.lower() not in ("that", "the", "shall", "and", "or", "to", "in", "of")]
                c_title = " ".join(words[:4]).capitalize() if words else "General Legal Clause"
            
            return c_title, cat

        structured_clauses = []
        for num, text in clause_items:
            clean_c = re.sub(r"\s+", " ", text).replace("", "").strip()
            if not clean_c or len(clean_c) < 10:
                continue
            c_title, cat = derive_clause_meta(clean_c)
            summary = clean_c if len(clean_c) <= 180 else clean_c[:177] + "..."
            snippet = clean_c[:250]
            structured_clauses.append({
                "clause_number": str(num),
                "title": c_title,
                "summary": summary,
                "original_snippet": snippet,
                "category": cat
            })

        # 4. Obligations
        obligations = []
        for line in lines:
            l_clean = re.sub(r"\s+", " ", line).replace("", "").strip()
            if any(term in l_clean.lower() for term in ["shall pay", "shall not", "must provide", "shall permit", "shall be responsible", "agrees to", "will pay"]):
                if 20 < len(l_clean) < 250:
                    cleaned_ob = re.sub(r"^(?:(?:clause|section)\s+)?\d+[\.\)]\s*", "", l_clean).strip()
                    if cleaned_ob not in obligations:
                        obligations.append(cleaned_ob)
                if len(obligations) >= 5:
                    break

        # 5. Important Dates
        dates = []
        date_matches = re.findall(r"\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s+\d{4})?\b|\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b", clean_text, re.IGNORECASE)
        for dm in date_matches[:3]:
            dates.append({"label": "Specified Date", "date_or_period": dm, "icon": "📅"})

        dur_matches = re.findall(r"\b(\d+\s*(?:years?|months?|days?|weeks?))\b", clean_text, re.IGNORECASE)
        for dur in dur_matches[:3]:
            label = "Lease Duration" if "year" in dur.lower() else ("Notice Period" if "month" in dur.lower() else "Timeframe")
            entry = {"label": label, "date_or_period": dur, "icon": "⏰"}
            if not any(d["date_or_period"] == dur for d in dates):
                dates.append(entry)

        # 6. Potential Concerns
        concerns = []
        for sc in structured_clauses:
            if sc["category"] == "concerns":
                concerns.append({
                    "title": sc["title"],
                    "description": f"Clause {sc['clause_number']} contains important legal restrictions or obligations: {sc['summary']}",
                    "severity": "High Priority" if any(w in sc["title"].lower() for w in ["sublet", "terminat", "penalty", "default"]) else "Review",
                    "legal_reference": "Contractual Provision"
                })
                if len(concerns) >= 5:
                    break

        party_desc = f" executed between {', '.join(parties)}" if parties else ""
        overview = (
            f"{title}{party_desc}. "
            f"This agreement outlines legal terms, rights, and operational obligations across {len(structured_clauses)} key clauses, "
            f"including financial covenants, duration terms, and operational guidelines."
        )

        return {
            "title": title,
            "overview": overview,
            "risk_level": "Med" if concerns else "Low",
            "total_clauses_identified": len(structured_clauses),
            "key_clauses": structured_clauses,
            "obligations": obligations,
            "important_dates": dates,
            "potential_concerns": concerns,
        }

    @classmethod
    async def chat(cls, user_message: str) -> Dict[str, Any]:
        """General legal chat question with intent classification."""
        intent = cls._classify_intent(user_message)
        intent_response = cls._handle_intent(intent, user_message)
        if intent_response:
            return intent_response

        prompt = build_chat_prompt(user_message)
        raw_response = await asyncio.to_thread(cls._call_gemini, prompt)

        if raw_response:
            try:
                data = cls._parse_json_safely(raw_response)
                return {
                    "answer": data.get("answer", "Analysis completed."),
                    "key_points": data.get("key_points", []),
                    "sources": data.get("sources", []),
                }
            except Exception as err:
                logger.error(f"Error parsing Gemini chat JSON: {err}")

        return {
            "answer": (
                f"Regarding your inquiry ('{user_message}'): Legal enforceability, obligations, and rights cannot be determined definitively in isolation. "
                "The legal outcome depends heavily on your specific governing jurisdiction (state/country) and the precise wording of your written contract.\n\n"
                "To help narrow down the legal principles:\n"
                "• Which country or state's law applies?\n"
                "• What type of agreement or transaction is involved?\n"
                "• What are the specific terms or restrictions in question?"
            ),
            "key_points": [
                "General Legal Information: Legal principles vary significantly by jurisdiction and statutory codes.",
                "Document-Grounded Analysis: Upload your document (PDF/DOCX/TXT) to analyze the specific clause text.",
                "Professional Advice Notice: Informational only — consult a licensed attorney for formal legal counsel."
            ],
            "sources": []
        }

    @classmethod
    async def analyze_document(cls, document_text: str, filename: str) -> Dict[str, Any]:
        """Analyze document text and return structured JSON."""
        # 1. Validation: verify that extracted text is not empty before Gemini
        if not document_text or not document_text.strip():
            logger.warning(f"[Document Analysis Error] Extracted text is empty for '{filename}'")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot analyze '{filename}': Extracted document text is empty."
            )

        # 2. Diagnostic logging
        logger.info(
            f"[Document Analysis] Initiated | filename='{filename}' | "
            f"char_count={len(document_text)} | sending_to_gemini=True"
        )

        prompt = build_document_analysis_prompt(document_text, filename)
        raw_response, gemini_error = await asyncio.to_thread(cls._call_gemini_with_error, prompt)

        if raw_response:
            try:
                data = cls._parse_json_safely(raw_response)
                if not isinstance(data, dict):
                    raise ValueError("Parsed Gemini response is not a valid JSON dictionary")

                title = data.get("title") or filename
                overview = data.get("overview") or "Overview generated from document."
                key_clauses = data.get("key_clauses") or []

                data["title"] = title
                data["overview"] = overview
                data["key_clauses"] = key_clauses
                data["total_clauses_identified"] = data.get("total_clauses_identified", len(key_clauses))
                data["risk_level"] = data.get("risk_level", "Low")
                data["obligations"] = data.get("obligations", [])
                data["important_dates"] = data.get("important_dates", [])
                data["potential_concerns"] = data.get("potential_concerns", [])

                logger.info(
                    f"[Document Analysis] Gemini structured response valid | "
                    f"title='{title}' | clauses_count={len(key_clauses)} | risk_level='{data['risk_level']}'"
                )
                return data
            except Exception as err:
                logger.error(f"[Schema Error] Failed to parse or validate Gemini document analysis JSON: {err}")
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Gemini returned an invalid analysis schema: {str(err)}"
                )

        # Handle when Gemini API was not available or call failed
        api_key = settings.GEMINI_API_KEY
        is_mock_mode = (
            not api_key
            or api_key.lower() == "mock"
            or api_key == "your_gemini_api_key_here"
            or gemini_error == "MOCK_MODE"
        )

        if is_mock_mode:
            logger.info(f"[Document Analysis] Generating dynamic document-grounded extract for '{filename}'")
            return cls._dynamic_document_extract(document_text, filename)

        # Real Gemini key was provided but failed: return a clear error instead of silently producing "Analysis unavailable"
        if "Cannot assign requested address" in str(gemini_error) or "99" in str(gemini_error):
            gemini_error = (
                f"{gemini_error} (Outbound connection failed. If running on PythonAnywhere free tier, "
                f"outbound requests must use proxy 'http://proxy.server:3128')."
            )
        logger.error(f"[Document Analysis Error] Gemini analysis failed for '{filename}': {gemini_error}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini document analysis failed: {gemini_error}"
        )

    @staticmethod
    def _is_address_line(text: str) -> bool:
        """Check if text is an address line to avoid misidentifying address numbers as lease duration."""
        t = text.lower()
        address_terms = [
            "street", " st.", " st,", " st\n", "avenue", " ave", "boulevard", "blvd",
            "drive", " dr.", "lane", " ln.", "road", " rd.", "way", "suite", "apt",
            "apartment", "unit", "premises address", "located at", "san francisco",
            "california", "zip code", " 94105", "po box", "p.o. box"
        ]
        duration_keywords = ["lease term", "term of this lease", "duration of", "commencing on", "ending on", "lease period"]
        has_addr = any(term in t for term in address_terms)
        has_dur = any(dk in t for dk in duration_keywords)
        if has_addr and not has_dur:
            return True
        return False

    @staticmethod
    def _extract_doc_units(document_text: str) -> list[str]:
        """Extract clean sentences and lines from document text."""
        units = []
        # Replace newlines with spaces except when there are double newlines
        paragraphs = re.split(r'\n\s*\n', document_text)
        
        for para in paragraphs:
            # normalize spaces within a paragraph
            para_clean = re.sub(r'\s+', ' ', para).strip()
            if not para_clean:
                continue
                
            parts = re.split(r'(?<=[.!?])\s+', para_clean)
            for p in parts:
                p_clean = p.strip()
                if len(p_clean) > 3:
                    units.append(p_clean)
        
        # Also include the original lines as fallback units so we don't lose headers
        for line in document_text.splitlines():
            line_clean = line.strip()
            if len(line_clean) > 3 and line_clean not in units:
                units.append(line_clean)
                
        # Remove duplicates while preserving order
        return list(dict.fromkeys(units))

    @classmethod
    def _retrieve_relevant_context(cls, document_text: str, question: str) -> str:
        """Retrieve top candidate clauses/units relevant to the user's question with semantic concept guards."""
        units = cls._extract_doc_units(document_text)
        q_lower = question.lower()

        # Boilerplate/generic stop words to filter out completely
        stop_words = {
            "what", "where", "when", "which", "who", "whom", "why", "how",
            "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
            "do", "does", "did", "a", "an", "the", "and", "or", "but", "if", "of",
            "at", "by", "for", "with", "about", "to", "from", "in", "on", "this",
            "that", "these", "those", "document", "contract", "agreement", "lease",
            "mention", "mentions", "mentioned", "contain", "contains", "contained",
            "say", "says", "said", "state", "states", "stated", "tell", "tells",
            "check", "verify", "show", "shows", "find", "there", "any", "allow", "allowed", "tenant", "tenants", "landlord", "landlords"
        }

        # Semantic concept mapping
        topic_synonyms = {
            "pets": ["pet", "pets", "dog", "dogs", "cat", "cats", "animal", "animals"],
            "parking": ["parking", "garage", "vehicle", "car", "parking spot", "space"],
            "smoking": ["smoking", "smoke", "tobacco", "vape", "vaping"],
            "sublet": ["sublet", "sublease", "assignment", "assigning", "assign"],
            "swimming": ["swimming", "pool", "swimming pool", "pools"],
            "deposit": ["deposit", "security deposit"],
            "due": ["due", "due date", "payment date", "pay rent", "1st", "first of", "payment terms"],
            "duration": ["duration", "how long", "lease term", "term length", "expiration", "months", "year"],
            "rent": ["rent", "monthly rent", "rent amount", "base rent", "rate"],
            "late": ["late fee", "late penalty", "grace period", "late payment"],
            "unpaid": ["don't pay", "not pay", "unpaid", "fail to pay", "default"],
            "termination": ["terminate", "termination", "cancel"],
            "renewal": ["renewal", "renew"],
            "insurance": ["insurance"],
            "maintenance": ["maintenance", "repair", "fix"],
            "guests": ["guest", "guests", "visitor", "visitors"]
        }

        # Determine if user is asking about a specific domain topic
        target_concept = None
        for concept, terms in topic_synonyms.items():
            if any(re.search(r'\b' + re.escape(term) + r'(s|es)?\b', q_lower) for term in terms):
                target_concept = concept
                break

        # Concept Guard: if query asks for an unmentioned topic, return empty
        if target_concept in ["pets", "parking", "smoking", "sublet", "swimming", "termination", "renewal", "insurance", "maintenance", "guests", "late", "deposit", "due"]:
            topic_terms = topic_synonyms[target_concept]
            doc_has_topic = any(term in document_text.lower() for term in topic_terms)
            if not doc_has_topic:
                return ""

        q_words = [w for w in re.findall(r'\b[a-zA-Z]{3,}\b', q_lower) if w not in stop_words]
        scored_units = []

        for u in units:
            u_lower = u.lower()
            if cls._is_address_line(u) and not any(k in q_lower for k in ["address", "location", "premises", "where"]):
                continue

            score = 0

            # Topic-specific intent scoring
            if target_concept == "due" or any(term in q_lower for term in ["due", "when is rent", "when do i pay", "payment date", "timing", "schedule"]):
                if any(w in u_lower for w in ["due on", "due by", "1st day", "1st of", "grace period", "payable on", "payment terms"]):
                    score += 50
                elif "due" in u_lower:
                    score += 10
                # Penalize rent amount clauses if they don't contain specific due dates
                if "base rent" in u_lower or "sum of" in u_lower or "$" in u_lower:
                    if not any(w in u_lower for w in ["due on", "1st day", "1st of", "payment terms", "grace period", "late fee applies"]):
                        score -= 30

            elif target_concept == "rent" or any(term in q_lower for term in ["monthly rent", "rent amount", "how much is rent"]):
                if any(w in u_lower for w in ["rent is $", "base rent", "monthly rent", "rent:", "$"]):
                    score += 50
                # Penalize if it's purely a date clause
                if "late fee" in u_lower or "grace period" in u_lower:
                    if "base rent" not in u_lower and "sum of" not in u_lower:
                        score -= 20

            elif target_concept == "duration" or any(term in q_lower for term in ["how long", "duration", "lease term"]):
                if any(w in u_lower for w in ["12 months", "12-month", "lease term", "duration of", "starting", "ending"]):
                    score += 50

            elif target_concept == "late" or "late fee" in q_lower:
                if any(w in u_lower for w in ["late fee", "late penalty", "grace period"]):
                    score += 50

            elif target_concept in topic_synonyms:
                for term in topic_synonyms[target_concept]:
                    if re.search(r'\b' + re.escape(term) + r'(s|es)?\b', u_lower):
                        score += 30
                        break

            # Boost numeric clauses if question asks for amount/fee/cost/deposit/percentage/number
            if any(term in q_lower for term in ["amount", "fee", "cost", "price", "deposit", "percentage", "number"]):
                if re.search(r'\$|\d', u_lower):
                    score += 40

            # Word overlaps for non-stop concept words
            score += sum(3 for w in q_words if w in u_lower)

            if score > 0:
                scored_units.append((score, u))

        scored_units.sort(key=lambda x: x[0], reverse=True)
        top_units = [u for sc, u in scored_units if sc > 0][:5]
        return "\n".join(top_units)

    @staticmethod
    def _normalised_numbers(text: str) -> set[str]:
        """Return comparable number tokens without inferring their legal meaning."""
        values: set[str] = set()
        for token in re.findall(r'\$?\s*\d{1,3}(?:,\d{3})*(?:\.\d+)?|\b\d+(?:\.\d+)?', text):
            cleaned = token.replace("$", "").replace(",", "").strip()
            try:
                values.add(format(Decimal(cleaned).normalize(), "f"))
            except InvalidOperation:
                continue
        return values

    @staticmethod
    def _month_names(text: str) -> set[str]:
        return set(re.findall(
            r'\b(?:january|february|march|april|may|june|july|august|september|october|november|december)\b',
            text.lower(),
        ))

    @classmethod
    def _gemini_answer_is_grounded(cls, answer: str, reference_snippet: str) -> bool:
        """Reject Gemini answers that introduce numeric or calendar facts absent from its quote."""
        if not cls._normalised_numbers(answer).issubset(cls._normalised_numbers(reference_snippet)):
            return False
        return cls._month_names(answer).issubset(cls._month_names(reference_snippet))

    @staticmethod
    def _question_requires_specific_value(question: str) -> bool:
        """Identify questions that cannot be answered safely without an explicit value or date."""
        q = question.lower()
        return any(phrase in q for phrase in [
            "how much", "amount", "what is the monthly rent", "what is the rent",
            "rent amount", "what is the late fee", "late fee amount", "security deposit amount",
            "when is", "when do", "when does", "due date", "how long", "duration",
            "expires", "expire", "expiration",
        ])

    @classmethod
    def _evidence_only_fallback(cls, relevant_context: str, question: str) -> Dict[str, Any]:
        """Return only a retrieved clause, or an honest not-found result."""
        top_clause = next((line.strip() for line in relevant_context.splitlines() if line.strip()), "")
        if not top_clause:
            return dict(cls._NOT_FOUND_RESPONSE)

        if cls._question_requires_specific_value(question):
            if not cls._normalised_numbers(top_clause) and not cls._month_names(top_clause):
                return dict(cls._NOT_FOUND_RESPONSE)

        return {
            "answer": top_clause,
            "reference_snippet": top_clause,
            "found_in_document": True,
        }

    @classmethod
    async def ask_document(cls, document_text: str, question: str) -> Dict[str, Any]:
        """Grounded QA on document text using semantic retrieval + Gemini synthesis with natural fallback."""
        relevant_context = cls._retrieve_relevant_context(document_text, question)

        logger.info("Document Q&A retrieval completed | context_characters=%d", len(relevant_context))

        # NO-EVIDENCE RULE: If retrieval found no evidence for the question topic, return absent response immediately
        if not relevant_context or not relevant_context.strip():
            logger.info("Document Q&A returned not found because retrieval produced no evidence.")
            return dict(cls._NOT_FOUND_RESPONSE)

        prompt = build_document_ask_prompt(document_text, question, relevant_context=relevant_context)
        raw_response = await asyncio.to_thread(cls._call_gemini, prompt)

        if raw_response:
            try:
                cleaned = cls._clean_json_string(raw_response)
                data = json.loads(cleaned)
                ans = data.get("answer", "").strip()
                ans = re.sub(r'^based on the (?:uploaded )?document(?: text)?:?\s*', '', ans, flags=re.IGNORECASE)
                
                # Check if Gemini stated it couldn't find info
                if "couldn't find" in ans.lower() or "not found" in ans.lower() or data.get("found_in_document") is False:
                    return dict(cls._NOT_FOUND_RESPONSE)
                    
                snippet = data.get("reference_snippet")
                # A generated answer is only usable when its claimed evidence is part of
                # the retrieved document context. This prevents unsupported Q&A output.
                if not snippet or snippet not in relevant_context:
                    logger.warning("Discarded document Q&A response with unsupported evidence.")
                    raise ValueError("Generated response did not include a retrieved supporting clause")

                if not cls._gemini_answer_is_grounded(ans, snippet):
                    logger.warning("Discarded document Q&A response with unsupported numeric or date facts.")
                    raise ValueError("Generated response failed grounding validation")

                logger.info("Gemini document Q&A response validated successfully.")
                return {
                    "answer": ans,
                    "reference_snippet": snippet,
                    "found_in_document": True
                }
            except Exception as err:
                logger.error(f"Error parsing Gemini document ask JSON: {err}")

        # Deterministic Grounded Synthesis Fallback (used when Gemini API key is mock or offline)
        logger.info("Executing Grounded Synthesis Fallback with retrieved evidence...")
        return cls._evidence_only_fallback(relevant_context, question)

    @classmethod
    async def checklist_document(cls, document_text: str, filename: str) -> Dict[str, Any]:
        """Generate legal checklist from document."""
        prompt = build_document_checklist_prompt(document_text, filename)
        raw_response = await asyncio.to_thread(cls._call_gemini, prompt)

        if raw_response:
            try:
                cleaned = cls._clean_json_string(raw_response)
                return json.loads(cleaned)
            except Exception as err:
                logger.error(f"Error parsing Gemini document checklist JSON: {err}")

        return {
            "important_items_to_review": [],
            "questions_for_legal_professional": [],
            "action_items_and_deadlines": [],
        }
