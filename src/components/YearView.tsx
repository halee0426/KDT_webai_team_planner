import { useEffect, useMemo, useState } from "react";
import { SharedEvent } from "./eventStore";
import { highlights, HighlightKey } from "./tokens";

type LocalHighlight = {
  id: number;
  month: number;
  start: number;
  end: number;
  color: string;
  label: string;
};

export function YearView({
  accent,
  events,
  onEventsChange,
}: {
  accent: string;
  events: SharedEvent[];
  onEventsChange: (next: SharedEvent[]) => void;
}) {
  const year = 2026;
  const [sheet, setSheet] = useState<{ month: number; start: number; end: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<HighlightKey>("yellow");
  const [label, setLabel] = useState("");
  const [drag, setDrag] = useState<{ month: number; a: number; b: number } | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<LocalHighlight | null>(null);
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

  const mobileDayCellWidth = 9;
  const barHeight = isDesktop ? 8 : 6;
  const monthLabelWidth = isDesktop ? 64 : 36;
  const monthNames = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

  const daysInMonth = (month: number) => new Date(year, month + 1, 0).getDate();
  const getDayFromPointer = (element: HTMLElement, clientX: number, totalDays: number) => {
    const rect = element.getBoundingClientRect();
    const scrollWidth = element.scrollWidth || rect.width;
    const offsetX = clientX - rect.left + element.scrollLeft;
    const clampedX = Math.max(0, Math.min(offsetX, scrollWidth - 1));
    return Math.max(1, Math.min(totalDays, Math.floor((clampedX / scrollWidth) * totalDays) + 1));
  };

  const highlightsInYear: LocalHighlight[] = useMemo(
    () =>
      events
        .filter((event) => event.startSlot === undefined && event.year === year)
        .map((event) => ({
          id: event.id,
          month: event.month,
          start: event.startDay,
          end: event.endDay,
          color: event.color,
          label: event.title,
        })),
    [events],
  );

  const saveHighlight = () => {
    if (!sheet) return;

    const color = highlights.find((item) => item.key === pickedColor)?.color ?? highlights[0].color;
    const nextEvent: SharedEvent = {
      id: Date.now(),
      year,
      month: sheet.month,
      startDay: sheet.start,
      endDay: sheet.end,
      title: label.trim() || "새 플랜",
      color,
    };

    onEventsChange([...events, nextEvent]);
    setSheet(null);
    setLabel("");
  };

  const saveEditedHighlight = () => {
    if (!editingHighlight) return;

    onEventsChange(
      events.map((event) =>
        event.id === editingHighlight.id
          ? {
              ...event,
              month: editingHighlight.month,
              startDay: editingHighlight.start,
              endDay: editingHighlight.end,
              color: editingHighlight.color,
              title: editingHighlight.label,
            }
          : event,
      ),
    );
    setEditingHighlight(null);
  };

  const deleteEditedHighlight = () => {
    if (!editingHighlight) return;
    onEventsChange(events.filter((event) => event.id !== editingHighlight.id));
    setEditingHighlight(null);
  };

  return (
    <div className="px-5 pt-5 pb-32 lg:px-4 lg:pt-7 xl:px-2">
      <div style={{ fontSize: isDesktop ? 36 : 28, fontWeight: 700, letterSpacing: "-0.5px" }}>{year}</div>
      <div style={{ fontSize: isDesktop ? 14 : 13, letterSpacing: "-0.224px" }} className="text-[var(--text-secondary)] mt-1">
        119일 / 365일, 33%
      </div>
      <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
        <div className="h-full rounded-full" style={{ width: "33%", background: accent }} />
      </div>

      <div className={`mt-5 ${isDesktop ? "space-y-4" : "space-y-3"}`}>
        {monthNames.map((monthName, monthIndex) => {
          const days = daysInMonth(monthIndex);
          const monthHighlights = highlightsInYear.filter((item) => item.month === monthIndex);
          const desktopDayWidthPercent = 100 / days;
          const lanes = monthHighlights.reduce<LocalHighlight[][]>((acc, item) => {
            const laneIndex = acc.findIndex((lane) => lane.every((placed) => item.end < placed.start || item.start > placed.end));
            if (laneIndex === -1) acc.push([item]);
            else acc[laneIndex].push(item);
            return acc;
          }, []);
          const desktopLaneHeight = lanes.length > 0 ? lanes.length * 18 : 0;

          return (
            <div
              key={monthIndex}
              className={`flex items-start ${isDesktop ? "gap-3 rounded-[28px] px-4 py-2" : "gap-2"}`}
              style={isDesktop ? { background: "var(--bg-elevated)", border: "0.5px solid var(--hairline)" } : undefined}
            >
              <div
                className="sticky shrink-0"
                style={{
                  width: monthLabelWidth,
                  fontSize: isDesktop ? 14 : 13,
                  fontWeight: 600,
                  letterSpacing: "-0.224px",
                }}
              >
                {monthName}
              </div>

              <div className={`min-w-0 flex-1 ${isDesktop ? "overflow-x-hidden" : "overflow-x-auto"}`}>
                <div
                  className={isDesktop ? "w-full" : "flex min-w-max"}
                  style={{
                    touchAction: "none",
                    userSelect: "none",
                    position: isDesktop ? "relative" : undefined,
                    paddingBottom: isDesktop && desktopLaneHeight > 0 ? desktopLaneHeight : 0,
                  }}
                  onPointerDown={(event) => {
                    const currentTarget = event.currentTarget as HTMLElement;
                    const day = getDayFromPointer(currentTarget, event.clientX, days);
                    currentTarget.setPointerCapture(event.pointerId);
                    setDrag({ month: monthIndex, a: day, b: day });
                  }}
                  onPointerMove={(event) => {
                    if (!drag || drag.month !== monthIndex) return;
                    const currentTarget = event.currentTarget as HTMLElement;
                    const day = getDayFromPointer(currentTarget, event.clientX, days);
                    if (day !== drag.b) setDrag({ ...drag, b: day });
                  }}
                  onPointerUp={() => {
                    if (!drag || drag.month !== monthIndex) return;

                    const start = Math.min(drag.a, drag.b);
                    const end = Math.max(drag.a, drag.b);
                    const reversed = drag.a > drag.b;
                    setDrag(null);

                    const overlapping = monthHighlights.filter((item) => !(item.end < start || item.start > end));

                    if (reversed && overlapping.length > 0) {
                      const ids = overlapping.map((item) => item.id);
                      onEventsChange(events.filter((entry) => !ids.includes(entry.id)));
                      return;
                    }

                    if (start === end) {
                      const hit = monthHighlights.find((item) => start >= item.start && start <= item.end);
                      if (hit) setEditingHighlight({ ...hit });
                      return;
                    }

                    setSheet({ month: monthIndex, start, end });
                  }}
                  onPointerCancel={() => setDrag(null)}
                >
                  {isDesktop ? (
                    <>
                      <div className="flex w-full">
                        {Array.from({ length: days }).map((_, index) => {
                          const day = index + 1;
                          const shouldShowDayLabel = day % 5 === 0 || day === 1;
                          const inDrag =
                            drag &&
                            drag.month === monthIndex &&
                            day >= Math.min(drag.a, drag.b) &&
                            day <= Math.max(drag.a, drag.b);

                          return (
                            <div
                              key={index}
                              data-yday={day}
                              className="flex flex-col items-center justify-start"
                              style={{
                                width: `${desktopDayWidthPercent}%`,
                                paddingRight: 2,
                                borderRight: day < days ? "0.5px solid var(--hairline)" : "none",
                                background: inDrag ? `${accent}22` : "transparent",
                              }}
                            >
                              <div
                                style={{
                                  height: 10,
                                  minHeight: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 9,
                                  color: "var(--text-muted)",
                                  lineHeight: 1,
                                  marginBottom: 0,
                                }}
                              >
                                <span style={{ visibility: shouldShowDayLabel ? "visible" : "hidden" }}>
                                  {shouldShowDayLabel ? day : "0"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {lanes.length > 0 && (
                        <div
                          className="absolute left-0 right-0"
                          style={{ top: 10, height: desktopLaneHeight, pointerEvents: "none" }}
                        >
                          {lanes.map((lane, laneIndex) =>
                            lane.map((item) => {
                              const left = `${((item.start - 1) / days) * 100}%`;
                              const width = `calc(${((item.end - item.start + 1) / days) * 100}% - 4px)`;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => setEditingHighlight({ ...item })}
                                  className="absolute flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full px-2 text-center active:scale-95"
                                  style={{
                                    left,
                                    top: laneIndex * 18,
                                    width,
                                    minWidth: 44,
                                    height: 16,
                                    background: item.color,
                                    color: "rgba(29,29,31,0.86)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    letterSpacing: "-0.18px",
                                    pointerEvents: "auto",
                                  }}
                                >
                                  <span className="truncate w-full text-center">{item.label || "새 플랜"}</span>
                                </button>
                              );
                            }),
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {Array.from({ length: days }).map((_, index) => {
                        const day = index + 1;
                        const dayHighlights = monthHighlights.filter((item) => day >= item.start && day <= item.end);
                        const inDrag =
                          drag &&
                          drag.month === monthIndex &&
                          day >= Math.min(drag.a, drag.b) &&
                          day <= Math.max(drag.a, drag.b);

                        return (
                          <div
                            key={index}
                            data-yday={day}
                            className="flex flex-col items-center justify-start"
                            style={{
                              width: mobileDayCellWidth,
                              paddingRight: 1,
                              borderRight: day < days ? "0.5px solid var(--hairline)" : "none",
                              background: inDrag ? `${accent}22` : "transparent",
                            }}
                          >
                            <div
                              style={{
                                fontSize: 8,
                                color: "var(--text-muted)",
                                lineHeight: 1,
                              }}
                            >
                              {day % 5 === 0 || day === 1 ? day : ""}
                            </div>
                            <div className="mt-[2px] w-full flex flex-col gap-[1px]">
                              {dayHighlights.length > 0 ? (
                                dayHighlights.map((item) => (
                                  <div key={item.id} style={{ height: barHeight, background: item.color, borderRadius: 1 }} />
                                ))
                              ) : (
                                <div
                                  style={{
                                    height: barHeight,
                                    background: "var(--bg-tertiary)",
                                    borderRadius: 1,
                                    opacity: 0.4,
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>

                {!isDesktop && monthHighlights.length > 0 && (
                  <div className={`mt-2 flex flex-wrap gap-2 ${isDesktop ? "pr-4" : ""}`}>
                    {monthHighlights.slice(0, isDesktop ? 5 : 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setEditingHighlight({ ...item })}
                        className="active:scale-95"
                        style={{
                          fontSize: isDesktop ? 12 : 11,
                          padding: isDesktop ? "3px 10px" : "1px 6px",
                          borderRadius: 999,
                          background: item.color,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.label || "새 플랜"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>형광펜으로 표시</div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작일</div>
                <select
                  value={sheet.start}
                  onChange={(event) => {
                    const nextStart = Number(event.target.value);
                    setSheet({ ...sheet, start: nextStart, end: Math.max(sheet.end, nextStart) });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth(sheet.month) }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {sheet.month + 1}월 {day}일
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료일</div>
                <select
                  value={sheet.end}
                  onChange={(event) => setSheet({ ...sheet, end: Number(event.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth(sheet.month) }, (_, index) => index + 1)
                    .filter((day) => day >= sheet.start)
                    .map((day) => (
                      <option key={day} value={day}>
                        {sheet.month + 1}월 {day}일
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setPickedColor(item.key as HighlightKey)}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: item.color,
                    border: pickedColor === item.key ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="이름 (선택)"
              className="w-full mt-4 px-3 py-3 rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <button
              onClick={saveHighlight}
              className="w-full mt-4 py-3 rounded-2xl active:scale-95"
              style={{ background: accent, color: "#fff", fontSize: 17, fontWeight: 600 }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {editingHighlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditingHighlight(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative w-full max-w-[420px] rounded-3xl p-5 pb-6 shadow-2xl"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>기간 편집</div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>월</div>
                <select
                  value={editingHighlight.month}
                  onChange={(event) => {
                    const nextMonth = Number(event.target.value);
                    const maxDay = daysInMonth(nextMonth);
                    setEditingHighlight({
                      ...editingHighlight,
                      month: nextMonth,
                      start: Math.min(editingHighlight.start, maxDay),
                      end: Math.min(editingHighlight.end, maxDay),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {monthNames.map((name, index) => (
                    <option key={index} value={index}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작일</div>
                <select
                  value={editingHighlight.start}
                  onChange={(event) => {
                    const nextStart = Number(event.target.value);
                    setEditingHighlight({
                      ...editingHighlight,
                      start: nextStart,
                      end: Math.max(editingHighlight.end, nextStart),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth(editingHighlight.month) }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}일
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료일</div>
                <select
                  value={editingHighlight.end}
                  onChange={(event) => setEditingHighlight({ ...editingHighlight, end: Number(event.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysInMonth(editingHighlight.month) }, (_, index) => index + 1)
                    .filter((day) => day >= editingHighlight.start)
                    .map((day) => (
                      <option key={day} value={day}>
                        {day}일
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setEditingHighlight({ ...editingHighlight, color: item.color })}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: item.color,
                    border: editingHighlight.color === item.color ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={editingHighlight.label}
              onChange={(event) => setEditingHighlight({ ...editingHighlight, label: event.target.value })}
              placeholder="이름 (선택)"
              className="w-full mt-4 px-3 py-3 rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={deleteEditedHighlight}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "#FF3B30", fontSize: 15, fontWeight: 500, background: "var(--bg-tertiary)" }}
              >
                삭제
              </button>
              <button
                onClick={() => setEditingHighlight(null)}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "var(--text-secondary)", fontSize: 15, background: "var(--bg-tertiary)" }}
              >
                취소
              </button>
              <button
                onClick={saveEditedHighlight}
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
