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

/** 할일 타입 — DayView에서 사용 */
export type Todo = {
  id: number;
  text: string;
  done: boolean;
  /** 어제 미완료 → 오늘 자동 이전된 항목 */
  rolled?: boolean;
  /** "나중에" 그룹 (오늘 X) */
  later?: boolean;
};

/** 나의 플랜 초기 todos */
export const initialMyTodos: Todo[] = [
  { id: 1, text: "디자인 리뷰 준비", done: false },
  { id: 2, text: "주간 회고 작성", done: true },
  { id: 3, text: "운동 30분", done: false, rolled: true },
  { id: 4, text: "책 한 챕터 읽기", done: false, later: true },
  { id: 5, text: "포트폴리오 업데이트", done: false, later: true },
  { id: 6, text: "여름휴가 계획", done: false, later: true },
];

/** 공동 플랜 초기 todos */
export const initialSharedTodos: Todo[] = [
  { id: 1, text: "회의록 공유 (지민)", done: false },
  { id: 2, text: "디자인 시안 확인 (수아)", done: true },
  { id: 3, text: "프로젝트 일정 합의", done: false },
  { id: 4, text: "분기 회고 자료 정리", done: false, later: true },
  { id: 5, text: "외부 협업사 미팅 준비", done: false, later: true },
];
