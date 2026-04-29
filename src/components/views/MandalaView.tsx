// 만다라트 — 9×9 = 81칸 목표 분해 + 블록 중심/외곽 자동 동기화
// 차별화: AI 자동 분해 버튼 (✨)

import { useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { useAIStore } from '@/store/aiStore';
import { BLOCK_CENTERS, SURROUND_MAP, CENTER_INDEX } from '@/types/mandala';
import { decompositionToCells } from '@/lib/ai/parser';

export default function MandalaView() {
  const { mandala, setMandalaCell, resetMandala } = useEventStore();
  const { decomposeMandala } = useAIStore();
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 셀 수정 — 블록 중심/외곽 자동 동기화
  const onCellChange = (idx: number, value: string) => {
    setMandalaCell(idx, value);
    // 가운데 블록의 외곽 셀(SURROUND_MAP) → 8개 블록 중심 동기화
    if (SURROUND_MAP[idx] !== undefined) {
      setMandalaCell(BLOCK_CENTERS[SURROUND_MAP[idx]], value);
    } else {
      // 거꾸로: 8개 블록 중심 → 가운데 블록 외곽 셀 동기화
      const pos = BLOCK_CENTERS.indexOf(idx as never);
      if (pos !== -1 && idx !== CENTER_INDEX) {
        const k = Object.keys(SURROUND_MAP).find(
          (key) => SURROUND_MAP[Number(key)] === pos,
        );
        if (k) setMandalaCell(Number(k), value);
      }
    }
  };

  const handleAIDecompose = async () => {
    const center = mandala.cells[CENTER_INDEX].trim();
    if (!center) {
      setAiError('먼저 가운데에 핵심 목표를 입력하세요');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await decomposeMandala(center);
      const cells = decompositionToCells(result);
      cells.forEach((v, i) => setMandalaCell(i, v));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI 호출 실패');
    } finally {
      setAiLoading(false);
    }
  };

  const getCellTier = (idx: number): 1 | 2 | 3 | 4 => {
    if (idx === CENTER_INDEX) return 1;
    if (BLOCK_CENTERS.includes(idx as never)) return 2;
    if (SURROUND_MAP[idx] !== undefined) return 3;
    return 4;
  };

  const cellStyle = (tier: 1 | 2 | 3 | 4) => {
    if (tier === 1)
      return 'bg-[color:var(--accent)] text-white font-bold text-[13px]';
    if (tier === 2)
      return 'bg-[var(--accent-soft)] text-[color:var(--accent)] font-bold text-[11px]';
    if (tier === 3) return 'bg-[var(--bg-tertiary)] text-ink text-[11px]';
    return 'bg-[var(--bg-elev)] text-ink text-[11px]';
  };

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[var(--bg-glass)] px-5 py-4 backdrop-blur-xl">
        <h1 className="text-xl font-bold tracking-apple">만다라트</h1>
        <span className="text-xs text-ink-soft">중앙 목표 → 8 세부 → 64 실행</span>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleAIDecompose}
            disabled={aiLoading}
            className="rounded-pill bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {aiLoading ? '✨ 분해 중…' : '✨ AI 자동 분해'}
          </button>
          <button
            onClick={() => {
              if (window.confirm('만다라트를 초기화할까요?')) resetMandala();
            }}
            className="rounded-pill bg-[var(--bg-tertiary)] px-3 py-2 text-xs"
          >
            초기화
          </button>
        </div>
      </div>

      {aiError && (
        <div className="mx-4 mt-3 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-600">
          {aiError}
        </div>
      )}

      {/* 9×9 그리드 */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="grid aspect-square w-full max-w-2xl grid-cols-9 grid-rows-9 gap-px bg-line-strong p-0.5 rounded-lg">
          {mandala.cells.map((cell, idx) => {
            const tier = getCellTier(idx);
            const blockIdx = Math.floor(idx / 27) * 3 + Math.floor((idx % 9) / 3);
            // 9개 블록 시각적 구분 (블록별 약간의 배경)
            const isOddBlock = (blockIdx % 2 === 0);
            return (
              <textarea
                key={idx}
                value={cell}
                onChange={(e) => onCellChange(idx, e.target.value)}
                className={`flex resize-none items-center justify-center p-1 text-center outline-none focus:ring-2 focus:ring-[color:var(--accent)] ${cellStyle(
                  tier,
                )} ${isOddBlock ? '' : ''}`}
                style={{
                  fontSize: tier === 1 ? 13 : 10,
                  lineHeight: 1.2,
                }}
                rows={1}
              />
            );
          })}
        </div>
      </div>

      <p className="px-4 text-center text-xs text-ink-mute">
        💡 가운데 블록의 외곽 셀과 8개 블록 중심은 자동 동기화됩니다.
      </p>
    </div>
  );
}
