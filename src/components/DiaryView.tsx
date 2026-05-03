import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Entry = {
  id: string;
  year: number;
  month: number;
  day: number;
  mood: string;
  text: string;
};

const MOODS = ["😊", "😐", "😢", "🥳", "😴", "😤"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function makeId(y: number, m: number, d: number) {
  return `${y}-${m}-${d}`;
}

export function DiaryView({
  accent,
  planKind = "my",
}: {
  accent: string;
  planKind?: "my" | "shared";
}) {
  const seed: Entry[] =
    planKind === "shared"
      ? [
          { id: "2026-3-29", year: 2026, month: 3, day: 29, mood: "🥳", text: "팀 워크숍 후기 — 모두가 즐겁게 참여했다. 다음 분기 목표도 함께 정했다." },
          { id: "2026-3-27", year: 2026, month: 3, day: 27, mood: "😊", text: "지민이 공유한 시안 좋았다. 수아가 피드백을 정리해줬다." },
          { id: "2026-3-24", year: 2026, month: 3, day: 24, mood: "😐", text: "회의가 길었다. 결론은 다음 주로 미뤘다." },
        ]
      : [
          { id: "2026-3-29", year: 2026, month: 3, day: 29, mood: "😊", text: "오늘은 디자인 리뷰가 있었다. 팀원들과 좋은 의견을 나눴고 다음 주에 적용하기로 했다." },
          { id: "2026-3-28", year: 2026, month: 3, day: 28, mood: "😐", text: "평범한 하루. 회의가 많아 집중하기 어려웠다." },
          { id: "2026-3-26", year: 2026, month: 3, day: 26, mood: "😊", text: "주말에 산책. 날씨가 좋았다." },
        ];

  const [entries, setEntries] = useState<Entry[]>(seed);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(3); // 0-indexed April
  const [selectedDay, setSelectedDay] = useState(29);
  const [draftMood, setDraftMood] = useState<string>(() => seed.find((e) => e.day === 29)?.mood ?? "😊");
  const [draftText, setDraftText] = useState<string>(() => seed.find((e) => e.day === 29)?.text ?? "");
  const [savedHint, setSavedHint] = useState(true);
  const [tab, setTab] = useState<"write" | "list">("write");
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1100 : false,
  );

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const stripRef = useRef<HTMLDivElement>(null);
  const latestMood = useRef(draftMood);
  const latestText = useRef(draftText);

  useEffect(() => { latestMood.current = draftMood; }, [draftMood]);
  useEffect(() => { latestText.current = draftText; }, [draftText]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1100);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const getEntry = (y: number, m: number, d: number) =>
    entries.find((e) => e.year === y && e.month === m && e.day === d);

  // Commit current draft to entries
  const commitDraft = (y: number, m: number, d: number, mood: string, text: string) => {
    const id = makeId(y, m, d);
    setEntries((prev) => {
      const exists = prev.find((e) => e.id === id);
      if (exists) {
        return prev.map((e) => (e.id === id ? { ...e, mood, text } : e));
      }
      if (!text.trim()) return prev; // don't create empty entry
      return [...prev, { id, year: y, month: m, day: d, mood, text }];
    });
  };

  // Select a new day — auto-save current, then load target
  const selectDay = (day: number) => {
    clearTimeout(saveTimer.current);
    commitDraft(viewYear, viewMonth, selectedDay, latestMood.current, latestText.current);
    setSelectedDay(day);
    const e = getEntry(viewYear, viewMonth, day);
    const mood = e?.mood ?? "😊";
    const text = e?.text ?? "";
    setDraftMood(mood);
    setDraftText(text);
    setSavedHint(!!e);
    // scroll strip to selected
    setTimeout(() => {
      const strip = stripRef.current;
      if (!strip) return;
      const btn = strip.children[day - 1] as HTMLElement;
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
  };

  // Change month
  const changeMonth = (delta: number) => {
    clearTimeout(saveTimer.current);
    commitDraft(viewYear, viewMonth, selectedDay, latestMood.current, latestText.current);
    let nm = viewMonth + delta;
    let ny = viewYear;
    if (nm < 0) { nm = 11; ny--; }
    if (nm > 11) { nm = 0; ny++; }
    const newMax = new Date(ny, nm + 1, 0).getDate();
    const newDay = Math.min(1, newMax);
    setViewYear(ny);
    setViewMonth(nm);
    setSelectedDay(newDay);
    const e = getEntry(ny, nm, newDay);
    setDraftMood(e?.mood ?? "😊");
    setDraftText(e?.text ?? "");
    setSavedHint(!!e);
  };

  // Text change → debounced auto-save
  const handleTextChange = (text: string) => {
    setDraftText(text);
    setSavedHint(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      commitDraft(viewYear, viewMonth, selectedDay, latestMood.current, text);
      setSavedHint(true);
    }, 700);
  };

  // Mood change → immediate save
  const handleMoodChange = (mood: string) => {
    setDraftMood(mood);
    commitDraft(viewYear, viewMonth, selectedDay, mood, latestText.current);
  };

  const selectedWday = WEEKDAYS[new Date(viewYear, viewMonth, selectedDay).getDay()];

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    if (a.month !== b.month) return b.month - a.month;
    return b.day - a.day;
  });

  // Scroll strip to selected day on mount
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const btn = strip.children[selectedDay - 1] as HTMLElement;
    if (btn) btn.scrollIntoView({ block: "nearest", inline: "center" });
  }, []);

  return (
    <div className={isDesktop ? "px-0 pt-7 pb-10" : "px-5 pt-4 pb-32"}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div
          style={{
            fontSize: isDesktop ? 40 : 22,
            fontWeight: isDesktop ? 800 : 700,
            letterSpacing: "-0.4px",
            lineHeight: isDesktop ? 1.08 : undefined,
          }}
        >
          일기
        </div>
        {/* 좌우 탭 토글 */}
        <div
          className="flex items-center"
          style={{
            background: "var(--bg-tertiary)",
            borderRadius: 999,
            padding: 3,
            gap: 2,
          }}
        >
          {([
            { key: "write", label: "쓰기" },
            { key: "list", label: "목록" },
          ] as const).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="active:scale-95 transition-transform"
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? "#fff" : "var(--text-secondary)",
                  background: active ? accent : "transparent",
                  border: 0,
                  cursor: "pointer",
                  transition: "background 180ms, color 180ms",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Month nav + date strip ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--hairline)" }}
      >
        {/* Month row */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderBottom: "0.5px solid var(--hairline)" }}
        >
          <button
            onClick={() => changeMonth(-1)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <ChevronLeft size={14} />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.2px" }}>
            {viewYear}년 {viewMonth + 1}월
          </div>
          <button
            onClick={() => changeMonth(1)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "var(--bg-tertiary)" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Day strip */}
        <div
          ref={stripRef}
          className="flex overflow-x-auto px-2 py-2 gap-1"
          style={{ scrollbarWidth: "none" }}
        >
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const hasEntry = !!getEntry(viewYear, viewMonth, d);
            const isSel = d === selectedDay;
            const dow = new Date(viewYear, viewMonth, d).getDay();
            return (
              <button
                key={d}
                onClick={() => selectDay(d)}
                className="flex flex-col items-center shrink-0 rounded-xl pt-1.5 pb-2 active:scale-95"
                style={{
                  width: 36,
                  background: isSel ? accent : "transparent",
                  transition: "background 180ms",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    marginBottom: 2,
                    color: isSel
                      ? "rgba(255,255,255,0.75)"
                      : dow === 0
                      ? "#FF3B30"
                      : dow === 6
                      ? "#0066cc"
                      : "var(--text-muted)",
                  }}
                >
                  {WEEKDAYS[dow]}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: isSel ? 700 : 500,
                    color: isSel ? "#fff" : "var(--text-primary)",
                  }}
                >
                  {d}
                </div>
                <div
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    marginTop: 3,
                    background: hasEntry
                      ? isSel
                        ? "rgba(255,255,255,0.65)"
                        : accent
                      : "transparent",
                  }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Writing area (tab === "write") ── */}
      {tab === "write" && (
      <div
        className="mt-4 rounded-2xl px-4 pt-4 pb-3"
        style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--hairline)" }}
      >
        {/* Date + save hint */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.374px" }}>
              {viewMonth + 1}월 {selectedDay}일
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{selectedWday}요일</div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginTop: 4,
              opacity: savedHint ? 1 : 0,
              transition: "opacity 300ms",
            }}
          >
            저장됨
          </div>
        </div>

        {/* Mood picker */}
        <div
          className="flex items-center gap-1 mb-3 px-1 py-2 rounded-xl"
          style={{ background: "var(--bg-tertiary)" }}
        >
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => handleMoodChange(m)}
              className="flex-1 flex items-center justify-center rounded-lg py-1 active:scale-90"
              style={{
                fontSize: 20,
                background: draftMood === m ? "var(--bg-elevated)" : "transparent",
                boxShadow: draftMood === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                opacity: draftMood === m ? 1 : 0.4,
                transition: "all 150ms",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ borderTop: "0.5px solid var(--hairline)", marginBottom: 12 }} />

        {/* Textarea */}
        <textarea
          value={draftText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="오늘을 기록해보세요..."
          className="w-full bg-transparent outline-none resize-none"
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            letterSpacing: "-0.224px",
            color: "var(--text-primary)",
            minHeight: 180,
          }}
        />
      </div>
      )}

      {/* ── List view (tab === "list") — 게시판 형식 ── */}
      {tab === "list" && (
        <div className="mt-4">
          {/* 카운트 헤더 */}
          <div
            className="flex items-center justify-between mb-2 px-1"
            style={{ fontSize: 12, color: "var(--text-muted)" }}
          >
            <span>
              {viewYear}년 {viewMonth + 1}월 ·{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                {sortedEntries.filter((e) => e.year === viewYear && e.month === viewMonth).length}
              </span>
              개
            </span>
            <span>전체 {sortedEntries.length}개</span>
          </div>

          {sortedEntries.length === 0 ? (
            <div
              className="text-center rounded-2xl py-12"
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--hairline)",
              }}
            >
              아직 작성한 일기가 없어요
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedEntries.map((e, idx) => {
                const dow = WEEKDAYS[new Date(e.year, e.month, e.day).getDay()];
                const isCurrent =
                  e.year === viewYear && e.month === viewMonth && e.day === selectedDay;
                // 본문에서 첫 줄을 제목처럼 사용
                const firstLine = (e.text || "").split("\n")[0].trim();
                const title = firstLine.length > 0 ? firstLine.slice(0, 28) : "내용 없음";
                const rest = e.text ? e.text.slice(firstLine.length).trim() : "";
                return (
                  <button
                    key={e.id}
                    onClick={() => {
                      clearTimeout(saveTimer.current);
                      commitDraft(
                        viewYear,
                        viewMonth,
                        selectedDay,
                        latestMood.current,
                        latestText.current,
                      );
                      setViewYear(e.year);
                      setViewMonth(e.month);
                      setSelectedDay(e.day);
                      setDraftMood(e.mood);
                      setDraftText(e.text);
                      setSavedHint(true);
                      setTab("write");
                    }}
                    className="w-full text-left rounded-2xl p-3 active:scale-[0.99] item-rise-in"
                    style={{
                      background: isCurrent ? `${accent}10` : "var(--bg-elevated)",
                      border: isCurrent
                        ? `1px solid ${accent}55`
                        : "0.5px solid var(--hairline)",
                      display: "flex",
                      alignItems: "stretch",
                      gap: 12,
                      animationDelay: `${Math.min(idx * 35, 280)}ms`,
                    }}
                  >
                    {/* 썸네일 — mood emoji + 그라데이션 배경 */}
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 14,
                        flexShrink: 0,
                        background: `linear-gradient(135deg, ${accent}22 0%, ${accent}0A 100%)`,
                        border: `0.5px solid ${accent}33`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 30,
                      }}
                    >
                      {e.mood}
                    </div>

                    {/* 본문 */}
                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* 날짜 + 제목 */}
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            color: isCurrent ? accent : "var(--text-muted)",
                            fontWeight: 600,
                            letterSpacing: "-0.1px",
                          }}
                        >
                          {e.year}.{String(e.month + 1).padStart(2, "0")}.
                          {String(e.day).padStart(2, "0")} ({dow})
                        </div>
                        <div
                          className="line-clamp-1"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            letterSpacing: "-0.3px",
                            color: "var(--text-primary)",
                            marginTop: 2,
                          }}
                        >
                          {title}
                        </div>
                      </div>

                      {/* 본문 일부 */}
                      <div
                        className="line-clamp-2"
                        style={{
                          fontSize: 12,
                          lineHeight: 1.5,
                          letterSpacing: "-0.15px",
                          color: "var(--text-secondary)",
                          marginTop: 4,
                        }}
                      >
                        {rest.length > 0 ? (
                          rest
                        ) : firstLine.length > title.length ? (
                          firstLine.slice(title.length)
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            한 줄로 짧게 남겨놨어요
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
