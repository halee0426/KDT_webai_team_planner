// 애플 톤 애니메이션 토큰 — motion/react 와 함께 사용
//
// 사용 예시:
//   import { SPRING, EASE, DURATION } from "@/styles/animations";
//   <motion.div transition={SPRING.sheet} ... />
//   <motion.div transition={{ duration: DURATION.base / 1000, ease: EASE.apple }} ... />
//
// 절제된 부드러움. prefers-reduced-motion 사용자는 호출부에서 useReducedMotion 훅으로 거의 즉각 변환.

export const SPRING = {
  /** 시트 진입/퇴장 — 묵직하게 안정감 있는 슬라이드 */
  sheet: { type: "spring" as const, stiffness: 380, damping: 38, mass: 0.9 },
  /** 짧고 빠른 snap — 탭 underline, layoutId 슬라이드, 토글 알약 */
  snap: { type: "spring" as const, stiffness: 500, damping: 32 },
  /** 부드러운 카드 등장/퇴장 */
  soft: { type: "spring" as const, stiffness: 280, damping: 30 },
};

export const EASE = {
  /** Apple 표준 easing — fade/dim/슬라이드 모두에 사용 */
  apple: [0.32, 0.72, 0, 1] as const,
  /** outQuart — 자연스러운 진입 종료 */
  outQuart: [0.16, 1, 0.3, 1] as const,
  /** inOutCubic — 양쪽 대칭 전환 */
  inOutCubic: [0.65, 0, 0.35, 1] as const,
};

export const DURATION = {
  fast: 180,
  base: 240,
  slow: 320,
  page: 360,
};
