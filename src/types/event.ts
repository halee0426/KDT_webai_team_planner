// 도메인 데이터 — Firestore users/{uid}/{events,todos,highlights,diaries}

/** 일정 */
export type Event = {
  id: string;
  date: string;            // 'YYYY-MM-DD'
  title: string;
  color: string;           // hex
  startTime?: string;      // 'HH:MM' (없으면 종일)
  endTime?: string;
  createdBy: string;       // uid — 동기화·공유 시 식별
  createdAt?: number;
};

/** 연력 형광펜 (기간 하이라이트) */
export type Highlight = {
  id: string;
  startDate: string;       // 'YYYY-MM-DD'
  endDate: string;         // 'YYYY-MM-DD'
  color: string;           // 6가지 형광펜 색
  label?: string;
};

/** 할 일 */
export type Todo = {
  id: string;
  text: string;
  done: boolean;
  /** 어제에서 이월된 경우 원본 날짜 */
  rolledFrom?: string;
  /** 어제에서 이월된 원본 todo의 id */
  rolledId?: string;
  createdAt?: number;
};

/** 일기 */
export type Diary = {
  date: string;            // 'YYYY-MM-DD' (PK)
  text: string;
  mood?: '😊' | '😐' | '😢';
  updatedAt?: number;
};

/** 형광펜 색상 팔레트 (rgba 50%) */
export const HIGHLIGHT_COLORS = [
  { name: 'red',    value: 'rgba(255,59,48,0.38)'  },
  { name: 'orange', value: 'rgba(255,149,0,0.42)'  },
  { name: 'yellow', value: 'rgba(255,204,0,0.5)'   },
  { name: 'green',  value: 'rgba(52,199,89,0.38)'  },
  { name: 'blue',   value: 'rgba(0,122,255,0.32)'  },
  { name: 'purple', value: 'rgba(175,82,222,0.38)' },
] as const;
