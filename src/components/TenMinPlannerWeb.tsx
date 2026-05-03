import { useEffect, useRef, useState } from "react";
import { Brush, Eraser, Plus } from "lucide-react";
import { highlights } from "./tokens";
import { TYPE } from "@/styles/typography";

type Task = { id: number; name: string; color: string };

export function TenMinPlannerWeb({ accent }: { accent: string }) {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, name: "딥워크", color: highlights[2].color },
    { id: 2, name: "회의", color: highlights[4].color },
    { id: 3, name: "운동", color: highlights[3].color },
  ]);
  const [activeId, setActiveId] = useState<number | null>(1);
  const [mode, setMode] = useState<"brush" | "eraser">("brush");
  const [cells, setCells] = useState<Record<string, number>>({});
  const dragging = useRef(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1100 : false,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  const plannerCellHeight = isDesktop
    ? "clamp(28px, calc((100vh - 390px) / 18), 36px)"
    : "36px";

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
      className="px-3 pt-4 pb-32 lg:px-0 lg:pt-7 lg:pb-10"
      onMouseUp={() => (dragging.current = false)}
      onMouseLeave={() => (dragging.current = false)}
      onTouchEnd={() => (dragging.current = false)}
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col lg:min-h-[calc(100vh-145px)]">
        {isDesktop && (
          <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "0.5px solid var(--hairline)" }}>
            <div
              style={{
                ...TYPE.titlePage,
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: "-0.4px",
                lineHeight: 1.08,
                color: "var(--text-primary)",
              }}
            >
              10분 플래너
            </div>
            <div
              style={{
                ...TYPE.bodySmall,
                fontSize: 17,
                fontWeight: 600,
                letterSpacing: "-0.2px",
                color: "var(--text-secondary)",
                marginTop: 12,
              }}
            >
              10분 단위로 촘촘하게 하루를 설계하기
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-2 lg:px-0">
          <span
            className="rounded-full px-3 py-1 lg:px-4 lg:py-2"
            style={{ background: "var(--bg-tertiary)", fontSize: isDesktop ? 14 : 13 }}
          >
            4월 29일
          </span>
          <button
            className="rounded-full px-3 py-1 lg:px-4 lg:py-2"
            style={{ background: "var(--bg-tertiary)", fontSize: isDesktop ? 14 : 13 }}
          >
            오늘
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setMode("brush")}
            className="flex h-9 w-9 items-center justify-center rounded-full lg:h-11 lg:w-11"
            style={{
              background: mode === "brush" ? accent : "var(--bg-tertiary)",
              color: mode === "brush" ? "#fff" : "var(--text-primary)",
            }}
          >
            <Brush size={isDesktop ? 18 : 16} />
          </button>
          <button
            onClick={() => setMode("eraser")}
            className="flex h-9 w-9 items-center justify-center rounded-full lg:h-11 lg:w-11"
            style={{
              background: mode === "eraser" ? accent : "var(--bg-tertiary)",
              color: mode === "eraser" ? "#fff" : "var(--text-primary)",
            }}
          >
            <Eraser size={isDesktop ? 18 : 16} />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <div className="lg:w-[320px] lg:shrink-0 lg:overflow-y-auto lg:pr-1">
            <div style={{ fontSize: isDesktop ? 12 : 11, fontWeight: 500 }} className="text-[var(--text-muted)] uppercase tracking-wider px-1 mb-2">
              총 {Math.floor(total / 60)}시간 {total % 60}분
            </div>
            <div className="space-y-1.5">
              {tasks.map((t) => {
                const isActive = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className="w-full flex items-center gap-2 rounded-xl px-2 py-2 text-left active:scale-95 lg:px-3 lg:py-3"
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
                      style={{ fontSize: isDesktop ? 14 : 13, fontWeight: isActive ? 600 : 400 }}
                    />
                    <span style={{ fontSize: isDesktop ? 12 : 11, color: "var(--text-muted)" }}>
                      {minutesFor(t.id)}분
                    </span>
                  </button>
                );
              })}
              <button
                onClick={addTask}
                className="w-full flex items-center justify-center gap-1 rounded-xl py-2 lg:py-3"
                style={{ background: "var(--bg-tertiary)", fontSize: isDesktop ? 14 : 13, color: "var(--text-secondary)" }}
              >
                <Plus size={isDesktop ? 16 : 14} /> 작업 추가
              </button>
            </div>
          </div>

          <div className="flex-1">
            <div
              className="select-none"
              style={{
                border: "0.5px solid var(--hairline)",
                borderRadius: 16,
                overflow: "hidden",
                background: "var(--bg-elevated)",
                maxHeight: isDesktop ? "min(650px, calc(100vh - 330px))" : undefined,
              }}
            >
              {hours.map((h) => (
                <div key={h} className="flex" style={{ borderBottom: "0.5px solid var(--hairline)" }}>
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 54,
                      fontSize: 12,
                      color: "var(--text-muted)",
                      background: "var(--bg-secondary)",
                      flexShrink: 0,
                    }}
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
                          height: plannerCellHeight,
                          background: color || "var(--bg-elevated)",
                          borderLeft: "0.5px solid var(--hairline)",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            {Object.keys(cells).length === 0 && (
              <div style={{ fontSize: 12 }} className="text-[var(--text-muted)] text-center mt-3">
                작업을 추가하고 시간을 칠해보세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
