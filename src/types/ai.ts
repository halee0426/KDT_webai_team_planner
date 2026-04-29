// AI 입출력 타입 — OpenAI API 호출 결과

import type { Event } from './event';
import type { MandalaCell } from './mandala';

/** AI 인사이트 인사말 */
export type Insight = {
  message: string;         // 한두 줄 코멘트
  generatedAt: number;
};

/** 자연어 → 일정 분해 결과 */
export type ParseEventResult = {
  events: (Omit<Event, 'id' | 'createdBy' | 'createdAt' | 'color'> & { color?: string })[];
};

/** 만다라트 자동 분해 결과 */
export type MandalaDecomposition = {
  center: string;          // 핵심 목표
  subgoals: [string, string, string, string, string, string, string, string]; // 8개
  actions: [
    [string, string, string, string, string, string, string, string],         // 각 subgoal당 8개
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
    [string, string, string, string, string, string, string, string],
  ];
};

/** 81칸 평면 배열로 변환 */
export const decompositionToCells = (d: MandalaDecomposition): MandalaCell[] => {
  // 구현은 lib/ai/parser.ts에서 처리
  void d;
  return Array(81).fill('');
};

/** 주간 회고 결과 */
export type WeeklyRecap = {
  summary: string;         // 이번 주 요약 (자연어)
  highlights: string[];    // 잘한 점 3개
  suggestions: string[];   // 다음 주 제안 3개
  generatedAt: number;
};
