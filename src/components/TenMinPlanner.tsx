import { useState, useRef } from "react";
import { Brush, Eraser, Plus } from "lucide-react";
import { highlights } from "./tokens";

type Task = { id: number; name: string; color: string };

export function TenMinPlanner({ accent }: { accent: string }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "딥워크", color: highlights[2].color },
    { id: 2, name: "회의", color: highlights[4].color },
    { id: 3, name: "운동", color: highlights[3].color },
  ]);
  const [activeId, setActiveId] = useState<number | null>(1);
  const [mode, setMode] = useState<"brush" | "eraser">("brush");
  const [cells, setCells] = useState<Record<string, number>>({}); // key h-s -> taskId
  const dragging = useRef(false);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  const paint = (h: number, s: number) => {
    const key = `${h}-${s}`;
    setCells((prev) => {
      const next = { ...prev };
      if (mode === "eraser") delete next[key];
      else if (activeId) next[key] = activeId;
      return next;
    });
  };

  const minutesFor = (id: number) =>
    Object.values(cells).filter((v) => v === id).length * 10;

  const total = Object.keys(cells).length * 10;

  const addTask = () => {
    const c = highlights[tasks.length % highlights.length].color;
    const id = Date.now();
    setTasks((t) => [...t, { id, name: "새 작업", color: c }]);
    setActiveId(id);
  };

  return (
    <div
      className="px-3 pt-4 pb-32"
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchEnd={() => (dragging.current = false)}
    >
      <div className="flex items-center gap-2 px-2">
        <span className="px-3 py-1 rounded-full" style={{ background: "var(--bg-tertiary)", fontSize: 13 }}>
          4월 29일
        </span>
        <button className="px-3 py-1 rounded-full" style={{ background: "var(--bg-tertiary)", fontSize: 13 }}>
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
                      onMouseDown={() => {
                        dragging.current = true;
                        paint(h, s);
                      }}
                      onMouseEnter={() => dragging.current && paint(h, s)}
                      onTouchStart={() => {
                        dragging.current = true;
                        paint(h, s);
                      }}
                      className="flex-1"
                      style={{
                        height: 22,
                        background: color || "var(--bg-elevated)",
                        // 30분 경계 (3번째 칸 시작) 는 구분선 굵게
                        borderLeft: s === 3
                          ? "1px solid var(--separator)"
                          : "0.5px solid var(--hairline)",
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
