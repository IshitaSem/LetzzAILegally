import { useState } from "react";
import { Page, ChatMessageItem } from "../../types";
import { I, Ico } from "../common/Icons";

export const HIST = [
  { t: "Rental Agreement Review",       d: "Today · 2:14 PM",   em: "📑", p: "What clauses should I watch for?" },
  { t: "Employment Contract",           d: "Yesterday · 11:30", em: "💼", p: "Is my non-compete clause enforceable?" },
  { t: "Consumer Rights",               d: "Mon · 9:05 AM",     em: "🛡️", p: "Can I get a refund for a defective product?" },
  { t: "Property Agreement",            d: "Sep 8",             em: "🏠", p: "What does this easement clause mean?" },
];

export function HistoryView({ setPage, setActiveConversationId, conversations }: { setPage: (p: Page) => void, setActiveConversationId: (id: string) => void, conversations: Record<string, ChatMessageItem[]> }) {
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
