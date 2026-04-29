// Figma Make 디자인 그대로 — 모바일 앱 프레임 + 7개 뷰 + 탭바

import { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon, Calendar, CalendarDays, Target,
  MoreHorizontal, Sparkles, Sun, BookOpen, Clock, Grid3x3,
  User as UserIcon, Users as UsersIcon,
} from "lucide-react";
import { accents, AccentKey } from "@/components/tokens";
import {
  initialSharedEvents,
  initialMyTodos,
  initialSharedTodos,
} from "@/components/eventStore";
import type { SharedEvent, Todo } from "@/components/eventStore";
import { DayView } from "@/components/DayView";
import { MonthView } from "@/components/MonthView";
import { YearView } from "@/components/YearView";
import { WeekView } from "@/components/WeekView";
import { TenMinPlanner } from "@/components/TenMinPlanner";
import { MandalaView } from "@/components/MandalaView";
import { DiaryView } from "@/components/DiaryView";
import { DailyFlipView } from "@/components/DailyFlipView";
import { Settings } from "@/components/Settings";
import { Splash } from "@/components/Splash";
import { PlanSelect } from "@/components/PlanSelect";
import { LogoLockup } from "@/components/Logo";
import { InsightGreeting, shouldShowInsightToday } from "@/components/shared/InsightGreeting";
import { AIChatModal, type AIEvent } from "@/components/ai/AIChatModal";
import { usePersistedState } from "@/hooks/usePersistedState";

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";

/** PlanSelect에 표시할 통계 계산 — 사용자 실제 데이터 기반 */
function computePlanStats({
  sharedEvents,
  myTodos,
  sharedTodos,
}: {
  sharedEvents: SharedEvent[];
  myTodos: Todo[];
  sharedTodos: Todo[];
}) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();    // 0-indexed
  const d = now.getDate();

  // 이번 주 (월요일 ~ 일요일)
  const dow = now.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const weekStart = new Date(y, m, d + mondayOffset);
  const weekEnd = new Date(y, m, d + mondayOffset + 6);

  // SharedEvent 안의 날짜를 Date 객체로
  const eventCoversDate = (e: SharedEvent, target: Date) => {
    const start = new Date(e.year, e.month, e.startDay);
    const end = new Date(e.year, e.month, e.endDay);
    return target >= start && target <= end;
  };
  const eventOverlapsRange = (e: SharedEvent, from: Date, to: Date) => {
    const start = new Date(e.year, e.month, e.startDay);
    const end = new Date(e.year, e.month, e.endDay);
    return start <= to && end >= from;
  };

  const today = new Date(y, m, d);

  // 오늘 일정 = 오늘 날짜를 포함하는 모든 SharedEvent
  const todayEventCount = sharedEvents.filter((e) => eventCoversDate(e, today)).length;
  // 이번 주 일정 = 이번 주 범위와 겹치는 모든 SharedEvent
  const weekEventCount = sharedEvents.filter((e) => eventOverlapsRange(e, weekStart, weekEnd)).length;

  // 오늘 할일 (later=false인 것 = 오늘 분량)
  const todayMyTodoCount = myTodos.filter((t) => !t.later && !t.done).length;
  const todaySharedTodoCount = sharedTodos.filter((t) => !t.later && !t.done).length;

  return {
    // 나의 플랜 카드용
    todayCount: todayEventCount + todayMyTodoCount,
    weekCount: weekEventCount,
    // 공동 플랜 카드용
    teamMembers: 4,            // TODO: 추후 Firebase 팀 데이터로 교체
    teamWeekShared: weekEventCount + todaySharedTodoCount,
  };
}

export default function App() {
  // 🔒 사용자별 설정 — localStorage에 영속화
  const [theme, setTheme] = usePersistedState<Theme>("theme", "light");
  const [accentKey, setAccentKey] = usePersistedState<AccentKey>("accentKey", "blue");
  const [aiOn, setAiOn] = usePersistedState<boolean>("aiOn", true);
  const [planKind, setPlanKind] = usePersistedState<"my" | "shared">("planKind", "my");

  // 일시적 UI 상태 — 영속화 X
  const [screen, setScreen] = useState<Screen>("day");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("splash");
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>(initialSharedEvents);

  // 🔒 todos — 영속화 (나의 플랜 / 공동 플랜 분리)
  const [myTodos, setMyTodos] = usePersistedState<Todo[]>("myTodos", initialMyTodos);
  const [sharedTodos, setSharedTodos] = usePersistedState<Todo[]>("sharedTodos", initialSharedTodos);

  const [insightOpen, setInsightOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // AI 자연어 입력 → 더미 응답 (나중에 OpenAI Edge Function으로 교체)
  const handleAISubmit = async (text: string): Promise<{ reply: string; events?: AIEvent[] }> => {
    void text;
    // 1초 후 가짜 일정 3개 반환
    await new Promise((r) => setTimeout(r, 1200));
    const todayY = 2026;
    const todayM = 4; // 5월 (0-indexed)
    return {
      reply: "이렇게 짜봤어요! 확인해보세요.",
      events: [
        { id: `ai-${Date.now()}-1`, date: `${todayY}-0${todayM + 1}-05`, title: "출발 / 이동", startTime: "09:00", endTime: "11:00", color: "#0066cc" },
        { id: `ai-${Date.now()}-2`, date: `${todayY}-0${todayM + 1}-05`, title: "현지 점심", startTime: "12:30", endTime: "14:00", color: "#FF9500" },
        { id: `ai-${Date.now()}-3`, date: `${todayY}-0${todayM + 1}-06`, title: "주요 활동", startTime: "10:00", endTime: "13:00", color: "#34C759" },
      ],
    };
  };

  // AI가 만든 일정을 sharedEvents에 머지
  const handleSaveAIEvents = (aiEvents: AIEvent[]) => {
    const newEvents: SharedEvent[] = aiEvents.map((e, i) => {
      const [y, m, d] = e.date.split("-").map(Number);
      const startSlot = e.startTime
        ? Number(e.startTime.split(":")[0]) * 2 + (Number(e.startTime.split(":")[1]) >= 30 ? 1 : 0)
        : undefined;
      const endSlot = e.endTime
        ? Number(e.endTime.split(":")[0]) * 2 + (Number(e.endTime.split(":")[1]) >= 30 ? 1 : 0)
        : undefined;
      return {
        id: Date.now() + i,
        year: y,
        month: m - 1,
        startDay: d,
        endDay: d,
        title: e.title,
        color: e.color,
        startSlot,
        endSlot,
      };
    });
    setSharedEvents((prev) => [...prev, ...newEvents]);
  };

  // 앱 진입(stage="app") + 개인 플랜일 때 인사이트 모달 표시 (오늘 닫지 않았다면)
  useEffect(() => {
    if (stage === "app" && planKind === "my" && shouldShowInsightToday()) {
      setInsightOpen(true);
    }
  }, [stage, planKind]);

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  const accent = accents[accentKey];

  const cssVars: Record<string, string> = isDark
    ? {
        "--bg-canvas": "#000000",
        "--bg-elevated": "#1C1C1E",
        "--bg-secondary": "#1C1C1E",
        "--bg-tertiary": "#2C2C2E",
        "--bg-glass": "rgba(28,28,30,0.72)",
        "--separator": "rgba(84,84,88,0.34)",
        "--hairline": "rgba(255,255,255,0.10)",
        "--text-primary": "#FFFFFF",
        "--text-secondary": "rgba(235,235,245,0.60)",
        "--text-muted": "rgba(235,235,245,0.48)",
        "--text-inverse": "#1D1D1F",
        "--card-shadow": "none",
        "--accent-line": `${accent}66`,
      }
    : {
        "--bg-canvas": "#FFFFFF",
        "--bg-elevated": "#FFFFFF",
        "--bg-secondary": "#F5F5F7",
        "--bg-tertiary": "#F2F2F7",
        "--bg-glass": "rgba(255,255,255,0.72)",
        "--separator": "rgba(60,60,67,0.12)",
        "--hairline": "rgba(0,0,0,0.08)",
        "--text-primary": "#1D1D1F",
        "--text-secondary": "rgba(60,60,67,0.60)",
        "--text-muted": "rgba(0,0,0,0.48)",
        "--text-inverse": "#FFFFFF",
        "--card-shadow": "0 1px 3px rgba(0,0,0,0.04)",
        "--accent-line": `${accent}66`,
      };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const renderScreen = () => {
    switch (screen) {
      case "day": return (
        <DayView
          accent={accent}
          planKind={planKind}
          todos={planKind === "shared" ? sharedTodos : myTodos}
          onTodosChange={planKind === "shared" ? setSharedTodos : setMyTodos}
        />
      );
      case "month": return <MonthView accent={accent} planKind={planKind} events={sharedEvents} onEventsChange={setSharedEvents} />;
      case "year": return <YearView accent={accent} events={sharedEvents} onEventsChange={setSharedEvents} />;
      case "week": return <WeekView accent={accent} planKind={planKind} />;
      case "tenmin": return <TenMinPlanner accent={accent} />;
      case "mandala": return <MandalaView accent={accent} planKind={planKind} />;
      case "diary": return <DiaryView accent={accent} planKind={planKind} />;
      case "daily": return <DailyFlipView accent={accent} events={sharedEvents} onEventsChange={setSharedEvents} />;
    }
  };

  return (
    <div
      className="app-outer"
      style={{
        fontFamily: "Pretendard, -apple-system, sans-serif",
        // 회색/검정 시연 배경은 CSS에서 데스크톱 전용으로 처리. 인라인에서 빼서 모바일 충돌 제거
      }}
    >
      <div
        className="relative overflow-hidden app-frame"
        style={{
          // CSS 변수만 인라인으로 전달, 크기는 CSS에서 처리
          background: "var(--bg-canvas)",
          color: "var(--text-primary)",
          ...cssVars,
        }}
      >
        {/* ─── 메인 앱 셸 (stage === "app"일 때만 렌더) ─────────── */}
        {stage === "app" && (
        <>
        {/* 상태바 — PWA 풀스크린 모드에서는 CSS로 숨김 (iOS 자체 상태바와 중복 방지) */}
        <div className="app-statusbar absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6"
          style={{
            height: 47,
            background: "transparent",
            color: "var(--text-primary)",
            fontSize: 13,
            fontWeight: 600,
          }}>
          <span>9:41</span>
          <span style={{ fontSize: 11 }}>● ● ●</span>
        </div>

        {/* 헤더 — 투명 배경 + 큰 로고 + 우측 플랜 토글 + 설정 */}
        <div
          className="app-header absolute left-0 right-0 z-20 flex items-center justify-between gap-3 px-5"
          style={{
            top: 47,
            height: 72,
            background: "var(--bg-canvas)",
            borderBottom: "0.5px solid var(--hairline)",
          }}
        >
          {/* 좌측: 로고 (커진 사이즈) */}
          <LogoLockup color="var(--text-primary)" accent={accent} size={28} />

          {/* 우측: 플랜 토글 + 설정 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 플랜 토글 (컴팩트 버전) */}
            <div
              className="relative flex p-0.5 rounded-full"
              style={{ background: "var(--bg-tertiary)", height: 32 }}
            >
              <div
                className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: "calc(50% - 2px)",
                  left: planKind === "my" ? 2 : "calc(50%)",
                  background: "var(--bg-elevated)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              />
              <button
                onClick={() => setPlanKind("my")}
                aria-label="나의 플랜"
                className="relative flex items-center justify-center gap-1 px-2.5 rounded-full active:scale-[0.97] transition-transform"
                style={{
                  fontSize: 12,
                  fontWeight: planKind === "my" ? 600 : 500,
                  color: planKind === "my" ? accent : "var(--text-secondary)",
                  letterSpacing: "-0.2px",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <UserIcon size={12} strokeWidth={2} />
                나의
              </button>
              <button
                onClick={() => setPlanKind("shared")}
                aria-label="공동 플랜"
                className="relative flex items-center justify-center gap-1 px-2.5 rounded-full active:scale-[0.97] transition-transform"
                style={{
                  fontSize: 12,
                  fontWeight: planKind === "shared" ? 600 : 500,
                  color: planKind === "shared" ? accent : "var(--text-secondary)",
                  letterSpacing: "-0.2px",
                  border: 0,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <UsersIcon size={12} strokeWidth={2} />
                공동
              </button>
            </div>

            {/* 설정 */}
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="설정"
              style={{
                width: 32, height: 32,
                display: "grid", placeItems: "center",
                background: "transparent", border: 0, cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              <SettingsIcon size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* 메인 스크롤 영역 */}
        <div className="app-content absolute inset-0 overflow-y-auto" style={{ paddingTop: 119 }} key={planKind + screen}>
          {renderScreen()}
        </div>

        {/* 하단 탭바 */}
        <div
          className="app-tabbar absolute left-0 right-0 bottom-0 z-30"
          style={{
            height: 84,
            background: "var(--bg-glass)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "0.5px solid var(--hairline)",
          }}
        >
          <div className="flex items-end justify-around px-2 pt-2 pb-7 h-full relative">
            <TabBtn icon={<Sun size={22} strokeWidth={1.5} />} label="오늘" active={screen === "day"} accent={accent} onClick={() => { setScreen("day"); setMoreOpen(false); }} />
            <TabBtn icon={<Calendar size={22} strokeWidth={1.5} />} label="캘린더" active={screen === "month" || screen === "week"} accent={accent} onClick={() => { setScreen("month"); setMoreOpen(false); }} />
            <div style={{ width: 56 }} />
            <TabBtn icon={<Target size={22} strokeWidth={1.5} />} label="목표" active={screen === "mandala"} accent={accent} onClick={() => { setScreen("mandala"); setMoreOpen(false); }} />
            <TabBtn icon={<MoreHorizontal size={22} strokeWidth={1.5} />} label="더보기" active={moreOpen || screen === "year" || screen === "tenmin" || screen === "diary" || screen === "daily" || screen === "week"} accent={accent} onClick={() => setMoreOpen((v) => !v)} />
          </div>

          <button
            onClick={() => setAiChatOpen(true)}
            aria-label="AI 어시스턴트 열기"
            className="absolute left-1/2 active:scale-95 transition-transform"
            style={{
              top: -8,
              transform: "translateX(-50%)",
              width: 56,
              height: 56,
              borderRadius: 28,
              background: accent,
              boxShadow: `0 6px 20px ${accent}66`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: 0,
              cursor: "pointer",
            }}
          >
            <Sparkles size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* 더보기 메뉴 */}
        {moreOpen && (
          <div
            className="absolute z-40 right-3 rounded-2xl overflow-hidden"
            style={{
              bottom: 96,
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--hairline)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            <MoreItem icon={<CalendarDays size={16} />} label="연력" onClick={() => { setScreen("year"); setMoreOpen(false); }} />
            <MoreItem icon={<CalendarDays size={16} />} label="일력" onClick={() => { setScreen("daily"); setMoreOpen(false); }} />
            <MoreItem icon={<Clock size={16} />} label="10분 플래너" onClick={() => { setScreen("tenmin"); setMoreOpen(false); }} />
            <MoreItem icon={<BookOpen size={16} />} label="일기" onClick={() => { setScreen("diary"); setMoreOpen(false); }} />
            <MoreItem icon={<Grid3x3 size={16} />} label="달력" onClick={() => { setScreen("month"); setMoreOpen(false); }} last />
          </div>
        )}
        </>
        )}
        {/* ─── 메인 앱 셸 끝 ──────────────────────────────────── */}

        {/* 스플래시 / 플랜 선택 */}
        {stage === "select" && (
          <PlanSelect
            accent={accent}
            stats={computePlanStats({ sharedEvents, myTodos, sharedTodos })}
            recentPlanKind={planKind}
            onSelect={(k) => {
              setPlanKind(k);
              setStage("app");
            }}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {stage === "splash" && <Splash accent={accent} onDone={() => setStage("select")} />}

        {/* 설정 */}
        <Settings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          accentKey={accentKey}
          setAccentKey={setAccentKey}
          aiOn={aiOn}
          setAiOn={setAiOn}
        />

        {/* AI 인사이트 인사말 모달 (앱 진입 시 1회) */}
        {insightOpen && (
          <InsightGreeting
            accent={accent}
            onClose={() => setInsightOpen(false)}
          />
        )}

        {/* AI 자연어 입력 채팅 모달 (FAB ✨ 클릭) */}
        <AIChatModal
          open={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          onSubmit={handleAISubmit}
          onSaveEvents={handleSaveAIEvents}
          accent={accent}
        />
      </div>
    </div>
  );
}

function TabBtn({ icon, label, active, accent, onClick }: { icon: React.ReactNode; label: string; active: boolean; accent: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 active:scale-95"
      style={{ color: active ? accent : "var(--text-muted)" }}
    >
      {icon}
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, letterSpacing: "-0.12px" }}>{label}</span>
    </button>
  );
}

function MoreItem({ icon, label, onClick, last }: { icon: React.ReactNode; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 w-44 active:opacity-60"
      style={{ borderBottom: last ? "none" : "0.5px solid var(--hairline)", fontSize: 15 }}
    >
      <span className="text-[var(--text-secondary)]">{icon}</span>
      {label}
    </button>
  );
}
