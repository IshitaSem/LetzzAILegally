export function Star({ x, y, size = 12, opacity = 0.35 }: { x: string; y: string; size?: number; opacity?: number }) {
  return (
    <span aria-hidden="true" style={{ position: "absolute", left: x, top: y, color: `rgba(61,127,255,${opacity})`, fontSize: size, pointerEvents: "none", userSelect: "none", lineHeight: 1 }}>✦</span>
  );
}

export function AIAv() {
  return (
    <div aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: "linear-gradient(135deg,#3d7fff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(61,127,255,.4)" }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1L8.5 5.5H13L9.5 8L11 12.5L7 10L3 12.5L4.5 8L1 5.5H5.5L7 1Z" fill="white"/>
      </svg>
    </div>
  );
}
