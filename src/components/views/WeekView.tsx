// 주력 — 주간 시간표 (7일 × 19시간)

import { useState } from 'react';
import { useEventStore } from '@/store/eventStore';
import { todayStr, parseDate, fmtDate, addDays, DAY_KO } from '@/lib/utils/date';
import { timeToSlot30, slotToTime30 } from '@/lib/utils/time';

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5); // 05:00 ~ 23:00
const SLOT_HEIGHT = 24;

export default function WeekView() {
  const { events } = useEventStore();
  const today = todayStr();
  const [anchor, setAnchor] = useState(today);

  // 주의 시작 (월요일)
  const d = parseDate(anchor);
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(anchor, mondayOffset);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const goPrev = () => setAnchor(addDays(monday, -7));
  const goNext = () => setAnchor(addDays(monday, 7));

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-xl">
        <button onClick={goPrev} className="rounded-pill px-2 py-1 hover:bg-[var(--bg-tertiary)]">‹</button>
        <div className="flex-1 text-center text-sm font-semibold">
          {monday.slice(5).replace('-', '/')} ~ {weekDates[6].slice(5).replace('-', '/')}
        </div>
        <button onClick={goNext} className="rounded-pill px-2 py-1 hover:bg-[var(--bg-tertiary)]">›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-[40px_repeat(7,1fr)] border-b border-line bg-[var(--bg-elev)]">
        <div />
        {weekDates.map((dateStr, i) => {
          const d = parseDate(dateStr);
          const isToday = dateStr === today;
          return (
            <div key={dateStr} className={`border-l border-line py-2 text-center text-xs ${isToday ? 'text-[color:var(--accent)] font-bold' : ''}`}>
              <div>{DAY_KO[d.getDay()]}</div>
              <div className="text-base">{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* 그리드 */}
      <div className="flex-1 overflow-y-auto bg-[var(--bg-elev)]">
        <div className="grid grid-cols-[40px_repeat(7,1fr)]" style={{ height: HOURS.length * 2 * SLOT_HEIGHT }}>
          {/* 시간 라벨 */}
          <div className="relative">
            {HOURS.map((h) => (
              <div key={h} className="absolute -translate-y-1 pl-1 text-[10px] text-ink-mute" style={{ top: (h - HOURS[0]) * 2 * SLOT_HEIGHT }}>
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>
          {/* 7일 컬럼 */}
          {weekDates.map((dateStr) => {
            const dayEvents = events.filter((e) => e.date === dateStr && e.startTime);
            return (
              <div key={dateStr} className="relative border-l border-line">
                {HOURS.map((h) => (
                  <div key={h} className="absolute inset-x-0 border-t border-line/40" style={{ top: (h - HOURS[0]) * 2 * SLOT_HEIGHT }} />
                ))}
                {dayEvents.map((e) => {
                  const sSlot = timeToSlot30(e.startTime!);
                  const eSlot = timeToSlot30(e.endTime || slotToTime30(sSlot + 2));
                  const top = (sSlot - HOURS[0] * 2) * SLOT_HEIGHT;
                  const height = Math.max(SLOT_HEIGHT, (eSlot - sSlot) * SLOT_HEIGHT);
                  return (
                    <div
                      key={e.id}
                      className="absolute inset-x-0.5 overflow-hidden rounded px-1 text-[10px] font-semibold text-white"
                      style={{ top, height, background: e.color }}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

void fmtDate;
