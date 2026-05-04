// LLM 응답 → 우리 도메인 모델 변환
// 담당: C

import type { MandalaDecomposition } from '@/types/ai';
import type { MandalaCell } from '@/types/mandala';
import { SURROUND_MAP, CENTER_INDEX } from '@/types/mandala';

const SUBGOAL_CENTERS = [10, 13, 16, 37, 43, 64, 67, 70] as const;

/**
 * 만다라트 분해 결과를 81칸 평면 배열로 변환.
 * 9개 블록 중심 셀과 가운데 블록의 외곽 셀이 자동 동기화됨.
 */
export function decompositionToCells(d: MandalaDecomposition): MandalaCell[] {
  const cells: MandalaCell[] = Array(81).fill('');

  // 1. 중심 셀
  cells[CENTER_INDEX] = d.center;

  // 2. 8개 블록 중심 + 가운데 블록의 외곽 (Tier 2 + Tier 3 동기화)
  d.subgoals.forEach((subgoal, i) => {
    cells[SUBGOAL_CENTERS[i]] = subgoal;
    // 가운데 블록의 외곽 셀(SURROUND_MAP)도 같은 값으로 동기화
    const innerCellIdx = Object.keys(SURROUND_MAP).find(
      (k) => SURROUND_MAP[Number(k)] === i,
    );
    if (innerCellIdx !== undefined) {
      cells[Number(innerCellIdx)] = subgoal;
    }
  });

  // 3. 64개 실행 셀 (각 8개 블록의 외곽 8칸)
  d.actions.forEach((blockActions, blockIdx) => {
    const blockCenter = SUBGOAL_CENTERS[blockIdx];
    const baseRow = Math.floor(blockCenter / 9) - 1;  // 블록의 첫 행
    const baseCol = (blockCenter % 9) - 1;

    let actionIdx = 0;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const cellIdx = (baseRow + r) * 9 + (baseCol + c);
        if (cellIdx === blockCenter) continue;  // 블록 중심은 건너뜀
        cells[cellIdx] = blockActions[actionIdx];
        actionIdx++;
      }
    }
  });

  return cells;
}
