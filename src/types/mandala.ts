// 만다라트 — Firestore users/{uid}/mandala/{mandalaId}

/** 81칸 만다라트 한 셀의 텍스트. 빈 셀은 '' */
export type MandalaCell = string;

/** 9×9 = 81칸 */
export type Mandala = {
  id: string;
  cells: MandalaCell[];    // length === 81
  createdAt?: number;
  updatedAt?: number;
};

/** 9×9 그리드에서 9개 블록 중심 셀의 인덱스 (3×3 블록의 중앙) */
export const BLOCK_CENTERS = [10, 13, 16, 37, 40, 43, 64, 67, 70] as const;

/** 중심 블록(가운데 3×3)의 8개 외곽 셀 → 8개 블록 중심으로 매핑 */
export const SURROUND_MAP: Record<number, number> = {
  30: 0, 31: 1, 32: 2,
  39: 3,        41: 4,
  48: 5, 49: 6, 50: 7,
};

/** 핵심 목표 셀 인덱스 */
export const CENTER_INDEX = 40;

export const EMPTY_MANDALA = (): MandalaCell[] => Array(81).fill('');
