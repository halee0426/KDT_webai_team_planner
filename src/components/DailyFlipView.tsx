import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { highlights } from "./tokens";
import { SharedEvent } from "./eventStore";
import { useHolidays } from "@/hooks/useHolidays";
import { TYPE } from "@/styles/typography";

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
  year,
  month,
  day,
  onDateChange,
  onBack,
  onAdd,
  onOpenEdit,
}: {
  accent: string;
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
  /** 외부에서 전달되는 표시 날짜 — 있으면 그 값 사용 (controlled) */
  year?: number;
  month?: number;
  day?: number;
  /** 날짜 변경 시 부모에 알림 (계층 동기화) */
  onDateChange?: (year: number, month: number, day: number) => void;
  /** 좌상단 ← 뒤로가기 — 달력으로 */
  onBack?: () => void;
  /** 우상단 + 버튼 */
  onAdd?: () => void;
  /** 일정 카드 탭 시 — 외부 통합 편집 모달 */
  onOpenEdit?: (e: SharedEvent) => void;
}) {
  // 외부에서 props 가 오면 controlled, 아니면 내부 today 로 fallback
  const initialDate =
    year !== undefined && month !== undefined && day !== undefined
      ? new Date(year, month, day)
      : new Date();
  const [date, setDateInner] = useState(initialDate);
  // props 변경 동기화 — controlled 모드일 때
  useEffect(() => {
    if (year !== undefined && month !== undefined && day !== undefined) {
      const next = new Date(year, month, day);
      if (next.getTime() !== date.getTime()) {
        setDateInner(next);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day]);
  const setDate = (d: Date | ((p: Date) => Date)) => {
    const next = typeof d === "function" ? (d as (p: Date) => Date)(date) : d;
    setDateInner(next);
    onDateChange?.(next.getFullYear(), next.getMonth(), next.getDate());
  };
  const [todos, setTodos] = useState<Todo[]>([]);
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
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1100 : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1100);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isToday = useMemo(() => {
    const t = new Date();
    return t.toDateString() === date.toDateString();
  }, [date]);

  const days = ["일", "월", "화", "수", "목", "금", "토"];

  // 공휴일 — 현재 표시 중인 연/월
  const holidays = useHolidays(date.getFullYear(), date.getMonth());
  const todayHolidayName = holidays.get(date.getDate());

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
    const scroller = scrollRef.current;
    if (!scroller) return;

    const now = new Date();
    const targetPx = isToday
      ? (now.getHours() * 60 + now.getMinutes()) * (SLOT / 30)
      : 9 * HOUR;
    const centeredTop = targetPx - scroller.clientHeight * 0.35;
    scroller.scrollTop = Math.max(0, Math.min(centeredTop, scroller.scrollHeight - scroller.clientHeight));
  }, [date, isToday]);

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
      const moved = evDrag.moved || Math.abs(e.clientY - evDrag.startY) > 8;

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
      console.log("[daily] pointerUp on event", { id, wasMoved, hasOnOpenEdit: !!onOpenEdit });
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
        // 클릭으로 인식 → 편집 모달 열기
        const full = events.find((x) => x.id === id);
        console.log("[daily] click → open edit", { id, found: !!full });
        if (full && onOpenEdit) {
          onOpenEdit(full);
        } else if (full) {
          // onOpenEdit 미제공 시 내부 editing fallback
          setEditing({
            id: full.id,
            startSlot: full.startSlot ?? 0,
            endSlot: full.endSlot ?? 1,
            title: full.title,
            color: full.color,
          });
        }
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
      {/* 일력 헤더 섹션 — 한 묶음 */}
      <div
        className={isDesktop ? "px-0" : "px-4"}
        style={{
          paddingTop: isDesktop ? 28 : 20,
          paddingBottom: 16,
          background: "var(--bg-glass)",
          backdropFilter: "blur(20px)",
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        {/* 1행 — 좌: 큰 N월 N일 + 작은 요일 / 우: 이전/오늘/다음/+ */}
        <div
          className="flex items-end justify-between gap-2"
          style={{ marginBottom: todayHolidayName ? 6 : 18 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              flex: "1 1 auto",
              minWidth: 0,
            }}
          >
            <span
              style={{
                ...TYPE.titlePage,
                fontSize: isDesktop ? 40 : TYPE.titlePage.fontSize,
                fontWeight: isDesktop ? 800 : TYPE.titlePage.fontWeight,
                letterSpacing: isDesktop ? "-0.4px" : TYPE.titlePage.letterSpacing,
                lineHeight: isDesktop ? 1.08 : TYPE.titlePage.lineHeight,
                color: todayHolidayName
                  ? "#FF3B30"
                  : isToday
                  ? accent
                  : "var(--text-primary)",
                whiteSpace: "nowrap",
              }}
            >
              {date.getMonth() + 1}월 {date.getDate()}일
            </span>
            <span
              style={{
                ...TYPE.captionMeta,
                fontSize: isDesktop ? 17 : TYPE.captionMeta.fontSize,
                fontWeight: isDesktop ? 600 : 600,
                color: todayHolidayName ? "#FF3B30" : accent,
                whiteSpace: "nowrap",
              }}
            >
              {days[date.getDay()]}요일
            </span>
          </div>

          <div className="flex items-center" style={{ gap: 6 }}>
            <div
              className="flex items-center"
              style={{
                background: "var(--bg-tertiary)",
                borderRadius: 999,
                padding: 3,
                gap: 2,
              }}
            >
              <button
                onClick={() => shift(-1)}
                className="active:scale-90"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
                aria-label="이전 날"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
              <button
                onClick={() => setDate(new Date())}
                disabled={isToday}
                className="active:scale-95"
                style={{
                  padding: "0 10px",
                  height: 28,
                  borderRadius: 999,
                  background: "transparent",
                  fontSize: 12,
                  fontWeight: 600,
                  color: accent,
                  opacity: isToday ? 0.4 : 1,
                  border: 0,
                  cursor: isToday ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                오늘
              </button>
              <button
                onClick={() => shift(1)}
                className="active:scale-90"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
                aria-label="다음 날"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>
            {onAdd && (
              <button
                onClick={onAdd}
                className="active:scale-90"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: accent,
                  color: "#fff",
                  border: 0,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  boxShadow: `0 4px 12px ${accent}55`,
                }}
                aria-label="일정 추가"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* 공휴일 라벨 — 별도 줄 (긴 이름도 안 넘침) */}
        {todayHolidayName && (
          <div
            style={{
              marginBottom: 12,
              fontSize: 12,
              fontWeight: 700,
              color: "#FF3B30",
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={todayHolidayName}
          >
            {todayHolidayName}
          </div>
        )}

        {/* 2행 — 주간 요일 + 날짜 (선택된 날짜는 액센트 캡슐) */}
        <WeekDayStrip
          date={date}
          accent={accent}
          holidays={holidays}
          onPickDay={(d) => setDate(d)}
        />
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
        style={{
          height: isDesktop ? "clamp(560px, calc(100vh - 330px), 760px)" : 460,
          background: "var(--bg-elevated)",
        }}
      >
        <div
          ref={gridRef}
          className="relative"
          style={{ height: TOTAL_SLOTS * SLOT, userSelect: "none", touchAction: "none" }}
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
                onPointerUp={(ev) => {
                  // 카드 위에서 직접 떼는 케이스 — 부모 grid onPointerUp 외에 추가 보장
                  if (evDrag?.moved) return;
                  ev.stopPropagation();
                  const full = events.find((x) => x.id === e.id);
                  console.log("[daily] card pointerUp", { id: e.id, found: !!full, hasOnOpenEdit: !!onOpenEdit });
                  if (full && onOpenEdit) {
                    // 다음 tick 에 호출 (현재 onPointerUp 의 setEvDrag(null) 직후)
                    setTimeout(() => onOpenEdit(full), 0);
                  }
                }}
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

        </div>
      </div>

      {/* Quick-add sheet */}
      {sheet && (
        <SheetShell onClose={() => setSheet(null)} centered={isDesktop}>
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
        <SheetShell onClose={() => setEditing(null)} centered={isDesktop}>
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

function SheetShell({
  children,
  onClose,
  centered = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  centered?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-50">
      <div
        className="absolute inset-0 backdrop-fade"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className={`${centered ? "absolute left-1/2 top-1/2 rounded-3xl" : "absolute left-0 right-0 bottom-0 rounded-t-3xl sheet-slide-up"} px-5 pt-3 pb-6`}
        style={{
          width: centered ? "min(420px, calc(100% - 32px))" : undefined,
          background: "var(--bg-elevated)",
          borderTop: centered ? undefined : "0.5px solid var(--hairline)",
          border: centered ? "0.5px solid var(--hairline)" : undefined,
          boxShadow: centered ? "0 24px 70px rgba(0,0,0,0.24)" : undefined,
          maxHeight: centered ? "min(720px, calc(100% - 32px))" : "70%",
          overflowY: "auto",
          transform: centered ? "translate(-50%, -50%)" : undefined,
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

/** 주간 요일 + 날짜 스트립 — 애플 캘린더 day view 상단 행 */
function WeekDayStrip({
  date,
  accent,
  holidays,
  onPickDay,
}: {
  date: Date;
  accent: string;
  holidays: Map<number, string>;
  onPickDay: (d: Date) => void;
}) {
  // date 가 속한 주의 일요일 ~ 토요일
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];
  return (
    <div className="grid grid-cols-7" style={{ gap: 0 }}>
      {week.map((d, i) => {
        const isSelected =
          d.getFullYear() === date.getFullYear() &&
          d.getMonth() === date.getMonth() &&
          d.getDate() === date.getDate();
        const holidayName =
          d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
            ? holidays.get(d.getDate())
            : undefined;
        return (
          <button
            key={i}
            onClick={() => onPickDay(d)}
            className="active:scale-95"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              padding: "4px 0 6px",
              background: isSelected ? `${accent}1A` : "transparent",
              borderRadius: 999,
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 180ms",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: holidayName ? "#FF3B30" : "var(--text-muted)",
                letterSpacing: "0.2px",
              }}
            >
              {dayLabels[i]}
            </span>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: isSelected ? accent : "transparent",
                color: isSelected ? "#fff" : holidayName ? "#FF3B30" : "var(--text-primary)",
                fontSize: 14,
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              {d.getDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
