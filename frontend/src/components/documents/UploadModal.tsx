import { useState, useRef, useEffect } from "react";
import { api } from "../../api";
import { I, Ico } from "../common/Icons";

export function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (docId: string) => void }) {
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState(0);
  const [phase, setPhase] = useState<"drop" | "up" | "done" | "error">("drop");
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const processFile = async (file: File) => {
    setPhase("up");
    setPct(20);

    try {
      setPct(50);
      const res = await api.uploadDocument(file);
      setPct(100);
      setUploadedDocId(res.id);
      setPhase("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to upload document.");
      setPhase("error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="anim-in"
      style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "rgba(0,0,0,.75)", backdropFilter: "blur(10px)" }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.txt,.docx"
        aria-label="Upload legal document (PDF, TXT, DOCX)"
        style={{ display: "none" }}
      />
      <div className="anim-up" style={{ width: "100%", maxWidth: 460, background: "var(--surface)", border: "1px solid rgba(61,127,255,.22)", borderRadius: 22, overflow: "hidden", boxShadow: "0 0 60px rgba(61,127,255,.12), 0 24px 64px rgba(0,0,0,.7)" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(61,127,255,.6),rgba(139,92,246,.5),transparent)" }} />
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h2 id="upload-modal-title" className="sora" style={{ fontSize: 20, fontWeight: 700, color: "var(--fg)", marginBottom: 5 }}>Analyze a legal document</h2>
            <p style={{ fontSize: 12.5, color: "var(--fg3)", lineHeight: 1.5 }}>Upload your contract, lease, or agreement and ask questions about its clauses.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close upload dialog"
            style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.06)", color: "var(--fg3)", marginLeft: 12, flexShrink: 0, cursor: "pointer" }}
          >
            <Ico c={<I.X />} s={14} />
          </button>
        </div>
        <div style={{ padding: 24 }}>
          {phase === "drop" && (
            <>
              <div onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
                onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
                aria-label="Drop a legal document here or press Enter to browse files (PDF, DOCX, TXT)"
                style={{
                  borderRadius: 16, padding: "48px 24px", textAlign: "center", cursor: "pointer",
                  background: drag ? "rgba(61,127,255,.07)" : "rgba(255,255,255,.02)",
                  border: `2px dashed ${drag ? "rgba(61,127,255,.5)" : "rgba(255,255,255,.1)"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
                  transition: "all .2s",
                }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue2)", boxShadow: "0 0 20px rgba(61,127,255,.15)" }}>
                  <Ico c={<I.Upload />} s={24} />
                </div>
                <div>
                  <p className="sora" style={{ fontSize: 15, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>Drop your document here</p>
                  <p style={{ fontSize: 13, color: "var(--fg3)" }}>or <span style={{ color: "var(--blue2)", fontWeight: 500 }}>browse files</span></p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["PDF", "DOCX", "TXT"].map(t => (
                    <span key={t} className="mono" style={{ fontSize: 11, padding: "3px 9px", borderRadius: 6, background: "rgba(255,255,255,.04)", border: "1px solid var(--border)", color: "var(--fg3)" }}>{t}</span>
                  ))}
                </div>
              </div>
            </>
          )}

          {phase === "up" && (
            <div className="anim-in" style={{ padding: 18, borderRadius: 14, background: "var(--bg2)", border: "1px solid var(--border)" }} role="status" aria-live="polite">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue2)", flexShrink: 0 }}>
                  <Ico c={<I.Doc />} s={20} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Processing document...</p>
                  <p style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 2 }}>Extracting text &amp; building index...</p>
                </div>
                <span className="mono" style={{ fontSize: 12, color: "var(--blue2)" }}>{pct}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 99, width: `${pct}%`, background: "linear-gradient(90deg,#3d7fff,#8b5cf6)", boxShadow: "0 0 10px rgba(61,127,255,.4)", transition: "width .2s" }} />
              </div>
              <p style={{ fontSize: 11.5, color: "var(--fg3)", marginTop: 10 }}>Analysing document structure and extracting key clauses…</p>
            </div>
          )}

          {phase === "done" && (
            <div className="anim-up" style={{ textAlign: "center", padding: "24px 0" }} role="status" aria-live="polite">
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(34,216,122,.1)", border: "1px solid rgba(34,216,122,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#5ef0a0", boxShadow: "0 0 20px rgba(34,216,122,.15)" }}>
                <Ico c={<I.Check />} s={28} />
              </div>
              <p className="sora" style={{ fontSize: 16, fontWeight: 600, color: "var(--fg)", marginBottom: 6 }}>Document ready</p>
              <p style={{ fontSize: 12.5, color: "var(--fg3)", marginBottom: 24, lineHeight: 1.5 }}>Document has been parsed &amp; indexed successfully.</p>
              <button className="btn-blue" onClick={() => { onClose(); if (uploadedDocId) onDone(uploadedDocId); }} aria-label="Open document analysis view">Open Analysis</button>
            </div>
          )}

          {phase === "error" && (
            <div className="anim-up" style={{ textAlign: "center", padding: "16px 0" }} role="alert">
              <p className="sora" style={{ fontSize: 15, fontWeight: 600, color: "#ff4d6d", marginBottom: 6 }}>Upload Failed</p>
              <p style={{ fontSize: 12.5, color: "var(--fg3)", marginBottom: 20 }}>{errorMsg}</p>
              <button className="btn-blue" onClick={() => setPhase("drop")} aria-label="Try uploading again">Try Again</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
