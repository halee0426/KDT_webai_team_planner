import { useMemo, useState } from "react";
import { highlights, HighlightKey } from "./tokens";
import { SharedEvent } from "./eventStore";
import { TYPE } from "@/styles/typography";

type LocalHl = { id: number; month: number; start: number; end: number; color: string; label: string };

export function YearView({
  accent,
  events,
  onEventsChange,
  year,
  onOpenMonth,
  onAdd,
}: {
  accent: string;
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
  /** 외부에서 전달되는 표시 연도 (없으면 2026 fallback) */
  year?: number;
  /** 월 라벨 클릭 시 → 달력(MonthView)로 진입 */
  onOpenMonth?: (year: number, month: number) => void;
  /** 우상단 + 버튼 */
  onAdd?: () => void;
}) {
  const YEAR = year ?? 2026;

  const [sheet, setSheet] = useState<{ month: number; start: number; end: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<HighlightKey>("yellow");
  const [label, setLabel] = useState("");
  const [drag, setDrag] = useState<{ month: number; a: number; b: number } | null>(null);
  const [editingHl, setEditingHl] = useState<LocalHl | null>(null);

  // Only untimed (plan) events for this year – shown in year view
  const hls: LocalHl[] = useMemo(
    () =>
      events
        .filter((e) => e.startSlot === undefined && e.year === YEAR)
        .map((e) => ({ id: e.id, month: e.month, start: e.startDay, end: e.endDay, color: e.color, label: e.title })),
    [events],
  );

  const monthNames = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
  const daysIn = (m: number) => new Date(YEAR, m + 1, 0).getDate();

  const save = () => {
    if (!sheet) return;
    const c = highlights.find((h) => h.key === pickedColor)!.color;
    const newEvent: SharedEvent = {
      id: Date.now(),
      year: YEAR,
      month: sheet.month,
      startDay: sheet.start,
      endDay: sheet.end,
      title: label.trim() || "플랜",
      color: c,
    };
    onEventsChange([...events, newEvent]);
    setSheet(null);
    setLabel("");
  };

  const saveEdit = () => {
    if (!editingHl) return;
    onEventsChange(
      events.map((e) =>
        e.id === editingHl.id
          ? { ...e, month: editingHl.month, startDay: editingHl.start, endDay: editingHl.end, color: editingHl.color, title: editingHl.label }
          : e,
      ),
    );
    setEditingHl(null);
  };

  const deleteEdit = () => {
    if (!editingHl) return;
    onEventsChange(events.filter((e) => e.id !== editingHl.id));
    setEditingHl(null);
  };

  return (
    <div className="px-5 pb-32" style={{ paddingTop: 24 }}>
      {/* 헤더 섹션 — 한 묶음 */}
      <div
        className="flex items-end justify-between"
        style={{ marginBottom: 12 }}
      >
        <div>
          <div style={{ ...TYPE.captionMeta, color: accent, fontWeight: 600, marginBottom: 2 }}>
            {YEAR}
          </div>
          <div style={{ ...TYPE.titlePage, color: "var(--text-primary)" }}>
            나의 1년 플랜
          </div>
          <div style={{ ...TYPE.bodySmall, color: "var(--text-secondary)", marginTop: 6 }}>
            119일 / 365일 · 33%
          </div>
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
              flexShrink: 0,
            }}
            aria-label="일정 추가"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        )}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)", marginTop: 4 }}>
        <div className="h-full rounded-full" style={{ width: "33%", background: accent }} />
      </div>

      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "0.5px solid var(--hairline)",
        }}
        className="space-y-2"
      >
        {monthNames.map((mn, mi) => {
          const days = daysIn(mi);
          const monthHls = hls.filter((h) => h.month === mi);
          const today = new Date();
          const isCurrentMonth =
            today.getFullYear() === YEAR && today.getMonth() === mi;
          return (
            <div
              key={mi}
              className="flex items-start gap-2"
              style={{
                padding: "4px 0",
                background: isCurrentMonth ? `${accent}0F` : "transparent",
                borderRadius: 6,
                marginLeft: -4,
                marginRight: -4,
                paddingLeft: 4,
                paddingRight: 4,
              }}
            >
              <button
                onClick={() => onOpenMonth?.(YEAR, mi)}
                className="sticky w-9 pt-1 text-left active:scale-95"
                style={{
                  fontSize: 13,
                  fontWeight: isCurrentMonth ? 800 : 600,
                  letterSpacing: "-0.224px",
                  background: "transparent",
                  border: 0,
                  cursor: onOpenMonth ? "pointer" : "default",
                  color: isCurrentMonth ? accent : "var(--text-primary)",
                  fontFamily: "inherit",
                  padding: 0,
                }}
                aria-label={`${mn} 달력 열기`}
              >
                {mn}
              </button>
              <div className="flex-1 min-w-0">
                <div
                  className="flex w-full relative"
                  style={{ touchAction: "none", userSelect: "none" }}
                  onPointerDown={(ev) => {
                    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
                    const cell = el?.closest("[data-yday]") as HTMLElement | null;
                    if (!cell) return;
                    const day = Number(cell.getAttribute("data-yday"));
                    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
                    setDrag({ month: mi, a: day, b: day });
                  }}
                  onPointerMove={(ev) => {
                    if (!drag || drag.month !== mi) return;
                    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
                    const cell = el?.closest("[data-yday]") as HTMLElement | null;
                    if (!cell) return;
                    const day = Number(cell.getAttribute("data-yday"));
                    if (day !== drag.b) setDrag({ ...drag, b: day });
                  }}
                  onPointerUp={() => {
                    if (!drag || drag.month !== mi) return;
                    const s = Math.min(drag.a, drag.b);
                    const e = Math.max(drag.a, drag.b);
                    const reverse = drag.a > drag.b;
                    setDrag(null);
                    const overlapping = monthHls.filter((h) => !(h.end < s || h.start > e));
                    if (reverse && overlapping.length > 0) {
                      const ids = overlapping.map((h) => h.id);
                      onEventsChange(events.filter((ev) => !ids.includes(ev.id)));
                      return;
                    }
                    if (s === e) {
                      // single tap: open edit if on a highlight, else do nothing
                      const hit = monthHls.find((h) => s >= h.start && s <= h.end);
                      if (hit) setEditingHl({ ...hit });
                      return;
                    }
                    setSheet({ month: mi, start: s, end: e });
                  }}
                  onPointerCancel={() => setDrag(null)}
                >
                  {Array.from({ length: days }).map((_, di) => {
                    const day = di + 1;
                    const dayHls = monthHls.filter((h) => day >= h.start && day <= h.end);
                    const inDrag =
                      drag &&
                      drag.month === mi &&
                      day >= Math.min(drag.a, drag.b) &&
                      day <= Math.max(drag.a, drag.b);
                    // 가이드 라인 (5/10/15/20/25, 진하기 차등)
                    const isMidGuide = day === 15;
                    const isMinorGuide = day % 5 === 0 && !isMidGuide;
                    return (
                      <div
                        key={di}
                        data-yday={day}
                        className="flex flex-col items-center justify-start"
                        style={{
                          width: `${100 / 31}%`,
                          minWidth: 0,
                          boxSizing: "border-box",
                          borderRight: isMidGuide
                            ? "0.5px dashed rgba(0,0,0,0.12)"
                            : isMinorGuide
                            ? "0.5px dashed rgba(0,0,0,0.05)"
                            : "none",
                          background: inDrag ? `${accent}22` : "transparent",
                          paddingTop: 2,
                          paddingBottom: 2,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color: "var(--text-muted)",
                            lineHeight: 1,
                            height: 9,
                          }}
                        >
                          {day === 1 || day % 5 === 0 ? day : ""}
                        </div>
                        <div
                          className="mt-[2px] w-full flex flex-col"
                          style={{ gap: 2, paddingLeft: 1, paddingRight: 1 }}
                        >
                          {dayHls.length > 0 ? (
                            dayHls.map((h) => (
                              <div
                                key={h.id}
                                style={{
                                  height: 8,
                                  background: h.color,
                                  borderTopLeftRadius: day === h.start ? 3 : 0,
                                  borderBottomLeftRadius: day === h.start ? 3 : 0,
                                  borderTopRightRadius: day === h.end ? 3 : 0,
                                  borderBottomRightRadius: day === h.end ? 3 : 0,
                                }}
                              />
                            ))
                          ) : (
                            <div
                              style={{
                                height: 8,
                                background: "var(--bg-tertiary)",
                                borderRadius: 2,
                                opacity: 0.35,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {monthHls.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {monthHls.slice(0, 3).map((h) => (
                      <button
                        key={h.id}
                        onClick={() => setEditingHl({ ...h })}
                        className="active:scale-95"
                        style={{
                          fontSize: 11,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: h.color,
                          color: "var(--text-primary)",
                        }}
                      >
                        {h.label || "플랜"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-fade" />
          <div
            className="relative w-full max-w-[375px] mx-auto rounded-t-3xl p-5 pb-8 sheet-slide-up"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>형광펜으로 표시</div>
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
                  {Array.from({ length: daysIn(sheet.month) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{sheet.month + 1}월 {d}일</option>
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
                  {Array.from({ length: daysIn(sheet.month) }, (_, i) => i + 1)
                    .filter((d) => d >= sheet.start)
                    .map((d) => (
                      <option key={d} value={d}>{sheet.month + 1}월 {d}일</option>
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
              onClick={save}
              className="w-full mt-4 py-3 rounded-2xl active:scale-95"
              style={{ background: accent, color: "#fff", fontSize: 17, fontWeight: 600 }}
            >
              저장
            </button>
          </div>
        </div>
      )}

      {/* Edit sheet */}
      {editingHl && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setEditingHl(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-fade" />
          <div
            className="relative w-full max-w-[375px] mx-auto rounded-t-3xl p-5 pb-8 sheet-slide-up"
            style={{ background: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: "var(--separator)" }} />
            <div style={{ fontSize: 17, fontWeight: 600 }}>기간 편집</div>
            <div className="flex gap-3 mt-4">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>월</div>
                <select
                  value={editingHl.month}
                  onChange={(e) => {
                    const nm = Number(e.target.value);
                    const maxDay = daysIn(nm);
                    setEditingHl({
                      ...editingHl,
                      month: nm,
                      start: Math.min(editingHl.start, maxDay),
                      end: Math.min(editingHl.end, maxDay),
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {monthNames.map((mn, i) => (
                    <option key={i} value={i}>{mn}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-3">
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>시작일</div>
                <select
                  value={editingHl.start}
                  onChange={(e) => {
                    const ns = Number(e.target.value);
                    setEditingHl({ ...editingHl, start: ns, end: Math.max(editingHl.end, ns) });
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysIn(editingHl.month) }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}일</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>종료일</div>
                <select
                  value={editingHl.end}
                  onChange={(e) => setEditingHl({ ...editingHl, end: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl outline-none"
                  style={{ background: "var(--bg-tertiary)", fontSize: 14, color: "var(--text-primary)", border: "none" }}
                >
                  {Array.from({ length: daysIn(editingHl.month) }, (_, i) => i + 1)
                    .filter((d) => d >= editingHl.start)
                    .map((d) => (
                      <option key={d} value={d}>{d}일</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setEditingHl({ ...editingHl, color: h.color })}
                  className="aspect-square rounded-lg active:scale-95"
                  style={{
                    background: h.color,
                    border: editingHl.color === h.color ? `2px solid ${accent}` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={editingHl.label}
              onChange={(e) => setEditingHl({ ...editingHl, label: e.target.value })}
              placeholder="라벨 (선택)"
              className="w-full mt-4 px-3 py-3 rounded-xl outline-none"
              style={{ background: "var(--bg-tertiary)", fontSize: 15 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={deleteEdit}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "#FF3B30", fontSize: 15, fontWeight: 500, background: "var(--bg-tertiary)" }}
              >
                삭제
              </button>
              <button
                onClick={() => setEditingHl(null)}
                className="flex-1 py-3 rounded-2xl"
                style={{ color: "var(--text-secondary)", fontSize: 15, background: "var(--bg-tertiary)" }}
              >
                취소
              </button>
              <button
                onClick={saveEdit}
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
