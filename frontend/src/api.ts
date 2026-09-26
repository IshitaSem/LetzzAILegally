/**
 * LetzAiLegally Frontend API Service Module
 * Handles communications with the FastAPI backend.
 */

// Production PythonAnywhere backend deployment URL
const PROD_API_URL = "https://ishhhi.pythonanywhere.com";

// Configurable API base URL: defaults to Vite proxy '/api' in development,
// and to live PythonAnywhere backend in production if VITE_API_BASE_URL is not set.
const API_BASE = import.meta.env.VITE_API_BASE_URL 
  ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` 
  : (import.meta.env.PROD ? `${PROD_API_URL}/api` : '/api');

export interface SourceCitation {
  title: string;
  reference: string;
  relevance: string;
}

export interface ChatResponse {
  conversation_id: string;
  answer: string;
  key_points: string[];
  sources: SourceCitation[];
  disclaimer: string;
}

export interface DocumentUploadResponse {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  char_count: number;
  extracted_text_status: string;
  message: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_type: string;
  file_size_bytes: number;
  char_count: number;
  created_at: string;
}

export interface KeyClause {
  clause_number?: string;
  title: string;
  summary: string;
  original_snippet?: string;
  category: string;
}

export interface ImportantDate {
  label: string;
  date_or_period: string;
  icon: string;
}

export interface PotentialConcern {
  title: string;
  description: string;
  severity: string;
  legal_reference?: string;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  filename: string;
  title: string;
  overview: string;
  risk_level: string;
  total_clauses_identified: number;
  key_clauses: KeyClause[];
  obligations: string[];
  important_dates: ImportantDate[];
  potential_concerns: PotentialConcern[];
  disclaimer: string;
}

export interface DocumentAskResponse {
  document_id: string;
  question: string;
  answer: string;
  reference_snippet?: string;
  found_in_document: boolean;
  disclaimer: string;
}

export interface ChecklistItem {
  category: string;
  item: string;
  priority: string;
}

export interface DocumentChecklistResponse {
  document_id: string;
  filename: string;
  important_items_to_review: ChecklistItem[];
  questions_for_legal_professional: string[];
  action_items_and_deadlines: string[];
  disclaimer: string;
}

export const api = {
  /**
   * Check backend health
   */
  async getHealth(): Promise<{ status: string; app: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      return await res.json();
    } catch (err) {
      console.warn("Backend health check failed, falling back:", err);
      return { status: "offline", app: "LetzAiLegally" };
    }
  },

  /**
   * Send general legal chat message
   */
  async sendChat(message: string, conversationId?: string): Promise<ChatResponse> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Chat request failed (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Upload legal document (PDF, TXT, DOCX)
   */
  async uploadDocument(file: File): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Upload failed (${res.status})`);
    }
    return await res.json();
  },

  /**
   * List uploaded documents
   */
  async listDocuments(): Promise<DocumentMetadata[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error(`Failed to list documents (${res.status})`);
    return await res.json();
  },

  /**
   * Delete uploaded document
   */
  async deleteDocument(docId: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Failed to delete document (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Analyze document
   */
  async analyzeDocument(docId: string): Promise<DocumentAnalysisResponse> {
    const res = await fetch(`${API_BASE}/documents/${docId}/analyze`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Document analysis failed (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Ask question about document
   */
  async askDocument(docId: string, question: string): Promise<DocumentAskResponse> {
    const res = await fetch(`${API_BASE}/documents/${docId}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Document Q&A failed (${res.status})`);
    }
    return await res.json();
  },

  /**
   * Get document review checklist
   */
  async getChecklist(docId: string): Promise<DocumentChecklistResponse> {
    const res = await fetch(`${API_BASE}/documents/${docId}/checklist`, {
      method: "POST",
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `Checklist fetch failed (${res.status})`);
    }
    return await res.json();
  }
};
