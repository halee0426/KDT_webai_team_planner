// 타이포그래피 토큰 — 앱 전체 폰트 사이즈/굵기 시스템 정립
// 애플 HIG + iOS 캘린더 디자인 참고

import type { CSSProperties } from "react";

/** 페이지 메인 타이틀 — "나의 1년 플랜", "5월 12일", "만다라트" */
export const titlePage: CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: "-1.0px",
  lineHeight: 1.1,
};

/** 강조 디스플레이 — "2026" (연력 메인) */
export const titleDisplay: CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: "-1.0px",
  lineHeight: 1.05,
};

/** 큰 월 타이틀 — "5월" (캘린더 등) */
export const titleMonth: CSSProperties = {
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: "-1.0px",
  lineHeight: 1,
};

/** 섹션 헤더 — "오늘의 일정", "할 일", "다가오는 일정" */
export const titleSection: CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: "-0.4px",
  lineHeight: 1.3,
};

/** 카드 제목 — 일정 카드 안의 제목 */
export const titleCard: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: "-0.2px",
  lineHeight: 1.3,
};

/** 페이지 부제 — 큰 타이틀 옆 작은 회색 ("2026", "화요일") */
export const captionMeta: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: "-0.2px",
  lineHeight: 1.3,
};

/** 작은 라벨 — "121일·33%", "20주차" */
export const captionLabel: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0px",
  lineHeight: 1.2,
};

/** 카운트 / 강조 액센트 — "N개 플랜", "3개" */
export const captionCount: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "-0.1px",
  lineHeight: 1.2,
};

/** 본문 — 일반 텍스트 */
export const body: CSSProperties = {
  fontSize: 15,
  fontWeight: 400,
  letterSpacing: "-0.3px",
  lineHeight: 1.5,
};

/** 작은 본문 — 보조 텍스트 */
export const bodySmall: CSSProperties = {
  fontSize: 13,
  fontWeight: 400,
  letterSpacing: "-0.2px",
  lineHeight: 1.45,
};

/** 캡션 — 가장 작은 회색 텍스트 */
export const caption: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0px",
  lineHeight: 1.4,
};

/** 셀 안 일정 알약 — 매우 컴팩트 */
export const pillTiny: CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "-0.1px",
  lineHeight: 1.4,
};

/** 버튼 라벨 — 알약 버튼 */
export const buttonLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "-0.1px",
};

/** 탭 라벨 — 캘린더 스코프 탭 */
export const tabLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: "-0.2px",
};

/** 한 묶음으로 export */
export const TYPE = {
  titlePage,
  titleDisplay,
  titleMonth,
  titleSection,
  titleCard,
  captionMeta,
  captionLabel,
  captionCount,
  body,
  bodySmall,
  caption,
  pillTiny,
  buttonLabel,
  tabLabel,
};
