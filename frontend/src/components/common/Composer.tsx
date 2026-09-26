import { useState, useRef, useEffect } from "react";
import { I, Ico } from "./Icons";

export function Composer({ onSend, onUpload }: { onSend: (t: string) => void; onUpload: () => void }) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const send = () => { if (!val.trim()) return; onSend(val); setVal(""); };
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = Math.min(ref.current.scrollHeight, 130) + "px";
  }, [val]);

  return (
    <div style={{ padding: "10px 24px 18px", flexShrink: 0 }} role="region" aria-label="Message Composer">
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{
          borderRadius: 16,
          background: "var(--surface)",
          border: "1px solid rgba(61,127,255,.22)",
          boxShadow: "0 0 0 1px rgba(61,127,255,.06), 0 8px 40px rgba(0,0,0,.5)",
          overflow: "hidden",
        }}>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(61,127,255,.5),rgba(139,92,246,.4),transparent)" }} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, padding: "12px 14px" }}>
            <button
              onClick={onUpload}
              title="Upload Legal Document"
              aria-label="Upload Legal Document"
              style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "rgba(61,127,255,.1)", color: "var(--blue2)", border: "1px solid rgba(61,127,255,.2)", cursor: "pointer" }}
            >
              <Ico c={<I.Attach />} s={15} />
            </button>
            <label htmlFor="chat-composer-textarea" className="sr-only">Ask LetzAiLegally anything about law, contracts, or legal definitions</label>
            <textarea
              id="chat-composer-textarea"
              ref={ref}
              rows={1}
              value={val}
              onChange={e => setVal(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Ask LetzAiLegally anything..."
              aria-label="Ask LetzAiLegally anything about law, contracts, or legal definitions"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none", resize: "none",
                fontSize: 14, lineHeight: 1.6, color: "var(--fg)", maxHeight: 130,
                caretColor: "var(--blue2)", fontFamily: "Inter, sans-serif",
              }}
            />
            <div style={{ display: "flex", gap: 7, alignItems: "center", flexShrink: 0 }}>
              <button
                type="button"
                aria-label="Voice input (Not active in this browser session)"
                style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.05)", color: "var(--fg3)", border: "1px solid var(--border)", cursor: "pointer" }}
              >
                <Ico c={<I.Mic />} s={15} />
              </button>
              <button
                onClick={send}
                aria-label="Send legal message"
                style={{
                  width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: val.trim() ? "linear-gradient(135deg,#3d7fff,#5b94ff)" : "rgba(255,255,255,.05)",
                  color: val.trim() ? "#fff" : "var(--fg3)",
                  border: "1px solid " + (val.trim() ? "transparent" : "var(--border)"),
                  boxShadow: val.trim() ? "0 2px 16px rgba(61,127,255,.38)" : "none",
                  cursor: val.trim() ? "pointer" : "default",
                }}
              >
                <Ico c={<I.Send />} s={15} />
              </button>
            </div>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--fg3)", marginTop: 9, lineHeight: 1.5 }}>
          This AI provides educational and informational assistance and is not a substitute for advice from a qualified legal professional.
        </p>
      </div>
    </div>
  );
}
