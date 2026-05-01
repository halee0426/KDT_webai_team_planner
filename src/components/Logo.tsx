// 로고 마크 (☀️ 해 모양 SVG) + 워드마크 (Haru:on, Baloo 2 700)
// 본문은 Pretendard, 로고만 Baloo 2

/**
 * 새 컨셉 로고: H + O를 해에 녹임 (v2)
 * - O = 중앙의 흰 원 (해 본체)
 * - H = 광선 8개로 알파벳 H 형태 형성
 *   • 좌측 위·중·아래 3개 광선 = H의 왼쪽 세로획
 *   • 우측 위·중·아래 3개 광선 = H의 오른쪽 세로획
 *   • 가운데 좌→우 광선 = H의 가로획
 *
 * 보는 사람: "해다!" → 자세히 보면 "어, H+O네"
 */
export function LogoMarkHO({
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

      {/* O = 중앙 해 본체 (속을 흰색으로 채워서 더 또렷) */}
      <circle cx="16" cy="16" r="4.6" fill="#fff" />

      {/* H 형태로 배치된 광선 6개 (좌3 + 우3) + 가운데 가로 광선 */}
      <g stroke="#fff" strokeWidth="1.9" strokeLinecap="round">
        {/* 좌측 H 세로 — 위/중/아래 */}
        <path d="M5 8.5l2 1.4" />     {/* 좌상 */}
        <path d="M3.5 16h2.5" />      {/* 좌중 */}
        <path d="M5 23.5l2-1.4" />    {/* 좌하 */}

        {/* 우측 H 세로 — 위/중/아래 */}
        <path d="M27 8.5l-2 1.4" />   {/* 우상 */}
        <path d="M28.5 16h-2.5" />    {/* 우중 */}
        <path d="M27 23.5l-2-1.4" />  {/* 우하 */}

        {/* 위·아래 강조 광선 (보너스) */}
        <path d="M16 3.5v2.5" />      {/* 정상 */}
        <path d="M16 26v2.5" />       {/* 정저 */}
      </g>
    </svg>
  );
}

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
  size = 28,
}: {
  color?: string;
  accent?: string;
  size?: number;
}) {
  const Mark = LogoMark;
  // 워드마크 폰트 크기 — 마크 박스보다 살짝 작게 (마크 박스 안에 시각적으로 들어오는 느낌)
  const fontSize = size * 0.92;

  // 미세 baseline 보정 — 폰트가 박스 정중앙보다 살짝 아래에 오도록
  const baselineNudge = 1; // px (양수 = 아래로)

  return (
    <div className="flex items-center" style={{ height: size, gap: 5 }}>
      <Mark size={size} accent={accent} />
      <span
        style={{
          fontFamily: "'Baloo 2', system-ui, sans-serif",
          color,
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          height: size,
          transform: `translateY(${baselineNudge}px)`,
        }}
      >
        Haru<span style={{ color: accent }}>:</span>on
      </span>
    </div>
  );
}
