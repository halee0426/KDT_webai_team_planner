// Figma Make 디자인 그대로 ? 모바일 앱 프레임 + 7개 뷰 + 탭바

import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon, Calendar, CalendarDays, Target,
  MoreHorizontal, Sun, BookOpen, Clock, Grid3x3,
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
import { LogoLockup, LogoMark } from "@/components/Logo";
import { InsightGreeting, shouldShowInsightToday } from "@/components/shared/InsightGreeting";
import { AIChatModal, type AIEvent } from "@/components/ai/AIChatModal";
import { usePersistedState } from "@/hooks/usePersistedState";

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";

const PRIMARY_TABS: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
  { screen: "day", label: "오늘", icon: <Sun size={22} strokeWidth={1.5} /> },
  { screen: "month", label: "달력", icon: <Calendar size={22} strokeWidth={1.5} /> },
  { screen: "mandala", label: "목표", icon: <Target size={22} strokeWidth={1.5} /> },
];

const MORE_TABS: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
  { screen: "year", label: "연력", icon: <CalendarDays size={16} /> },
  { screen: "daily", label: "일력", icon: <CalendarDays size={16} /> },
  { screen: "week", label: "주력", icon: <CalendarDays size={16} /> },
  { screen: "tenmin", label: "10분 플래너", icon: <Clock size={16} /> },
  { screen: "diary", label: "일기", icon: <BookOpen size={16} /> },
];

const ALL_SCREENS: Array<{ screen: Screen; label: string; helper: string; icon: ReactNode }> = [
  { screen: "day", label: "오늘", helper: "오늘 일정과 할 일을 집중해서 보기", icon: <Sun size={18} strokeWidth={1.75} /> },
  { screen: "year", label: "연력", helper: "연간 하이라이트와 기간 계획 추적", icon: <Grid3x3 size={18} strokeWidth={1.75} /> },
  { screen: "month", label: "달력", helper: "한 달 단위로 계획과 일정을 관리", icon: <Calendar size={18} strokeWidth={1.75} /> },
  { screen: "week", label: "주력", helper: "한 주의 흐름을 한눈에 정리", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { screen: "daily", label: "일력", helper: "개인과 공동 일정을 넘겨보며 확인", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { screen: "tenmin", label: "10분 플래너", helper: "짧은 집중 시간 단위로 계획", icon: <Clock size={18} strokeWidth={1.75} /> },
  { screen: "mandala", label: "만다라트", helper: "목표를 세부 목표로 구조화", icon: <Target size={18} strokeWidth={1.75} /> },
  { screen: "diary", label: "일기", helper: "하루 기록과 회고를 정리", icon: <BookOpen size={18} strokeWidth={1.75} /> },
];

/** PlanSelect에 표시할 통계 계산 ? 사용자 실제 데이터 기반 */
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
  // ?? 사용자별 설정 ? localStorage에 영속화
  const [theme, setTheme] = usePersistedState<Theme>("theme", "light");
  const [accentKey, setAccentKey] = usePersistedState<AccentKey>("accentKey", "blue");
  const [aiOn, setAiOn] = usePersistedState<boolean>("aiOn", true);
  const [planKind, setPlanKind] = usePersistedState<"my" | "shared">("planKind", "my");

  // 일시적 UI 상태 ? 영속화 X
  const [screen, setScreen] = useState<Screen>("day");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("splash");
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>(initialSharedEvents);

  // ?? todos ? 영속화 (나의 플랜 / 공동 플랜 분리)
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

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1100 : false,
  );

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1100);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 모바일 감지 ? 768px 이하면 풀스크린 모드
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMoreOpen(false);
    }
  }, [isDesktop]);

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

  const shellStyle = isDesktop
    ? {
        width: "min(1680px, calc(100vw - 32px))",
        height: "calc(100vh - 32px)",
        borderRadius: 32,
      }
    : isMobile
      ? {
          width: "100vw",
          height: "100vh",
          borderRadius: 0,
        }
      : {
          width: 375,
          height: 812,
          borderRadius: 40,
        };

  return (
    <div
      className="app-outer flex min-h-screen justify-center overflow-y-auto p-3 md:p-6 lg:items-start"
      style={{
        background: isDesktop
          ? (isDark
              ? "radial-gradient(circle at top, #151515 0%, #0a0a0a 48%, #000 100%)"
              : "linear-gradient(180deg, #eff2f6 0%, #d9dbe1 100%)")
          : isMobile
            ? "var(--bg-canvas)"
            : isDark
              ? "#0a0a0a"
              : "#e5e5ea",
        fontFamily: "Pretendard, -apple-system, sans-serif",
      }}
    >
      <div
        className={`app-frame relative overflow-hidden ${isDesktop && stage === "app" ? "grid grid-cols-[280px_minmax(0,1fr)]" : ""}`}
        style={{
          background: "var(--bg-canvas)",
          color: "var(--text-primary)",
          boxShadow: isDesktop || !isMobile ? "0 20px 60px rgba(0,0,0,0.2)" : "none",
          ...cssVars,
          ...shellStyle,
        }}
      >
        {isDesktop && stage === "app" && (
          <aside
            className="hidden min-h-0 flex-col lg:flex"
            style={{
              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.78)",
              borderRight: "0.5px solid var(--hairline)",
            }}
          >
            <div className="px-6 pt-8 pb-6">
              <div className="flex items-center justify-between">
                <LogoLockup color="var(--text-primary)" accent={accent} size={20} />
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  <SettingsIcon size={18} strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="px-4">
              <DesktopPlanToggle accent={accent} planKind={planKind} onChange={setPlanKind} />
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-6">
              <div className="space-y-1">
                {ALL_SCREENS.map((item) => (
                  <button
                    key={item.screen}
                    onClick={() => setScreen(item.screen)}
                    className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors"
                    style={{
                      background: screen === item.screen ? `${accent}18` : "transparent",
                      color: screen === item.screen ? accent : "var(--text-primary)",
                    }}
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: screen === item.screen ? `${accent}18` : "var(--bg-tertiary)" }}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0">
                      <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{item.label}</span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                        {item.helper}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </nav>
          </aside>
        )}

        <section className="relative min-h-0 min-w-0">
          {stage === "app" && !isDesktop && (
            <>
              <div
                className="app-header absolute left-0 right-0 z-20 flex items-center justify-between gap-3 px-5"
                style={{
                  top: 0,
                  height: 72,
                  background: "var(--bg-canvas)",
                  borderBottom: "0.5px solid var(--hairline)",
                }}
              >
                <LogoLockup color="var(--text-primary)" accent={accent} size={28} />

                <div className="flex shrink-0 items-center gap-2">
                  <div
                    className="relative flex rounded-full p-0.5"
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
                      className="relative flex items-center justify-center gap-1 rounded-full px-2.5 transition-transform active:scale-[0.97]"
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
                      className="relative flex items-center justify-center gap-1 rounded-full px-2.5 transition-transform active:scale-[0.97]"
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

                  <button
                    onClick={() => setSettingsOpen(true)}
                    aria-label="설정"
                    style={{
                      width: 32,
                      height: 32,
                      display: "grid",
                      placeItems: "center",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      color: "var(--text-primary)",
                    }}
                  >
                    <SettingsIcon size={20} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="app-content absolute inset-0 overflow-y-auto" style={{ paddingTop: 72 }} key={planKind + screen}>
                {renderScreen()}
              </div>

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
                <div className="relative flex h-full items-end justify-around px-2 pt-2 pb-7">
                  {PRIMARY_TABS.map((tab) => (
                    <TabBtn
                      key={tab.screen}
                      icon={tab.icon}
                      label={tab.label}
                      active={screen === tab.screen}
                      accent={accent}
                      onClick={() => {
                        setScreen(tab.screen);
                        setMoreOpen(false);
                      }}
                    />
                  ))}
                  <div style={{ width: 56 }} />
                  <TabBtn
                    icon={<MoreHorizontal size={22} strokeWidth={1.5} />}
                    label="더보기"
                    active={moreOpen || MORE_TABS.some((tab) => tab.screen === screen)}
                    accent={accent}
                    onClick={() => setMoreOpen((v) => !v)}
                  />
                </div>

                <button
                  onClick={() => setAiChatOpen(true)}
                  aria-label="하루온봇 열기"
                  className="absolute left-1/2 transition-transform active:scale-95"
                  style={{
                    top: -8,
                    transform: "translateX(-50%)",
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    background: accent,
                    boxShadow: `0 6px 20px ${accent}66`,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  <LogoMark size={32} accent={accent} rounded={10} />
                </button>
              </div>

              {moreOpen && (
                <div
                  className="absolute right-3 z-40 overflow-hidden rounded-2xl"
                  style={{
                    bottom: 96,
                    background: "var(--bg-elevated)",
                    border: "0.5px solid var(--hairline)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {MORE_TABS.map((tab, index) => (
                    <MoreItem
                      key={tab.screen}
                      icon={tab.icon}
                      label={tab.label}
                      onClick={() => {
                        setScreen(tab.screen);
                        setMoreOpen(false);
                      }}
                      last={index === MORE_TABS.length - 1}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {stage === "app" && isDesktop && (
            <div
              className="absolute inset-0 overflow-y-auto"
              style={{
                paddingTop: 20,
                paddingBottom: 20,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
              key={planKind + screen + "-desktop"}
            >
              <div className="w-full px-6 2xl:px-8">{renderScreen()}</div>
            </div>
          )}
        </section>
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

        {/* AI 자연어 입력 채팅 모달 (FAB ? 클릭) */}
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

function DesktopPlanToggle({
  accent,
  planKind,
  onChange,
}: {
  accent: string;
  planKind: "my" | "shared";
  onChange: (value: "my" | "shared") => void;
}) {
  return (
    <div className="relative flex w-full rounded-full p-1" style={{ background: "var(--bg-tertiary)" }}>
      <div
        className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out"
        style={{
          width: "calc(50% - 4px)",
          left: planKind === "my" ? 4 : "calc(50%)",
          background: "var(--bg-elevated)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      />
      <button
        onClick={() => onChange("my")}
        className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 transition-transform active:scale-[0.97]"
        style={{
          fontSize: 14,
          fontWeight: planKind === "my" ? 600 : 500,
          color: planKind === "my" ? accent : "var(--text-secondary)",
          letterSpacing: "-0.24px",
          border: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <UserIcon size={14} strokeWidth={1.9} />
        나의 플랜
      </button>
      <button
        onClick={() => onChange("shared")}
        className="relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 transition-transform active:scale-[0.97]"
        style={{
          fontSize: 14,
          fontWeight: planKind === "shared" ? 600 : 500,
          color: planKind === "shared" ? accent : "var(--text-secondary)",
          letterSpacing: "-0.24px",
          border: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <UsersIcon size={14} strokeWidth={1.9} />
        공동 플랜
      </button>
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

