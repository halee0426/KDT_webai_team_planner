import { useEffect, useState } from "react";

export function Splash({
  onDone,
  onLeaveStart,
  accent = "#0066cc",
}: {
  onDone: () => void;
  /** 페이드아웃 시작 시점 — 호출되면 부모가 PlanSelect를 미리 마운트해 크로스페이드 */
  onLeaveStart?: () => void;
  accent?: string;
}) {
  const [phase, setPhase] = useState<"draw" | "out">("draw");

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase("out");
      onLeaveStart?.();
    }, 2200);
    const t2 = setTimeout(onDone, 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, onLeaveStart]);

  const isOut = phase === "out";

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center"
      style={{
        background: "#000",
        // 컨테이너 전체가 페이드 아웃 → 그 아래 PlanSelect 가 자연스럽게 드러남 (크로스페이드)
        opacity: isOut ? 0 : 1,
        pointerEvents: isOut ? "none" : "auto",
        transition: "opacity 0.9s cubic-bezier(0.22, 0.61, 0.36, 1)",
        willChange: "opacity",
      }}
    >
      <style>{`
        @keyframes haruRayDraw {
          0%   { stroke-dashoffset: 14; opacity: 0; }
          40%  { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 1; }
        }
        /* 중앙 해 — SVG transform attribute로 정확한 좌표 기준 scale */
        @keyframes haruCircleIn {
          0%   { r: 0; opacity: 0; }
          70%  { opacity: 1; }
          100% { r: 4.6; opacity: 1; }
        }
        @keyframes haruBoxIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes haruFadeUp {
          0%   { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes haruSubFade {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      <div
        className="flex flex-col items-center"
        style={{
          // 살짝 위로 올라가며 사라짐 + 글자/로고도 페이드아웃
          transform: isOut ? "translateY(-10px)" : "translateY(0)",
          opacity: isOut ? 0 : 1,
          transition:
            "transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.7s cubic-bezier(0.22, 0.61, 0.36, 1)",
          willChange: "transform, opacity",
        }}
      >
        {/* SVG 로고 마크 — 드로잉 애니메이션 */}
        <div style={{ marginBottom: 6 }}>
          <svg width={100} height={100} viewBox="0 0 32 32" fill="none">
            {/* 둥근 박스 — 페이드 인만 (변형 없음, 안전) */}
            <rect
              x="0" y="0" width="32" height="32"
              rx={(26 / 100) * 32}
              fill={accent}
              style={{
                animation: "haruBoxIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) both",
                willChange: "opacity",
              }}
            />

            {/* 중앙 해 — circle의 r 속성 자체를 애니메이션 (transform 안 씀) */}
            <circle
              cx="16" cy="16" r="4.6"
              fill="#fff"
              style={{
                animation: "haruCircleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.45s both",
              }}
            />

            {/* 광선 8개 — 천천히 시계방향으로 */}
            <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none">
              {[
                "M16 5.5v2.5",
                "M21.7 10.3l1.8-1.8",
                "M24 16h2.5",
                "M21.7 21.7l1.8 1.8",
                "M16 24v2.5",
                "M8.5 23.5l1.8-1.8",
                "M5.5 16h2.5",
                "M8.5 8.5l1.8 1.8",
              ].map((d, i) => (
                <path
                  key={i}
                  d={d}
                  strokeDasharray="14"
                  style={{
                    animation: `haruRayDraw 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${0.7 + i * 0.09}s both`,
                    willChange: "stroke-dashoffset, opacity",
                  }}
                />
              ))}
            </g>
          </svg>
        </div>

        {/* 워드마크 */}
        <div
          style={{
            fontFamily: "'Baloo 2', system-ui, sans-serif",
            color: "#fff",
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.8px",
            lineHeight: 1,
            animation: "haruFadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.5s both",
            willChange: "transform, opacity",
          }}
        >
          Haru<span style={{ color: accent }}>:</span>on
        </div>

        {/* 부제 */}
        <div
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: "-0.3px",
            marginTop: 16,
            animation: "haruSubFade 0.6s cubic-bezier(0.4, 0, 0.2, 1) 1.85s both",
            willChange: "opacity",
          }}
        >
          켜지는 하루, 채워지는 시간
        </div>
      </div>
    </div>
  );
}
