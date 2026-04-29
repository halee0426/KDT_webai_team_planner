// 일력 — 30분 타임그리드 + 할일 + AI 인사이트 인사말
// 메인 홈 화면

import { useState, useEffect } from 'react';
import { useEventStore } from '@/store/eventStore';
import { todayStr, parseDate, fmtDate, addDays, DAY_KO } from '@/lib/utils/date';
import { timeToSlot30, slotToTime30 } from '@/lib/utils/time';
import InsightGreeting from '@/components/shared/InsightGreeting';

const SLOT_HEIGHT = 28;

const PALETTE = ['#0066cc', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#AF52DE', '#FF2D55'];

export default function DayView() {
  const { events, todos, addEvent, removeEvent, addTodo, toggleTodo, removeTodo, rolloverTodos } = useEventStore();
  const [date, setDate] = useState(todayStr());
  const today = todayStr();

  // 자동 이전: 어제 미완료 → 오늘
  useEffect(() => {
    if (date === today) {
      const yesterday = addDays(today, -1);
      rolloverTodos(yesterday, today);
    }
  }, [date, today, rolloverTodos]);

  // 빠른 추가
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [color, setColor] = useState(PALETTE[0]);
  const [allDay, setAllDay] = useState(false);

  // Todo 입력
  const [todoText, setTodoText] = useState('');

  const eventsToday = events.filter((e) => e.date === date);
  const timedEvents = eventsToday.filter((e) => e.startTime);
  const allDayEvents = eventsToday.filter((e) => !e.startTime);
  const todosToday = todos[date] || [];
  const doneCount = todosToday.filter((t) => t.done).length;

  const goDay = (delta: number) => setDate(addDays(date, delta));

  const handleAddEvent = () => {
    if (!title.trim()) return;
    addEvent({
      date,
      title: title.trim(),
      color,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      createdBy: 'guest',
    });
    setTitle('');
    setShowAdd(false);
  };

  const handleAddTodo = () => {
    if (!todoText.trim()) return;
    addTodo(date, todoText.trim());
    setTodoText('');
  };

  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) {
    timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  const d = parseDate(date);

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-xl">
        <button onClick={() => goDay(-1)} className="rounded-pill px-2 py-1 text-lg hover:bg-[var(--bg-tertiary)]">‹</button>
        <div className="flex-1 text-center">
          <div className={`text-lg font-bold tracking-apple ${date === today ? 'text-[color:var(--accent)]' : ''}`}>
            {d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-xs text-ink-soft">{DAY_KO[d.getDay()]}요일</div>
        </div>
        <button onClick={() => goDay(1)} className="rounded-pill px-2 py-1 text-lg hover:bg-[var(--bg-tertiary)]">›</button>
        {date !== today && (
          <button onClick={() => setDate(today)} className="rounded-pill bg-[var(--bg-tertiary)] px-3 py-1 text-xs">오늘</button>
        )}
      </div>

      {/* AI 인사이트 인사말 */}
      <InsightGreeting />

      {/* 종일 이벤트 */}
      {allDayEvents.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2 bg-[var(--bg-tertiary)]/50">
          <span className="text-xs text-ink-mute">종일</span>
          {allDayEvents.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-white"
              style={{ background: e.color }}
            >
              {e.title}
              <button onClick={() => removeEvent(e.id)} className="opacity-70 hover:opacity-100">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* 타임 그리드 */}
        <div className="relative flex-1 overflow-y-auto bg-[var(--bg-elev)]">
          <div className="relative" style={{ height: 48 * SLOT_HEIGHT }}>
            {/* 시간선 */}
            {Array.from({ length: 25 }, (_, h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-line/60"
                style={{ top: h * 2 * SLOT_HEIGHT }}
              >
                <span className="absolute -translate-y-1/2 pl-2 text-[10px] font-medium text-ink-mute">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
            {/* 30분 점선 */}
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={`half-${h}`}
                className="absolute inset-x-14 border-t border-dashed border-line/40"
                style={{ top: (h * 2 + 1) * SLOT_HEIGHT }}
              />
            ))}
            {/* 이벤트 블록 */}
            {timedEvents.map((e) => {
              const sSlot = timeToSlot30(e.startTime!);
              const eSlot = timeToSlot30(e.endTime || slotToTime30(sSlot + 2));
              const top = sSlot * SLOT_HEIGHT;
              const height = Math.max(SLOT_HEIGHT, (eSlot - sSlot) * SLOT_HEIGHT);
              return (
                <div
                  key={e.id}
                  className="absolute left-14 right-2 rounded-md px-2 py-1 shadow-sm"
                  style={{
                    top, height,
                    background: e.color + '20',
                    borderLeft: `3px solid ${e.color}`,
                  }}
                >
                  <div className="text-xs font-bold truncate" style={{ color: e.color }}>{e.title}</div>
                  <div className="text-[10px] text-ink-mute">{e.startTime} – {e.endTime}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 사이드: 할일 */}
        <aside className="border-t border-line bg-[var(--bg-elev)] p-4 lg:w-80 lg:border-l lg:border-t-0">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-ink-mute">할 일</span>
            <span className="text-ink-soft">{doneCount}/{todosToday.length}</span>
          </div>
          {todosToday.length > 0 && (
            <div className="mb-3 h-1 rounded bg-line/50">
              <div
                className="h-full rounded bg-[color:var(--accent)] transition-all"
                style={{ width: `${(doneCount / todosToday.length) * 100}%` }}
              />
            </div>
          )}
          <div className="mb-3 flex gap-2">
            <input
              value={todoText}
              onChange={(e) => setTodoText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
              placeholder="새 할 일 + Enter"
              className="flex-1 rounded-md border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
            />
            <button
              onClick={handleAddTodo}
              className="rounded-md bg-[color:var(--accent)] px-3 text-sm font-semibold text-white"
            >
              +
            </button>
          </div>
          <ul className="space-y-1">
            {todosToday.map((t) => (
              <li key={t.id} className="group flex items-center gap-2 rounded p-1 hover:bg-[var(--bg-tertiary)]">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTodo(date, t.id)}
                  className="h-4 w-4 cursor-pointer accent-[color:var(--accent)]"
                />
                <span className={`flex-1 text-sm ${t.done ? 'line-through opacity-40' : ''}`}>
                  {t.text}
                </span>
                {t.rolledFrom && (
                  <span className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] text-ink-mute">이월</span>
                )}
                <button
                  onClick={() => removeTodo(date, t.id)}
                  className="text-xs text-ink-mute opacity-0 group-hover:opacity-100 hover:text-[color:var(--danger)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          {todosToday.length === 0 && (
            <p className="text-center text-sm text-ink-mute">오늘 할 일이 없어요.</p>
          )}
        </aside>
      </div>

      {/* 일정 추가 FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-24 right-4 z-30 h-14 w-14 rounded-full bg-[color:var(--accent)] text-2xl text-white shadow-lg hover:scale-105"
      >
        +
      </button>

      {/* 일정 추가 모달 */}
      {showAdd && (
        <div
          onClick={() => setShowAdd(false)}
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 backdrop-blur-sm sm:items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-2xl bg-[var(--bg-elev)] p-6 shadow-2xl sm:rounded-2xl"
          >
            <h3 className="mb-4 text-lg font-bold">새 일정</h3>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
              placeholder="일정 제목"
              className="mb-3 w-full rounded-lg border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
            />
            <label className="mb-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
              종일
            </label>
            {!allDay && (
              <div className="mb-3 flex items-center gap-2">
                <select value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 rounded-md border border-line-strong bg-[var(--bg-secondary)] px-2 py-2 text-sm">
                  {timeOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
                <span>~</span>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 rounded-md border border-line-strong bg-[var(--bg-secondary)] px-2 py-2 text-sm">
                  {timeOptions.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div className="mb-4 flex gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ background: c }}
                  className={`h-7 w-7 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 rounded-pill bg-[var(--bg-tertiary)] px-4 py-3 text-sm font-medium">취소</button>
              <button onClick={handleAddEvent} className="flex-1 rounded-pill bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-white">추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

void fmtDate;
