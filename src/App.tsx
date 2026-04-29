import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Clock,
  Grid3x3,
  MoreHorizontal,
  Settings as SettingsIcon,
  Sparkles,
  Sun,
  Target,
  User as UserIcon,
  Users as UsersIcon,
} from "lucide-react";
import { LogoLockup } from "@/components/Logo";
import { DayView } from "@/components/DayView";
import { DailyFlipView } from "@/components/DailyFlipView";
import { DiaryView } from "@/components/DiaryView";
import { MandalaView } from "@/components/MandalaView";
import { MonthView } from "@/components/MonthView";
import { PlanSelect } from "@/components/PlanSelect";
import { Settings } from "@/components/Settings";
import { Splash } from "@/components/Splash";
import { TenMinPlanner } from "@/components/TenMinPlanner";
import { WeekView } from "@/components/WeekView";
import { YearView } from "@/components/YearView";
import { initialSharedEvents, SharedEvent } from "@/components/eventStore";
import { accents, AccentKey } from "@/components/tokens";

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";

const PRIMARY_TABS: Array<{
  screen: Screen;
  label: string;
  icon: ReactNode;
}> = [
  { screen: "day", label: "오늘", icon: <Sun size={22} strokeWidth={1.5} /> },
  { screen: "month", label: "캘린더", icon: <Calendar size={22} strokeWidth={1.5} /> },
  { screen: "mandala", label: "목표", icon: <Target size={22} strokeWidth={1.5} /> },
];

const MORE_TABS: Array<{
  screen: Screen;
  label: string;
  icon: ReactNode;
}> = [
  { screen: "year", label: "연력", icon: <CalendarDays size={16} /> },
  { screen: "daily", label: "일력", icon: <CalendarDays size={16} /> },
  { screen: "week", label: "주력", icon: <CalendarDays size={16} /> },
  { screen: "tenmin", label: "10분", icon: <Clock size={16} /> },
  { screen: "diary", label: "일기", icon: <BookOpen size={16} /> },
];

const ALL_SCREENS: Array<{
  screen: Screen;
  label: string;
  helper: string;
  icon: ReactNode;
}> = [
  { screen: "day", label: "오늘", helper: "오늘 일정과 할 일을 집중해서 보기", icon: <Sun size={18} strokeWidth={1.75} /> },
  { screen: "year", label: "연력", helper: "연간 하이라이트와 기간 계획 추적", icon: <Grid3x3 size={18} strokeWidth={1.75} /> },
  { screen: "month", label: "달력", helper: "한 달 단위로 계획과 일정을 관리", icon: <Calendar size={18} strokeWidth={1.75} /> },
  { screen: "week", label: "주력", helper: "한 주의 흐름을 한눈에 정리", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { screen: "daily", label: "일력", helper: "개인과 공동 일정을 넘겨보며 확인", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { screen: "tenmin", label: "10분 플래너", helper: "짧은 집중 시간 단위로 계획", icon: <Clock size={18} strokeWidth={1.75} /> },
  { screen: "mandala", label: "만다라트", helper: "목표와 세부 목표를 구조화", icon: <Target size={18} strokeWidth={1.75} /> },
  { screen: "diary", label: "일기", helper: "하루 기록과 회고를 정리", icon: <BookOpen size={18} strokeWidth={1.75} /> },
];

export default function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [accentKey, setAccentKey] = useState<AccentKey>("blue");
  const [screen, setScreen] = useState<Screen>("day");
  const [aiOn, setAiOn] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("splash");
  const [planKind, setPlanKind] = useState<"my" | "shared">("my");
  const [sharedEvents, setSharedEvents] = useState<SharedEvent[]>(initialSharedEvents);
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

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  const accent = accents[accentKey];
  const activeScreen = ALL_SCREENS.find((item) => item.screen === screen) ?? ALL_SCREENS[0];

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

  useEffect(() => {
    if (isDesktop) {
      setMoreOpen(false);
    }
  }, [isDesktop]);

  const renderScreen = () => {
    switch (screen) {
      case "day":
        return <DayView accent={accent} planKind={planKind} />;
      case "month":
        return <MonthView accent={accent} planKind={planKind} events={sharedEvents} onEventsChange={setSharedEvents} />;
      case "year":
        return <YearView accent={accent} events={sharedEvents} onEventsChange={setSharedEvents} />;
      case "week":
        return <WeekView accent={accent} planKind={planKind} />;
      case "tenmin":
        return <TenMinPlanner accent={accent} />;
      case "mandala":
        return <MandalaView accent={accent} planKind={planKind} />;
      case "diary":
        return <DiaryView accent={accent} planKind={planKind} />;
      case "daily":
        return <DailyFlipView accent={accent} events={sharedEvents} onEventsChange={setSharedEvents} />;
    }
  };

  const shellStyle = isDesktop
    ? {
        width: "min(1680px, calc(100vw - 32px))",
        height: "calc(100vh - 32px)",
        borderRadius: 32,
      }
    : {
        width: 375,
        height: 812,
        borderRadius: 40,
      };

  return (
    <div
      className="size-full flex min-h-screen justify-center overflow-y-auto p-3 md:p-6 lg:items-start"
      style={{
        background: isDark
          ? "radial-gradient(circle at top, #151515 0%, #0a0a0a 48%, #000 100%)"
          : "linear-gradient(180deg, #eff2f6 0%, #d9dbe1 100%)",
        fontFamily: "Pretendard, -apple-system, sans-serif",
      }}
    >
      <div
        className={`relative overflow-hidden ${isDesktop ? "grid grid-cols-[280px_minmax(0,1fr)]" : ""}`}
        style={{
          background: "var(--bg-canvas)",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          ...cssVars,
          ...shellStyle,
        }}
      >
        {isDesktop && (
          <aside
            className="hidden lg:flex min-h-0 flex-col"
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
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
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
                    className="w-full flex items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors"
                    style={{
                      background: screen === item.screen ? `${accent}18` : "transparent",
                      color: screen === item.screen ? accent : "var(--text-primary)",
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
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

            <div className="px-4 pb-4">
              <div
                className="rounded-3xl p-4"
                style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.9)", border: "0.5px solid var(--hairline)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: `${accent}18`, color: accent }}
                  >
                    <Sparkles size={20} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>웹 확장 진행 중</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4 }}>
                      먼저 레이아웃을 넓히고, 그다음 화면별로 하나씩 다듬어가면 됩니다.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}

        <section className="relative min-h-0 min-w-0">
          {!isDesktop && (
            <>
              <div
                className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6"
                style={{ height: 47, background: "#000", color: "#fff", fontSize: 13, fontWeight: 600 }}
              >
                <span>9:41</span>
                <span style={{ fontSize: 11 }}>플래너</span>
              </div>

              <div
                className="absolute left-0 right-0 z-20 flex items-center justify-between px-5"
                style={{ top: 47, height: 44, background: "#000" }}
              >
                <LogoLockup color="#fff" accent={accent} size={15} />
                <button onClick={() => setSettingsOpen(true)} className="text-white">
                  <SettingsIcon size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div
                className="absolute left-0 right-0 z-20 px-5 flex items-center"
                style={{
                  top: 91,
                  height: 56,
                  background: "var(--bg-canvas)",
                  borderBottom: "0.5px solid var(--hairline)",
                }}
              >
                <DesktopPlanToggle accent={accent} planKind={planKind} onChange={setPlanKind} compact />
              </div>
            </>
          )}

          {false && isDesktop && (
            <div
              className="absolute left-0 right-0 top-0 z-20 px-8 py-5"
              style={{
                background: isDark ? "linear-gradient(180deg, rgba(0,0,0,0.72), rgba(0,0,0,0.42), transparent)" : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.72), transparent)",
              }}
            >
              <div className="flex items-start justify-end gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="rounded-2xl px-4 py-3 hidden xl:block"
                    style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--hairline)" }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {planKind === "my" ? "나의 플랜" : "공동 플랜"}
                    </div>
                  </div>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--hairline)" }}
                  >
                    <SettingsIcon size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            className={`absolute left-0 right-0 bottom-0 overflow-y-auto ${isDesktop ? "hide-scrollbar" : ""}`}
            style={{
              top: isDesktop ? 20 : 147,
              paddingBottom: isDesktop ? 20 : 108,
              scrollbarWidth: isDesktop ? "none" : undefined,
              msOverflowStyle: isDesktop ? "none" : undefined,
            }}
            key={planKind + screen + (isDesktop ? "-desktop" : "-mobile")}
          >
            <div className={isDesktop ? "w-full px-6 2xl:px-8" : ""}>{renderScreen()}</div>
          </div>

          {!isDesktop && (
            <>
              <div
                className="absolute left-0 right-0 bottom-0 z-30"
                style={{
                  height: 84,
                  background: "var(--bg-glass)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  borderTop: "0.5px solid var(--hairline)",
                }}
              >
                <div className="flex items-end justify-around px-2 pt-2 pb-7 h-full relative">
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
                    onClick={() => setMoreOpen((value) => !value)}
                  />
                </div>

                <button
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
                  }}
                >
                  <Sparkles size={24} strokeWidth={1.5} />
                </button>
              </div>

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
                  {MORE_TABS.map((tab, index) => (
                    <MoreItem
                      key={tab.screen}
                      icon={tab.icon}
                      label={tab.label}
                      last={index === MORE_TABS.length - 1}
                      onClick={() => {
                        setScreen(tab.screen);
                        setMoreOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {stage === "select" && (
            <PlanSelect
              accent={accent}
              onSelect={(kind) => {
                setPlanKind(kind);
                setStage("app");
              }}
            />
          )}
          {stage === "splash" && <Splash accent={accent} onDone={() => setStage("select")} />}

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
        </section>
      </div>
    </div>
  );
}

function DesktopPlanToggle({
  accent,
  planKind,
  onChange,
  compact = false,
}: {
  accent: string;
  planKind: "my" | "shared";
  onChange: (value: "my" | "shared") => void;
  compact?: boolean;
}) {
  return (
    <div className="relative flex w-full p-1 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
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
        className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full active:scale-[0.97] transition-transform"
        style={{
          fontSize: compact ? 13 : 14,
          fontWeight: planKind === "my" ? 600 : 500,
          color: planKind === "my" ? accent : "var(--text-secondary)",
          letterSpacing: "-0.224px",
        }}
      >
        <UserIcon size={14} strokeWidth={2} /> 나의 플랜
      </button>
      <button
        onClick={() => onChange("shared")}
        className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full active:scale-[0.97] transition-transform"
        style={{
          fontSize: compact ? 13 : 14,
          fontWeight: planKind === "shared" ? 600 : 500,
          color: planKind === "shared" ? accent : "var(--text-secondary)",
          letterSpacing: "-0.224px",
        }}
      >
        <UsersIcon size={14} strokeWidth={2} /> 공동 플랜
      </button>
    </div>
  );
}

function TabBtn({
  icon,
  label,
  active,
  accent,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
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

function MoreItem({
  icon,
  label,
  onClick,
  last,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
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
