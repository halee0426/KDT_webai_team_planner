// AI 입출력 타입 — OpenAI API 호출 결과

import type { Event } from './event';
import type { MandalaCell } from './mandala';
import { CENTER_INDEX, SURROUND_MAP } from './mandala';

const SUBGOAL_CENTERS = [10, 13, 16, 37, 43, 64, 67, 70] as const;

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
  const cells: MandalaCell[] = Array(81).fill('');
  cells[CENTER_INDEX] = d.center;

  d.subgoals.forEach((subgoal, i) => {
    cells[SUBGOAL_CENTERS[i]] = subgoal;
    const innerCellIdx = Object.keys(SURROUND_MAP).find(
      (k) => SURROUND_MAP[Number(k)] === i,
    );
    if (innerCellIdx !== undefined) cells[Number(innerCellIdx)] = subgoal;
  });

  d.actions.forEach((blockActions, blockIdx) => {
    const blockCenter = SUBGOAL_CENTERS[blockIdx];
    const baseRow = Math.floor(blockCenter / 9) - 1;
    const baseCol = (blockCenter % 9) - 1;

    let actionIdx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellIdx = (baseRow + r) * 9 + (baseCol + c);
        if (cellIdx === blockCenter) continue;
        cells[cellIdx] = blockActions[actionIdx];
        actionIdx++;
      }
    }
  });

  return cells;
};

/** 주간 회고 결과 */
export type WeeklyRecap = {
  summary: string;         // 이번 주 요약 (자연어)
  highlights: string[];    // 잘한 점 3개
  suggestions: string[];   // 다음 주 제안 3개
  generatedAt: number;
};
