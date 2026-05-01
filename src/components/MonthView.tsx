import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { highlights, HighlightKey } from "./tokens";
import { SharedEvent } from "./eventStore";

export function MonthView({
  accent,
  planKind = "my",
  events,
  onEventsChange,
  year: yearProp,
  month: monthProp,
  onMonthChange,
  onBack,
  onOpenDay,
}: {
  accent: string;
  planKind?: "my" | "shared";
  events: SharedEvent[];
  onEventsChange: (e: SharedEvent[]) => void;
  /** 외부에서 전달되는 표시 연/월 — 있으면 그 값 사용, 없으면 내부 상태 fallback */
  year?: number;
  month?: number;
  /** 월 변경 시 부모에 알려줌 (계층 네비게이션 동기화) */
  onMonthChange?: (year: number, month: number) => void;
  /** 좌상단 < 뒤로가기 — 연력으로 */
  onBack?: () => void;
  /** 날짜 셀 탭 시 일력으로 진입 */
  onOpenDay?: (year: number, month: number, day: number) => void;
}) {
  // 외부 props가 있으면 controlled, 없으면 내부 상태 (하위 호환)
  const [innerMonth, setInnerMonth] = useState(planKind === "shared" ? 4 : 3);
  const [innerYear, setInnerYear] = useState(2026);
  const month = monthProp ?? innerMonth;
  const year = yearProp ?? innerYear;
  const setMonth: React.Dispatch<React.SetStateAction<number>> = (v) => {
    const next = typeof v === "function" ? (v as (p: number) => number)(month) : v;
    if (onMonthChange) onMonthChange(year, next);
    else setInnerMonth(next);
  };
  void setInnerYear;
  const [selected, setSelected] = useState(planKind === "shared" ? 5 : 29);
  const today = 29;

  const [drag, setDrag] = useState<{ a: number; b: number } | null>(null);
  const [sheet, setSheet] = useState<{ start: number; end: number } | null>(null);
  const [pickedColor, setPickedColor] = useState<HighlightKey>("yellow");
  const [label, setLabel] = useState("");
  const [editingPlan, setEditingPlan] = useState<{ id: number; start: number; end: number; color: string; label: string } | null>(null);

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
    const p = plans.find((p) => d >= p.start && d <= p.end);
    return p?.color;
  };

  const dotsFor = (d: number) => timedEvents.filter((e) => e.startDay === d).length;

  const dayFromPoint = (x: number, y: number): number | null => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    const cell = el?.closest("[data-day]") as HTMLElement | null;
    if (!cell) return null;
    const v = cell.getAttribute("data-day");
    return v ? Number(v) : null;
  };

  // 단일 탭만 처리 — 어떤 칸이든 일력 진입
  const onGridDown = (e: React.PointerEvent) => {
    const d = dayFromPoint(e.clientX, e.clientY);
    if (!d) return;
    setDrag({ a: d, b: d });
  };
  const onGridMove = (_e: React.PointerEvent) => {
    /* drag 기능 제거됨 — 이동 무시 */
  };
  const onUp = () => {
    if (!drag) return;
    const day = drag.a;
    setDrag(null);
    setSelected(day);
    onOpenDay?.(year, month, day);
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
    <div className="px-4 pt-4 pb-32">
      {/* 애플 캘린더 스타일 헤더 — 좌상단 알약 ← 2026년 + 우상단 알약 액션 */}
      <div
        className="flex items-center justify-between"
        style={{ paddingLeft: 4, paddingRight: 4, marginBottom: 16 }}
      >
        {/* 좌측: 알약형 ← 연도 버튼 */}
        {onBack ? (
          <button
            onClick={onBack}
            className="active:scale-95"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 16px 8px 12px",
              borderRadius: 999,
              background: "var(--bg-elevated)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              color: "var(--text-primary)",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.3px",
              border: 0,
              cursor: "pointer",
            }}
            aria-label="연력으로"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
            {year}년
          </button>
        ) : (
          <div style={{ width: 1 }} />
        )}

        {/* 우측: 알약 그룹 (이전/다음/오늘 통합) */}
        <div
          className="flex items-center"
          style={{
            background: "var(--bg-elevated)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            borderRadius: 999,
            padding: 4,
            gap: 4,
          }}
        >
          <button
            onClick={() => setMonth((m) => (m + 11) % 12)}
            className="active:scale-90"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
            aria-label="이전 달"
          >
            <ChevronLeft size={18} strokeWidth={2.2} />
          </button>
          <button
            onClick={() => setMonth(new Date().getMonth())}
            className="active:scale-95"
            style={{
              padding: "0 10px",
              height: 30,
              borderRadius: 999,
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            오늘
          </button>
          <button
            onClick={() => setMonth((m) => (m + 1) % 12)}
            className="active:scale-90"
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "var(--text-primary)",
            }}
            aria-label="다음 달"
          >
            <ChevronRight size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 큰 월 타이틀 (애플 스타일) */}
      <div
        style={{
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: "-1.4px",
          lineHeight: 1,
          color: "var(--text-primary)",
          padding: "0 4px",
          marginBottom: 18,
        }}
      >
        {month + 1}월
      </div>

      {/* 요일 헤더 — 모두 회색 (애플 스타일) */}
      <div className="grid grid-cols-7" style={{ marginBottom: 4 }}>
        {wd.map((d) => (
          <div
            key={d}
            className="text-center"
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--text-muted)",
              paddingBottom: 6,
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 애플 스타일 — 테두리 없는 깔끔 그리드, 가로 행 사이만 hairline */}
      <div
        className="grid grid-cols-7"
        data-no-swipe="true"
        style={{
          touchAction: "none",
          userSelect: "none",
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
          const row = Math.floor(i / 7);
          // 해당 날짜에 걸리는 untimed 플랜 (멀티데이 포함) — 알약으로 표시
          const dayPlans = d ? plans.filter((p) => d >= p.start && d <= p.end) : [];
          // 해당 날짜의 timed events 개수 — 점으로 표시
          const dots = d
            ? timedEvents.filter((e) => e.startDay === d).length
            : 0;
          return (
            <div
              key={i}
              data-day={d ?? undefined}
              className="relative flex flex-col items-center"
              style={{
                aspectRatio: "1 / 1.6",
                paddingTop: 8,
                borderTop: row === 0 ? "none" : "0.5px solid var(--hairline)",
              }}
            >
              {d && (
                <>
                  {/* 날짜 숫자 */}
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: isToday ? accent : isSelected ? `${accent}22` : "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: isToday || isSelected ? 700 : 500,
                        letterSpacing: "-0.3px",
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

                  {/* 일정 알약 (untimed 플랜 — 셀 하단에 작게) */}
                  {dayPlans.length > 0 && (
                    <div
                      className="w-full"
                      style={{
                        marginTop: 4,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        paddingLeft: 2,
                        paddingRight: 2,
                      }}
                    >
                      {dayPlans.slice(0, 2).map((p, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: 9,
                            fontWeight: 600,
                            color: pillTextColor(p.color),
                            background: pillBgColor(p.color),
                            borderRadius: 4,
                            padding: "1px 3px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.1px",
                            lineHeight: 1.3,
                          }}
                        >
                          {p.label || "플랜"}
                        </div>
                      ))}
                      {dayPlans.length > 2 && (
                        <div
                          style={{
                            fontSize: 9,
                            color: "var(--text-muted)",
                            paddingLeft: 3,
                            lineHeight: 1.3,
                          }}
                        >
                          +{dayPlans.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 시간 일정 점 */}
                  {dots > 0 && dayPlans.length === 0 && (
                    <div className="flex gap-[2px] mt-1">
                      {Array.from({ length: Math.min(dots, 3) }).map((_, j) => (
                        <div
                          key={j}
                          className="w-1 h-1 rounded-full"
                          style={{ background: accent }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add plan sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-fade" />
          <div
            className="relative w-full max-w-[375px] mx-auto rounded-t-3xl p-5 pb-8 sheet-slide-up"
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
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setEditingPlan(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-fade" />
          <div
            className="relative w-full max-w-[375px] mx-auto rounded-t-3xl p-5 pb-8 sheet-slide-up"
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

/** 일정 알약 배경 — 원래 색의 매우 연한 톤 */
function pillBgColor(c: string): string {
  // hex 또는 rgb 스타일 모두 안전하게 처리
  if (c.startsWith("#") && (c.length === 7 || c.length === 4)) {
    return `${c}33`; // ~20% alpha
  }
  return c;
}
/** 일정 알약 텍스트 — 색을 어둡게 보정 */
function pillTextColor(c: string): string {
  if (c.startsWith("#") && c.length === 7) {
    // hex → rgb
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    // 60% 어둡게
    const dr = Math.round(r * 0.55);
    const dg = Math.round(g * 0.55);
    const db = Math.round(b * 0.55);
    return `rgb(${dr}, ${dg}, ${db})`;
  }
  return c;
}
