// Figma Make 디자인 그대로 — 모바일 앱 프레임 + 7개 뷰 + 탭바

import { useEffect, useMemo, useState } from "react";
import {
  Settings as SettingsIcon, Calendar, CalendarDays, Target,
  MoreHorizontal, Sparkles, Sun, BookOpen, Clock, Grid3x3,
  User as UserIcon, Users as UsersIcon,
} from "lucide-react";
import { accents, AccentKey } from "@/components/tokens";
import { initialSharedEvents, SharedEvent } from "@/components/eventStore";
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

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";

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
      case "day": return <DayView accent={accent} planKind={planKind} />;
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
      className="size-full flex items-center justify-center min-h-screen"
      style={{ background: isDark ? "#0a0a0a" : "#e5e5ea", fontFamily: "Pretendard, -apple-system, sans-serif" }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          width: 375,
          height: 812,
          background: "var(--bg-canvas)",
          color: "var(--text-primary)",
          borderRadius: 40,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          ...cssVars,
        }}
      >
        {/* 상태바 */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6"
          style={{ height: 47, background: "#000", color: "#fff", fontSize: 13, fontWeight: 600 }}>
          <span>9:41</span>
          <span style={{ fontSize: 11 }}>● ● ●</span>
        </div>

        {/* 헤더 */}
        <div className="absolute left-0 right-0 z-20 flex items-center justify-between px-5"
          style={{ top: 47, height: 44, background: "#000" }}>
          <LogoLockup color="#fff" accent={accent} size={15} />
          <button onClick={() => setSettingsOpen(true)} className="text-white">
            <SettingsIcon size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* 플랜 토글 */}
        <div
          className="absolute left-0 right-0 z-20 px-5 flex items-center"
          style={{
            top: 91,
            height: 56,
            background: "var(--bg-canvas)",
            borderBottom: "0.5px solid var(--hairline)",
          }}
        >
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
              onClick={() => setPlanKind("my")}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full active:scale-[0.97] transition-transform"
              style={{
                fontSize: 13,
                fontWeight: planKind === "my" ? 600 : 500,
                color: planKind === "my" ? accent : "var(--text-secondary)",
                letterSpacing: "-0.224px",
              }}
            >
              <UserIcon size={14} strokeWidth={2} /> 나의 플랜
            </button>
            <button
              onClick={() => setPlanKind("shared")}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full active:scale-[0.97] transition-transform"
              style={{
                fontSize: 13,
                fontWeight: planKind === "shared" ? 600 : 500,
                color: planKind === "shared" ? accent : "var(--text-secondary)",
                letterSpacing: "-0.224px",
              }}
            >
              <UsersIcon size={14} strokeWidth={2} /> 공동 플랜
            </button>
          </div>
        </div>

        {/* 메인 스크롤 영역 */}
        <div className="absolute inset-0 overflow-y-auto" style={{ paddingTop: 147 }} key={planKind + screen}>
          {renderScreen()}
        </div>

        {/* 하단 탭바 */}
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
            <TabBtn icon={<Sun size={22} strokeWidth={1.5} />} label="오늘" active={screen === "day"} accent={accent} onClick={() => { setScreen("day"); setMoreOpen(false); }} />
            <TabBtn icon={<Calendar size={22} strokeWidth={1.5} />} label="캘린더" active={screen === "month" || screen === "week"} accent={accent} onClick={() => { setScreen("month"); setMoreOpen(false); }} />
            <div style={{ width: 56 }} />
            <TabBtn icon={<Target size={22} strokeWidth={1.5} />} label="목표" active={screen === "mandala"} accent={accent} onClick={() => { setScreen("mandala"); setMoreOpen(false); }} />
            <TabBtn icon={<MoreHorizontal size={22} strokeWidth={1.5} />} label="더보기" active={moreOpen || screen === "year" || screen === "tenmin" || screen === "diary" || screen === "daily" || screen === "week"} accent={accent} onClick={() => setMoreOpen((v) => !v)} />
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

        {/* 스플래시 / 플랜 선택 */}
        {stage === "select" && (
          <PlanSelect
            accent={accent}
            onSelect={(k) => {
              setPlanKind(k);
              setStage("app");
            }}
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
