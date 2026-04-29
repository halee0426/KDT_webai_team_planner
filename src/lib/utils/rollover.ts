// 미완료 할일 자동 이전 — 규칙 기반 (LLM 사용 X)
// 어제 done=false인 todo를 오늘 목록에 "이월" 라벨로 추가

import type { Todo } from '@/types/event';

export function computeRollover(
  fromList: Todo[],
  toList: Todo[],
  fromDate: string,
): Todo[] {
  const incomplete = fromList.filter((t) => !t.done);
  if (incomplete.length === 0) return [];
  const alreadyRolled = new Set(
    toList.filter((t) => t.rolledFrom === fromDate).map((t) => t.rolledId),
  );
  return incomplete
    .filter((t) => !alreadyRolled.has(t.id))
    .map((t) => ({
      id: '',  // 호출 측에서 새 id 부여
      text: t.text,
      done: false,
      rolledFrom: fromDate,
      rolledId: t.id,
    }));
}
