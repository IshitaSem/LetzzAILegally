import { Page, ChatMessageItem } from "../../types";
import { I, Ico } from "../common/Icons";
import { LogoMark } from "../common/LogoMark";
import { HIST } from "../views/HistoryView";

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

export function Sidebar({ page, setPage, activeConversationId, setActiveConversationId, conversations }: { page: Page; setPage: (p: Page) => void, activeConversationId: string, setActiveConversationId: (id: string) => void, conversations: Record<string, ChatMessageItem[]> }) {
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
