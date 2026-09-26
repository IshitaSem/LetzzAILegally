import { I, Ico } from "../common/Icons";

export function SavedView() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 16 }} role="region" aria-label="Saved Items">
      <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(61,127,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue2)", boxShadow: "0 0 20px rgba(61,127,255,.12)" }} aria-hidden="true"><Ico c={<I.Save />} s={26} /></div>
      <h2 className="sora" style={{ fontSize: 22, fontWeight: 700, color: "var(--fg)" }}>Nothing saved yet</h2>
      <p style={{ fontSize: 13.5, color: "var(--fg3)", maxWidth: 320 }}>Save important AI responses and document snippets here for quick access.</p>
    </div>
  );
}
