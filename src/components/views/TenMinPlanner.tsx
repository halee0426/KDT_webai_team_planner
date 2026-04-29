// 10분 플래너 — 18시간 × 6칸(10분) = 108칸 그리드 페인팅
// 차별화 포인트 2: 시간 사용 직관 분석

import { useEffect, useRef, useState } from 'react';
import { todayStr } from '@/lib/utils/date';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 ~ 23:00
const SLOTS_PER_HOUR = 6;

const TASK_COLORS = [
  '#0066cc', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#5AC8FA', '#AF52DE', '#FF2D55',
];

type Task = { id: string; name: string; color: string };

type DayData = {
  tasks: Task[];
  /** key = "h_s" (h: 시간 6~23, s: 슬롯 0~5), value = task id */
  grid: Record<string, string>;
};

const STORAGE_PREFIX = 'kdt-tenmin-';
const loadDay = (date: string): DayData => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    tasks: [{ id: 't1', name: '', color: TASK_COLORS[0] }],
    grid: {},
  };
};
const saveDay = (date: string, data: DayData) => {
  localStorage.setItem(STORAGE_PREFIX + date, JSON.stringify(data));
};

export default function TenMinPlanner() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState<DayData>(() => loadDay(todayStr()));
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [erasing, setErasing] = useState(false);
  const paintingRef = useRef(false);
  const erasingRef = useRef(false);

  useEffect(() => {
    setData(loadDay(date));
    setActiveTaskId(null);
  }, [date]);

  useEffect(() => {
    erasingRef.current = erasing;
  }, [erasing]);

  useEffect(() => {
    const stop = () => { paintingRef.current = false; };
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const update = (patch: Partial<DayData>) => {
    const next = { ...data, ...patch };
    setData(next);
    saveDay(date, next);
  };

  const paintCell = (h: number, s: number) => {
    const key = `${h}_${s}`;
    const grid = { ...data.grid };
    if (erasingRef.current) {
      delete grid[key];
    } else if (activeTaskId) {
      grid[key] = activeTaskId;
    }
    update({ grid });
  };

  const addTask = () => {
    const id = 't' + Date.now();
    const color = TASK_COLORS[data.tasks.length % TASK_COLORS.length];
    update({ tasks: [...data.tasks, { id, name: '', color }] });
  };
  const updateTask = (id: string, patch: Partial<Task>) => {
    update({ tasks: data.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
  };
  const removeTask = (id: string) => {
    const grid = { ...data.grid };
    Object.keys(grid).forEach((k) => { if (grid[k] === id) delete grid[k]; });
    update({ tasks: data.tasks.filter((t) => t.id !== id), grid });
  };

  const taskMinutes = (id: string) =>
    Object.values(data.grid).filter((v) => v === id).length * 10;
  const totalMinutes = Object.keys(data.grid).length * 10;

  return (
    <div className="flex h-full min-h-screen flex-col bg-[var(--bg-secondary)] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-[var(--bg-glass)] px-4 py-3 backdrop-blur-xl">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-line-strong bg-[var(--bg-tertiary)] px-2 py-1 text-sm"
        />
        <button
          onClick={() => setDate(todayStr())}
          className="rounded-pill bg-[var(--bg-tertiary)] px-3 py-1 text-xs font-medium"
        >
          오늘
        </button>
        <div className="flex-1 text-right text-xs text-ink-soft">
          총 {Math.floor(totalMinutes / 60)}시간 {totalMinutes % 60}분
        </div>
        <div className="flex rounded-pill bg-[var(--bg-tertiary)] p-1">
          <button
            onClick={() => setErasing(false)}
            className={`rounded-pill px-3 py-1 text-xs font-medium ${
              !erasing ? 'bg-[color:var(--accent)] text-white' : ''
            }`}
          >
            🖌
          </button>
          <button
            onClick={() => setErasing(true)}
            className={`rounded-pill px-3 py-1 text-xs font-medium ${
              erasing ? 'bg-[color:var(--accent)] text-white' : ''
            }`}
          >
            🧽
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* 작업 목록 */}
        <div className="border-b border-line bg-[var(--bg-elev)] p-4 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-mute">
            작업
          </div>
          <div className="space-y-2">
            {data.tasks.map((t) => {
              const min = taskMinutes(t.id);
              const isActive = activeTaskId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTaskId(t.id)}
                  className={`flex items-center gap-2 rounded-lg p-2 cursor-pointer transition ${
                    isActive ? 'ring-2 ring-[color:var(--accent)] bg-[var(--accent-soft)]' : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="h-6 w-6 rounded shrink-0" style={{ background: t.color }} />
                  <input
                    value={t.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateTask(t.id, { name: e.target.value })}
                    placeholder="작업명"
                    className="flex-1 bg-transparent text-sm outline-none"
                  />
                  <span className="text-xs text-ink-mute tabular-nums">{min}분</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTask(t.id); }}
                    className="text-xs text-ink-mute hover:text-[color:var(--danger)]"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={addTask}
            className="mt-2 w-full rounded-lg border border-dashed border-line-strong py-2 text-sm text-ink-soft hover:bg-[var(--bg-tertiary)]"
          >
            + 작업 추가
          </button>
        </div>

        {/* 그리드 */}
        <div className="flex-1 overflow-x-auto p-3">
          <div className="inline-block min-w-full select-none">
            <div className="grid grid-cols-[40px_repeat(6,1fr)] gap-px">
              {/* 헤더 */}
              <div className="text-[10px] text-ink-mute" />
              {Array.from({ length: SLOTS_PER_HOUR }, (_, i) => (
                <div key={i} className="text-center text-[9px] text-ink-mute">
                  {i * 10}'
                </div>
              ))}
              {/* 시간별 행 */}
              {HOURS.map((h) => (
                <div key={h} className="contents">
                  <div className="py-1 text-right text-[10px] font-medium text-ink-soft">
                    {String(h).padStart(2, '0')}
                  </div>
                  {Array.from({ length: SLOTS_PER_HOUR }, (_, s) => {
                    const taskId = data.grid[`${h}_${s}`];
                    const task = data.tasks.find((t) => t.id === taskId);
                    return (
                      <div
                        key={`${h}_${s}`}
                        onMouseDown={() => {
                          paintingRef.current = true;
                          paintCell(h, s);
                        }}
                        onMouseEnter={() => {
                          if (paintingRef.current) paintCell(h, s);
                        }}
                        className="h-7 cursor-pointer border border-line/40 transition hover:opacity-80"
                        style={{ background: task ? task.color : 'var(--bg-elev)' }}
                        title={task?.name}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
