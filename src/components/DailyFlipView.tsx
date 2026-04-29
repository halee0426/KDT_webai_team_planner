import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { highlights } from "./tokens";
import { SharedEvent } from "./eventStore";

type Ev = { id: number; startSlot: number; endSlot: number; title: string; color: string };
type Todo = { id: number; text: string; done: boolean; rolled?: boolean };

const SLOT = 28;
const HOUR = SLOT * 2;
const TOTAL_SLOTS = 48;

function fmtSlot(s: number) {
  const h = Math.floor(s / 2);
  const m = s % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}

export function DailyFlipView({
  accent,
  events,
  onEventsChange,
}: {
  accent: string;
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
}) {
  const [date, setDate] = useState(new Date());
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "디자인 리뷰 준비", done: false },
    { id: 2, text: "주간 회고 작성", done: true },
    { id: 3, text: "운동 30분", done: false, rolled: true },
  ]);
  const [todoExpanded, setTodoExpanded] = useState(false);
  const [todoDraft, setTodoDraft] = useState("");

  const [dragRange, setDragRange] = useState<{ a: number; b: number } | null>(null);
  const [evDrag, setEvDrag] = useState<{
    id: number;
    mode: "move" | "top" | "bottom";
    startY: number;
    origStart: number;
    origEnd: number;
    moved: boolean;
  } | null>(null);
  // Local visual override while dragging (does not mutate shared state until drop)
  const [dragOverride, setDragOverride] = useState<{ id: number; startSlot: number; endSlot: number } | null>(null);

  const [sheet, setSheet] = useState<{ start: number; end: number; title: string; color: string } | null>(null);
  const [editing, setEditing] = useState<Ev | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isToday = useMemo(() => {
    const t = new Date();
    return t.toDateString() === date.toDateString();
  }, [date]);

  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // Timed events for the currently viewed date
  const timedEventsForDay = useMemo((): Ev[] =>
    events
      .filter(
        (e) =>
          e.startSlot !== undefined &&
          e.year === date.getFullYear() &&
          e.month === date.getMonth() &&
          e.startDay === date.getDate(),
      )
      .map((e) => ({
        id: e.id,
        startSlot: e.startSlot!,
        endSlot: e.endSlot!,
        title: e.title,
        color: e.color,
      })),
    [events, date],
  );

  // Untimed (all-day/range) events that cover the current date
  const allDayEvents = useMemo(() =>
    events.filter(
      (e) =>
        e.startSlot === undefined &&
        e.year === date.getFullYear() &&
        e.month === date.getMonth() &&
        date.getDate() >= e.startDay &&
        date.getDate() <= e.endDay,
    ),
    [events, date],
  );

  // Apply drag override for visual position during drag
  const displayEvents = useMemo((): Ev[] => {
    if (!dragOverride) return timedEventsForDay;
    return timedEventsForDay.map((e) =>
      e.id === dragOverride.id
        ? { ...e, startSlot: dragOverride.startSlot, endSlot: dragOverride.endSlot }
        : e,
    );
  }, [timedEventsForDay, dragOverride]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 12 * HOUR;
  }, []);

  const shift = (d: number) => {
    const n = new Date(date);
    n.setDate(date.getDate() + d);
    setDate(n);
  };

  const slotFromY = (y: number) => {
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const local = y - rect.top + (scrollRef.current?.scrollTop ?? 0);
    return Math.max(0, Math.min(TOTAL_SLOTS - 1, Math.floor(local / SLOT)));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-event]") || target.closest("[data-handle]")) return;
    const s = slotFromY(e.clientY);
    setDragRange({ a: s, b: s });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (evDrag) {
      const deltaSlots = Math.round((e.clientY - evDrag.startY) / SLOT);
      const moved = evDrag.moved || Math.abs(e.clientY - evDrag.startY) > 4;

      let newStart: number, newEnd: number;
      if (evDrag.mode === "move") {
        const len = evDrag.origEnd - evDrag.origStart;
        newStart = Math.max(0, Math.min(TOTAL_SLOTS - len, evDrag.origStart + deltaSlots));
        newEnd = newStart + len;
      } else if (evDrag.mode === "top") {
        newStart = Math.max(0, Math.min(evDrag.origEnd - 1, evDrag.origStart + deltaSlots));
        newEnd = evDrag.origEnd;
      } else {
        newStart = evDrag.origStart;
        newEnd = Math.max(evDrag.origStart + 1, Math.min(TOTAL_SLOTS, evDrag.origEnd + deltaSlots));
      }
      setDragOverride({ id: evDrag.id, startSlot: newStart, endSlot: newEnd });
      setEvDrag({ ...evDrag, moved });
      return;
    }
    if (!dragRange) return;
    setDragRange({ ...dragRange, b: slotFromY(e.clientY) });
  };

  const onPointerUp = () => {
    if (evDrag) {
      const wasMoved = evDrag.moved;
      const id = evDrag.id;
      const override = dragOverride;
      setEvDrag(null);
      setDragOverride(null);
      if (wasMoved && override) {
        // Commit dragged position to shared state
        onEventsChange(
          events.map((e) =>
            e.id === id
              ? { ...e, startSlot: override.startSlot, endSlot: override.endSlot }
              : e,
          ),
        );
      } else if (!wasMoved) {
        const ev = timedEventsForDay.find((x) => x.id === id);
        if (ev) setEditing({ ...ev });
      }
      return;
    }
    if (!dragRange) return;
    const start = Math.min(dragRange.a, dragRange.b);
    const end = Math.max(dragRange.a, dragRange.b) + 1;
    setDragRange(null);
    if (end - start >= 1) {
      setSheet({ start, end, title: "", color: accent });
    }
  };

  const beginEvDrag = (e: React.PointerEvent, ev: Ev, mode: "move" | "top" | "bottom") => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setEvDrag({
      id: ev.id,
      mode,
      startY: e.clientY,
      origStart: ev.startSlot,
      origEnd: ev.endSlot,
      moved: false,
    });
  };

  const nowSlotPx = (() => {
    const n = new Date();
    return (n.getHours() * 60 + n.getMinutes()) * (SLOT / 30);
  })();

  const colors = [accent, "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#5AC8FA", "#AF52DE", "#FF2D55"];

  const addEvent = () => {
    if (!sheet) return;
    const newEvent: SharedEvent = {
      id: Date.now(),
      year: date.getFullYear(),
      month: date.getMonth(),
      startDay: date.getDate(),
      endDay: date.getDate(),
      startSlot: sheet.start,
      endSlot: sheet.end,
      title: sheet.title.trim() || "새 일정",
      color: sheet.color,
    };
    onEventsChange([...events, newEvent]);
    setSheet(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    onEventsChange(
      events.map((e) =>
        e.id === editing.id
          ? { ...e, startSlot: editing.startSlot, endSlot: editing.endSlot, title: editing.title, color: editing.color }
          : e,
      ),
    );
    setEditing(null);
  };

  const deleteEdit = () => {
    if (!editing) return;
    onEventsChange(events.filter((e) => e.id !== editing.id));
    setEditing(null);
  };

  const toggleTodo = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const addTodo = () => {
    if (!todoDraft.trim()) return;
    setTodos((ts) => [...ts, { id: Date.now(), text: todoDraft.trim(), done: false }]);
    setTodoDraft("");
  };
  const removeTodo = (id: number) => setTodos((ts) => ts.filter((t) => t.id !== id));

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div className="relative" style={{ height: "calc(100% - 0px)" }}>
      {/* Day nav bar */}
      <div
        className="px-5 flex items-center gap-2"
        style={{
          height: 56,
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        <button
          onClick={() => shift(-1)}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <ChevronLeft size={16} strokeWidth={1.8} />
        </button>
        <div className="flex-1 text-center">
          <div
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "-0.3px",
              color: isToday ? accent : "var(--text-primary)",
              lineHeight: 1.1,
            }}
          >
            {date.getFullYear()}년 {date.getMonth() + 1}월 {date.getDate()}일
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{days[date.getDay()]}요일</div>
        </div>
        <button
          onClick={() => shift(1)}
          className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <ChevronRight size={16} strokeWidth={1.8} />
        </button>
        <button
          onClick={() => setDate(new Date())}
          disabled={isToday}
          className="px-3 rounded-full active:scale-95"
          style={{
            height: 28,
            background: "var(--bg-tertiary)",
            fontSize: 13,
            fontWeight: 500,
            opacity: isToday ? 0.4 : 1,
            color: "var(--text-secondary)",
          }}
        >
          오늘
        </button>
      </div>

      {/* All-day strip – shows untimed plan events that cover this date */}
      <div
        className="flex items-center px-3 py-2"
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "0.5px solid var(--hairline)",
          minHeight: 36,
        }}
      >
        <div
          style={{
            width: 48,
            fontSize: 10,
            color: "var(--text-muted)",
            textAlign: "right",
            paddingRight: 8,
            letterSpacing: "0.4px",
            flexShrink: 0,
          }}
        >
          종일
        </div>
        <div className="flex-1 flex flex-wrap gap-1.5">
          {allDayEvents.length === 0 ? (
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>종일 일정 없음</span>
          ) : (
            allDayEvents.map((e) => (
              <span
                key={e.id}
                className="px-2 py-1 rounded-md"
                style={{
                  background: e.color,
                  color: "rgba(0,0,0,0.7)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {e.startDay !== e.endDay
                  ? `${e.month + 1}/${e.startDay}~${e.endDay} · ${e.title}`
                  : e.title}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Timeline grid */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ height: 460, background: "var(--bg-elevated)" }}
      >
        <div
          ref={gridRef}
          className="relative"
          style={{ height: TOTAL_SLOTS * SLOT, userSelect: "none", touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Hour rows */}
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h}>
              <div
                className="absolute left-0"
                style={{
                  top: h * HOUR,
                  width: 48,
                  height: HOUR,
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--text-muted)",
                  textAlign: "right",
                  paddingRight: 8,
                  paddingTop: 2,
                }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
              <div
                className="absolute right-0"
                style={{ left: 48, top: h * HOUR, borderTop: "0.5px solid var(--hairline)" }}
              />
              <div
                className="absolute right-0"
                style={{ left: 48, top: h * HOUR + SLOT, borderTop: "0.5px dashed var(--hairline)" }}
              />
            </div>
          ))}
          <div
            className="absolute top-0 bottom-0"
            style={{ left: 48, borderLeft: "0.5px solid var(--hairline)" }}
          />

          {/* Events (using displayEvents = shared + drag override) */}
          {displayEvents.map((e) => {
            const isDragging = evDrag?.id === e.id && evDrag.moved;
            return (
              <div
                key={e.id}
                data-event
                onPointerDown={(ev) => beginEvDrag(ev, e, "move")}
                className="absolute text-left"
                style={{
                  left: 52,
                  right: 8,
                  top: e.startSlot * SLOT + 1,
                  height: Math.max(SLOT, (e.endSlot - e.startSlot) * SLOT) - 2,
                  background: `${e.color}20`,
                  borderLeft: `3px solid ${e.color}`,
                  borderRadius: 8,
                  padding: "4px 8px",
                  boxShadow: isDragging ? "0 6px 20px rgba(0,0,0,0.15)" : "var(--card-shadow)",
                  cursor: isDragging ? "grabbing" : "grab",
                  zIndex: isDragging ? 10 : 1,
                  touchAction: "none",
                  opacity: isDragging ? 0.95 : 1,
                }}
              >
                <div
                  data-handle
                  onPointerDown={(ev) => beginEvDrag(ev, e, "top")}
                  style={{ position: "absolute", top: -4, left: 0, right: 0, height: 8, cursor: "ns-resize" }}
                />
                <div
                  data-handle
                  onPointerDown={(ev) => beginEvDrag(ev, e, "bottom")}
                  style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 8, cursor: "ns-resize" }}
                />
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: e.color,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.title}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {fmtSlot(e.startSlot)} – {fmtSlot(e.endSlot)}
                </div>
              </div>
            );
          })}

          {/* Drag selection */}
          {dragRange && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: 52,
                right: 8,
                top: Math.min(dragRange.a, dragRange.b) * SLOT,
                height: (Math.abs(dragRange.b - dragRange.a) + 1) * SLOT,
                background: `${accent}30`,
                border: `2px dashed ${accent}`,
                borderRadius: 8,
              }}
            />
          )}

          {/* Current time line */}
          {isToday && (
            <div
              className="absolute pointer-events-none"
              style={{ left: 44, right: 0, top: nowSlotPx, height: 1, background: "#FF3B30" }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: -3.5,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "#FF3B30",
                }}
              />
            </div>
          )}

          {displayEvents.length === 0 && (
            <div
              className="absolute left-0 right-0 text-center pointer-events-none"
              style={{ top: 12 * HOUR, fontSize: 13, color: "var(--text-muted)" }}
            >
              빈 시간을 눌러 드래그해 일정을 추가해보세요
            </div>
          )}
        </div>
      </div>

      {/* Todo bottom sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-3xl"
        style={{
          height: todoExpanded ? 360 : 96,
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          borderTop: "0.5px solid var(--hairline)",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
          transition: "height 220ms ease",
          overflow: "hidden",
        }}
      >
        <button
          onClick={() => setTodoExpanded((v) => !v)}
          className="w-full flex flex-col items-center pt-2"
        >
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--separator)" }} />
        </button>
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>할 일</div>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {doneCount}/{todos.length}
          </span>
        </div>
        <div className="px-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
            <div
              className="h-full transition-all"
              style={{
                width: `${todos.length === 0 ? 0 : (doneCount / todos.length) * 100}%`,
                background: accent,
              }}
            />
          </div>
        </div>

        {todoExpanded && (
          <div className="px-3 pt-3 pb-4 overflow-y-auto" style={{ maxHeight: 260 }}>
            <div className="flex items-center gap-2 px-2 mb-2">
              <input
                value={todoDraft}
                onChange={(e) => setTodoDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTodo()}
                placeholder="새 할 일... (Enter로 추가)"
                className="flex-1 px-3 py-2 rounded-full outline-none"
                style={{ background: "var(--bg-tertiary)", fontSize: 15, letterSpacing: "-0.224px" }}
              />
              <button
                onClick={addTodo}
                className="px-3 py-2 rounded-full active:scale-95"
                style={{ background: accent, color: "#fff", fontSize: 13, fontWeight: 600 }}
              >
                추가
              </button>
            </div>
            {todos.length === 0 && (
              <div className="text-center py-6" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                오늘 할 일이 없어요. 가볍게 시작해볼까요?
              </div>
            )}
            {todos.map((t) => (
              <div key={t.id} className="group flex items-center gap-3 px-3 py-2 rounded-xl">
                <button
                  onClick={() => toggleTodo(t.id)}
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 active:scale-90"
                  style={{
                    border: t.done ? "none" : "1.5px solid var(--separator)",
                    background: t.done ? accent : "transparent",
                  }}
                >
                  {t.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.5L5 9L9.5 3.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
                <div
                  className="flex-1 flex items-center gap-2 min-w-0"
                  style={{
                    fontSize: 15,
                    letterSpacing: "-0.224px",
                    opacity: t.done ? 0.4 : 1,
                    textDecoration: t.done ? "line-through" : "none",
                  }}
                >
                  <span className="truncate">{t.text}</span>
                  {t.rolled && (
                    <span
                      className="px-2 py-[2px] rounded-full shrink-0"
                      style={{
                        fontSize: 10,
                        fontWeight: 500,
                        background: "var(--bg-tertiary)",
                        color: "var(--text-muted)",
                      }}
                    >
                      어제 이월
                    </span>
                  )}
                </div>
                <button
                  onClick={() => removeTodo(t.id)}
                  className="p-1 rounded-full text-[var(--text-muted)] active:opacity-60"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick-add sheet */}
      {sheet && (
        <SheetShell onClose={() => setSheet(null)}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>새 일정</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }} className="mt-1">
            {date.getMonth() + 1}월 {date.getDate()}일
          </div>
          <input
            autoFocus
            value={sheet.title}
            onChange={(e) => setSheet({ ...sheet, title: e.target.value })}
            placeholder="일정 제목"
            className="mt-4 w-full px-4 py-3 rounded-full outline-none"
            style={{ background: "var(--bg-tertiary)", fontSize: 17, letterSpacing: "-0.374px" }}
          />
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작 시간</div>
              <select
                value={sheet.start}
                onChange={(e) => {
                  const ns = Number(e.target.value);
                  setSheet({ ...sheet, start: ns, end: Math.max(sheet.end, ns + 1) });
                }}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <option key={i} value={i}>{fmtSlot(i)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료 시간</div>
              <select
                value={sheet.end}
                onChange={(e) => setSheet({ ...sheet, end: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1)
                  .filter((v) => v > sheet.start)
                  .map((v) => (
                    <option key={v} value={v}>{fmtSlot(v)}</option>
                  ))}
              </select>
            </div>
          </div>
          <ColorRow value={sheet.color} onChange={(c) => setSheet({ ...sheet, color: c })} colors={colors} />
          <button
            onClick={addEvent}
            className="mt-5 w-full py-3 rounded-full active:scale-[0.98]"
            style={{ background: accent, color: "#fff", fontSize: 17, fontWeight: 600 }}
          >
            추가
          </button>
          <button
            onClick={() => setSheet(null)}
            className="mt-2 w-full py-3"
            style={{ fontSize: 15, color: "var(--text-secondary)" }}
          >
            취소
          </button>
        </SheetShell>
      )}

      {/* Edit sheet */}
      {editing && (
        <SheetShell onClose={() => setEditing(null)}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>일정 편집</div>
          <input
            value={editing.title}
            onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            className="mt-4 w-full px-4 py-3 rounded-full outline-none"
            style={{ background: "var(--bg-tertiary)", fontSize: 17, letterSpacing: "-0.374px" }}
          />
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작 시간</div>
              <select
                value={editing.startSlot}
                onChange={(e) => {
                  const ns = Number(e.target.value);
                  setEditing({ ...editing, startSlot: ns, endSlot: Math.max(editing.endSlot, ns + 1) });
                }}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
                  <option key={i} value={i}>{fmtSlot(i)}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료 시간</div>
              <select
                value={editing.endSlot}
                onChange={(e) => setEditing({ ...editing, endSlot: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl outline-none"
                style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
              >
                {Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1)
                  .filter((v) => v > editing.startSlot)
                  .map((v) => (
                    <option key={v} value={v}>{fmtSlot(v)}</option>
                  ))}
              </select>
            </div>
          </div>
          <ColorRow
            value={editing.color}
            onChange={(c) => setEditing({ ...editing, color: c })}
            colors={colors}
          />
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={deleteEdit}
              className="flex-1 py-3 rounded-full"
              style={{ color: "#FF3B30", fontSize: 15, fontWeight: 500 }}
            >
              삭제
            </button>
            <button
              onClick={() => setEditing(null)}
              className="flex-1 py-3 rounded-full"
              style={{ color: "var(--text-secondary)", fontSize: 15 }}
            >
              취소
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 py-3 rounded-full"
              style={{ background: accent, color: "#fff", fontSize: 15, fontWeight: 600 }}
            >
              저장
            </button>
          </div>
        </SheetShell>
      )}
    </div>
  );
}

function ColorRow({
  value,
  onChange,
  colors,
}: {
  value: string;
  onChange: (c: string) => void;
  colors: string[];
}) {
  return (
    <div className="mt-4 flex items-center gap-2 overflow-x-auto">
      {colors.map((c, i) => (
        <button
          key={`${c}-${i}`}
          onClick={() => onChange(c)}
          className="shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            background: c,
            boxShadow: value === c ? `0 0 0 2px #fff inset, 0 0 0 2px ${c}` : "none",
          }}
        />
      ))}
    </div>
  );
}

function SheetShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div
        className="absolute left-0 right-0 bottom-0 rounded-t-3xl px-5 pt-3 pb-6"
        style={{
          background: "var(--bg-elevated)",
          borderTop: "0.5px solid var(--hairline)",
          maxHeight: "70%",
          overflowY: "auto",
        }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--separator)" }} />
        </div>
        {children}
      </div>
    </div>
  );
}
