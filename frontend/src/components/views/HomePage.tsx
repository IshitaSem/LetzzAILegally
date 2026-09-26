import { Page } from "../../types";
import { I, Ico } from "../common/Icons";
import { Star } from "../common/Decorative";

const QUICK = [
  { em: "⚖️", label: "Ask a Legal Question",   sub: "Get clear explanations of legal topics",         tag: "Most popular", page: "chat" as Page },
  { em: "📄", label: "Analyze a Document",      sub: "Upload a contract, agreement or legal document", tag: "AI-powered",   page: "doc-analysis" as Page },
  { em: "📚", label: "Explain a Legal Term",    sub: "Understand complex legal language in plain English", tag: null,        page: "chat" as Page },
  { em: "🔍", label: "Find Relevant Sources",   sub: "Explore supporting legal references and case law", tag: null,         page: "chat" as Page },
];

export function HomePage({ setPage, onUpload }: { setPage: (p: Page) => void; onUpload: () => void }) {
  return (
    <div className="scroll" style={{ flex: 1, overflowY: "auto", position: "relative" }}>
      <div className="gblob" style={{ width: 600, height: 600, top: -150, right: -100, background: "radial-gradient(circle,rgba(61,127,255,.14) 0%,transparent 65%)", animationDelay: "0s" }} />
      <div className="gblob" style={{ width: 400, height: 400, bottom: 0, left: -80, background: "radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 65%)", animationDelay: "2.5s" }} />
      <Star x="8%" y="18%" size={10} opacity={0.4} />
      <Star x="92%" y="12%" size={14} opacity={0.3} />
      <Star x="15%" y="72%" size={8}  opacity={0.25} />
      <Star x="87%" y="68%" size={11} opacity={0.35} />
      <div className="scanline" />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "52px 32px 40px", position: "relative", zIndex: 1 }}>
        <div className="anim-up" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 99, background: "rgba(61,127,255,.08)", border: "1px solid rgba(61,127,255,.2)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span style={{ fontSize: 11.5, color: "var(--blue2)", fontWeight: 500, letterSpacing: "0.02em" }}>AI Legal Assistant · Powered by LetzAi</span>
          </div>
        </div>

        <div className="anim-up" style={{ marginBottom: 36, animationDelay: ".05s" }}>
          <h1 className="sora" style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.035em", color: "var(--fg)", marginBottom: 16 }}>
            Democratizing Legal Access<br />
            <span style={{ background: "linear-gradient(90deg,#3d7fff,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Plain-Language AI Legal Companion
            </span>
          </h1>
          <p style={{ fontSize: 14.5, color: "var(--fg2)", lineHeight: 1.65, maxWidth: 520 }}>
            Understand agreements without confusing legalese. Ask legal questions, analyze contracts, extract critical dates, and receive evidence-grounded answers.
          </p>
        </div>

        <div className="anim-up" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 40, animationDelay: ".1s" }}>
          {QUICK.map(q => (
            <button key={q.label} onClick={() => { if (q.page === "doc-analysis") onUpload(); else setPage(q.page); }}
              aria-label={`${q.label}: ${q.sub}`}
              style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 16, padding: "22px 22px 18px", textAlign: "left",
                display: "flex", flexDirection: "column", gap: 10,
                cursor: "pointer", position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,127,255,.3)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(61,127,255,.12)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLElement).style.transform = "none";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle,rgba(61,127,255,.08),transparent)", pointerEvents: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 26 }} aria-hidden="true">{q.em}</span>
                {q.tag && <span className="badge bd-pink" style={{ fontSize: 10 }}>{q.tag}</span>}
              </div>
              <div>
                <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)", marginBottom: 5, lineHeight: 1.3 }}>{q.label}</p>
                <p style={{ fontSize: 12.5, color: "var(--fg3)", lineHeight: 1.55 }}>{q.sub}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--blue2)", marginTop: 4 }}>
                Get started <Ico c={<I.Arrow />} s={12} />
              </div>
            </button>
          ))}
        </div>

        <div className="anim-up" style={{ animationDelay: ".18s" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: "var(--fg3)", textTransform: "uppercase" }}>Continue where you left off</p>
            <button style={{ fontSize: 11.5, color: "var(--blue2)", cursor: "pointer" }} onClick={() => setPage("history")} aria-label="See all past conversations">See all →</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { t: "Rental Agreement Review",  time: "Today · 2:14 PM",   em: "📑" },
              { t: "Employment Contract",       time: "Yesterday · 11:30", em: "💼" },
              { t: "Consumer Rights Question",  time: "Mon · 9:05 AM",     em: "🛡️" },
            ].map(r => (
              <button key={r.t} onClick={() => setPage("chat")}
                aria-label={`Open conversation: ${r.t}`}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", textAlign: "left", width: "100%" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(61,127,255,.2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}>
                <span style={{ fontSize: 18 }} aria-hidden="true">{r.em}</span>
                <span style={{ flex: 1, fontSize: 13.5, color: "var(--fg2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.t}</span>
                <span style={{ fontSize: 11.5, color: "var(--fg3)", flexShrink: 0 }}>{r.time}</span>
                <Ico c={<I.Arrow />} s={13} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
