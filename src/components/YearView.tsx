import { useEffect, useMemo, useState } from "react";
import { highlights, HighlightKey } from "./tokens";
import { SharedEvent } from "./eventStore";
import { TYPE } from "@/styles/typography";
import { YearViewWeb } from "./YearViewWeb";

type LocalHl = { id: number; month: number; start: number; end: number; color: string; label: string };

type YearViewProps = {
  accent: string;
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
  year?: number;
  onOpenMonth?: (year: number, month: number) => void;
  onAdd?: () => void;
  onOpenEdit?: (e: SharedEvent) => void;
};

export function YearView(props: YearViewProps) {
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

  return isDesktop ? <YearViewWeb {...props} /> : <YearViewMobile {...props} />;
}

function YearViewMobile({
  accent,
  events,
  onEventsChange,
  year,
  onOpenMonth,
  onAdd,
  onOpenEdit,
}: YearViewProps) {
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
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {monthNames.map((mn, mi) => {
          const days = daysIn(mi);
          const monthHls = hls.filter((h) => h.month === mi);
          const today = new Date();
          const isCurrentMonth =
            today.getFullYear() === YEAR && today.getMonth() === mi;
          // 트랙 알고리즘 — 겹치는 플랜은 다단으로
          const TRACK_H = 14;
          const TRACK_GAP = 2;
          type Placed = { id: number; start: number; end: number; color: string; label: string; track: number };
          const placedBars: Placed[] = [];
          const trackEnds: number[] = [];
          for (const h of [...monthHls].sort((a, b) => a.start - b.start)) {
            let t = -1;
            for (let i = 0; i < trackEnds.length; i++) {
              if (trackEnds[i] < h.start) { t = i; break; }
            }
            if (t === -1) {
              t = trackEnds.length;
              trackEnds.push(h.end);
            } else {
              trackEnds[t] = h.end;
            }
            placedBars.push({ id: h.id, start: h.start, end: h.end, color: h.color, label: h.label, track: t });
          }
          const monthTrackCount = Math.max(trackEnds.length, 1);
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
                  style={{ userSelect: "none" }}
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
                          {(() => {
                            const dayHls = monthHls.filter((h) => day >= h.start && day <= h.end);
                            return dayHls.length > 0 ? (
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
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}

                </div>
                {(() => {
                  // 라벨 박스용 트랙 알고리즘 — 글자 길이 기반 너비 추정해서 겹침 판정
                  type LabelPlaced = {
                    id: number; start: number; end: number; color: string; label: string;
                    estDays: number; track: number;
                  };
                  const CH_PX = 7; // 글자 1개당 약 7px
                  const PAD_PX = 14;
                  // estDays = 라벨이 차지하는 가로 (일 단위 환산) — 막대 너비보다 라벨이 길면 라벨이 우선
                  const placedLabels: LabelPlaced[] = [];
                  const ends: number[] = [];
                  for (const p of [...placedBars].sort((a, b) => a.start - b.start)) {
                    const text = p.label || "플랜";
                    const estPx = text.length * CH_PX + PAD_PX;
                    // px → days 환산 (스트립 = 31일 분량)
                    // 화면 너비 모르니 31일 기준 비율로 처리
                    const stripPxApprox = 280; // 대략적인 가로 (화면 폭 - 월 라벨 - 패딩)
                    const labelDays = Math.ceil((estPx / stripPxApprox) * 31);
                    const barDays = p.end - p.start + 1;
                    const estDays = Math.max(labelDays, barDays);
                    let t = -1;
                    for (let i = 0; i < ends.length; i++) {
                      if (ends[i] < p.start) { t = i; break; }
                    }
                    if (t === -1) {
                      t = ends.length;
                      ends.push(p.start + estDays - 1);
                    } else {
                      ends[t] = p.start + estDays - 1;
                    }
                    placedLabels.push({ ...p, estDays, track: t });
                  }
                  const labelTrackCount = Math.max(ends.length, 1);
                  if (placedLabels.length === 0) return null;
                  return (
                    <div
                      style={{
                        position: "relative",
                        marginTop: 4,
                        height: labelTrackCount * (TRACK_H + TRACK_GAP),
                      }}
                    >
                      {placedLabels.map((p) => {
                        const left = ((p.start - 1) / 31) * 100;
                        // 우측 끝(31일)까지 남은 공간으로 max-width 제한
                        const maxWidthPct = ((31 - p.start + 1) / 31) * 100;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              if (onOpenEdit) {
                                const ev = events.find((e) => e.id === p.id);
                                if (ev) onOpenEdit(ev);
                              } else {
                                setEditingHl({ id: p.id, month: mi, start: p.start, end: p.end, color: p.color, label: p.label });
                              }
                            }}
                            className="active:scale-95"
                            style={{
                              position: "absolute",
                              left: `${left}%`,
                              maxWidth: `${maxWidthPct}%`,
                              top: p.track * (TRACK_H + TRACK_GAP),
                              height: TRACK_H,
                              background: p.color,
                              borderRadius: 4,
                              padding: "0 7px",
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              lineHeight: `${TRACK_H}px`,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              letterSpacing: "-0.1px",
                              border: 0,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              textAlign: "left",
                              boxSizing: "border-box",
                            }}
                          >
                            {p.label || "플랜"}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
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
