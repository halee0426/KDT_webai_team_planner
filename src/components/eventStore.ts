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

export const initialSharedEvents: SharedEvent[] = [];

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

/** 나의 플랜 초기 todos — 실데이터 only */
export const initialMyTodos: Todo[] = [];

/** 공동 플랜 초기 todos — 실데이터 only (공동은 그룹 단위로 별도 관리) */
export const initialSharedTodos: Todo[] = [];
