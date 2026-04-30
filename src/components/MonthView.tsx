import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { highlights, HighlightKey } from "./tokens";
import { SharedEvent } from "./eventStore";

export function MonthView({
  accent,
  planKind = "my",
  events,
  onEventsChange,
}: {
  accent: string;
  planKind?: "my" | "shared";
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
}) {
  const [month, setMonth] = useState(planKind === "shared" ? 4 : 3);
  const year = 2026;
  const [selected, setSelected] = useState(planKind === "shared" ? 5 : 29);
  const today = 29;

  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const [sheet, setSheet] = useState<{ start: number; end: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<HighlightKey>("yellow");
  const [label, setLabel] = useState("");
  const [editingPlan, setEditingPlan] = useState<{ id: number; start: number; end: number; color: string; label: string } | null>(null);
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

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const first = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  const wd = ["일", "월", "화", "수", "목", "금", "토"];

  // Untimed plans for this month (from shared events)
  const plans = useMemo(() =>
    events
      .filter((e) => e.startSlot === undefined && e.year === year && e.month === month)
      .map((e) => ({ id: e.id, start: e.startDay, end: e.endDay, color: e.color, label: e.title })),
    [events, month],
  );

  // Timed events for this month → show as dots
  const timedEvents = useMemo(() =>
    events.filter((e) => e.startSlot !== undefined && e.year === year && e.month === month),
    [events, month],
  );

  // Timed events for selected day (for detail panel)
  const selectedDayEvents = useMemo(() =>
    timedEvents.filter((e) => e.startDay === selected),
    [timedEvents, selected],
  );

  const dragRange = drag
    ? { start: Math.min(drag.a, drag.b), end: Math.max(drag.a, drag.b) }
    : null;

  const tintOf = (d: number) => {
    if (dragRange && d >= dragRange.start && d <= dragRange.end) return `${accent}33`;
    return undefined;
  };

  const dotsFor = (d: number) => timedEvents.filter((e) => e.startDay === d).length;

  const dayFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest("[data-day]") as HTMLElement | null;
    if (!cell) return null;
    const v = cell.getAttribute("data-day");
    return v ? Number(v) : null;
  };

  const onGridDown = (e: React.PointerEvent) => {
    const d = dayFromPoint(e.clientX, e.clientY);
    if (!d) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ a: d, b: d });
  };
  const onGridMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const d = dayFromPoint(e.clientX, e.clientY);
    if (d && d !== drag.b) setDrag({ ...drag, b: d });
  };
  const onUp = () => {
    if (!drag) return;
    const start = Math.min(drag.a, drag.b);
    const end = Math.max(drag.a, drag.b);
    const reverse = drag.a > drag.b;
    setDrag(null);
    const overlapping = plans.filter((p) => !(p.end < start || p.start > end));
    if (reverse && overlapping.length > 0) {
      const ids = overlapping.map((p) => p.id);
      onEventsChange(events.filter((e) => !ids.includes(e.id)));
      return;
    }
    if (start === end) {
      const hit = plans.find((p) => start >= p.start && start <= p.end);
      if (hit) {
        setEditingPlan({ ...hit });
        return;
      }
      setSelected(start);
    } else {
      setSheet({ start, end });
    }
  };

  const savePlan = () => {
    if (!sheet) return;
    const c = highlights.find((h) => h.key === pickedColor)!.color;
    const newEvent: SharedEvent = {
      id: Date.now(),
      year,
      month,
      startDay: sheet.start,
      endDay: sheet.end,
      title: label.trim() || "플랜",
      color: c,
    };
    onEventsChange([...events, newEvent]);
    setSheet(null);
    setLabel("");
  };

  const saveEditPlan = () => {
    if (!editingPlan) return;
    onEventsChange(
      events.map((e) =>
        e.id === editingPlan.id
          ? { ...e, startDay: editingPlan.start, endDay: editingPlan.end, color: editingPlan.color, title: editingPlan.label }
          : e,
      ),
    );
    setEditingPlan(null);
  };

  const deleteEditPlan = () => {
    if (!editingPlan) return;
    onEventsChange(events.filter((e) => e.id !== editingPlan.id));
    setEditingPlan(null);
  };

  function fmtSlot(s: number) {
    const h = Math.floor(s / 2);
    const m = s % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  }

  return (
    <div className={isDesktop ? "px-3 pt-2 pb-8" : "px-4 pt-4 pb-32"}>
      <div className="flex items-center justify-between px-1">
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>
          {year}년 {month + 1}월
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setMonth((m) => (m + 11) % 12)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setMonth((m) => (m + 1) % 12)}
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 ${isDesktop ? "mt-3 mb-1" : "mt-4 mb-2"}`}>
        {wd.map((d, i) => (
          <div
            key={d}
            className="text-center"
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.3px",
              color: i === 0 ? "#FF3B30" : i === 6 ? "#0066cc" : "var(--text-muted)",
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 overflow-hidden ${isDesktop ? "rounded-3xl" : "rounded-2xl"}`}
        style={{
          border: "0.5px solid var(--hairline)",
          background: "var(--bg-elevated)",
          touchAction: "none",
          userSelect: "none",
          gridAutoRows: isDesktop ? "minmax(92px, 1fr)" : undefined,
        }}
        onPointerDown={onGridDown}
        onPointerMove={onGridMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {cells.map((d, i) => {
          const dow = i % 7;
          const isToday = d === today;
          const isSelected = d === selected;
          const tint = d ? tintOf(d) : undefined;
          const row = Math.floor(i / 7);
          const dots = d ? dotsFor(d) : 0;
          const planStarts: typeof plans = [];
          const dayPlans = d ? plans.filter((p) => d >= p.start && d <= p.end) : [];
          const timedDayItems = d ? timedEvents.filter((e) => e.startDay === d) : [];
          const inlineItemCount = timedDayItems.length;
          return (
            <div
              key={i}
              data-day={d ?? undefined}
              className={`relative flex flex-col justify-start ${isDesktop ? "px-2 py-2" : "aspect-[1/1.15] items-center py-1"}`}
              style={{
                background: tint,
                borderLeft: dow === 0 ? "none" : "0.5px solid var(--hairline)",
                borderTop: row === 0 ? "none" : "0.5px solid var(--hairline)",
                minHeight: isDesktop ? 92 : undefined,
              }}
            >
              {d && (
                <>
                  <div
                    className={`${isDesktop ? "w-6 h-6" : "w-7 h-7"} flex items-center justify-center rounded-full`}
                    style={{
                      background: isToday ? accent : "transparent",
                      border: isSelected && !isToday ? `1.5px solid ${accent}` : "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isDesktop ? 14 : 15,
                        fontWeight: 500,
                        color: isToday
                          ? "#fff"
                          : dow === 0
                          ? "#FF3B30"
                          : dow === 6
                          ? "#0066cc"
                          : "var(--text-primary)",
                      }}
                    >
                      {d}
                    </span>
                  </div>
                  {isDesktop ? (
                    <div className="mt-1.5 flex min-h-0 flex-1 flex-col">
                      <div className="space-y-1">
                      {planStarts.slice(0, 3).map((plan) => (
                        <div
                          key={`plan-${plan.id}`}
                          className="truncate rounded-md px-2 py-[3px]"
                          style={{
                            background: plan.color,
                            fontSize: 11,
                            fontWeight: 600,
                            lineHeight: 1.2,
                            color: "rgba(29,29,31,0.82)",
                          }}
                        >
                          {plan.label || "새 플랜"}
                        </div>
                      ))}
                      {timedDayItems.slice(0, 3).map((event) => (
                        <div
                          key={`event-${event.id}`}
                          className="truncate rounded-md px-2 py-[3px]"
                          style={{
                            background: `${event.color || accent}22`,
                            borderLeft: `2px solid ${event.color || accent}`,
                            fontSize: 11,
                            lineHeight: 1.2,
                            color: "var(--text-primary)",
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {inlineItemCount > 3 && (
                        <div style={{ fontSize: 10, color: "var(--text-muted)", paddingLeft: 2 }}>
                          +{inlineItemCount - 3}
                        </div>
                      )}
                      </div>
                      {dayPlans.length > 0 && (
                        <div className="mt-auto space-y-1 pt-2">
                          {dayPlans.slice(0, 2).map((plan) => {
                            const weekStart = Math.max(1, d - dow);
                            const weekEnd = Math.min(daysInMonth, d + (6 - dow));
                            const visibleStart = Math.max(plan.start, weekStart);
                            const visibleEnd = Math.min(plan.end, weekEnd);
                            const middleDay = Math.floor((visibleStart + visibleEnd) / 2);
                            const showLabel = d === middleDay;
                            const isStart = plan.start === d;
                            const isEnd = plan.end === d;
                            return (
                              <div
                                key={`range-${plan.id}`}
                                className="flex h-3 items-center justify-center overflow-hidden whitespace-nowrap text-center"
                                style={{
                                  background: plan.color,
                                  borderRadius: `${isStart ? 8 : 0}px ${isEnd ? 8 : 0}px ${isEnd ? 8 : 0}px ${isStart ? 8 : 0}px`,
                                  marginLeft: isStart ? 0 : -8,
                                  marginRight: isEnd ? 0 : -8,
                                  fontSize: 10,
                                  lineHeight: "12px",
                                  fontWeight: 600,
                                  color: "rgba(29,29,31,0.82)",
                                }}
                              >
                                {showLabel ? plan.label || "새 플랜" : ""}
                              </div>
                            );
                          })}
                          {dayPlans.length > 2 && (
                            <div style={{ fontSize: 10, color: "var(--text-muted)", paddingLeft: 2 }}>
                              +{dayPlans.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    dots > 0 && (
                      <div className="flex gap-[2px] mt-1">
                        {Array.from({ length: Math.min(dots, 3) }).map((_, j) => (
                          <div key={j} className="w-1 h-1 rounded-full" style={{ background: accent }} />
                        ))}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Plan tags */}
      {!isDesktop && <div className="mt-3 flex flex-wrap gap-1.5">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setEditingPlan({ ...p })}
            className="px-2 py-1 rounded-md active:scale-95"
            style={{ background: p.color, fontSize: 11, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}
          >
            {p.start}–{p.end} {p.label || "플랜"}
          </button>
        ))}
        <span style={{ fontSize: 11, color: "var(--text-muted)" }} className="self-center">
          드래그=추가 · 역드래그=삭제 · 탭=편집
        </span>
      </div>}

      {/* Selected day detail panel */}
      {!isDesktop && <div
        className="mt-6 rounded-t-3xl pt-3 pb-2"
        style={{ background: "var(--bg-secondary)", margin: "0 -16px" }}
      >
        <div className="w-9 h-1 rounded-full mx-auto" style={{ background: "var(--separator)" }} />
        <div className="px-5 pt-3" style={{ fontSize: 17, fontWeight: 600 }}>
          {month + 1}월 {selected}일 일정
        </div>
        <div className="px-5 mt-2 space-y-2">
          {selectedDayEvents.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }} className="py-3">
              등록된 시간 일정이 없습니다
            </div>
          ) : (
            selectedDayEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2">
                <div className="w-1 h-8 rounded-full" style={{ background: e.color }} />
                <div>
                  <div style={{ fontSize: 15, letterSpacing: "-0.3px" }}>{e.title}</div>
                  {e.startSlot !== undefined && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {fmtSlot(e.startSlot)} – {fmtSlot(e.endSlot!)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>}

      {/* Add plan sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>플랜 추가</div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작일</div>
                <select
                  value={sheet.start}
                  onChange={(e) => {
                    const ns = Number(e.target.value);
                    setSheet({ ...sheet, start: ns, end: Math.max(sheet.end, ns) });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{month + 1}월 {d}일</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료일</div>
                <select
                  value={sheet.end}
                  onChange={(e) => setSheet({ ...sheet, end: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    .filter((d) => d >= sheet.start)
                    .map((d) => (
                      <option key={d} value={d}>{month + 1}월 {d}일</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setPickedColor(h.key as HighlightKey)}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: h.color,
                    border: pickedColor === h.key ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="라벨 (선택)"
              className="w-full mt-4 px-3 py-3 rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <button
              onClick={savePlan}
              className="w-full mt-4 py-3 rounded-2xl active:scale-95"
              style={{ background: accent, color: "#fff", fontSize: 17, fontWeight: 600 }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Edit plan sheet */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingPlan(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>플랜 편집</div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작일</div>
                <select
                  value={editingPlan.start}
                  onChange={(e) => {
                    const ns = Number(e.target.value);
                    setEditingPlan({ ...editingPlan, start: ns, end: Math.max(editingPlan.end, ns) });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{month + 1}월 {d}일</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료일</div>
                <select
                  value={editingPlan.end}
                  onChange={(e) => setEditingPlan({ ...editingPlan, end: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1)
                    .filter((d) => d >= editingPlan.start)
                    .map((d) => (
                      <option key={d} value={d}>{month + 1}월 {d}일</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setEditingPlan({ ...editingPlan, color: h.color })}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: h.color,
                    border: editingPlan.color === h.color ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={editingPlan.label}
              onChange={(e) => setEditingPlan({ ...editingPlan, label: e.target.value })}
              placeholder="라벨 (선택)"
              className="w-full mt-4 px-3 py-3 rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={deleteEditPlan}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "#FF3B30", fontSize: 15, fontWeight: 500, background: "var(--bg-tertiary)" }}
              >
                삭제
              </button>
              <button
                onClick={() => setEditingPlan(null)}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "var(--text-secondary)", fontSize: 15, background: "var(--bg-tertiary)" }}
              >
                취소
              </button>
              <button
                onClick={saveEditPlan}
                className="flex-1 py-3 rounded-2xl active:scale-95"
                style={{ background: accent, color: "#fff", fontSize: 15, fontWeight: 600 }}
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
