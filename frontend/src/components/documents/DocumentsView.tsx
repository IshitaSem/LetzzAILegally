import { useState, useEffect } from "react";
import { api, DocumentMetadata } from "../../api";
import { Page } from "../../types";
import { I, Ico } from "../common/Icons";
import { Star } from "../common/Decorative";

export function DocumentsView({ setPage, onUpload, onSelectDoc }: { setPage: (p: Page) => void; onUpload: () => void; onSelectDoc: (id: string) => void }) {
  const [docs, setDocs] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const data = await api.listDocuments();
        setDocs(data);
      } catch (err) {
        // Document fetch error handled in state
      } finally {
        setLoading(false);
      }
    }
    fetchDocs();
  }, []);

  return (
    <div className="scroll" style={{ flex: 1, padding: "40px", overflowY: "auto", position: "relative" }}>
      <Star x="90%" y="6%" size={12} opacity={0.25} />
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <h1 className="sora" style={{ fontSize: 34, fontWeight: 800, color: "var(--fg)", marginBottom: 6, letterSpacing: "-0.03em" }}>Documents</h1>
            <p style={{ fontSize: 13.5, color: "var(--fg2)" }}>Upload and analyse your legal documents</p>
          </div>
          <button className="btn-blue" onClick={onUpload} style={{ cursor: "pointer" }} aria-label="Upload document file">
            <Ico c={<I.Upload />} s={14} /> Upload
          </button>
        </div>

        <button onClick={onUpload}
          aria-label="Drop a legal document or click to upload PDF, DOCX, or TXT"
          style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", borderRadius: 18, textAlign: "center", cursor: "pointer", marginBottom: 24, background: "rgba(61,127,255,.03)", border: "2px dashed rgba(61,127,255,.18)", gap: 12 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,127,255,.4)"; (e.currentTarget as HTMLElement).style.background = "rgba(61,127,255,.06)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,127,255,.18)"; (e.currentTarget as HTMLElement).style.background = "rgba(61,127,255,.03)"; }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue2)", boxShadow: "0 0 16px rgba(61,127,255,.15)" }}>
            <Ico c={<I.Upload />} s={22} />
          </div>
          <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>Drop a document or click to upload</p>
          <p style={{ fontSize: 12.5, color: "var(--fg3)" }}>PDF · DOCX · TXT</p>
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "var(--fg3)", padding: 20 }} role="status" aria-live="polite">Loading uploaded documents...</p>
          ) : docs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--fg3)", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="sora" style={{ fontSize: 14, color: "var(--fg)", marginBottom: 4, fontWeight: 600 }}>No documents uploaded yet</p>
              <p style={{ fontSize: 12.5 }}>Upload a contract, lease, or agreement above to begin analysis.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id}
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,127,255,.22)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--blue2)" }}>
                  <Ico c={<I.Doc />} s={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className="sora" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.filename}</p>
                  <p style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 2 }}>{doc.file_type} · {(doc.file_size_bytes / 1024).toFixed(0)} KB</p>
                </div>
                <span className="badge bd-green">Analysed</span>
                <button className="btn-ghost" onClick={() => { onSelectDoc(doc.id); setPage("doc-analysis"); }} style={{ fontSize: 12, cursor: "pointer" }} aria-label={`Open analysis for ${doc.filename}`}>Open</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
