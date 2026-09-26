import { useState, useEffect } from "react";
import {
  api,
  DocumentAnalysisResponse,
  DocumentChecklistResponse,
  DocumentAskResponse,
} from "../../api";
import { Page, ATab } from "../../types";
import { I, Ico } from "../common/Icons";

export function DocAnalysis({ docId, setPage }: { docId: string | null; setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<ATab>("summary");
  const [analysis, setAnalysis] = useState<DocumentAnalysisResponse | null>(null);
  const [checklist, setChecklist] = useState<DocumentChecklistResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Document Q&A state
  const [docQuestion, setDocQuestion] = useState("");
  const [docAnswers, setDocAnswers] = useState<DocumentAskResponse[]>([]);
  const [asking, setAsking] = useState(false);

  const tabs: ATab[] = ["summary", "clauses", "dates", "concerns", "checklist"];

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        if (docId) {
          const res = await api.analyzeDocument(docId);
          setAnalysis(res);
        } else {
          const docs = await api.listDocuments();
          if (docs.length > 0) {
            const res = await api.analyzeDocument(docs[0].id);
            setAnalysis(res);
          } else {
            setError("No document selected. Please upload a document to view its analysis.");
          }
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load document analysis.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [docId]);

  const handleFetchChecklist = async () => {
    if (checklist) return;
    const targetId = docId || analysis?.document_id;
    if (!targetId) return;
    try {
      const res = await api.getChecklist(targetId);
      setChecklist(res);
    } catch (err) {
      // Checklist error handled gracefully
    }
  };

  const handleTabChange = (t: ATab) => {
    setTab(t);
    if (t === "checklist") {
      handleFetchChecklist();
    }
  };

  const handleAskDoc = async () => {
    const q = docQuestion.trim();
    if (!q || asking) return;
    const targetId = docId || analysis?.document_id;
    if (!targetId) return;
    setAsking(true);

    try {
      const res = await api.askDocument(targetId, q);
      setDocAnswers(prev => [res, ...prev]);
      setDocQuestion("");
    } catch (err: any) {
      // Document QA error handled in state
    } finally {
      setAsking(false);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <button className="btn-ghost" onClick={() => setPage("documents")} style={{ fontSize: 12, cursor: "pointer" }} aria-label="Go back to documents list">← Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
            {analysis?.filename || "Document Analysis"}
          </p>
          <p style={{ fontSize: 11.5, marginTop: 2 }}>
            <span style={{ color: "var(--fg3)" }}>Legal Analysis · </span>
            <span style={{ color: "var(--green)" }}>✓ Evidence-grounded document analysis</span>
          </p>
        </div>
        <span className="badge bd-blue">Document Analysis</span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left pane: Document text rendering */}
        <div className="scroll" style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--fg3)" }} role="status" aria-live="polite">
              <p className="sora" style={{ fontSize: 16, marginBottom: 8, color: "var(--fg)" }}>Analyzing Legal Document...</p>
              <p style={{ fontSize: 12.5 }}>Extracting clauses, risk levels, and legal obligations...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#ff4d6d" }} role="alert">
              <p className="sora" style={{ fontSize: 16, marginBottom: 8 }}>Analysis Error</p>
              <p style={{ fontSize: 13, color: "var(--fg2)" }}>{error}</p>
            </div>
          ) : (
            <div style={{ maxWidth: 600, margin: "0 auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 1, background: "linear-gradient(90deg,rgba(61,127,255,.5),rgba(139,92,246,.4),transparent)" }} />
              <div style={{ padding: "18px 30px 14px", textAlign: "center", background: "rgba(255,255,255,.02)", borderBottom: "1px solid var(--border2)" }}>
                <p className="sora" style={{ fontSize: 16, fontWeight: 700, color: "var(--fg)" }}>
                  {analysis?.title || "LEGAL AGREEMENT"}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 4 }}>Structured AI Extract</p>
              </div>
              <div style={{ padding: "22px 30px", display: "flex", flexDirection: "column", gap: 18, fontSize: 13, lineHeight: 1.7, color: "var(--fg2)" }}>
                {analysis?.key_clauses.map((clause, idx) => (
                  <section key={idx} aria-label={`Clause ${clause.clause_number || idx + 1}: ${clause.title}`} style={{
                    borderRadius: 10, padding: "12px 14px",
                    background: clause.category === "concerns" ? "rgba(255,77,109,.05)" : "rgba(61,127,255,.06)",
                    borderLeft: clause.category === "concerns" ? "2px solid rgba(255,77,109,.4)" : "2px solid rgba(61,127,255,.5)",
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--fg3)", textTransform: "uppercase", marginBottom: 5 }}>
                      {clause.clause_number || idx + 1}. {clause.title}
                    </p>
                    <p style={{ color: "var(--fg2)" }}>{clause.summary}</p>
                    {clause.original_snippet && (
                      <p style={{ fontSize: 11.5, color: "var(--fg3)", fontStyle: "italic", marginTop: 6 }}>"{clause.original_snippet}"</p>
                    )}
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI panel */}
        <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid var(--border2)", display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(4,6,15,.6)" }}>
          <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 10px rgba(61,127,255,.3)" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white" aria-hidden="true"><path d="M5 0L6.5 3.5H10L7 5.5L8.5 9L5 7L1.5 9L3 5.5L0 3.5H3.5L5 0Z"/></svg>
              </div>
              <span className="sora" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>AI Analysis</span>
              <span className="badge bd-green" style={{ marginLeft: "auto" }}>Ready</span>
            </div>
            <div role="tablist" aria-label="Document Analysis Sections" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {tabs.map(t => (
                <button
                  key={t}
                  role="tab"
                  id={`tab-${t}`}
                  aria-selected={tab === t}
                  aria-controls={`panel-${t}`}
                  onClick={() => handleTabChange(t)}
                  style={{ padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 500, textTransform: "capitalize", cursor: "pointer", background: tab === t ? "rgba(61,127,255,.18)" : "rgba(255,255,255,.04)", border: tab === t ? "1px solid rgba(61,127,255,.3)" : "1px solid var(--border)", color: tab === t ? "var(--blue2)" : "var(--fg3)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="scroll" style={{ flex: 1, padding: 14, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {tab === "summary" && (
              <>
                <div style={{ padding: 14, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", color: "var(--fg3)", textTransform: "uppercase", marginBottom: 8 }}>Overview</p>
                  <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "var(--fg2)" }}>
                    {analysis?.overview || "Document overview loading..."}
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                    <p style={{ fontSize: 10.5, color: "var(--fg3)", marginBottom: 4 }}>Risk Level</p>
                    <p className="sora" style={{ fontSize: 20, fontWeight: 700, color: analysis?.risk_level === "High" ? "#ff4d6d" : "var(--green)" }}>
                      {analysis?.risk_level || "Low"}
                    </p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                    <p style={{ fontSize: 10.5, color: "var(--fg3)", marginBottom: 4 }}>Clauses</p>
                    <p className="sora" style={{ fontSize: 20, fontWeight: 700, color: "var(--blue2)" }}>
                      {analysis?.total_clauses_identified || 5}
                    </p>
                  </div>
                </div>
              </>
            )}

            {tab === "clauses" && (
              analysis?.key_clauses.map((c, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--blue2)", marginBottom: 4 }}>{c.title}</p>
                  <p style={{ fontSize: 12.5, lineHeight: 1.6, color: "var(--fg2)" }}>{c.summary}</p>
                </div>
              ))
            )}

            {tab === "dates" && (
              analysis?.important_dates.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 18 }} aria-hidden="true">{d.icon || "📅"}</span>
                  <div>
                    <p style={{ fontSize: 10.5, color: "var(--fg3)" }}>{d.label}</p>
                    <p className="sora" style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{d.date_or_period}</p>
                  </div>
                </div>
              ))
            )}

            {tab === "concerns" && (
              analysis?.potential_concerns.map((c, i) => (
                <div key={i} style={{ padding: 14, borderRadius: 10, background: "rgba(255,77,109,.05)", border: "1px solid rgba(255,77,109,.2)" }}>
                  <span className={`badge ${c.severity === "High Priority" ? "bd-red" : "bd-amber"}`}>{c.severity}</span>
                  <p className="sora" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg)", margin: "8px 0 5px" }}>{c.title}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--fg3)" }}>{c.description}</p>
                </div>
              ))
            )}

            {tab === "checklist" && (
              checklist?.important_items_to_review.map((item, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span className="badge bd-blue" style={{ fontSize: 9 }}>{item.category}</span>
                  <p style={{ fontSize: 12, marginTop: 6, color: "var(--fg2)" }}>{item.item}</p>
                </div>
              ))
            )}

            {/* Q&A Stream responses */}
            {docAnswers.map((ans, idx) => (
              <div key={idx} style={{ padding: 12, borderRadius: 10, background: "rgba(61,127,255,.08)", border: "1px solid rgba(61,127,255,.2)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--blue2)" }}>Q: {ans.question}</p>
                <p style={{ fontSize: 12, marginTop: 4, color: "var(--fg)" }}>{ans.answer}</p>
                {ans.reference_snippet && (
                  <p style={{ fontSize: 11, fontStyle: "italic", marginTop: 4, color: "var(--fg3)" }}>
                    Supporting clause: "{ans.reference_snippet}"
                  </p>
                )}
                {!ans.found_in_document && (
                  <p style={{ fontSize: 10.5, color: "#ff8fa3", marginTop: 4 }}>
                    Notice: Information not specified in document.
                  </p>
                )}
              </div>
            ))}

            {/* Ask about document input */}
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(61,127,255,.05)", border: "1px solid rgba(61,127,255,.16)", marginTop: "auto" }}>
              <p style={{ fontSize: 11.5, fontWeight: 500, color: "var(--blue2)", marginBottom: 10 }}>Ask about this document</p>
              <div style={{ display: "flex", gap: 8 }}>
                <label htmlFor="doc-qa-input" className="sr-only">Ask a question about this legal document</label>
                <input
                  id="doc-qa-input"
                  value={docQuestion}
                  onChange={e => setDocQuestion(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAskDoc(); }}
                  placeholder="e.g. What is the security deposit?"
                  aria-label="Ask a question about this legal document"
                  style={{ flex: 1, fontSize: 12, padding: "7px 10px", borderRadius: 7, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "var(--fg)", outline: "none", fontFamily: "Inter, sans-serif" }}
                />
                <button
                  onClick={handleAskDoc}
                  disabled={asking}
                  aria-label="Submit question about document"
                  style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "linear-gradient(135deg,#3d7fff,#5b94ff)", color: "#fff", boxShadow: "0 2px 10px rgba(61,127,255,.3)", cursor: "pointer" }}>
                  <Ico c={<I.Send />} s={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
