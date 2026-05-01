// 신규 일정 모달 — 애플 캘린더 "신규" 화면 스타일
// 연/월/일 어디서든 + 버튼으로 진입, 저장 시 SharedEvent 생성
//
// - 하루 종일 토글 → on이면 startSlot/endSlot undefined (untimed plan)
// - off면 시간 슬롯 입력 (timed event)
// - 시작/종료 날짜 + 시간 입력
// - 색상 6개 중 선택

import { useEffect, useState } from "react";
import type { SharedEvent } from "../eventStore";
import { TYPE } from "@/styles/typography";

const EVENT_COLORS = [
  { key: "blue", color: "#0066CC", label: "집" },
  { key: "purple", color: "#AF52DE", label: "업무" },
  { key: "pink", color: "#FF2D55", label: "중요" },
  { key: "orange", color: "#FF9500", label: "여행" },
  { key: "green", color: "#34C759", label: "건강" },
  { key: "mint", color: "#1ec4b3", label: "기타" },
];

export type NewEventInitial = {
  year?: number;
  month?: number;
  day?: number;
  /** 하루 종일 기본값 */
  allDay?: boolean;
  /** 시간 일정 시작 슬롯 (0-47, 30분 단위) — allDay false 일 때 */
  startSlot?: number;
  endSlot?: number;
};

export function NewEventModal({
  open,
  onClose,
  onSave,
  initial,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (e: Omit<SharedEvent, "id">) => void;
  initial?: NewEventInitial;
  accent: string;
}) {
  // 폼 상태
  const today = new Date();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [year, setYear] = useState(initial?.year ?? today.getFullYear());
  const [month, setMonth] = useState(initial?.month ?? today.getMonth());
  const [day, setDay] = useState(initial?.day ?? today.getDate());
  const [startSlot, setStartSlot] = useState(initial?.startSlot ?? 16 * 2); // 16:00
  const [endSlot, setEndSlot] = useState(initial?.endSlot ?? 17 * 2); // 17:00
  // 종료일 (멀티데이 지원) — 기본 = 시작일
  const [endYear, setEndYear] = useState(initial?.year ?? today.getFullYear());
  const [endMonth, setEndMonth] = useState(initial?.month ?? today.getMonth());
  const [endDay, setEndDay] = useState(initial?.day ?? today.getDate());
  const [colorKey, setColorKey] = useState(EVENT_COLORS[0].key);

  // 모달 열 때마다 initial 로 리셋
  useEffect(() => {
    if (open) {
      setTitle("");
      setLocation("");
      setAllDay(initial?.allDay ?? false);
      const t = new Date();
      const y = initial?.year ?? t.getFullYear();
      const m = initial?.month ?? t.getMonth();
      const d = initial?.day ?? t.getDate();
      setYear(y);
      setMonth(m);
      setDay(d);
      setEndYear(y);
      setEndMonth(m);
      setEndDay(d);
      setStartSlot(initial?.startSlot ?? 16 * 2);
      setEndSlot(initial?.endSlot ?? 17 * 2);
      setColorKey(EVENT_COLORS[0].key);
    }
  }, [open, initial]);

  if (!open) return null;

  const colorObj = EVENT_COLORS.find((c) => c.key === colorKey)!;

  const handleSave = () => {
    const finalTitle = title.trim() || "새 일정";
    // allDay 면 startSlot/endSlot 없이 (untimed plan)
    if (allDay) {
      // 시작 ~ 종료 날짜 — 같은 달/연이면 그대로, 다른 달이면 일단 시작 기준으로 처리
      onSave({
        year,
        month,
        startDay: day,
        // 같은 달/연일 때만 endDay 사용, 아니면 day 와 같게
        endDay:
          year === endYear && month === endMonth ? Math.max(endDay, day) : day,
        title: finalTitle,
        color: colorObj.color,
      });
    } else {
      // 시간 일정 — 같은 날 기준 (멀티데이 시간 일정은 미지원)
      onSave({
        year,
        month,
        startDay: day,
        endDay: day,
        startSlot,
        endSlot: Math.max(endSlot, startSlot + 1),
        title: finalTitle,
        color: colorObj.color,
      });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.4)", animation: "none" }}
    >
      <div
        className="absolute inset-0 backdrop-fade"
        style={{ background: "rgba(0,0,0,0)" }}
      />
      <div
        className="relative w-full sheet-slide-up"
        style={{
          background: "var(--bg-secondary)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: "env(safe-area-inset-top, 0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 — 취소 / 신규 / 추가 */}
        <div
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 500,
              color: accent,
              padding: 0,
            }}
          >
            취소
          </button>
          <div
            style={{
              ...TYPE.titleSection,
              fontSize: 17,
              color: "var(--text-primary)",
            }}
          >
            신규
          </div>
          <button
            onClick={handleSave}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 600,
              color: accent,
              padding: 0,
            }}
          >
            추가
          </button>
        </div>

        {/* 본문 — 그룹별 카드 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 16px 24px",
          }}
        >
          {/* 그룹 1 — 제목 + 위치 */}
          <Card>
            <Field>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Divider />
            <Field>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="위치"
                style={inputStyle}
              />
            </Field>
          </Card>

          {/* 그룹 2 — 하루 종일 + 시작 + 종료 */}
          <Card>
            <Field>
              <Label>하루 종일</Label>
              <ToggleSwitch on={allDay} onChange={setAllDay} accent={accent} />
            </Field>
            <Divider />
            <Field>
              <Label>시작</Label>
              <div style={{ display: "flex", gap: 6 }}>
                <DatePill
                  year={year}
                  month={month}
                  day={day}
                  onChange={(y, m, d) => {
                    setYear(y);
                    setMonth(m);
                    setDay(d);
                    // 종료일이 시작일보다 빠르면 자동 보정
                    if (
                      endYear < y ||
                      (endYear === y && endMonth < m) ||
                      (endYear === y && endMonth === m && endDay < d)
                    ) {
                      setEndYear(y);
                      setEndMonth(m);
                      setEndDay(d);
                    }
                  }}
                />
                {!allDay && (
                  <TimePill slot={startSlot} onChange={setStartSlot} />
                )}
              </div>
            </Field>
            <Divider />
            <Field>
              <Label>종료</Label>
              <div style={{ display: "flex", gap: 6 }}>
                <DatePill
                  year={endYear}
                  month={endMonth}
                  day={endDay}
                  onChange={(y, m, d) => {
                    setEndYear(y);
                    setEndMonth(m);
                    setEndDay(d);
                  }}
                />
                {!allDay && (
                  <TimePill
                    slot={endSlot}
                    onChange={setEndSlot}
                    min={startSlot + 1}
                  />
                )}
              </div>
            </Field>
          </Card>

          {/* 그룹 3 — 색상 (캘린더) */}
          <Card>
            <Field>
              <Label>캘린더</Label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    background: colorObj.color,
                  }}
                />
                <span style={{ fontSize: 14, color: "var(--text-primary)" }}>
                  {colorObj.label}
                </span>
              </div>
            </Field>
            <Divider />
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              {EVENT_COLORS.map((c) => {
                const sel = c.key === colorKey;
                return (
                  <button
                    key={c.key}
                    onClick={() => setColorKey(c.key)}
                    className="active:scale-95"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      background: c.color,
                      border: 0,
                      cursor: "pointer",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: sel
                        ? `0 0 0 2px var(--bg-secondary), 0 0 0 4px ${c.color}`
                        : "none",
                    }}
                    aria-label={c.label}
                  >
                    {sel && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── 내부 헬퍼 ───────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: 0,
  outline: "none",
  fontSize: 15,
  letterSpacing: "-0.3px",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  padding: 0,
};

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        borderRadius: 12,
        marginTop: 12,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
function Divider() {
  return (
    <div
      style={{
        marginLeft: 16,
        borderBottom: "0.5px solid var(--hairline)",
      }}
    />
  );
}
function Field({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 15,
        color: "var(--text-primary)",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}
function ToggleSwitch({
  on,
  onChange,
  accent,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="transition-colors"
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        background: on ? accent : "var(--bg-tertiary)",
        position: "relative",
        border: 0,
        cursor: "pointer",
      }}
    >
      <div
        className="transition-all"
        style={{
          position: "absolute",
          top: 2,
          left: on ? 22 : 2,
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}
function DatePill({
  year,
  month,
  day,
  onChange,
}: {
  year: number;
  month: number;
  day: number;
  onChange: (year: number, month: number, day: number) => void;
}) {
  // 단순한 input[type=date] 사용
  const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        const [y, m, d] = v.split("-").map(Number);
        if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
          onChange(y, m - 1, d);
        }
      }}
      style={{
        background: "var(--bg-tertiary)",
        border: 0,
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.2px",
        color: "var(--text-primary)",
        fontFamily: "inherit",
      }}
    />
  );
}
function TimePill({
  slot,
  onChange,
  min,
}: {
  slot: number;
  onChange: (s: number) => void;
  min?: number;
}) {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? "00" : "30";
  const value = `${String(h).padStart(2, "0")}:${m}`;
  return (
    <input
      type="time"
      value={value}
      step={1800}
      onChange={(e) => {
        const v = e.target.value;
        const [hh, mm] = v.split(":").map(Number);
        if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
          let next = hh * 2 + (mm >= 30 ? 1 : 0);
          if (min !== undefined && next < min) next = min;
          onChange(next);
        }
      }}
      style={{
        background: "var(--bg-tertiary)",
        border: 0,
        borderRadius: 6,
        padding: "4px 8px",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "-0.2px",
        color: "var(--text-primary)",
        fontFamily: "inherit",
      }}
    />
  );
}
