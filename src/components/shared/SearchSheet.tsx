// 일정 검색 시트 — 캘린더에서 진입, 제목 부분 매칭으로 sharedEvents 필터링
//
// 패턴: AccountSheet / NewEventModal 의 sheet-slide-up 모달 스타일 따름
// - 입력창 (autoFocus)
// - 결과 리스트: 각 항목 [날짜, 제목, 색상점]
// - 항목 탭 → onSelect(event) → 캘린더는 그 달로 이동 + 편집 모달 열기

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { SharedEvent } from "../eventStore";

export function SearchSheet({
  open,
  onClose,
  events,
  accent,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  events: SharedEvent[];
  accent: string;
  /** 결과 항목 탭 시 호출 — 부모가 그 달로 이동 + 편집 모달 열기 */
  onSelect: (e: SharedEvent) => void;
}) {
  const [query, setQuery] = useState("");

  // 모달 열 때마다 검색어 초기화
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return events
      .filter((e) => (e.title || "").toLowerCase().includes(q))
      .sort((a, b) => {
        // 시간순 (year → month → startDay → startSlot)
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        if (a.startDay !== b.startDay) return a.startDay - b.startDay;
        return (a.startSlot ?? -1) - (b.startSlot ?? -1);
      });
  }, [events, query]);

  if (!open) return null;

  function fmtDate(e: SharedEvent) {
    const m = e.month + 1;
    const d = e.startDay;
    const isRange = e.endDay !== e.startDay;
    const base = `${e.year}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}`;
    if (isRange) {
      return `${base} – ${String(e.endDay).padStart(2, "0")}`;
    }
    if (e.startSlot !== undefined) {
      const h = Math.floor(e.startSlot / 2);
      const mm = e.startSlot % 2 === 0 ? "00" : "30";
      return `${base} ${String(h).padStart(2, "0")}:${mm}`;
    }
    return base;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 backdrop-fade" style={{ background: "rgba(0,0,0,0.3)" }} />
      <div
        className="relative w-full max-w-[375px] mx-auto rounded-t-3xl sheet-slide-up"
        style={{
          background: "var(--bg-elevated)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--separator)" }} />
        </div>

        {/* 헤더 */}
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 32 }} />
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            일정 검색
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-secondary)",
              padding: 0,
            }}
          >
            닫기
          </button>
        </div>

        {/* 검색 입력 */}
        <div style={{ padding: "8px 20px 12px", flexShrink: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--bg-tertiary)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            <Search size={16} strokeWidth={2} color="var(--text-muted)" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="일정 제목으로 검색"
              className="flex-1 bg-transparent outline-none"
              style={{
                fontSize: 15,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                border: 0,
                minWidth: 0,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                  color: "var(--text-muted)",
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* 결과 영역 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 24px" }}>
          {!query.trim() && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              일정 제목을 입력하세요
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              검색 결과가 없습니다
            </div>
          )}

          {results.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect(e)}
              className="active:scale-[0.99]"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                background: "transparent",
                border: 0,
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 10,
                fontFamily: "inherit",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: e.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.3px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.title || "(제목 없음)"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 2,
                    letterSpacing: "-0.1px",
                  }}
                >
                  {fmtDate(e)}
                  {e.startSlot === undefined && (
                    <span style={{ marginLeft: 6, color: accent, fontWeight: 600 }}>플랜</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
