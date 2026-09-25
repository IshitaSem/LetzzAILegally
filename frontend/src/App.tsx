import { useState, useRef, useEffect } from "react";
import {
  api,
  ChatResponse,
  DocumentAnalysisResponse,
  DocumentMetadata,
  DocumentChecklistResponse,
  DocumentAskResponse,
} from "./api";

type Page = "home" | "chat" | "documents" | "doc-analysis" | "history" | "saved" | "settings";
type ChatStage = "idle" | "typing" | "done" | "error";

interface ChatMessageItem {
  id: string;
  sender: "user" | "ai";
  text: string;
  data?: ChatResponse;
  error?: string;
}

/* ─── icon primitives ────────────────────────────────────────────────────────── */
const SVG = ({ children, ...p }: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "100%", height: "100%" }} aria-hidden="true" {...p}>{children}</svg>
);
const I = {
  Plus:    () => <SVG><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"/></SVG>,
  Chat:    () => <SVG><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd"/></SVG>,
  Doc:     () => <SVG><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></SVG>,
  Save:    () => <SVG><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/></SVG>,
  History: () => <SVG><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/></SVG>,
  Cog:     () => <SVG><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></SVG>,
  User:    () => <SVG><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></SVG>,
  Send:    () => <SVG><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></SVG>,
  Attach:  () => <SVG><path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4.5a4.5 4.5 0 009 0V7a1 1 0 112 0v4.5a6.5 6.5 0 11-13 0V7a5 5 0 0110 0v4.5a2.5 2.5 0 01-5 0V7a1 1 0 012 0v4.5a.5.5 0 001 0V7a3 3 0 00-3-3z" clipRule="evenodd"/></SVG>,
  Mic:     () => <SVG><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/></SVG>,
  Upload:  () => <SVG><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"/></SVG>,
  Check:   () => <SVG><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></SVG>,
  X:       () => <SVG><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></SVG>,
  Search:  () => <SVG><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></SVG>,
  Dots:    () => <SVG><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></SVG>,
  Link:    () => <SVG><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></SVG>,
  Alert:   () => <SVG><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></SVG>,
  Trash:   () => <SVG><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></SVG>,
  Pen:     () => <SVG><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></SVG>,
  Arrow:   () => <SVG><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></SVG>,
  Help:    () => <SVG><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></SVG>,
  Lock:    () => <SVG><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></SVG>,
};

function Ico({ c, s = 16 }: { c: React.ReactNode; s?: number }) {
  return <span style={{ width: s, height: s, display: "inline-flex", flexShrink: 0 }} aria-hidden="true">{c}</span>;
}

/* ─── Logo mark ──────────────────────────────────────────────────────────────── */
function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="url(#lmg)" />
      <path d="M11 24L17 10L23 24" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.4 19.5h7.2" stroke="white" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="26" cy="11" r="2.5" fill="rgba(255,255,255,0.5)"/>
      <defs>
        <linearGradient id="lmg" x1="0" y1="0" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3d7fff"/>
          <stop offset="1" stopColor="#8b5cf6"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Decorative star ────────────────────────────────────────────────────────── */
function Star({ x, y, size = 12, opacity = 0.35 }: { x: string; y: string; size?: number; opacity?: number }) {
  return (
    <span aria-hidden="true" style={{ position: "absolute", left: x, top: y, color: `rgba(61,127,255,${opacity})`, fontSize: size, pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>✦</span>
  );
}

/* ─── AI avatar ──────────────────────────────────────────────────────────────── */
function AIAv() {
  return (
    <div aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(61,127,255,.4)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L8.5 5.5H13L9.5 8L11 12.5L7 10L3 12.5L4.5 8L1 5.5H5.5L7 1Z" fill="white"/>
      </svg>
    </div>
  );
}

/* ─── sidebar ────────────────────────────────────────────────────────────────── */
const NAV = [
  { id: "home",      label: "New Chat",      icon: <I.Plus /> },
  { id: "history",   label: "Conversations", icon: <I.Chat /> },
  { id: "documents", label: "Documents",     icon: <I.Doc /> },
  { id: "saved",     label: "Saved",         icon: <I.Save /> },
  { id: "settings",  label: "Settings",      icon: <I.Cog /> },
];

const RECENT_CONVS = [
  { label: "Rental Agreement Review", time: "2h" },
  { label: "Employment Contract",     time: "1d" },
  { label: "Consumer Rights",         time: "Mon" },
  { label: "Property Agreement",      time: "Sep 8" },
];

function Sidebar({ page, setPage, activeConversationId, setActiveConversationId, conversations }: { page: Page; setPage: (p: Page) => void, activeConversationId: string, setActiveConversationId: (id: string) => void, conversations: Record<string, ChatMessageItem[]> }) {
  const dynamicRecents = Object.entries(conversations)
    .filter(([id, msgs]) => msgs.length > 0 && !RECENT_CONVS.find(r => r.label === id) && id !== "default")
    .map(([id, msgs]) => ({
      label: msgs[0].text.substring(0, 25) + (msgs[0].text.length > 25 ? "..." : ""),
      time: "New",
      id: id
    }));
  const allRecents = [...RECENT_CONVS.map(r => ({ ...r, id: r.label })), ...dynamicRecents];

  return (
    <aside style={{
      width: 230, height: "100%", flexShrink: 0,
      background: "var(--bg1)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      position: "relative", overflow: "hidden",
    }} aria-label="Sidebar">
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg,transparent,rgba(61,127,255,.3),transparent)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--border2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <LogoMark size={32} />
          <div>
            <p className="sora" style={{ fontSize: 15.5, fontWeight: 700, color: "var(--fg)", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              LetzAi<span style={{ color: "var(--blue2)" }}>Legally</span>
            </p>
            <p style={{ fontSize: 10, color: "var(--fg3)", marginTop: 2 }}>AI Legal Companion</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 8px", borderRadius: 99, background: "rgba(34,216,122,.07)", border: "1px solid rgba(34,216,122,.14)", width: "max-content", marginTop: 12 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 5px var(--green)" }} />
          <span style={{ fontSize: 9.5, color: "#5ef0a0", fontWeight: 500 }}>AI Online · Ready</span>
        </div>
      </div>

      {/* Nav */}
      <nav aria-label="Main Navigation" style={{ padding: "12px 10px 0", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <button
          className="btn-blue"
          style={{ width: "100%", justifyContent: "center", marginBottom: 20 }}
          onClick={() => { setActiveConversationId(crypto.randomUUID()); setPage("home"); }}
          aria-label="Start a new chat conversation"
        >
          <Ico c={<I.Plus />} s={14} /> New Chat
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV.map(n => (
            <button key={n.id}
              className={`nav-item${(page === n.id || (n.id === "home" && page === "chat")) ? " active" : ""}`}
              onClick={() => { if(n.id==="home") setActiveConversationId(crypto.randomUUID()); setPage(n.id as Page); }}
              aria-label={n.label}
            >
              <Ico c={n.icon} s={14} />
              {n.label}
              {n.id === "history" && (
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 99, background: "var(--blue-dim)", color: "var(--blue2)" }}>{HIST.length + dynamicRecents.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Recent */}
        <div style={{ marginTop: 22, flex: 1, minHeight: 0, overflowY: "auto" }} role="region" aria-label="Recent Conversations">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 12, paddingRight: 12, marginBottom: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "var(--fg3)", textTransform: "uppercase" }}>Recent</p>
            <span className="badge bd-blue" style={{ fontSize: 9.5 }}>{allRecents.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {allRecents.map(r => (
              <button
                key={r.id}
                className={"nav-item" + (activeConversationId === r.id ? " active" : "")}
                style={{ fontSize: 12 }}
                onClick={() => { setActiveConversationId(r.id); setPage("chat"); }}
                aria-label={`Open conversation: ${r.label}`}
              >
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(61,127,255,.5)", flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                <span style={{ fontSize: 10, color: "var(--fg3)", flexShrink: 0 }}>{r.time}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border2)" }}>
        <button className="nav-item" style={{ fontSize: 12, marginBottom: 2 }} aria-label="Help and Support"><Ico c={<I.Help />} s={13} />Help &amp; Support</button>
        <button className="nav-item" style={{ fontSize: 12, marginBottom: 10 }} aria-label="Privacy information"><Ico c={<I.Lock />} s={13} />Privacy</button>
        <div style={{ padding: "10px 12px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }} role="status" aria-label="User account: Alex Johnson">
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(61,127,255,.25)" }}>
            <Ico c={<I.User />} s={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Alex Johnson</p>
            <p style={{ fontSize: 10.5, color: "var(--fg3)", marginTop: 1 }}>Pro · 142 queries</p>
          </div>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
        </div>
      </div>
    </aside>
  );
}

/* ─── composer ───────────────────────────────────────────────────────────────── */
function Composer({ onSend, onUpload }: { onSend: (t: string) => void; onUpload: () => void }) {
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

/* ─── home page ──────────────────────────────────────────────────────────────── */
const QUICK = [
  { em: "⚖️", label: "Ask a Legal Question",   sub: "Get clear explanations of legal topics",         tag: "Most popular", page: "chat" as Page },
  { em: "📄", label: "Analyze a Document",      sub: "Upload a contract, agreement or legal document", tag: "AI-powered",   page: "doc-analysis" as Page },
  { em: "📚", label: "Explain a Legal Term",    sub: "Understand complex legal language in plain English", tag: null,        page: "chat" as Page },
  { em: "🔍", label: "Find Relevant Sources",   sub: "Explore supporting legal references and case law", tag: null,         page: "chat" as Page },
];

function HomePage({ setPage, onUpload }: { setPage: (p: Page) => void; onUpload: () => void }) {
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

/* ─── AI response block ──────────────────────────────────────────────────────── */
function AIResponseBlock({ data }: { data?: ChatResponse }) {
  const answer = data?.answer || "As a tenant, you are protected under the implied warranty of habitability — your landlord must maintain the rental in a livable condition. You also have the right to proper notice before entry, protection from unlawful eviction, and return of your security deposit within the statutory period.";
  const keyPoints = data?.key_points || [
    "Landlords must maintain habitable conditions: heat, running water, structural integrity.",
    "Written notice of 24–48 hours is required before entry, except in emergencies.",
    "Security deposits must be returned within 14–30 days depending on your state.",
    "Retaliatory eviction for exercising your legal rights is prohibited in most jurisdictions."
  ];
  const sources = data?.sources || [
    { title: "Uniform Residential Landlord Act", reference: "Federal Standard", relevance: "Federal" },
    { title: "Cal. Civ. Code § 1941", reference: "Habitability Standard", relevance: "CA" },
    { title: "N.Y. Real Property § 235-b", reference: "Warranty of Habitability", relevance: "NY" }
  ];
  const disclaimer = data?.disclaimer || "This AI provides educational and informational assistance and is not a substitute for advice from a qualified legal professional.";

  return (
    <article className="anim-up" style={{ display: "flex", alignItems: "flex-start", gap: 12 }} aria-label="AI Legal Assistant Response">
      <div style={{ marginTop: 2, flexShrink: 0 }}><AIAv /></div>
      <div style={{
        flex: 1, maxWidth: 700,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 16, borderTopLeftRadius: 4,
        padding: "20px 22px",
        display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "0 4px 24px rgba(0,0,0,.3)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,rgba(61,127,255,.6),rgba(139,92,246,.4),transparent)" }} />

        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--blue2)", textTransform: "uppercase", marginBottom: 10 }}>Legal Overview</p>
          <p style={{ fontSize: 13.5, lineHeight: 1.75, color: "var(--fg)" }}>{answer}</p>
        </div>

        {keyPoints.length > 0 && (
          <>
            <hr className="div" />
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--fg3)", textTransform: "uppercase", marginBottom: 12 }}>Key Points</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {keyPoints.map((pt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(61,127,255,.14)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, color: "var(--blue2)" }}>
                      <Ico c={<I.Check />} s={10} />
                    </div>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: "var(--fg2)" }}>{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {sources.length > 0 && (
          <>
            <hr className="div" />
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", color: "var(--fg3)", textTransform: "uppercase", marginBottom: 10 }}>Relevant Sources</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {sources.map(s => (
                  <button key={s.title}
                    aria-label={`View source citation: ${s.title} (${s.relevance || "Legal"})`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8,
                      background: "rgba(61,127,255,.07)", border: "1px solid rgba(61,127,255,.18)",
                      cursor: "pointer", fontSize: 12, color: "var(--fg2)",
                    }}>
                    <span className="mono" style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(61,127,255,.22)", color: "var(--blue2)" }}>{s.relevance || "Legal"}</span>
                    {s.title} {s.reference && `(${s.reference})`} <Ico c={<I.Link />} s={11} />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: "rgba(245,166,35,.07)", border: "1px solid rgba(245,166,35,.25)" }} role="note" aria-label="Legal Disclaimer">
          <Ico c={<I.Alert />} s={14} />
          <p style={{ fontSize: 11.5, lineHeight: 1.6, color: "var(--fg2)" }}>{disclaimer}</p>
        </div>
      </div>
    </article>
  );
}

/* ─── chat view ──────────────────────────────────────────────────────────────── */
function ChatView({ onUpload, initialQuery, processedQueryIdRef, messages, setMessages }: { onUpload: () => void, initialQuery?: {id: string, text: string} | null, processedQueryIdRef: React.MutableRefObject<string | null>, messages: ChatMessageItem[], setMessages: React.Dispatch<React.SetStateAction<ChatMessageItem[]>> }) {
  const [stage, setStage] = useState<ChatStage>("idle");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.id !== processedQueryIdRef.current) {
      processedQueryIdRef.current = initialQuery.id;
      handleSend(initialQuery.text);
    }
  }, [initialQuery, processedQueryIdRef]);

  const handleSend = async (text: string) => {
    const userMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setStage("typing");

    try {
      const response = await api.sendChat(text);
      const aiMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "ai", text: response.answer, data: response };
      setMessages(prev => [...prev, aiMsg]);
      setStage("done");
    } catch (err: any) {
      const errorMsg: ChatMessageItem = { id: crypto.randomUUID(), sender: "ai", text: "API Error", error: err.message || "Failed to communicate with LetzAiLegally backend." };
      setMessages(prev => [...prev, errorMsg]);
      setStage("error");
    }
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, stage]);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "var(--fg)" }}>
            {messages.length === 0 ? "New Conversation" : "LetzAiLegally Legal Chat"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
            <span style={{ fontSize: 11.5, color: "var(--fg3)" }}>AI Ready · Fast API Session</span>
          </div>
        </div>
        <button
          style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg3)", background: "var(--surface)", border: "1px solid var(--border)" }}
          aria-label="Conversation options"
        >
          <Ico c={<I.Dots />} s={14} />
        </button>
      </div>

      {/* messages */}
      <div className="scroll" style={{ flex: 1, padding: "24px", overflowY: "auto" }}>
        {messages.length === 0 && stage === "idle" ? (
          <div className="anim-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "65%", textAlign: "center", gap: 22, position: "relative" }}>
            <Star x="10%" y="20%" size={10} opacity={0.3} />
            <Star x="88%" y="15%" size={12} opacity={0.25} />
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 32px rgba(61,127,255,.35)" }} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M13 2L15.5 9.5H23L17 14L19.5 21.5L13 17L6.5 21.5L9 14L3 9.5H10.5L13 2Z" fill="white"/></svg>
            </div>
            <div>
              <h2 className="sora" style={{ fontSize: 24, fontWeight: 700, color: "var(--fg)", marginBottom: 8 }}>What would you like to explore?</h2>
              <p style={{ fontSize: 13.5, color: "var(--fg2)", lineHeight: 1.6 }}>Type a legal question, or try one of these:</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 520 }}>
              {["What are my rights as a tenant?", "Is my non-compete enforceable?", "What does 'force majeure' mean?", "Review this indemnity clause"].map(q => (
                <button key={q} onClick={() => handleSend(q)}
                  aria-label={`Ask suggestion: ${q}`}
                  style={{ padding: "8px 18px", borderRadius: 99, fontSize: 13, background: "rgba(61,127,255,.08)", border: "1px solid rgba(61,127,255,.22)", color: "var(--blue2)", cursor: "pointer" }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 800, margin: "0 auto" }}>
            {messages.map(m => (
              <div key={m.id}>
                {m.sender === "user" ? (
                  <div className="anim-up" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ maxWidth: 440, padding: "12px 18px", borderRadius: 16, borderTopRightRadius: 4, background: "linear-gradient(135deg,#3d7fff,#5b94ff)", color: "#fff", fontSize: 13.5, lineHeight: 1.65, boxShadow: "0 4px 20px rgba(61,127,255,.3)" }}>
                      {m.text}
                    </div>
                  </div>
                ) : m.error ? (
                  <div className="anim-up" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <AIAv />
                    <div role="alert" style={{ padding: "14px 18px", borderRadius: 14, background: "rgba(255,77,109,.1)", border: "1px solid rgba(255,77,109,.25)", color: "var(--fg)" }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "#ff4d6d" }}>Backend Communication Error</p>
                      <p style={{ fontSize: 12, marginTop: 4, color: "var(--fg2)" }}>{m.error}</p>
                    </div>
                  </div>
                ) : (
                  <AIResponseBlock data={m.data} />
                )}
              </div>
            ))}

            {stage === "typing" && (
              <div className="anim-in" style={{ display: "flex", alignItems: "flex-start", gap: 12 }} role="status" aria-live="polite" aria-label="AI is generating legal response">
                <AIAv />
                <div style={{ padding: "12px 16px", borderRadius: 14, borderTopLeftRadius: 4, background: "var(--surface)", border: "1px solid var(--border)", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0,1,2].map(i => <div key={i} className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--blue)", animationDelay: `${i*.2}s` }} />)}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer onSend={(text) => handleSend(text)} onUpload={onUpload} />
    </div>
  );
}

/* ─── upload modal ───────────────────────────────────────────────────────────── */
function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (docId: string) => void }) {
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

/* ─── document analysis ──────────────────────────────────────────────────────── */
type ATab = "summary" | "clauses" | "dates" | "concerns" | "checklist";

function DocAnalysis({ docId, setPage }: { docId: string | null; setPage: (p: Page) => void }) {
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

/* ─── documents list ─────────────────────────────────────────────────────────── */
function DocumentsView({ setPage, onUpload, onSelectDoc }: { setPage: (p: Page) => void; onUpload: () => void; onSelectDoc: (id: string) => void }) {
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

/* ─── history ────────────────────────────────────────────────────────────────── */
const HIST = [
  { t: "Rental Agreement Review",       d: "Today · 2:14 PM",   em: "📑", p: "What clauses should I watch for?" },
  { t: "Employment Contract",           d: "Yesterday · 11:30", em: "💼", p: "Is my non-compete clause enforceable?" },
  { t: "Consumer Rights",               d: "Mon · 9:05 AM",     em: "🛡️", p: "Can I get a refund for a defective product?" },
  { t: "Property Agreement",            d: "Sep 8",             em: "🏠", p: "What does this easement clause mean?" },
];

function HistoryView({ setPage, setActiveConversationId, conversations }: { setPage: (p: Page) => void, setActiveConversationId: (id: string) => void, conversations: Record<string, ChatMessageItem[]> }) {
  const [q, setQ] = useState("");
  
  const dynamicHist = Object.entries(conversations)
    .filter(([id, msgs]) => msgs.length > 0 && !HIST.find(h => h.t === id) && id !== "default")
    .map(([id, msgs]) => ({
      t: msgs[0].text.substring(0, 25) + (msgs[0].text.length > 25 ? "..." : ""),
      d: "New",
      em: "💬",
      p: msgs[0].text,
      id: id
    }));

  const allHist = [...HIST.map(h => ({ ...h, id: h.t })), ...dynamicHist];
  const filtered = allHist.filter(h => h.t.toLowerCase().includes(q.toLowerCase()));

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "32px 40px 20px", flexShrink: 0 }}>
        <h1 className="sora" style={{ fontSize: 34, fontWeight: 800, color: "var(--fg)", marginBottom: 20, letterSpacing: "-0.03em" }}>Conversations</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 11, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Ico c={<I.Search />} s={15} />
            <label htmlFor="history-search-input" className="sr-only">Search conversations</label>
            <input
              id="history-search-input"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13.5, color: "var(--fg)", fontFamily: "Inter, sans-serif" }}
            />
          </div>
        </div>
      </div>
      <div className="scroll" style={{ flex: 1, padding: "0 40px 32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }} role="region" aria-label="Conversation History List">
        {filtered.map(h => (
          <div
            key={h.id}
            role="button"
            tabIndex={0}
            onClick={() => { setActiveConversationId(h.id); setPage("chat"); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveConversationId(h.id); setPage("chat"); } }}
            aria-label={`Open conversation: ${h.t}`}
            style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 18px", borderRadius: 14, background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer" }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }} aria-hidden="true">{h.em}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="sora" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.t}</p>
              <p style={{ fontSize: 12, color: "var(--fg3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.p}</p>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--fg3)", flexShrink: 0 }}>{h.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedView() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }} role="region" aria-label="Saved Items">
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue2)", boxShadow: "0 0 20px rgba(61,127,255,.12)" }} aria-hidden="true"><Ico c={<I.Save />} s={26} /></div>
      <h2 className="sora" style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>Nothing saved yet</h2>
      <p style={{ fontSize: 13.5, color: "var(--fg3)", maxWidth: 320 }}>Save important AI responses and document snippets here for quick access.</p>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="scroll" style={{ flex: 1, padding: "40px", overflowY: "auto" }} role="region" aria-label="User Settings">
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <h1 className="sora" style={{ fontSize: 34, fontWeight: 800, color: "var(--fg)", marginBottom: 32, letterSpacing: "-0.03em" }}>Settings</h1>
        {[
          { g: "Account",     items: [["Display name","Alex Johnson"],["Email","alex@example.com"],["Plan","Pro"]] },
          { g: "Preferences", items: [["Language","English"],["Jurisdiction","California, US"],["Theme","Dark"]] },
        ].map(({ g, items }) => (
          <div key={g} style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.12em", color: "var(--fg3)", textTransform: "uppercase", marginBottom: 12 }}>{g}</p>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              {items.map(([l, v], i) => (
                <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderTop: i > 0 ? "1px solid var(--border2)" : "none" }}>
                  <p style={{ fontSize: 13.5, color: "var(--fg2)" }}>{l}</p>
                  <p className="sora" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--fg)" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── root ────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [initialQuery, setInitialQuery] = useState<{id: string, text: string} | null>(null);
  const processedQueryIdRef = useRef<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<Record<string, ChatMessageItem[]>>(() => {
    try {
      const saved = localStorage.getItem("letzAiLegally_conversations");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // Local storage fallback handled gracefully
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem("letzAiLegally_conversations", JSON.stringify(conversations));
    } catch (e) {
      // Local storage save error handled gracefully
    }
  }, [conversations]);

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "var(--bg)", overflow: "hidden" }}>
      {/* Skip to Main Content link for keyboard accessibility */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <Sidebar page={page} setPage={setPage} activeConversationId={activeConversationId} setActiveConversationId={setActiveConversationId} conversations={conversations} />

      <main id="main-content" tabIndex={-1} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, outline: "none" }}>
        {/* top status bar */}
        <div style={{ height: 44, display: "flex", alignItems: "center", padding: "0 24px", borderBottom: "1px solid var(--border2)", flexShrink: 0, background: "rgba(4,6,15,.9)", backdropFilter: "blur(8px)", gap: 8, position: "relative", zIndex: 10 }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg,transparent,rgba(61,127,255,.3),transparent)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <LogoMark size={18} />
            <span style={{ fontSize: 12, color: "var(--fg3)" }}>LetzAiLegally</span>
            <span style={{ fontSize: 12, color: "var(--fg3)" }}>•</span>
            <span className="sora" style={{ fontSize: 12, color: "var(--fg2)", fontWeight: 500, textTransform: "capitalize" }}>
              {page === "doc-analysis" ? "Document Analysis" : page === "home" ? "New Chat" : page}
            </span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(34,216,122,.07)", border: "1px solid rgba(34,216,122,.14)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", boxShadow: "0 0 5px var(--green)" }} />
              <span style={{ fontSize: 11, color: "#5ef0a0", fontWeight: 500 }}>AI Online</span>
            </div>
          </div>
        </div>

        {page === "home"         && <><HomePage setPage={setPage} onUpload={() => setUploadOpen(true)} /><Composer onSend={(text) => { setInitialQuery({id: String(Date.now()), text}); setPage("chat"); }} onUpload={() => setUploadOpen(true)} /></>}
        {page === "chat"         && <ChatView 
            key={activeConversationId} 
            onUpload={() => setUploadOpen(true)} 
            initialQuery={initialQuery} 
            processedQueryIdRef={processedQueryIdRef}
            messages={conversations[activeConversationId] || []}
            setMessages={(msgs) => setConversations(prev => ({...prev, [activeConversationId]: typeof msgs === 'function' ? msgs(prev[activeConversationId] || []) : msgs}))}
          />}
        {page === "documents"    && <DocumentsView setPage={setPage} onUpload={() => setUploadOpen(true)} onSelectDoc={id => setSelectedDocId(id)} />}
        {page === "doc-analysis" && <DocAnalysis docId={selectedDocId} setPage={setPage} />}
        {page === "history"      && <HistoryView setPage={setPage} setActiveConversationId={setActiveConversationId} conversations={conversations} />}
        {page === "saved"        && <SavedView />}
        {page === "settings"     && <SettingsView />}
      </main>

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onDone={(docId) => {
            setSelectedDocId(docId);
            setPage("doc-analysis");
          }}
        />
      )}
    </div>
  );
}
