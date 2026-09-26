export function LogoMark({ size = 34 }: { size?: number }) {
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
