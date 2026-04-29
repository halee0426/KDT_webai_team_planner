export function LogoMark({
  size = 28,
  accent = "#0066cc",
  rounded,
}: {
  size?: number;
  accent?: string;
  rounded?: number;
}) {
  const r = rounded ?? size * 0.26;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="0" y="0" width="32" height="32" rx={(r / size) * 32} fill={accent} />
      {/* sun core */}
      <circle cx="16" cy="16" r="4.6" fill="#fff" />
      {/* rays */}
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 5.5v2.5" />
        <path d="M16 24v2.5" />
        <path d="M5.5 16h2.5" />
        <path d="M24 16h2.5" />
        <path d="M8.5 8.5l1.8 1.8" />
        <path d="M21.7 21.7l1.8 1.8" />
        <path d="M8.5 23.5l1.8-1.8" />
        <path d="M21.7 10.3l1.8-1.8" />
      </g>
    </svg>
  );
}

export function LogoLockup({
  color = "#FFFFFF",
  accent = "#0066cc",
  size = 24,
}: {
  color?: string;
  accent?: string;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <LogoMark size={size} accent={accent} />
      <span
        style={{
          color,
          fontSize: (size / 18) * 16.5,
          fontWeight: 700,
          letterSpacing: "-0.374px",
        }}
      >
        하루온
      </span>
    </div>
  );
}
