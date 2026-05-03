// Figma Make 디자인 그대로 — 모바일 앱 프레임 + 7개 뷰 + 탭바

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Menu as MenuIcon, Calendar, CalendarDays, Target,
  MoreHorizontal, Sun, BookOpen, Clock,
} from "lucide-react";
import { accents, AccentKey } from "@/components/tokens";
import {
  initialSharedEvents,
  initialMyTodos,
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
import { AppMenuSheet } from "@/components/shared/AppMenuSheet";
import { AuthModal } from "@/components/shared/AuthModal";
import { AccountSheet } from "@/components/shared/AccountSheet";
import { NewEventModal, type NewEventInitial } from "@/components/shared/NewEventModal";
import { CalendarScopeTabs, type ScopeKey } from "@/components/shared/CalendarScopeTabs";
import { Splash } from "@/components/Splash";
import { PlanSelect } from "@/components/PlanSelect";
import { LogoLockup, LogoMark } from "@/components/Logo";
import { InsightGreeting, shouldShowInsightToday } from "@/components/shared/InsightGreeting";
import { AIChatModal, type AIEvent } from "@/components/ai/AIChatModal";
import { GroupSheet } from "@/components/shared/GroupSheet";
import { GroupDetailSheet } from "@/components/shared/GroupDetailSheet";
import { GroupSelector } from "@/components/shared/GroupSelector";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useSharedEventsSync } from "@/hooks/useSharedEventsSync";
import { useGroupEventsSync } from "@/hooks/useGroupEventsSync";
import { useGroupTodosSync } from "@/hooks/useGroupTodosSync";
import { useMyGroups } from "@/hooks/useMyGroups";
import { useAuthSubscription } from "@/hooks/useAuth";
import { useUserStore } from "@/store/userStore";
import { claimPendingInvites } from "@/lib/firebase/groupsAdapter";

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";

/** PlanSelect에 표시할 통계 계산 — 사용자 실제 데이터 기반 */
function computePlanStats({
  sharedEvents,
  myTodos,
  groupCount,
}: {
  sharedEvents: SharedEvent[];
  myTodos: Todo[];
  groupCount: number;
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

  return {
    // 나의 플랜 카드용
    todayCount: todayEventCount + todayMyTodoCount,
    weekCount: weekEventCount,
    // 공동 플랜 카드용 — 가입한 그룹 수 (멤버 수는 그룹 진입 후 확인)
    teamMembers: groupCount,
    teamWeekShared: weekEventCount,
  };
}

export default function App() {
  // Firebase 인증 상태 구독 — 게스트(더미 키)일 때는 즉시 게스트 모드로 끝남
  useAuthSubscription();

  // 🔒 사용자별 설정 — localStorage에 영속화
  const [theme, setTheme] = usePersistedState<Theme>("theme", "light");
  const [accentKey, setAccentKey] = usePersistedState<AccentKey>("accentKey", "mint");
  const [aiOn, setAiOn] = usePersistedState<boolean>("aiOn", true);
  // planKind: "my" 또는 groupId (string). 기존 "shared" 값은 그룹 모델 도입 전 유산이라 "my" 로 마이그레이션
  const [planKindRaw, setPlanKind] = usePersistedState<string>("planKind", "my");
  const planKind = planKindRaw === "shared" ? "my" : planKindRaw;
  useEffect(() => {
    if (planKindRaw === "shared") setPlanKind("my");
  }, [planKindRaw, setPlanKind]);

  // 활성 그룹 — planKind 가 "my" 가 아니면 그게 groupId
  const activeGroupId = planKind === "my" ? null : planKind;

  // 내 그룹 목록 + 로그인 사용자
  const user = useUserStore((s) => s.user);
  const { groups: myGroups } = useMyGroups();

  // 캘린더 계층 네비게이션 — 연력 → 달력 → 일력 사이 공통 focus (year/month/day)
  const todayObj = new Date();
  const [calYear, setCalYear] = useState<number>(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(todayObj.getMonth());
  const [calDay, setCalDay] = useState<number>(todayObj.getDate());

  // 일시적 UI 상태 — 영속화 X
  const [screen, setScreen] = useState<Screen>("day");

  // 화면 전환 애니메이션 — 이전 screen 추적해서 진입 방향 결정
  const prevScreenRef = useRef<Screen>(screen);
  const MAIN_TAB_ORDER: Screen[] = ["day", "month", "mandala"];
  const calDepth = (s: Screen) =>
    s === "year" ? 0 : s === "month" ? 1 : s === "daily" ? 2 : -1;
  const transitionClass = useMemo(() => {
    const prev = prevScreenRef.current;
    if (prev === screen) return "screen-enter-fade";
    const prevMain = MAIN_TAB_ORDER.indexOf(prev as any);
    const curMain = MAIN_TAB_ORDER.indexOf(screen as any);
    if (prevMain !== -1 && curMain !== -1) {
      return curMain > prevMain ? "screen-enter-right" : "screen-enter-left";
    }
    const prevD = calDepth(prev);
    const curD = calDepth(screen);
    if (prevD !== -1 && curD !== -1) {
      return curD > prevD ? "screen-enter-zoomin" : "screen-enter-zoomout";
    }
    return "screen-enter-fade";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
  useEffect(() => {
    prevScreenRef.current = screen;
  }, [screen]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [groupDetailId, setGroupDetailId] = useState<string | null>(null);
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEventInitial, setNewEventInitial] = useState<NewEventInitial | undefined>(undefined);
  const openNewEvent = (init?: NewEventInitial) => {
    setNewEventInitial(init);
    setNewEventOpen(true);
  };
  const [stage, setStage] = useState<Stage>("splash");
  // Splash 가 아직 마운트되어 있는지 (페이드 아웃 동안에도 true)
  const [splashMounted, setSplashMounted] = useState(true);
  // 내 일정 (planKind === "my") — localStorage(게스트) + Firestore(로그인) 자동 동기화
  const [myEvents, setMyEvents] = useSharedEventsSync(initialSharedEvents);
  // 그룹 일정 — 활성 그룹의 events 실시간 구독
  const [groupEvents, setGroupEvents] = useGroupEventsSync(activeGroupId);

  // 현재 활성 events / setter
  const events = activeGroupId ? groupEvents : myEvents;
  const setEvents = activeGroupId ? setGroupEvents : setMyEvents;

  const [editingEvent, setEditingEvent] = useState<SharedEvent | null>(null);
  const openEditEvent = (e: SharedEvent) => {
    setEditingEvent(e);
    setNewEventOpen(true);
  };
  const handleAddEvent = (e: Omit<SharedEvent, "id">) => {
    if (editingEvent) {
      // 편집 모드 — 같은 id 유지하고 교체
      setEvents((prev) =>
        prev.map((x) => (x.id === editingEvent.id ? { ...e, id: editingEvent.id } : x)),
      );
    } else {
      setEvents((prev) => [...prev, { ...e, id: Date.now() }]);
    }
    setEditingEvent(null);
  };
  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((x) => x.id !== id));
    setEditingEvent(null);
  };

  // splash-mode 클래스 — splash가 시각적으로 가리고 있을 때만 검정 강제
  // splashLeaving (페이드 아웃 중) 시점부터는 클래스를 제거해서 그 아래 PlanSelect가 자연스럽게 드러남
  useEffect(() => {
    const root = document.documentElement;
    if (stage === "splash" && splashMounted) {
      root.classList.add("splash-mode");
    } else {
      root.classList.remove("splash-mode");
    }
    return () => {
      root.classList.remove("splash-mode");
    };
  }, [stage, splashMounted]);

  // 🔒 내 todos — 영속화 (planKind === "my" 일 때 사용)
  const [myTodos, setMyTodos] = usePersistedState<Todo[]>("myTodos", initialMyTodos);
  // 그룹 todos — 활성 그룹의 todos 실시간 구독
  const [groupTodos, setGroupTodos] = useGroupTodosSync(activeGroupId);

  // 현재 활성 todos / setter
  const activeTodos = activeGroupId ? groupTodos : myTodos;
  const setActiveTodos = activeGroupId ? setGroupTodos : setMyTodos;

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
    setEvents((prev) => [...prev, ...newEvents]);
  };

  // 앱 진입(stage="app") + 개인 플랜일 때 인사이트 모달 표시 (오늘 닫지 않았다면)
  useEffect(() => {
    if (stage === "app" && planKind === "my" && shouldShowInsightToday()) {
      setInsightOpen(true);
    }
  }, [stage, planKind]);

  // 로그인 시 — 내 이메일로 온 대기 초대 자동 합류
  const claimedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !user.email) return;
    if (claimedRef.current === user.uid) return;
    claimedRef.current = user.uid;
    const displayName = user.displayName || user.email || "이름없음";
    claimPendingInvites(user.uid, displayName, user.photoURL, user.email).catch((err) => {
      console.warn("pending invites 처리 실패:", err);
    });
  }, [user]);

  // activeGroupId 가 더 이상 내 그룹에 없으면 (탈퇴/삭제됨) "my" 로 fallback
  useEffect(() => {
    if (planKind === "my") return;
    // 그룹 목록 로딩 직후 빈 배열이 잠깐 있을 수 있음 — user 가 로그인 상태이고 myGroups 가 채워졌는데도 없으면 정리
    if (!user) return;
    if (myGroups.length === 0) return;
    const stillExists = myGroups.some((g) => g.id === planKind);
    if (!stillExists) setPlanKind("my");
  }, [planKind, myGroups, user, setPlanKind]);

  const isDark = useMemo(() => {
    if (theme === "dark") return true;
    if (theme === "light") return false;
    return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, [theme]);

  const accent = accents[accentKey] ?? accents.mint;

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

  // 모바일 감지 — 768px 이하면 풀스크린 모드
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false,
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // 좌우 스와이프로 탭 전환 — day ↔ month ↔ mandala
  const SWIPE_TABS: Screen[] = ["day", "month", "mandala"];
  // 최신 screen 참조용 (이벤트 리스너가 stale closure 안 쓰게)
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  const setScreenRef = useRef(setScreen);
  const setMoreOpenRef = useRef(setMoreOpen);
  useEffect(() => {
    setScreenRef.current = setScreen;
    setMoreOpenRef.current = setMoreOpen;
  });

  // ref callback — element가 mount/unmount/remount될 때마다 리스너 재등록
  // (메인 div는 key={planKind+screen}로 리마운트 되기 때문에 useEffect+useRef 조합으로는 첫 element 이후 놓침)
  const contentCallbackRef = useMemo(() => {
    let attached: HTMLDivElement | null = null;
    let cleanup: (() => void) | null = null;

    return (el: HTMLDivElement | null) => {
      // 같은 element면 재처리 안 함
      if (attached === el) return;
      // 이전 정리
      if (cleanup) {
        cleanup();
        cleanup = null;
      }
      attached = el;
      if (!el) return;

      let startX = 0;
      let startY = 0;
      let startT = 0;
      let lastX = 0;
      let lastT = 0;
      let locked: "h" | "v" | null = null;
      let active = false;
      let inNoSwipe = false;
      let multiTouchAborted = false;

      // 화면 너비 기반 동적 임계값 (onEnd 마다 다시 계산 — 회전/리사이즈 대응)
      const getScreenW = () =>
        el.clientWidth || window.innerWidth || 375;
      // 일반: 화면 25% 거리 OR 빠른 플릭(화면 12% + 속도 0.2 px/ms)
      const NORMAL_DIST_R = 0.25;
      const NORMAL_FLICK_DIST_R = 0.12;
      const NORMAL_FLICK_VEL = 0.2;
      // 보호 영역: 화면 50% + 속도 0.5 px/ms + 가로/세로 비율 2.5배
      const PROT_DIST_R = 0.5;
      const PROT_VEL = 0.5;
      const PROT_RATIO = 2.5;

      const onStart = (e: TouchEvent) => {
        if (e.touches.length !== 1) {
          active = false;
          multiTouchAborted = true;
          return;
        }
        multiTouchAborted = false;
        const target = e.target as HTMLElement | null;
        inNoSwipe = !!(
          target &&
          target.closest &&
          target.closest("[data-no-swipe]")
        );
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startT = e.timeStamp || performance.now();
        lastX = startX;
        lastT = startT;
        locked = null;
        active = true;
      };

      const onMove = (e: TouchEvent) => {
        if (!active) return;
        if (e.touches.length > 1) {
          active = false;
          multiTouchAborted = true;
          return;
        }
        const t = e.touches[0];
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        lastX = t.clientX;
        lastT = e.timeStamp || performance.now();
        if (locked === null) {
          if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            locked = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
          }
        }
        // 보호 영역에선 preventDefault 안 함 (자체 드래그/핀치 그대로 흘려야)
        if (locked === "h" && !inNoSwipe) {
          e.preventDefault();
        }
      };

      const onEnd = (e: TouchEvent) => {
        if (!active) return;
        const wasH = locked === "h";
        active = false;
        if (multiTouchAborted) return;
        if (!wasH) return;

        const endX = e.changedTouches[0]?.clientX ?? lastX;
        const endY = e.changedTouches[0]?.clientY ?? startY;
        const endT = e.timeStamp || performance.now();
        const dx = endX - startX;
        const dy = endY - startY;
        const totalDuration = Math.max(1, endT - startT);
        const totalVel = Math.abs(dx) / totalDuration; // px/ms (전체 평균 속도)
        const ratio = Math.abs(dx) / Math.max(1, Math.abs(dy));

        const W = getScreenW();
        let trigger = false;
        if (inNoSwipe) {
          // 보호 영역: 화면 50% + 빠른 속도 + 가로 우세
          trigger =
            Math.abs(dx) >= W * PROT_DIST_R &&
            totalVel >= PROT_VEL &&
            ratio >= PROT_RATIO;
        } else {
          // 일반 영역: 화면 25% 거리 OR 빠른 플릭(화면 12% + 속도)
          trigger =
            Math.abs(dx) >= W * NORMAL_DIST_R ||
            (Math.abs(dx) >= W * NORMAL_FLICK_DIST_R &&
              totalVel >= NORMAL_FLICK_VEL);
        }
        if (!trigger) return;

        const cur = screenRef.current;
        const idx = SWIPE_TABS.indexOf(cur as any);
        if (idx === -1) return;
        if (dx < 0 && idx < SWIPE_TABS.length - 1) {
          setScreenRef.current(SWIPE_TABS[idx + 1]);
          setMoreOpenRef.current(false);
        } else if (dx > 0 && idx > 0) {
          setScreenRef.current(SWIPE_TABS[idx - 1]);
          setMoreOpenRef.current(false);
        }
      };

      el.addEventListener("touchstart", onStart, { passive: true });
      el.addEventListener("touchmove", onMove, { passive: false });
      el.addEventListener("touchend", onEnd);
      el.addEventListener("touchcancel", onEnd);

      cleanup = () => {
        el.removeEventListener("touchstart", onStart);
        el.removeEventListener("touchmove", onMove);
        el.removeEventListener("touchend", onEnd);
        el.removeEventListener("touchcancel", onEnd);
      };
    };
  }, []);

  const renderScreen = () => {
    switch (screen) {
      case "day": return (
        <DayView
          accent={accent}
          planKind={planKind}
          todos={activeTodos}
          onTodosChange={setActiveTodos}
        />
      );
      case "month": return (
        <MonthView
          accent={accent}
          planKind={planKind}
          events={events}
          onEventsChange={setEvents}
          year={calYear}
          month={calMonth}
          onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
          onBack={() => { setScreen("year"); setMoreOpen(false); }}
          onOpenDay={(y, m, d) => {
            setCalYear(y); setCalMonth(m); setCalDay(d);
            setScreen("daily");
            setMoreOpen(false);
          }}
          onAdd={() => openNewEvent({ year: calYear, month: calMonth, day: calDay, allDay: true })}
          onOpenEdit={openEditEvent}
        />
      );
      case "year": return (
        <YearView
          accent={accent}
          events={events}
          onEventsChange={setEvents}
          year={calYear}
          onOpenMonth={(y, m) => {
            setCalYear(y); setCalMonth(m);
            setScreen("month");
            setMoreOpen(false);
          }}
          onAdd={() => openNewEvent({ year: calYear, month: calMonth, day: 1, allDay: true })}
          onOpenEdit={openEditEvent}
        />
      );
      case "week": return <WeekView accent={accent} planKind={planKind} />;
      case "tenmin": return <TenMinPlanner accent={accent} />;
      case "mandala": return <MandalaView accent={accent} planKind={planKind} />;
      case "diary": return <DiaryView accent={accent} planKind={planKind} />;
      case "daily": return (
        <DailyFlipView
          accent={accent}
          events={events}
          onEventsChange={setEvents}
          year={calYear}
          month={calMonth}
          day={calDay}
          onDateChange={(y, m, d) => { setCalYear(y); setCalMonth(m); setCalDay(d); }}
          onBack={() => { setScreen("month"); setMoreOpen(false); }}
          onAdd={() => openNewEvent({ year: calYear, month: calMonth, day: calDay, allDay: false })}
          onOpenEdit={openEditEvent}
        />
      );
    }
  };

  // splash 단계에서는 outer/frame 배경도 검은색으로 시작 — 첫 로드 시 흰 깜빡임 방지
  const isSplash = stage === "splash";
  const outerBg = isSplash
    ? "#000"
    : isMobile
    ? "var(--bg-canvas)"
    : isDark
    ? "#0a0a0a"
    : "#e5e5ea";
  const frameBg = isSplash ? "#000" : "var(--bg-canvas)";

  return (
    <div
      className={isMobile ? "app-outer" : "size-full flex items-center justify-center min-h-screen app-outer"}
      style={{
        background: outerBg,
        fontFamily: "Pretendard, -apple-system, sans-serif",
        minHeight: isMobile ? "100vh" : undefined,
        transition: "background 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}
    >
      <div
        className="relative overflow-hidden app-frame"
        style={
          isMobile
            ? {
                // 모바일: 풀스크린, 박스 없음
                width: "100vw",
                height: "100vh",
                background: frameBg,
                color: "var(--text-primary)",
                transition: "background 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)",
                ...cssVars,
              }
            : {
                // 데스크톱: 모바일 프레임 박스 시연
                width: 375,
                height: 812,
                background: frameBg,
                color: "var(--text-primary)",
                borderRadius: 40,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                transition: "background 0.6s cubic-bezier(0.22, 0.61, 0.36, 1)",
                ...cssVars,
              }
        }
      >
        {/* ─── 메인 앱 셸 (stage === "app"일 때만 렌더) ─────────── */}
        {stage === "app" && (
        <>
        {/* (자체 상태바 제거 — 폰 시연 시 iOS/Android 자체 상태바 그대로 사용) */}

        {/* 헤더 — 투명 배경 + 큰 로고 + 우측 플랜 토글 + 설정 (iOS notch / 배터리 영역 침범 안 함) */}
        <div
          className="app-header absolute left-0 right-0 z-20 flex items-center justify-between gap-3 px-5"
          style={{
            top: 0,
            height: 72,
            paddingTop: "env(safe-area-inset-top, 0)",
            boxSizing: "content-box",
            background: "var(--bg-canvas)",
            borderBottom: "0.5px solid var(--hairline)",
          }}
        >
          {/* 좌측: 로고 (커진 사이즈) */}
          <LogoLockup color="#444444" accent={accent} size={32} />

          {/* 우측: 플랜 선택 (나의 / 그룹 드롭다운) + 메뉴 */}
          <div className="flex items-center gap-2 shrink-0">
            <GroupSelector
              accent={accent}
              planKind={planKind}
              groups={myGroups}
              currentUid={user?.uid ?? null}
              onSelectMy={() => setPlanKind("my")}
              onSelectGroup={(gid) => setPlanKind(gid)}
              onOpenGroupSheet={() => setGroupSheetOpen(true)}
            />

            {/* 햄버거 메뉴 */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="메뉴"
              style={{
                width: 32, height: 32,
                display: "grid", placeItems: "center",
                background: "transparent", border: 0, cursor: "pointer",
                color: "var(--text-primary)",
              }}
            >
              <MenuIcon size={22} strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* 메인 스크롤 영역 — 헤더 72px + iOS safe-area 만큼 위에서 떨어지게 + 좌우 스와이프 탭 전환 */}
        <div
          ref={contentCallbackRef}
          className="app-content absolute inset-0 overflow-y-auto"
          style={{
            paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
            // 가로 스와이프가 브라우저 기본 제스처와 충돌 안 하게
            touchAction: "pan-y",
          }}
          key={planKind + screen}
        >
          {/* 캘린더 계층 + 10분 플래너 — 상단 스코프 탭 (연/월/일/10분) */}
          {(screen === "year" || screen === "month" || screen === "daily" || screen === "tenmin") && (
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-canvas)" }}>
              <CalendarScopeTabs
                accent={accent}
                active={screen as ScopeKey}
                onChange={(k) => {
                  setScreen(k as Screen);
                  setMoreOpen(false);
                }}
              />
            </div>
          )}

          {/* 화면 전환 애니메이션 wrapper — 진입 방향에 따라 슬라이드/페이드/줌 */}
          <div className={transitionClass} key={screen}>
            {renderScreen()}
          </div>
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
            aria-label="하루온봇 열기"
            className="absolute left-1/2 active:scale-95 transition-transform"
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

        {/* 더보기 메뉴 */}
        {moreOpen && (
          <div
            className="absolute z-40 right-3 rounded-2xl overflow-hidden more-menu-enter"
            style={{
              bottom: 96,
              background: "var(--bg-elevated)",
              border: "0.5px solid var(--hairline)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              backdropFilter: "blur(20px)",
              transformOrigin: "bottom right",
            }}
          >
            {/* 캘린더 — 연력/달력/일력은 계층 구조로 통합. 메인 진입은 월(달력) 뷰 */}
            <MoreItem icon={<CalendarDays size={16} />} label="캘린더" onClick={() => { setScreen("month"); setMoreOpen(false); }} />
            <MoreItem icon={<Clock size={16} />} label="10분 플래너" onClick={() => { setScreen("tenmin"); setMoreOpen(false); }} />
            <MoreItem icon={<BookOpen size={16} />} label="일기" onClick={() => { setScreen("diary"); setMoreOpen(false); }} last />
          </div>
        )}
        </>
        )}
        {/* ─── 메인 앱 셸 끝 ──────────────────────────────────── */}

        {/* 플랜 선택 — splash 단계에서도 미리 렌더 (splash 가 위에서 페이드 아웃되며 자연스럽게 드러남) */}
        {(stage === "select" || stage === "splash") && (
          <PlanSelect
            accent={accent}
            stats={computePlanStats({
              sharedEvents: myEvents,
              myTodos,
              groupCount: myGroups.length,
            })}
            recentPlanKind={planKind === "my" ? "my" : "shared"}
            onSelect={(k) => {
              if (k === "my") {
                setPlanKind("my");
                setStage("app");
              } else {
                // "공동" 선택 — 그룹이 있으면 첫 그룹 진입, 없으면 그룹 시트 열어 안내
                if (myGroups.length > 0) {
                  setPlanKind(myGroups[0].id);
                  setStage("app");
                } else {
                  setStage("app");
                  setGroupSheetOpen(true);
                }
              }
            }}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {/* 스플래시 — 페이드 아웃 중에도 마운트 유지, opacity 0 되면 unmount */}
        {splashMounted && (
          <Splash
            accent={accent}
            onLeaveStart={() => {
              // 사용자가 페이드 중에 이미 카드를 눌렀다면 stage가 "app"일 수 있음 → 그 경우 덮어쓰지 않음
              setStage((prev) => (prev === "splash" ? "select" : prev));
            }}
            onDone={() => setSplashMounted(false)}
          />
        )}

        {/* 신규/편집 통합 일정 모달 */}
        <NewEventModal
          open={newEventOpen}
          onClose={() => {
            setNewEventOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleAddEvent}
          initial={newEventInitial}
          editing={editingEvent}
          onDelete={handleDeleteEvent}
          accent={accent}
        />

        {/* 햄버거 메뉴 시트 */}
        <AppMenuSheet
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          accent={accent}
          onNavigate={(s) => {
            setScreen(s as Screen);
            setMoreOpen(false);
          }}
          onOpenSettings={() => {
            setMenuOpen(false);
            setSettingsOpen(true);
          }}
          onOpenAuth={() => {
            setMenuOpen(false);
            setAuthOpen(true);
          }}
          onOpenAccount={() => {
            setMenuOpen(false);
            setAccountOpen(true);
          }}
          onOpenGroups={() => {
            setMenuOpen(false);
            setGroupSheetOpen(true);
          }}
        />

        {/* 로그인 / 회원가입 모달 */}
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          accent={accent}
        />

        {/* 계정 시트 */}
        <AccountSheet
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          accent={accent}
        />

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

        {/* 그룹 관리 시트 — 목록 / 새 그룹 / 코드로 참여 */}
        <GroupSheet
          open={groupSheetOpen}
          onClose={() => setGroupSheetOpen(false)}
          accent={accent}
          onSelectGroup={(gid) => setPlanKind(gid)}
          onOpenDetail={(gid) => {
            setGroupDetailId(gid);
          }}
        />

        {/* 그룹 상세 시트 — 이름 / 초대 코드 / 이메일 초대 / 멤버 / 나가기·삭제 */}
        <GroupDetailSheet
          open={groupDetailId !== null}
          groupId={groupDetailId}
          onClose={() => setGroupDetailId(null)}
          accent={accent}
          onAfterLeaveOrDelete={() => {
            // 떠난 / 삭제한 그룹이 활성이라면 "my" 로 되돌림
            if (planKind === groupDetailId) setPlanKind("my");
          }}
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
