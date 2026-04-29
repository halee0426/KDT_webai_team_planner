// 연력 — 1년 365일을 한 화면에 + 드래그 형광펜 하이라이트
// 차별화 포인트 1: 1년 한눈에 보기

import { useMemo, useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { fmtDate, daysInMonth, todayStr, MONTH_KO, DAY_KO } from '@/lib/utils/date';
import { HIGHLIGHT_COLORS } from '@/types/event';

const MONTH_BAR_HEIGHT = 28;
const DAY_WIDTH = 18;

export default function YearView() {
  const { highlights, addHighlight, removeHighlight } = useEventStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const today = todayStr();

  // 드래그 상태
  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [pickedLabel, setPickedLabel] = useState('');

  const isInDragRange = (date: string) => {
    if (!dragStart || !dragEnd) return false;
    const [s, e] = [dragStart, dragEnd].sort();
    return date >= s && date <= e;
  };

  const dateHighlights = (date: string) =>
    highlights.filter((h) => date >= h.startDate && date <= h.endDate);

  const onDayDown = (date: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDragStart(date);
    setDragEnd(date);
  };
  const onDayEnter = (date: string) => {
    if (dragStart) setDragEnd(date);
  };
  const onDayUp = () => {
    if (dragStart && dragEnd && dragStart !== dragEnd) {
      setShowPicker(true);
    } else {
      setDragStart(null);
      setDragEnd(null);
    }
  };

  const saveHighlight = () => {
    if (!dragStart || !dragEnd) return;
    const [s, e] = [dragStart, dragEnd].sort();
    addHighlight({
      startDate: s,
      endDate: e,
      color: pickedColor,
      label: pickedLabel.trim() || undefined,
    });
    setDragStart(null);
    setDragEnd(null);
    setShowPicker(false);
    setPickedLabel('');
  };

  // 연도별 12개월
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, mi) => {
      const days = daysInMonth(year, mi);
      return Array.from({ length: days }, (_, di) => {
        const d = new Date(year, mi, di + 1);
        return { date: fmtDate(d), day: di + 1, weekday: d.getDay() };
      });
    });
  }, [year]);

  return (
    <div className="min-h-full bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[var(--bg-glass)] px-5 py-4 backdrop-blur-xl">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="rounded-pill px-3 py-1 text-sm hover:bg-[var(--bg-tertiary)]"
        >
          ‹
        </button>
        <div className="text-xl font-bold tracking-apple">{year}</div>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="rounded-pill px-3 py-1 text-sm hover:bg-[var(--bg-tertiary)]"
        >
          ›
        </button>
      </div>

      <div className="px-2 pt-3" onMouseUp={onDayUp}>
        {months.map((days, mi) => (
          <div key={mi} className="mb-1 flex items-center">
            {/* 월 라벨 */}
            <div className="w-12 shrink-0 pr-2 text-right text-xs font-semibold text-ink-soft">
              {MONTH_KO[mi]}
            </div>
            {/* 일자들 */}
            <div className="flex flex-1 items-center gap-[1px] overflow-x-auto">
              {days.map((d) => {
                const hls = dateHighlights(d.date);
                const isToday = d.date === today;
                const isSat = d.weekday === 6;
                const isSun = d.weekday === 0;
                const inDrag = isInDragRange(d.date);
                return (
                  <div
                    key={d.date}
                    onMouseDown={(e) => onDayDown(d.date, e)}
                    onMouseEnter={() => onDayEnter(d.date)}
                    style={{ width: DAY_WIDTH, height: MONTH_BAR_HEIGHT }}
                    className={`relative shrink-0 cursor-pointer select-none border-r border-line/40 text-center text-[10px] leading-[28px] ${
                      isToday ? 'font-bold text-[color:var(--accent)]' : ''
                    } ${isSun ? 'text-[#FF3B30]' : ''} ${
                      isSat ? 'text-[#0066cc]' : ''
                    } ${inDrag ? 'bg-[var(--accent-soft)] ring-1 ring-[color:var(--accent)]' : ''}`}
                    title={`${d.date} (${DAY_KO[d.weekday]})`}
                  >
                    {/* 형광펜 배경 */}
                    {hls.length > 0 && (
                      <div
                        className="absolute inset-x-0 top-1/2 h-[14px] -translate-y-1/2"
                        style={{ background: hls[0].color }}
                      />
                    )}
                    <span className="relative z-10">{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 형광펜 목록 */}
      {highlights.length > 0 && (
        <div className="mt-4 px-5">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            형광펜 ({highlights.length})
          </div>
          <div className="space-y-1">
            {highlights.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 rounded-md p-2"
                style={{ background: h.color }}
              >
                <span className="flex-1 text-sm font-medium text-black/70">
                  {h.label || `${h.startDate} ~ ${h.endDate}`}
                </span>
                <button
                  onClick={() => removeHighlight(h.id)}
                  className="text-xs text-black/50 hover:text-black/80"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 형광펜 추가 모달 */}
      {showPicker && (
        <div
          onClick={() => setShowPicker(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[90%] max-w-sm rounded-2xl bg-[var(--bg-elev)] p-6 shadow-2xl"
          >
            <h3 className="mb-1 text-lg font-bold">형광펜으로 표시</h3>
            <p className="mb-4 text-sm text-ink-soft">
              {dragStart} ~ {dragEnd}
            </p>
            <input
              autoFocus
              value={pickedLabel}
              onChange={(e) => setPickedLabel(e.target.value)}
              placeholder="라벨 (예: 여행, 시험기간)"
              className="mb-3 w-full rounded-lg border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
            />
            <div className="mb-4 flex gap-2">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setPickedColor(c.value)}
                  style={{ background: c.value }}
                  className={`h-9 flex-1 rounded-md transition ${
                    pickedColor === c.value ? 'ring-2 ring-ink' : ''
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPicker(false)}
                className="flex-1 rounded-pill bg-[var(--bg-tertiary)] px-4 py-3 text-sm font-medium"
              >
                취소
              </button>
              <button
                onClick={saveHighlight}
                className="flex-1 rounded-pill bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
