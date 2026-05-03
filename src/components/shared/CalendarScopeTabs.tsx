// 캘린더 계층 빠른 이동 탭 — Calendar Views.html 의 ScopeTabs 디자인
// 디자인: 작은 탭 라벨 + 활성은 액센트 색 + 하단 2px 액센트 보더
// 10분 플래너는 차별화 기능이라 작은 NEW dot 으로 강조 (시연 임팩트)
//
// props:
//   accent — 액센트 색
//   active — 현재 활성 탭 키
//   onChange — 탭 변경 콜백

import { motion } from "motion/react";
import { SPRING } from "@/styles/animations";

export type ScopeKey = "year" | "month" | "daily" | "tenmin";

const SCOPE_ITEMS: { key: ScopeKey; label: string; highlight?: boolean }[] = [
  { key: "year", label: "연" },
  { key: "month", label: "월" },
  { key: "daily", label: "일" },
  { key: "tenmin", label: "10분", highlight: true },
];

export function CalendarScopeTabs({
  accent,
  active,
  onChange,
}: {
  accent: string;
  active: ScopeKey;
  onChange: (k: ScopeKey) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        padding: "0 20px",
        background: "var(--bg-canvas)",
        borderBottom: "0.5px solid var(--hairline)",
      }}
    >
      {SCOPE_ITEMS.map((s) => {
        const on = s.key === active;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className="active:scale-95 relative"
            style={{
              flex: 1,
              padding: "10px 0 11px",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "-0.2px",
              color: on ? accent : "var(--text-secondary)",
              background: "transparent",
              border: 0,
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "color 180ms",
            }}
          >
            <span style={{ position: "relative", display: "inline-block" }}>
              {s.label}
              {/* 차별화 기능 강조 — 작은 dot pulse */}
              {s.highlight && !on && (
                <motion.span
                  animate={{ scale: [1, 1.3, 1], opacity: [0.85, 1, 0.85] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -7,
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
              )}
            </span>
            {/* 활성 underline — layoutId 로 부드럽게 슬라이드 */}
            {on && (
              <motion.div
                layoutId="scope-underline"
                transition={SPRING.snap}
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  background: accent,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
