import { highlights } from "./tokens";

/**
 * 연력·달력·일력이 공유하는 통합 일정 타입
 * startSlot / endSlot 이 있으면 → 일력 시간 일정 (timed)
 * 없으면              → 달력/연력 날짜 범위 플랜 (untimed)
 */
export type SharedEvent = {
  id: number;
  year: number;
  month: number;     // 0-indexed (0=Jan, 3=Apr)
  startDay: number;
  endDay: number;
  startSlot?: number; // 0-47 (30분 단위, 일력 전용)
  endSlot?: number;   // 1-48
  title: string;
  color: string;
};

export const initialSharedEvents: SharedEvent[] = [
  // 달력 플랜 (2026년 4월)
  { id: 1, year: 2026, month: 3, startDay: 8,  endDay: 10, title: "집중주간",       color: highlights[2].color },
  { id: 2, year: 2026, month: 3, startDay: 17, endDay: 17, title: "리뷰",            color: highlights[4].color },
  // 연력 하이라이트
  { id: 3, year: 2026, month: 3, startDay: 27, endDay: 30, title: "프로젝트 마무리", color: highlights[2].color },
  { id: 4, year: 2026, month: 4, startDay: 5,  endDay: 9,  title: "휴가",            color: highlights[3].color },
  { id: 5, year: 2026, month: 6, startDay: 1,  endDay: 31, title: "여름 챌린지",     color: highlights[4].color },
  // 일력 시간 일정 (2026년 4월 29일)
  { id: 6, year: 2026, month: 3, startDay: 29, endDay: 29, title: "팀 스탠드업", color: highlights[4].color, startSlot: 20, endSlot: 22 },
  { id: 7, year: 2026, month: 3, startDay: 29, endDay: 29, title: "1:1 미팅",    color: highlights[5].color, startSlot: 29, endSlot: 31 },
  { id: 8, year: 2026, month: 3, startDay: 29, endDay: 29, title: "운동",        color: highlights[1].color, startSlot: 38, endSlot: 40 },
];
