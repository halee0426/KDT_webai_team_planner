import { useState, useRef, useEffect } from "react";
import { Brush, ChevronLeft, ChevronRight, Eraser, Plus } from "lucide-react";
import { highlights } from "./tokens";
import { TenMinPlannerWeb } from "./TenMinPlannerWeb";

type Task = { id: number; name: string; color: string };
/** 드래그 페인트 모드 — 시작 셀 상태로 결정 (있으면 erase, 없으면 fill) */
type PaintMode = "fill" | "erase" | null;

export function TenMinPlanner({ accent }: { accent: string }) {
  const [isDesktopView, setIsDesktopView] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1100 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktopView(window.innerWidth >= 1100);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isDesktopView ? <TenMinPlannerWeb accent={accent} /> : <TenMinPlannerMobile accent={accent} />;
}

const DEFAULT_TASKS: Task[] = [
  { id: 1, name: "", color: highlights[0].color },
  { id: 2, name: "", color: highlights[1].color },
  { id: 3, name: "", color: highlights[2].color },
  { id: 4, name: "", color: highlights[3].color },
  { id: 5, name: "", color: highlights[4].color },
];

const DATA_VERSION = 2;

function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function plannerKey(date: Date) {
  return `ten-min-planner-v2-${date.toISOString().slice(0, 10)}`;
}

function loadForDate(date: Date): { tasks: Task[]; cells: Record<string, number> } | null {
  try {
    const raw = localStorage.getItem(plannerKey(date));
    if (raw) {
      const data = JSON.parse(raw);
      if (data.v === DATA_VERSION) return { tasks: data.tasks, cells: data.cells ?? {} };
    }
  } catch {}
  return null;
}

function TenMinPlannerMobile({ accent }: { accent: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight);
  const [tasks, setTasks] = useState<Task[]>(() => loadForDate(todayMidnight())?.tasks ?? DEFAULT_TASKS);
  const [activeId, setActiveId] = useState<number | null>(() => (loadForDate(todayMidnight())?.tasks ?? DEFAULT_TASKS)[0]?.id ?? null);
  const [mode, setMode] = useState<"brush" | "eraser">("brush");
  const [cells, setCells] = useState<Record<string, number>>(() => loadForDate(todayMidnight())?.cells ?? {}); // key h-s -> taskId
  const dragging = useRef(false);
  const paintModeRef = useRef<PaintMode>(null);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // 날짜 변경 시 해당 날짜 데이터 로드
  useEffect(() => {
    const saved = loadForDate(selectedDate);
    setTasks(saved?.tasks ?? DEFAULT_TASKS);
    setCells(saved?.cells ?? {});
  }, [selectedDate.toDateString()]);

  // tasks/cells 변경 시 선택된 날짜 키로 저장
  useEffect(() => {
    try { localStorage.setItem(plannerKey(selectedDate), JSON.stringify({ v: DATA_VERSION, tasks, cells })); } catch {}
  }, [tasks, cells]);

  const prevDay = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setSelectedDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToday = () => setSelectedDate(todayMidnight());
  const isToday = selectedDate.toDateString() === todayMidnight().toDateString();
  const dateLabel = `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일`;

  // window pointerup — 드래그 종료 시 모드 초기화 (셀 밖에서 떼도 정상 종료)
  useEffect(() => {
    const onUp = () => {
      dragging.current = false;
      paintModeRef.current = null;
    };
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  /** 단일 셀 적용 — 명시적 모드 인자 받음 (드래그 enter 시 시작 모드 유지) */
  const applyCell = (h: number, s: number, paintMode: PaintMode) => {
    const key = `${h}-${s}`;
    setCells((prev) => {
      const next = { ...prev };
      if (paintMode === "erase") {
        if (!(key in next)) return prev;
        delete next[key];
      } else if (paintMode === "fill" && activeId) {
        if (next[key] === activeId) return prev;
        next[key] = activeId;
      } else {
        return prev;
      }
      return next;
    });
  };

  /** 시작 셀 — toolbar 의 brush/eraser 보다 시작 셀 상태가 우선
   *  (있는 셀 → erase, 빈 셀 → fill). 단, eraser 모드면 강제 erase. */
  const startPaint = (h: number, s: number) => {
    const key = `${h}-${s}`;
    const occupied = key in cells;
    const startMode: PaintMode =
      mode === "eraser" ? "erase" : occupied ? "erase" : "fill";
    paintModeRef.current = startMode;
    dragging.current = true;
    applyCell(h, s, startMode);
  };

  const enterPaint = (h: number, s: number) => {
    if (!dragging.current) return;
    applyCell(h, s, paintModeRef.current);
  };

  const minutesFor = (id: number) =>
    Object.values(cells).filter((v) => v === id).length * 10;

  const total = Object.keys(cells).length * 10;

  const addTask = () => {
    const lastColor = tasks[tasks.length - 1]?.color;
    const lastUsed = (color: string) => {
      for (let i = tasks.length - 1; i >= 0; i--) {
        if (tasks[i].color === color) return i;
      }
      return -1;
    };
    const picked =
      [...highlights]
        .sort((a, b) => lastUsed(a.color) - lastUsed(b.color))
        .find((h) => h.color !== lastColor) ?? highlights[0];
    const id = Date.now();
    setTasks((t) => [...t, { id, name: "새 작업", color: picked.color }]);
    setActiveId(id);
  };

  return (
    <div className="px-3 pt-4 pb-32">
      <div className="flex items-center gap-2 px-2">
        {/* 날짜 이동 */}
        <button
          onClick={prevDay}
          className="flex items-center justify-center rounded-full active:scale-90"
          style={{ width: 32, height: 32, background: "var(--bg-tertiary)", border: 0, cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-3 py-1 rounded-full" style={{ background: "var(--bg-tertiary)", fontSize: 13, fontWeight: 600, minWidth: 76, textAlign: "center" }}>
          {dateLabel}
        </span>
        <button
          onClick={nextDay}
          className="flex items-center justify-center rounded-full active:scale-90"
          style={{ width: 32, height: 32, background: "var(--bg-tertiary)", border: 0, cursor: "pointer", color: "var(--text-secondary)", flexShrink: 0 }}
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={goToday}
          className="px-3 py-1 rounded-full active:scale-95"
          style={{ background: isToday ? "var(--bg-tertiary)" : `${accent}1A`, color: isToday ? "var(--text-muted)" : accent, fontSize: 13, fontWeight: isToday ? 400 : 600, border: 0, cursor: "pointer" }}
        >
          오늘
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setMode("brush")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: mode === "brush" ? accent : "var(--bg-tertiary)", color: mode === "brush" ? "#fff" : "var(--text-primary)" }}
        >
          <Brush size={16} />
        </button>
        <button
          onClick={() => setMode("eraser")}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: mode === "eraser" ? accent : "var(--bg-tertiary)", color: mode === "eraser" ? "#fff" : "var(--text-primary)" }}
        >
          <Eraser size={16} />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="w-[40%]">
          <div style={{ fontSize: 11, fontWeight: 500 }} className="text-[var(--text-muted)] uppercase tracking-wider px-1 mb-2">
            총 {Math.floor(total / 60)}시간 {total % 60}분
          </div>
          <div className="space-y-1">
            {tasks.map((t) => {
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left active:scale-95"
                  style={{
                    background: isActive ? "var(--bg-tertiary)" : "transparent",
                    border: isActive ? `1.5px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                >
                  <div className="w-4 h-4 rounded" style={{ background: t.color }} />
                  <input
                    value={t.name}
                    onChange={(e) =>
                      setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-transparent outline-none min-w-0"
                    style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}
                  />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {minutesFor(t.id)}분
                  </span>
                </button>
              );
            })}
            <button
              onClick={addTask}
              className="w-full flex items-center justify-center gap-1 py-2 rounded-xl"
              style={{ background: "var(--bg-tertiary)", fontSize: 13, color: "var(--text-secondary)" }}
            >
              <Plus size={14} /> 작업 추가
            </button>
          </div>
        </div>

        <div className="flex-1">
          {/* 도움말 — 한 칸 = 10분 */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--text-muted)",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              padding: "0 1px 6px",
            }}
          >
            한 칸 = 10분 · 한 줄 = 1시간
          </div>
          <div
            className="select-none"
            style={{ border: "0.5px solid var(--hairline)", borderRadius: 8, overflow: "hidden" }}
          >
            {/* 헤더 행 — 분 단위 라벨 (00, 10, 20, 30, 40, 50) */}
            <div className="flex" style={{ borderBottom: "0.5px solid var(--separator)", background: "var(--bg-secondary)" }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 22,
                  height: 16,
                  fontSize: 8,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.2px",
                }}
              >
                시
              </div>
              {Array.from({ length: 6 }).map((_, s) => (
                <div
                  key={s}
                  className="flex-1 flex items-center justify-center"
                  style={{
                    height: 16,
                    fontSize: 8,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    letterSpacing: "0.2px",
                    borderLeft: "0.5px solid var(--hairline)",
                  }}
                >
                  {s === 0 ? "00" : String(s * 10)}
                </div>
              ))}
            </div>

            {hours.map((h) => (
              <div key={h} className="flex" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
                <div
                  className="flex items-center justify-center"
                  style={{ width: 22, fontSize: 9, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
                >
                  {String(h).padStart(2, "0")}
                </div>
                {Array.from({ length: 6 }).map((_, s) => {
                  const key = `${h}-${s}`;
                  const tid = cells[key];
                  const color = tid ? tasks.find((t) => t.id === tid)?.color : undefined;
                  return (
                    <div
                      key={s}
                      onPointerDown={(e) => {
                        // 단일 손가락 / 마우스 좌클릭만 — 멀티터치는 무시
                        if (e.pointerType === "touch" && !e.isPrimary) return;
                        e.preventDefault();
                        startPaint(h, s);
                      }}
                      onPointerEnter={() => enterPaint(h, s)}
                      className="flex-1"
                      style={{
                        height: 22,
                        background: color || "var(--bg-elevated)",
                        // 30분 경계 (3번째 칸 시작) 는 구분선 굵게
                        borderLeft: s === 3
                          ? "1px solid var(--separator)"
                          : "0.5px solid var(--hairline)",
                        touchAction: "none",
                        userSelect: "none",
                        // 색칠 변화 부드럽게 — 새로 칠해진 셀 100ms fade-in 효과
                        transition: "background 120ms ease-out",
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {Object.keys(cells).length === 0 && (
            <div style={{ fontSize: 11 }} className="text-[var(--text-muted)] text-center mt-3">
              작업을 추가하고 시간을 칠해보세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
