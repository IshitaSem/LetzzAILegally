import { ChatResponse } from "../../api";
import { I, Ico } from "../common/Icons";
import { AIAv } from "../common/Decorative";

export function AIResponseBlock({ data }: { data?: ChatResponse }) {
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
