export function SettingsView() {
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
