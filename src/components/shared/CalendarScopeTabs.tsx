// 캘린더 계층 빠른 이동 탭 — Calendar Views.html 의 ScopeTabs 디자인
// 디자인: 작은 탭 라벨 + 활성은 액센트 색 + 하단 2px 액센트 보더
// 10분 플래너는 별도 도구라 스코프에서 분리됨 (햄버거 메뉴 → 도구 → 10분 플래너 NEW)
//
// props:
//   accent — 액센트 색
//   active — 현재 활성 탭 키
//   onChange — 탭 변경 콜백

import { motion } from "motion/react";
import { SPRING } from "@/styles/animations";

export type ScopeKey = "year" | "month" | "daily" | "tenmin";

const SCOPE_ITEMS: { key: ScopeKey; label: string }[] = [
  { key: "year", label: "연" },
  { key: "month", label: "월" },
  { key: "daily", label: "일" },
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
            {s.label}
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
