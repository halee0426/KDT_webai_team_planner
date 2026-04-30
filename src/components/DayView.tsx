import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarClock, GripVertical, Plus } from "lucide-react";
import { highlights } from "./tokens";
import type { Todo } from "./eventStore";

export function DayView({
  accent,
  planKind = "my",
  todos,
  onTodosChange,
}: {
  accent: string;
  planKind?: "my" | "shared";
  todos: Todo[];
  onTodosChange: (todos: Todo[]) => void;
}) {
  const setTodos: React.Dispatch<React.SetStateAction<Todo[]>> = (updater) => {
    if (typeof updater === "function") {
      onTodosChange((updater as (prev: Todo[]) => Todo[])(todos));
    } else {
      onTodosChange(updater);
    }
  };

  const [diary, setDiary] = useState("");
  const [diaryOpen, setDiaryOpen] = useState(false);
  const [adding, setAdding] = useState<"today" | "later" | null>(null);
  const [draft, setDraft] = useState("");

  const today = useMemo(() => todos.filter((t) => !t.later), [todos]);
  const later = useMemo(() => todos.filter((t) => t.later), [todos]);

  const events =
    planKind === "shared"
      ? [
          { id: 1, time: "11:00 - 12:00", title: "팀 워크숍", loc: "라운지", hl: highlights[3].color },
          { id: 2, time: "16:00 - 17:00", title: "기획 싱크", loc: "줌", hl: highlights[1].color },
        ]
      : [
          { id: 1, time: "10:00 - 11:00", title: "팀 스탠드업", loc: "회의실 A", hl: highlights[4].color },
          { id: 2, time: "14:30 - 15:30", title: "1:1 미팅", loc: "온라인", hl: highlights[5].color },
        ];

  const upcoming =
    planKind === "shared"
      ? [
          { id: 11, when: "내일 (목)", time: "10:00 - 11:30", title: "스프린트 회고", loc: "회의실 B", hl: highlights[2].color },
          { id: 12, when: "5/2 (금)", time: "13:00", title: "분기 리뷰", loc: "본관 대회의실", hl: highlights[4].color },
        ]
      : [
          { id: 11, when: "내일 (목)", time: "09:30", title: "사용자 리뷰", loc: "온라인", hl: highlights[2].color },
          { id: 12, when: "5/2 (금)", time: "14:00 - 16:00", title: "병원 검진", loc: "강남 연세병원", hl: highlights[0].color },
          { id: 13, when: "5/4 (일)", time: "종일", title: "가족 모임", loc: "양평", hl: highlights[3].color },
        ];

  const toggle = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const move = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, later: !t.later, rolled: false } : t)));

  const submitAdd = () => {
    if (!draft.trim()) {
      setAdding(null);
      return;
    }
    setTodos((ts) => [
      ...ts,
      { id: Date.now(), text: draft.trim(), done: false, later: adding === "later" },
    ]);
    setDraft("");
    setAdding(null);
  };

  const doneCount = today.filter((t) => t.done).length;
  const progress = today.length === 0 ? 0 : doneCount / today.length;

  return (
    <div className="px-5 pt-6 pb-32 lg:px-0 lg:pt-2 lg:pb-10">
      <div className="mx-auto w-full max-w-[1380px]">
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          4월 29일 화요일
        </div>
        <div
          className="mt-1 text-[var(--text-secondary)]"
          style={{ fontSize: 13, letterSpacing: "-0.224px" }}
        >
          할 일 {today.filter((t) => !t.done).length}개 · 일정 {events.length}개
          {planKind === "shared" && " · 멤버 4명"}
        </div>

        {planKind === "shared" && (
          <div className="mt-3 flex items-center gap-2">
            {["지민", "서아", "현우", "나"].map((n, i) => (
              <div
                key={n}
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{
                  background: [accent, "#FF9500", "#34C759", "#AF52DE"][i],
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "1.5px solid var(--bg-canvas)",
                  marginLeft: i === 0 ? 0 : -10,
                }}
              >
                {n[0]}
              </div>
            ))}
            <span className="ml-1" style={{ fontSize: 11, color: "var(--text-muted)" }}>
              함께하는 플랜
            </span>
          </div>
        )}

        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          <div>
            <SectionLabel>오늘 일정</SectionLabel>
            <div className="space-y-2">
              {events.length === 0 ? (
                <EmptyCard>오늘 예정된 일정이 없어요</EmptyCard>
              ) : (
                events.map((e) => (
                  <EventCard
                    key={e.id}
                    highlight={e.hl}
                    top={e.time}
                    title={e.title}
                    bottom={e.loc}
                  />
                ))
              )}
            </div>

            <SectionLabel>다가오는 일정</SectionLabel>
            <div className="space-y-2">
              {upcoming.length === 0 ? (
                <EmptyCard>예정된 다음 일정이 없어요</EmptyCard>
              ) : (
                upcoming.map((e) => (
                  <EventCard
                    key={e.id}
                    highlight={e.hl}
                    top={
                      <div className="flex items-baseline gap-2">
                        <div style={{ fontSize: 12, fontWeight: 600, color: accent, letterSpacing: "-0.2px" }}>
                          {e.when}
                        </div>
                        <div className="text-[var(--text-secondary)]" style={{ fontSize: 13, letterSpacing: "-0.224px" }}>
                          {e.time}
                        </div>
                      </div>
                    }
                    title={e.title}
                    bottom={e.loc}
                  />
                ))
              )}
            </div>
          </div>

          <div>
            <SectionLabel>할일</SectionLabel>
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--hairline)",
                boxShadow: "var(--card-shadow)",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: `${accent}1A`, color: accent }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7.5L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>할일</div>
                  <span
                    className="rounded-full px-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "var(--bg-tertiary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {doneCount}/{today.length}
                  </span>
                </div>
                <button
                  onClick={() => setAdding("today")}
                  className="flex h-7 w-7 items-center justify-center rounded-full active:scale-90"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="px-5">
                <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--bg-tertiary)" }}>
                  <div
                    className="h-full transition-all"
                    style={{ width: `${progress * 100}%`, background: accent, borderRadius: 999 }}
                  />
                </div>
              </div>

              <div className="px-2 pt-2 pb-2">
                {today.map((t) => (
                  <TodoRow
                    key={t.id}
                    t={t}
                    accent={accent}
                    onToggle={() => toggle(t.id)}
                    onMove={() => move(t.id)}
                    moveIcon={<ArrowDown size={14} />}
                    moveLabel="나중에"
                  />
                ))}
                {adding === "today" && (
                  <AddRow
                    draft={draft}
                    setDraft={setDraft}
                    onSubmit={submitAdd}
                    onCancel={() => {
                      setAdding(null);
                      setDraft("");
                    }}
                  />
                )}
                {today.length === 0 && adding !== "today" && (
                  <div className="py-4 text-center" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    오늘 할 일이 없어요. 쉬어도 괜찮아요
                  </div>
                )}
              </div>
            </div>

            <SectionLabel>나중에 할 일</SectionLabel>
            <div
              className="overflow-hidden rounded-3xl"
              style={{
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--hairline)",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                  >
                    <CalendarClock size={14} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>나중에 할 일</div>
                  <span
                    className="rounded-full px-2"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {later.length}
                  </span>
                </div>
                <button
                  onClick={() => setAdding("later")}
                  className="flex h-7 w-7 items-center justify-center rounded-full active:scale-90"
                  style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="px-2 pb-2">
                {later.map((t) => (
                  <TodoRow
                    key={t.id}
                    t={t}
                    accent={accent}
                    dim
                    onToggle={() => toggle(t.id)}
                    onMove={() => move(t.id)}
                    moveIcon={<ArrowUp size={14} />}
                    moveLabel="오늘로"
                  />
                ))}
                {adding === "later" && (
                  <AddRow
                    draft={draft}
                    setDraft={setDraft}
                    onSubmit={submitAdd}
                    onCancel={() => {
                      setAdding(null);
                      setDraft("");
                    }}
                  />
                )}
                {later.length === 0 && adding !== "later" && (
                  <div className="py-4 text-center" style={{ fontSize: 13, color: "var(--text-muted)" }}>
                    미뤄둔 일이 없어요
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <SectionLabel>한 줄 일기</SectionLabel>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--hairline)",
          }}
        >
          {diaryOpen ? (
            <textarea
              autoFocus
              value={diary}
              onChange={(e) => setDiary(e.target.value)}
              onBlur={() => setDiaryOpen(false)}
              placeholder="오늘 하루를 한 줄로 남겨보세요..."
              className="w-full resize-none bg-transparent outline-none"
              style={{ fontSize: 17, letterSpacing: "-0.374px", lineHeight: 1.47, minHeight: 80 }}
            />
          ) : (
            <button
              onClick={() => setDiaryOpen(true)}
              className="w-full text-left text-[var(--text-muted)]"
              style={{ fontSize: 17, letterSpacing: "-0.374px" }}
            >
              {diary || "오늘 하루를 한 줄로 남겨보세요..."}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl py-5 text-center"
      style={{
        background: "var(--bg-elevated)",
        border: "0.5px solid var(--hairline)",
        fontSize: 13,
        color: "var(--text-muted)",
      }}
    >
      {children}
    </div>
  );
}

function EventCard({
  highlight,
  top,
  title,
  bottom,
}: {
  highlight: string;
  top: React.ReactNode;
  title: string;
  bottom: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: "var(--bg-elevated)",
        border: "0.5px solid var(--hairline)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: highlight }} />
      <div className="py-3 pl-4 pr-4">
        <div className="text-[var(--text-secondary)]" style={{ fontSize: 13, letterSpacing: "-0.224px" }}>
          {top}
        </div>
        <div className="mt-0.5" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>
          {title}
        </div>
        <div className="mt-0.5 text-[var(--text-muted)]" style={{ fontSize: 13, letterSpacing: "-0.224px" }}>
          {bottom}
        </div>
      </div>
    </div>
  );
}

function TodoRow({
  t,
  accent,
  dim,
  onToggle,
  onMove,
  moveIcon,
  moveLabel,
}: {
  t: Todo;
  accent: string;
  dim?: boolean;
  onToggle: () => void;
  onMove: () => void;
  moveIcon: React.ReactNode;
  moveLabel: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-[var(--bg-tertiary)]">
      <button
        onClick={onToggle}
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          border: t.done ? "none" : "1.5px solid var(--separator)",
          background: t.done ? accent : "transparent",
        }}
      >
        {t.done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <div
        className="flex min-w-0 flex-1 items-center gap-2"
        style={{
          fontSize: 17,
          letterSpacing: "-0.374px",
          opacity: t.done ? 0.4 : dim ? 0.75 : 1,
          textDecoration: t.done ? "line-through" : "none",
        }}
      >
        <span className="truncate">{t.text}</span>
        {t.rolled && (
          <span
            className="shrink-0 rounded-full px-2 py-[2px]"
            style={{
              fontSize: 11,
              fontWeight: 500,
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
            }}
          >
            어제 이월
          </span>
        )}
      </div>
      <button
        onClick={onMove}
        className="flex items-center gap-1 rounded-full px-2 py-1 opacity-0 transition-opacity active:scale-95 group-hover:opacity-100"
        style={{ background: "var(--bg-tertiary)", fontSize: 11, color: "var(--text-secondary)" }}
      >
        {moveIcon}
        {moveLabel}
      </button>
      <GripVertical size={14} className="shrink-0 text-[var(--text-muted)]" />
    </div>
  );
}

function AddRow({
  draft,
  setDraft,
  onSubmit,
  onCancel,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2">
      <div
        className="h-[22px] w-[22px] shrink-0 rounded-full"
        style={{ border: "1.5px dashed var(--separator)" }}
      />
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={onSubmit}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="새 할일 입력"
        className="flex-1 bg-transparent outline-none"
        style={{ fontSize: 17, letterSpacing: "-0.374px" }}
      />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mt-7 mb-3 text-[var(--text-muted)]"
      style={{
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
