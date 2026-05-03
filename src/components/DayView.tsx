import { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, ArrowDown, ArrowUp, CalendarClock, Trash2 } from "lucide-react";
import { highlights } from "./tokens";
import type { Todo, SharedEvent } from "./eventStore";
import type { Group } from "@/types/group";
import { MemberAvatarStack, membersFromGroup } from "./shared/MemberAvatar";
import { TYPE } from "@/styles/typography";

export function DayView({
  accent,
  planKind = "my",
  todos,
  onTodosChange,
  events: realEvents = [],
  onOpenEdit,
  activeGroup = null,
  currentUid = null,
}: {
  accent: string;
  planKind?: string;
  todos: Todo[];
  onTodosChange: (todos: Todo[]) => void;
  /** 실제 일정 데이터 (sharedEvents) — App.tsx 가 전달 */
  events?: SharedEvent[];
  /** 일정 카드 탭 시 외부 편집 모달 열기 */
  onOpenEdit?: (e: SharedEvent) => void;
  /** planKind 가 그룹일 때 — 멤버 아바타와 카운트에 사용 */
  activeGroup?: Group | null;
  currentUid?: string | null;
}) {
  // 부모로 끌어올린 todos를 setter 형식으로 사용 (기존 setTodos 호출 호환)
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
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
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

  const today = useMemo(() => todos.filter((t) => !t.later), [todos]);
  const later = useMemo(() => todos.filter((t) => t.later), [todos]);

  // 오늘 날짜 — 실시간
  const todayDate = useMemo(() => new Date(), []);
  const todayY = todayDate.getFullYear();
  const todayM = todayDate.getMonth();
  const todayD = todayDate.getDate();

  // 시간 일정만 (allDay 가 아닌 것) 의 슬롯 → "HH:MM — HH:MM"
  const slotToTime = (s?: number) => {
    if (s == null) return null;
    const h = Math.floor(s / 2);
    const m = s % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
  };

  // 오늘 일정 — 시작일 ≤ 오늘 ≤ 종료일 + 시간이 있는 것
  const todayEvents = useMemo(
    () =>
      realEvents.filter(
        (e) =>
          e.year === todayY &&
          e.month === todayM &&
          e.startDay <= todayD &&
          e.endDay >= todayD &&
          e.startSlot != null,
      ),
    [realEvents, todayY, todayM, todayD],
  );

  // 다가오는 일정 — 오늘 이후 7일 내, 또는 같은 달 종일 일정
  const upcomingEvents = useMemo(() => {
    const tStart = new Date(todayY, todayM, todayD);
    const sevenLater = new Date(todayY, todayM, todayD + 7);
    return realEvents
      .filter((e) => {
        const eStart = new Date(e.year, e.month, e.startDay);
        return eStart > tStart && eStart <= sevenLater;
      })
      .sort((a, b) => {
        const da = new Date(a.year, a.month, a.startDay).getTime();
        const db = new Date(b.year, b.month, b.startDay).getTime();
        return da - db;
      })
      .slice(0, 5);
  }, [realEvents, todayY, todayM, todayD]);

  // 표시용 어댑터 — 기존 카드 렌더링 형식 유지
  const events = todayEvents.map((e) => {
    const start = slotToTime(e.startSlot);
    const end = slotToTime(e.endSlot);
    return {
      id: e.id,
      time: start && end ? `${start} — ${end}` : start ?? "종일",
      title: e.title,
      loc: "",
      hl: e.color,
      _raw: e, // 클릭 시 onOpenEdit 에 전달
    };
  });

  const formatRelDay = (e: SharedEvent) => {
    const eStart = new Date(e.year, e.month, e.startDay);
    const diff = Math.round(
      (eStart.getTime() - new Date(todayY, todayM, todayD).getTime()) / 86400000,
    );
    const wd = ["일", "월", "화", "수", "목", "금", "토"][eStart.getDay()];
    if (diff === 1) return `내일 (${wd})`;
    if (diff === 2) return `모레 (${wd})`;
    return `${e.month + 1}/${e.startDay} (${wd})`;
  };

  const upcoming = upcomingEvents.map((e) => {
    const start = slotToTime(e.startSlot);
    const end = slotToTime(e.endSlot);
    return {
      id: e.id,
      when: formatRelDay(e),
      time: start && end ? `${start} — ${end}` : start ?? "종일",
      title: e.title,
      loc: "",
      hl: e.color,
      _raw: e,
    };
  });

  const toggle = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const move = (id: number) =>
    setTodos((ts) => ts.map((t) => (t.id === id ? { ...t, later: !t.later, rolled: false } : t)));
  const startEditTodo = (todo: Todo) => {
    setAdding(null);
    setDraft("");
    setEditingTodoId(todo.id);
    setEditDraft(todo.text);
  };
  const cancelEditTodo = () => {
    setEditingTodoId(null);
    setEditDraft("");
  };
  const saveEditTodo = () => {
    if (editingTodoId === null) return;
    const text = editDraft.trim();
    if (!text) {
      setTodos((ts) => ts.filter((t) => t.id !== editingTodoId));
    } else {
      setTodos((ts) => ts.map((t) => (t.id === editingTodoId ? { ...t, text } : t)));
    }
    cancelEditTodo();
  };
  const deleteTodo = (id: number) =>
    setTodos((ts) => ts.filter((t) => t.id !== id));
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

  const pageTitleStyle = isDesktop
    ? { ...TYPE.titlePage, fontSize: 40, fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.08 }
    : TYPE.titlePage;
  const pageMetaStyle = isDesktop
    ? { ...TYPE.bodySmall, fontSize: 17, fontWeight: 600, letterSpacing: "-0.2px" }
    : TYPE.bodySmall;

  return (
    <div className={isDesktop ? "px-0 pb-10 pt-7" : "px-5 pb-32"} style={{ paddingTop: isDesktop ? undefined : 24 }}>
      {/* 헤더 섹션 — 한 묶음 */}
      <div
        style={{
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "0.5px solid var(--hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ ...pageTitleStyle, color: "var(--text-primary)" }}>
            {todayM + 1}월 {todayD}일
          </span>
          <span style={{ ...TYPE.captionMeta, color: accent, fontWeight: 600 }}>
            {["일", "월", "화", "수", "목", "금", "토"][todayDate.getDay()]}요일
          </span>
        </div>
        <div
          style={{
            ...pageMetaStyle,
            color: "var(--text-secondary)",
            marginTop: 6,
          }}
        >
          할일 {today.filter((t) => !t.done).length} · 일정 {events.length}
          {planKind !== "my" && activeGroup && ` · 멤버 ${activeGroup.memberUids.length}`}
        </div>
      {planKind !== "my" && activeGroup && (
        <div className="flex items-center gap-2 mt-3">
          <MemberAvatarStack
            members={membersFromGroup(activeGroup)}
            size={28}
            max={4}
            accent={accent}
            currentUid={currentUid}
            ringBg="var(--bg-canvas)"
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }} className="ml-1">
            {activeGroup.name}
          </span>
        </div>
      )}
      </div>

      <div
        style={
          isDesktop
            ? {
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                columnGap: 28,
                alignItems: "start",
              }
            : undefined
        }
      >
        <div>
      {/* 오늘 일정 — 헤더 바로 아래 (가장 먼저 보이게) */}
      <SectionLabel>오늘 일정</SectionLabel>
      <div className="space-y-2">
        {events.length === 0 ? (
          <div
            className="rounded-2xl py-5 text-center"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--hairline)",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            오늘 잡힌 일정이 없어요
          </div>
        ) : (
          events.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpenEdit?.(e._raw)}
              className="relative rounded-2xl overflow-hidden text-left w-full active:scale-[0.99] transition-transform"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--hairline)",
                boxShadow: "var(--card-shadow)",
                cursor: onOpenEdit ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: e.hl }} />
              <div className="pl-4 pr-4 py-3">
                <div style={{ fontSize: 13, letterSpacing: "-0.224px" }} className="text-[var(--text-secondary)]">
                  {e.time}
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }} className="mt-0.5">
                  {e.title}
                </div>
                {e.loc && (
                  <div style={{ fontSize: 13, letterSpacing: "-0.224px" }} className="text-[var(--text-muted)] mt-0.5">
                    {e.loc}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* 다가오는 일정 — 오늘 일정 다음 */}
      <SectionLabel>다가오는 일정</SectionLabel>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <div
            className="rounded-2xl py-5 text-center"
            style={{
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--hairline)",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            예정된 일정이 없어요
          </div>
        ) : (
          upcoming.map((e) => (
            <button
              key={e.id}
              onClick={() => onOpenEdit?.(e._raw)}
              className="relative rounded-2xl overflow-hidden text-left w-full active:scale-[0.99] transition-transform"
              style={{
                background: "var(--bg-elevated)",
                border: "0.5px solid var(--hairline)",
                boxShadow: "var(--card-shadow)",
                cursor: onOpenEdit ? "pointer" : "default",
                fontFamily: "inherit",
              }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: e.hl }} />
              <div className="pl-4 pr-4 py-3">
                <div className="flex items-baseline gap-2">
                  <div style={{ fontSize: 12, fontWeight: 600, color: accent, letterSpacing: "-0.2px" }}>
                    {e.when}
                  </div>
                  <div style={{ fontSize: 13, letterSpacing: "-0.224px" }} className="text-[var(--text-secondary)]">
                    {e.time}
                  </div>
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }} className="mt-0.5">
                  {e.title}
                </div>
                {e.loc && (
                  <div style={{ fontSize: 13, letterSpacing: "-0.224px" }} className="text-[var(--text-muted)] mt-0.5">
                    {e.loc}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

        </div>

        <div>
          {isDesktop && <SectionLabel>할일</SectionLabel>}
      {/* Today todos card */}
      <div
        className={`${isDesktop ? "" : "mt-6"} rounded-3xl overflow-hidden`}
        style={{
          background: "var(--bg-elevated)",
          border: "0.5px solid var(--hairline)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: `${accent}1A`, color: accent }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7.5L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>할일</div>
            <span
              className="px-2 rounded-full"
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
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="px-5">
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
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
              onEdit={() => startEditTodo(t)}
              onDelete={() => deleteTodo(t.id)}
              isEditing={editingTodoId === t.id}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              onSaveEdit={saveEditTodo}
              onCancelEdit={cancelEditTodo}
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
            <div className="text-center py-4" style={{ fontSize: 13, color: "var(--text-muted)" }}>
              오늘은 할일이 없어요 ☀️
            </div>
          )}
        </div>
      </div>

      {/* Later todos card */}
      <div
        className="mt-3 rounded-3xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "0.5px solid var(--hairline)",
        }}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              <CalendarClock size={14} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.374px" }}>나중에 할 일</div>
            <span
              className="px-2 rounded-full"
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
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
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
              onEdit={() => startEditTodo(t)}
              onDelete={() => deleteTodo(t.id)}
              isEditing={editingTodoId === t.id}
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              onSaveEdit={saveEditTodo}
              onCancelEdit={cancelEditTodo}
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
            <div className="text-center py-4" style={{ fontSize: 13, color: "var(--text-muted)" }}>
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
            placeholder="오늘 하루를 한 줄로..."
            className="w-full bg-transparent outline-none resize-none"
            style={{ fontSize: 17, letterSpacing: "-0.374px", lineHeight: 1.47, minHeight: 80 }}
          />
        ) : (
          <button
            onClick={() => setDiaryOpen(true)}
            className="w-full text-left text-[var(--text-muted)]"
            style={{ fontSize: 17, letterSpacing: "-0.374px" }}
          >
            {diary || "오늘 하루를 한 줄로..."}
          </button>
        )}
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
  onEdit,
  onDelete,
  isEditing,
  editDraft,
  setEditDraft,
  onSaveEdit,
  onCancelEdit,
  moveIcon,
  moveLabel,
}: {
  t: Todo;
  accent: string;
  dim?: boolean;
  onToggle: () => void;
  onMove: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editDraft: string;
  setEditDraft: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  moveIcon: React.ReactNode;
  moveLabel: string;
}) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors">
      <button
        onClick={onToggle}
        className="w-[22px] h-[22px] rounded-full flex items-center justify-center transition-transform active:scale-90 shrink-0"
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
      {isEditing ? (
        <input
          autoFocus
          value={editDraft}
          onChange={(e) => setEditDraft(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
          className="min-w-0 flex-1 rounded-xl bg-transparent px-2 py-1 outline-none"
          style={{
            fontSize: 17,
            letterSpacing: "-0.374px",
            border: "0.5px solid var(--hairline)",
          }}
        />
      ) : (
      <button
        type="button"
        onClick={onEdit}
        className="flex-1 flex items-center gap-2 min-w-0"
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
            className="px-2 py-[2px] rounded-full shrink-0"
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
      </button>
      )}
      <button
        onClick={onMove}
        className="flex items-center gap-1 px-2 py-1 rounded-full transition-transform active:scale-95"
        style={{ background: "var(--bg-tertiary)", fontSize: 11, color: "var(--text-secondary)" }}
      >
        {moveIcon}
        <span className="hidden sm:inline">{moveLabel}</span>
      </button>
      <button
        onClick={onDelete}
        aria-label="할일 삭제"
        title="할일 삭제"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full transition-transform active:scale-90"
        style={{ background: "var(--bg-tertiary)", color: "#FF3B30" }}
      >
        <Trash2 size={14} />
      </button>
      <GripVertical size={14} className="text-[var(--text-muted)] shrink-0" />
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
        className="w-[22px] h-[22px] rounded-full shrink-0"
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
