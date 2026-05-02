import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { highlights, HighlightKey } from "./tokens";
import { SharedEvent } from "./eventStore";
import { TYPE } from "@/styles/typography";

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
  onAdd,
}: {
  accent: string;
  planKind?: string;
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
  /** 우상단 + 버튼 — 신규 일정 모달 열기 */
  onAdd?: () => void;
}) {
  // 외부 props가 있으면 controlled, 없으면 내부 상태 (하위 호환)
  const [innerMonth, setInnerMonth] = useState(planKind !== "my" ? 4 : 3);
  const [innerYear, setInnerYear] = useState(2026);
  const month = monthProp ?? innerMonth;
  const year = yearProp ?? innerYear;
  const setMonth: React.Dispatch<React.SetStateAction<number>> = (v) => {
    const next = typeof v === "function" ? (v as (p: number) => number)(month) : v;
    if (onMonthChange) onMonthChange(year, next);
    else setInnerMonth(next);
  };
  void setInnerYear;
  const [selected, setSelected] = useState(planKind !== "my" ? 5 : 29);
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
    <div className="px-4 pb-32" style={{ paddingTop: 24 }}>
      {/* 헤더 섹션 — 한 묶음으로 호흡감 있게 */}
      <div
        className="flex items-end justify-between"
        style={{
          marginBottom: 28,
          paddingBottom: 16,
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ ...TYPE.titleMonth, color: "var(--text-primary)" }}>
            {month + 1}월
          </span>
          <span style={{ ...TYPE.captionMeta, color: accent, fontWeight: 600 }}>
            {year}
          </span>
        </div>

        {/* 우측 알약 그룹: 이전/오늘/다음 + 분리된 + 버튼 */}
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
              onClick={() => setMonth((m) => (m + 11) % 12)}
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
              aria-label="이전 달"
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setMonth(new Date().getMonth())}
              className="active:scale-95"
              style={{
                padding: "0 10px",
                height: 28,
                borderRadius: 999,
                background: "transparent",
                fontSize: 12,
                fontWeight: 600,
                color: accent,
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
              aria-label="다음 달"
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
          position: "relative",
          gridAutoRows: "1fr", // 행 height 통일 — 셀 라인 정확히 맞춤
        }}
        onPointerDown={onGridDown}
        onPointerMove={onGridMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {(() => {
          // 행별 멀티데이 트랙 개수 미리 계산 — 셀 padding-bottom 결정용
          const rowTrackCount: number[] = [0, 0, 0, 0, 0, 0];
          const multiAll = plans.filter((p) => p.start !== p.end);
          const dayToCell2 = (day: number) => first + day - 1;
          type S = { row: number; startCol: number; endCol: number; color: string; label: string; isStart: boolean };
          const segs2: S[] = [];
          for (const p of multiAll) {
            const sc = dayToCell2(p.start);
            const ec = dayToCell2(Math.min(p.end, daysInMonth));
            let cur = sc;
            while (cur <= ec) {
              const r = Math.floor(cur / 7);
              const lastInRow = r * 7 + 6;
              const segEnd = Math.min(ec, lastInRow);
              segs2.push({
                row: r,
                startCol: cur % 7,
                endCol: segEnd - r * 7,
                color: p.color,
                label: p.label,
                isStart: cur === sc,
              });
              cur = segEnd + 1;
            }
          }
          const rowTracksTmp = new Map<number, number[]>();
          // cellTrackCount[cellIndex] = 그 셀을 통과하는 멀티데이 트랙 개수
          const cellTrackCount: number[] = new Array(42).fill(0);
          type Placed2 = S & { track: number };
          const placed2: Placed2[] = [];
          for (const s of segs2.sort((a, b) => (a.row !== b.row ? a.row - b.row : a.startCol - b.startCol))) {
            const tr = rowTracksTmp.get(s.row) ?? [];
            let t = -1;
            for (let i = 0; i < tr.length; i++) {
              if (tr[i] < s.startCol) { t = i; break; }
            }
            if (t === -1) {
              t = tr.length;
              tr.push(s.endCol);
            } else {
              tr[t] = s.endCol;
            }
            rowTracksTmp.set(s.row, tr);
            placed2.push({ ...s, track: t });
          }
          rowTracksTmp.forEach((tr, r) => { rowTrackCount[r] = tr.length; });
          // 각 셀별 통과하는 막대 개수 계산
          for (const p of placed2) {
            for (let col = p.startCol; col <= p.endCol; col++) {
              const cellIdx = p.row * 7 + col;
              cellTrackCount[cellIdx] = Math.max(cellTrackCount[cellIdx], p.track + 1);
            }
          }
          return cells.map((d, i) => {
          const dow = i % 7;
          const isToday = d === today;
          const isSelected = d === selected;
          const row = Math.floor(i / 7);
          // 해당 날짜에 걸리는 untimed 플랜 (멀티데이 포함)
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
                aspectRatio: "1 / 1.85",
                minHeight: 120, // 좁은 화면에서도 트랙 두 개 + 콘텐츠 공간 보장 (MIN_BAR_TOP 42 + ITEM 16 + GAP 14 + BAR 11+3+11 + 여백)
                paddingTop: 8,
                paddingLeft: 2,
                paddingRight: 2,
                paddingBottom: 4,
                borderTop: row === 0 ? "none" : "0.5px solid var(--hairline)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
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

                  {/* 일정 표시 — 점+텍스트 위 / 멀티데이 막대 아래 (셀 안 자연 흐름) */}
                  {d && (() => {
                    const dayTimed = timedEvents.filter((e) => e.startDay === d);
                    const daySingle = dayPlans.filter((p) => p.start === p.end);
                    const dayMulti = dayPlans.filter((p) => p.start !== p.end);
                    const totalCount = dayTimed.length + daySingle.length + dayMulti.length;
                    if (totalCount === 0) return null;
                    const MAX = 3;
                    const timedSlots = Math.min(dayTimed.length, MAX);
                    const singleSlots = Math.min(daySingle.length, MAX - timedSlots);
                    const hiddenCount = dayTimed.length + daySingle.length - (timedSlots + singleSlots);
                    // 이 셀이 속한 행에서 통과하는 막대 개수 (행 통일을 위해 빈 슬롯 포함)
                    const myTrackTotal = rowTrackCount[row];
                    return (
                      <>
                      {/* 1행 — 점+텍스트 (셀 안에만) */}
                      <div
                        className="w-full"
                        style={{
                          marginTop: 4,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        {/* 시간 일정 — 좌측 색 점 + 텍스트 */}
                        {dayTimed.slice(0, timedSlots).map((ev) => (
                          <div
                            key={`ev-${ev.id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              minHeight: 11,
                              paddingLeft: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 999,
                                background: ev.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.1px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "clip",
                                lineHeight: 1.2,
                              }}
                            >
                              {ev.title}
                            </span>
                          </div>
                        ))}

                        {/* 단일일 플랜 — 점+텍스트 (시간 일정과 동일 형태) */}
                        {daySingle.slice(0, singleSlots).map((p, idx) => (
                          <div
                            key={`single-${idx}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              minHeight: 11,
                              paddingLeft: 1,
                            }}
                          >
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: 999,
                                background: p.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: 9,
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.1px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "clip",
                                lineHeight: 1.2,
                              }}
                            >
                              {p.label || "플랜"}
                            </span>
                          </div>
                        ))}

                        {/* 초과 카운트 */}
                        {hiddenCount > 0 && (
                          <div
                            style={{
                              fontSize: 9,
                              color: "var(--text-muted)",
                              paddingLeft: 3,
                              lineHeight: 1.2,
                            }}
                          >
                            +{hiddenCount}
                          </div>
                        )}
                      </div>

                      {/* 셀 안 막대 비활성 — 오버레이가 그림 */}
                      {false && myTrackTotal > 0 && (
                        <div
                          className="w-full"
                          style={{
                            marginTop: "auto",
                            paddingTop: 4,
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          {Array.from({ length: myTrackTotal }).map((_, trackIdx) => {
                            const seg = placed2.find(
                              (s) =>
                                s.row === row &&
                                s.track === trackIdx &&
                                dow >= s.startCol &&
                                dow <= s.endCol,
                            );
                            if (!seg) {
                              return <div key={trackIdx} style={{ height: 11 }} />;
                            }
                            const isStart = dow === seg.startCol;
                            const isEnd = dow === seg.endCol;
                            return (
                              <div
                                key={trackIdx}
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "var(--text-primary)",
                                  background: pillBgColor(seg.color),
                                  borderTopLeftRadius: isStart ? 4 : 0,
                                  borderBottomLeftRadius: isStart ? 4 : 0,
                                  borderTopRightRadius: isEnd ? 4 : 0,
                                  borderBottomRightRadius: isEnd ? 4 : 0,
                                  marginLeft: isStart ? 0 : -2,
                                  marginRight: isEnd ? 0 : -2,
                                  padding: 0,
                                  height: 11,
                                  lineHeight: "11px",
                                  textAlign: "center",
                                  whiteSpace: "nowrap",
                                  overflow: "visible",
                                  position: "relative",
                                  letterSpacing: "-0.1px",
                                }}
                              >
                                {isStart && (
                                  <span
                                    style={{
                                      position: "absolute",
                                      left: `${50 + ((seg.endCol - seg.startCol) / 2) * 100}%`,
                                      top: "50%",
                                      transform: "translate(-50%, -50%)",
                                      pointerEvents: "none",
                                      whiteSpace: "nowrap",
                                      zIndex: 2,
                                    }}
                                  >
                                    {seg.label || "플랜"}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>
          );
        });
        })()}

        {/* 멀티데이 막대 오버레이 — 그리드 위 absolute, 행 단위로 라인 맞춤 */}
        {(() => {
          const multi = plans.filter((p) => p.start !== p.end);
          if (multi.length === 0) return null;
          const dayToCell = (day: number) => first + day - 1;
          type Seg = { id: number; row: number; startCol: number; endCol: number; color: string; label: string; isStart: boolean };
          const segs: Seg[] = [];
          for (const p of multi) {
            const startCell = dayToCell(p.start);
            const endCell = dayToCell(Math.min(p.end, daysInMonth));
            let cur = startCell;
            while (cur <= endCell) {
              const r = Math.floor(cur / 7);
              const lastInRow = r * 7 + 6;
              const segEnd = Math.min(endCell, lastInRow);
              segs.push({
                id: p.id,
                row: r,
                startCol: cur % 7,
                endCol: segEnd - r * 7,
                color: p.color,
                label: p.label,
                isStart: cur === startCell,
              });
              cur = segEnd + 1;
            }
          }
          // 트랙 알고리즘 (각 row 안에서 겹치면 위/아래)
          type Placed = Seg & { track: number };
          const placed: Placed[] = [];
          const rowTracks = new Map<number, number[]>();
          for (const s of segs.sort((a, b) => (a.row !== b.row ? a.row - b.row : a.startCol - b.startCol))) {
            const tracks = rowTracks.get(s.row) ?? [];
            let t = -1;
            for (let i = 0; i < tracks.length; i++) {
              if (tracks[i] < s.startCol) { t = i; break; }
            }
            if (t === -1) {
              t = tracks.length;
              tracks.push(s.endCol);
            } else {
              tracks[t] = s.endCol;
            }
            rowTracks.set(s.row, tracks);
            placed.push({ ...s, track: t });
          }
          const TOTAL_ROWS = 6;
          const BAR_H = 11;
          const BAR_GAP = 3;
          // 셀별 점+텍스트 개수 — 각 막대가 통과하는 셀들의 max 기준으로 위치 결정
          const cellItems: number[] = new Array(42).fill(0);
          for (let cellIdx = 0; cellIdx < 42; cellIdx++) {
            const day = cellIdx - first + 1;
            if (day < 1 || day > daysInMonth) continue;
            const tCount = timedEvents.filter((e) => e.startDay === day).length;
            const sCount = plans.filter((p) => p.start === day && p.end === day).length;
            cellItems[cellIdx] = Math.min(tCount + sCount, 3);
          }
          // 셀 상단 ~ 콘텐츠 영역 시작점 픽셀 계산
          // 셀 paddingTop(8) + 날짜원(26) + 여백(8) = 42px 최소 — 막대는 절대 이 아래에 위치
          const MIN_BAR_TOP = 42;
          const ITEM_H = 16; // 점+텍스트 한 줄 실제 높이
          const BAR_TOP_GAP = 14; // 점+텍스트 끝과 첫 막대 사이 여백
          // 같은 plan(id)이 여러 행에 걸쳐 있을 때, 모든 segment가 같은 시각적 흐름으로 보이도록
          // plan id별로 통과하는 모든 셀의 max content를 미리 계산
          const planMaxItems = new Map<number, number>();
          for (const s of placed) {
            let m = planMaxItems.get(s.id) ?? 0;
            for (let col = s.startCol; col <= s.endCol; col++) {
              const cellIdx = s.row * 7 + col;
              if (cellItems[cellIdx] > m) m = cellItems[cellIdx];
            }
            planMaxItems.set(s.id, m);
          }
          return (
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
              {placed.map((s, i) => {
                const left = (s.startCol / 7) * 100;
                const width = ((s.endCol - s.startCol + 1) / 7) * 100;
                const rowHeightPct = 100 / TOTAL_ROWS;
                // 같은 plan의 모든 segment가 공유하는 max content 사용 (행 통일)
                const segMaxItems = planMaxItems.get(s.id) ?? 0;
                // 콘텐츠 기반 top — 같은 plan이면 segMaxItems 동일 → 모든 행에서 같은 위치
                // bottom 캡 제거: 셀 minHeight 로 공간 보장 → 항상 contentBasedTop 사용 → 트랙 간격 일정
                const contentBasedTop = MIN_BAR_TOP + segMaxItems * ITEM_H + (segMaxItems > 0 ? BAR_TOP_GAP : 0) + s.track * (BAR_H + BAR_GAP);
                const finalTop = `calc(${s.row * rowHeightPct}% + ${contentBasedTop}px)`;
                return (
                  <div
                    key={`${s.id}-${i}`}
                    style={{
                      position: "absolute",
                      left: `calc(${left}% + 3px)`,
                      width: `calc(${width}% - 6px)`,
                      top: finalTop,
                      height: BAR_H,
                      background: pillBgColor(s.color),
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      lineHeight: `${BAR_H}px`,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "clip",
                      letterSpacing: "-0.1px",
                      textAlign: "center",
                      boxSizing: "border-box",
                      padding: "0 4px",
                    }}
                  >
                    {s.isStart ? s.label || "플랜" : ""}
                  </div>
                );
              })}
            </div>
          );
        })()}
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
                      <option key={d} value={d}>
                        {month + 1}/{d}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {highlights.map((h) => (
                <button
                  key={h.key}
                  onClick={() => setEditingPlan({ ...editingPlan, color: h.color })}
                  className="w-8 h-8 rounded-full active:scale-95"
                  style={{
                    background: h.color,
                    border: editingPlan.color === h.color ? `2px solid var(--text-primary)` : "0.5px solid var(--hairline)",
                  }}
                />
              ))}
            </div>
            <input
              value={editingPlan.label}
              onChange={(e) => setEditingPlan({ ...editingPlan, label: e.target.value })}
              placeholder=""
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
                onClick={saveEditPlan}
                className="flex-1 py-3 rounded-2xl"
                style={{ background: accent, color: "#fff", fontSize: 15, fontWeight: 500 }}
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

function pillBgColor(c: string): string {
  if (c.startsWith("#") && (c.length === 7 || c.length === 4)) {
    return `${c}33`;
  }
  return c;
}
function pillTextColor(c: string): string {
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const dr = Math.round(r * 0.55);
    const dg = Math.round(g * 0.55);
    const db = Math.round(b * 0.55);
    return `rgb(${dr}, ${dg}, ${db})`;
  }
  return c;
}
