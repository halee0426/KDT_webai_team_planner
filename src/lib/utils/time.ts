// 시간 ↔ 슬롯 변환 (30분 단위 = 48슬롯, 10분 단위 = 6칸/시간)

/** 'HH:MM' → 30분 단위 슬롯 인덱스 (0~47) */
export const timeToSlot30 = (t: string): number => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
};

/** 슬롯 → 'HH:MM' (30분 단위) */
export const slotToTime30 = (s: number): string => {
  s = Math.max(0, Math.min(47, s));
  return `${String(Math.floor(s / 2)).padStart(2, '0')}:${s % 2 === 0 ? '00' : '30'}`;
};

/** 'HH:MM' → 10분 단위 슬롯 인덱스 (시간 6h~24h, 0~107) */
export const timeToSlot10 = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return Math.max(0, (h - 6) * 6 + Math.floor(m / 10));
};

/** 'HH:MM' 두 시간 사이 분 단위 차이 */
export const minutesBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh - sh) * 60 + (em - sm);
};
