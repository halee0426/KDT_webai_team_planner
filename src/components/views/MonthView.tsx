// 달력 — 월간 일정 한눈에

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/eventStore';
import { fmtDate, daysInMonth, todayStr, MONTH_KO, DAY_KO } from '@/lib/utils/date';

export default function MonthView() {
  const { events, highlights } = useEventStore();
  const navigate = useNavigate();
  const today = todayStr();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  const goPrev = () => {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  };

  const days = daysInMonth(year, month);
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalCells = Math.ceil((firstWeekday + days) / 7) * 7;

  const dateStr = (d: number) => fmtDate(new Date(year, month, d));
  const eventsOf = (d: number) => events.filter((e) => e.date === dateStr(d));
  const highlightOf = (d: number) =>
    highlights.find((h) => dateStr(d) >= h.startDate && dateStr(d) <= h.endDate);

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[var(--bg-glass)] px-5 py-4 backdrop-blur-xl">
        <button onClick={goPrev} className="rounded-pill px-3 py-1 hover:bg-[var(--bg-tertiary)]">‹</button>
        <h2 className="text-xl font-bold tracking-apple">
          {year}년 {MONTH_KO[month]}
        </h2>
        <button onClick={goNext} className="rounded-pill px-3 py-1 hover:bg-[var(--bg-tertiary)]">›</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-line bg-[var(--bg-elev)] px-2 py-2">
        {DAY_KO.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold ${
              i === 0 ? 'text-[#FF3B30]' : i === 6 ? 'text-[#0066cc]' : 'text-ink-soft'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 그리드 */}
      <div className="grid flex-1 grid-cols-7 gap-px bg-line p-px">
        {Array.from({ length: totalCells }).map((_, i) => {
          const day = i - firstWeekday + 1;
          const inMonth = day >= 1 && day <= days;
          const isToday = inMonth && dateStr(day) === today;
          const dEvents = inMonth ? eventsOf(day) : [];
          const hl = inMonth ? highlightOf(day) : undefined;
          const isSun = i % 7 === 0;
          const isSat = i % 7 === 6;
          return (
            <button
              key={i}
              disabled={!inMonth}
              onClick={() => navigate(`/day?d=${dateStr(day)}`)}
              className="flex min-h-[80px] flex-col items-start bg-[var(--bg-elev)] p-1.5 text-left transition hover:bg-[var(--bg-tertiary)] disabled:opacity-40"
              style={hl ? { background: hl.color } : undefined}
            >
              <div
                className={`mb-1 text-xs ${
                  isToday
                    ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--accent)] font-bold text-white'
                    : isSun
                    ? 'text-[#FF3B30]'
                    : isSat
                    ? 'text-[#0066cc]'
                    : ''
                }`}
              >
                {inMonth ? day : ''}
              </div>
              <div className="flex flex-wrap gap-0.5">
                {dEvents.slice(0, 3).map((e) => (
                  <div key={e.id} className="h-1 w-1 rounded-full" style={{ background: e.color }} />
                ))}
                {dEvents.length > 3 && <span className="text-[9px] text-ink-mute">+{dEvents.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
