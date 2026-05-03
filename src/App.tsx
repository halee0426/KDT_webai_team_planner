// Figma Make 디자인 그대로 — 모바일 앱 프레임 + 7개 뷰 + 탭바

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Menu as MenuIcon, Calendar, CalendarDays, Target,
  Sun, BookOpen, Clock, Grid3x3,
  User as UserIcon, Users as UsersIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING, EASE, DURATION } from "@/styles/animations";
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
import { askAI } from "@/lib/aiClient";

type Theme = "light" | "dark" | "system";
type Screen = "day" | "month" | "year" | "week" | "tenmin" | "mandala" | "diary" | "daily";
type Stage = "splash" | "select" | "app";
const ACCENT_DEFAULT_MIGRATION_KEY = "kdt:accentKeyDefaultMintMigrated";

const ALL_SCREENS: Array<{ screen: Screen; label: string; helper: string; icon: React.ReactNode }> = [
  { screen: "day", label: "오늘", helper: "오늘의 일정과 할 일을 한눈에 보기", icon: <Sun size={18} strokeWidth={1.75} /> },
  { screen: "year", label: "연력", helper: "한 해 계획과 주요 일정을 한눈에 보기", icon: <Grid3x3 size={18} strokeWidth={1.75} /> },
  { screen: "month", label: "달력", helper: "월별 일정과 기간 계획을 한눈에 보기", icon: <Calendar size={18} strokeWidth={1.75} /> },
  { screen: "daily", label: "일력", helper: "하루의 시간표와 일정을 자세히 보기", icon: <CalendarDays size={18} strokeWidth={1.75} /> },
  { screen: "tenmin", label: "10분 플래너", helper: "10분 단위로 촘촘하게 하루를 설계하기", icon: <Clock size={18} strokeWidth={1.75} /> },
  { screen: "mandala", label: "만다라트", helper: "한 해 목표를 구체적인 실천으로 바꾸기", icon: <Target size={18} strokeWidth={1.75} /> },
  { screen: "diary", label: "일기", helper: "하루의 기록과 감정을 남기기", icon: <BookOpen size={18} strokeWidth={1.75} /> },
];

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
  const [accentKey, setAccentKey] = usePersistedState<AccentKey>("accentKey:v2", "mint");
  const [aiOn, setAiOn] = usePersistedState<boolean>("aiOn", true);
  // planKind: "my" 또는 groupId (string). 기존 "shared" 값은 그룹 모델 도입 전 유산이라 "my" 로 마이그레이션
  const [planKindRaw, setPlanKind] = usePersistedState<string>("planKind", "my");
  const planKind = planKindRaw === "shared" ? "my" : planKindRaw;
  useEffect(() => {
    if (planKindRaw === "shared") setPlanKind("my");
  }, [planKindRaw, setPlanKind]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(ACCENT_DEFAULT_MIGRATION_KEY) === "1") return;
    localStorage.setItem(ACCENT_DEFAULT_MIGRATION_KEY, "1");
    if (accentKey === "blue") setAccentKey("mint");
  }, [accentKey, setAccentKey]);

  // 활성 그룹 — planKind 가 "my" 가 아니면 그게 groupId
  const activeGroupId = planKind === "my" ? null : planKind;

  // 내 그룹 목록 + 로그인 사용자
  const user = useUserStore((s) => s.user);
  const { groups: myGroups } = useMyGroups();

  // 활성 그룹 객체 — DayView 등에서 멤버 표시에 사용
  const activeGroup = useMemo(
    () => (activeGroupId ? myGroups.find((g) => g.id === activeGroupId) ?? null : null),
    [activeGroupId, myGroups],
  );

  // 새로 만든/가입한 그룹을 활성화한 직후 onSnapshot 이 따라잡기 전에
  // 아래 fallback useEffect 가 "stillExists=false" 로 판단해 "my" 로 되돌리는
  // race condition 방지용 — grace period 동안만 fallback 보호
  const recentActiveGroupRef = useRef<{ id: string; at: number } | null>(null);
  const setActivePlan = useCallback(
    (value: string) => {
      if (value !== "my") {
        recentActiveGroupRef.current = { id: value, at: Date.now() };
      }
      setPlanKind(value);
    },
    [setPlanKind],
  );

  // 캘린더 계층 네비게이션 — 연력 → 달력 → 일력 사이 공통 focus (year/month/day)
  const todayObj = new Date();
  const [calYear, setCalYear] = useState<number>(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(todayObj.getMonth());
  const [calDay, setCalDay] = useState<number>(todayObj.getDate());

  // 일시적 UI 상태 — 영속화 X
  const [screen, setScreen] = useState<Screen>("day");

  // 화면 전환 — motion variant 로 진입 방향 결정 (좌/우 슬라이드 + 깊이 줌)
  const prevScreenRef = useRef<Screen>(screen);
  const MAIN_TAB_ORDER: Screen[] = ["day", "month", "mandala", "diary"];
  const calDepth = (s: Screen) =>
    s === "year" ? 0 : s === "month" ? 1 : s === "daily" ? 2 : -1;
  /** 진입 방향 — page transition motion variant 결정용
   *  'right' = 새 화면이 오른쪽에서 들어옴 (다음 탭 / 깊이 진입)
   *  'left'  = 왼쪽에서 들어옴 (이전 탭 / 깊이 후퇴)
   *  'fade'  = 같은 깊이 / 알 수 없음 — 단순 페이드 */
  const transitionDir = useMemo<"right" | "left" | "fade">(() => {
    const prev = prevScreenRef.current;
    if (prev === screen) return "fade";
    const prevMain = MAIN_TAB_ORDER.indexOf(prev as any);
    const curMain = MAIN_TAB_ORDER.indexOf(screen as any);
    if (prevMain !== -1 && curMain !== -1) {
      return curMain > prevMain ? "right" : "left";
    }
    const prevD = calDepth(prev);
    const curD = calDepth(screen);
    if (prevD !== -1 && curD !== -1) {
      return curD > prevD ? "right" : "left";
    }
    return "fade";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
  useEffect(() => {
    prevScreenRef.current = screen;
  }, [screen]);

  const [settingsOpen, setSettingsOpen] = useState(false);
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

  // AI 자연어 입력 → /api/ai/orchestrate 실제 호출
  // 미인증 사용자는 차단 (안내 reply 만 반환), 그 외 에러는 메시지 그대로 표시
  const handleAISubmit = async (text: string): Promise<{ reply: string; events?: AIEvent[] }> => {
    if (!user) {
      return { reply: "로그인 후 하루온봇을 사용할 수 있어요." };
    }
    try {
      const isGroup = !!activeGroupId;
      return await askAI(text, {
        scope: isGroup ? "group" : "personal",
        groupId: isGroup ? activeGroupId : undefined,
        groupName: activeGroup?.name ?? null,
        personalEvents: isGroup ? undefined : myEvents,
        personalTodos: isGroup ? undefined : myTodos,
        groupEvents: isGroup ? groupEvents : undefined,
        groupTodos: isGroup ? groupTodos : undefined,
        currentScreen: screen,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "AI 호출 중 오류가 발생했어요.";
      return { reply: message };
    }
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
    if (!stillExists) {
      // 방금 setActivePlan 으로 활성화된 그룹은 onSnapshot 이 도착하기까지
      // grace period 동안 fallback 차단 — 새 그룹 생성/가입 직후 race 보호
      const recent = recentActiveGroupRef.current;
      if (recent && recent.id === planKind && Date.now() - recent.at < 2500) return;
      setPlanKind("my");
    }
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
  const SWIPE_TABS: Screen[] = ["day", "month", "mandala", "diary"];
  // 최신 screen 참조용 (이벤트 리스너가 stale closure 안 쓰게)
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  const setScreenRef = useRef(setScreen);
  useEffect(() => {
    setScreenRef.current = setScreen;
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
        } else if (dx > 0 && idx > 0) {
          setScreenRef.current(SWIPE_TABS[idx - 1]);
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
          events={events}
          onOpenEdit={openEditEvent}
          activeGroup={activeGroup}
          currentUid={user?.uid ?? null}
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
          onBack={() => setScreen("year")}
          onOpenDay={(y, m, d) => {
            setCalYear(y); setCalMonth(m); setCalDay(d);
            setScreen("daily");
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
          onBack={() => setScreen("month")}
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
                width: "min(100vw - 24px, 2048px)",
                height: "min(100vh - 24px, 1180px)",
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
        isMobile ? (
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
              onSelectGroup={(gid) => setActivePlan(gid)}
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
          {/* 캘린더 계층 — 상단 스코프 탭 (연/월/일/10분). 10분 플래너는 dot 으로 강조 */}
          {(screen === "year" || screen === "month" || screen === "daily" || screen === "tenmin") && (
            <div style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg-canvas)" }}>
              <CalendarScopeTabs
                accent={accent}
                active={screen as ScopeKey}
                onChange={(k) => setScreen(k as Screen)}
              />
            </div>
          )}

          {/* 화면 전환 애니메이션 — motion variant 로 좌/우 슬라이드 + fade */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={screen}
              initial={
                transitionDir === "right"
                  ? { opacity: 0, x: "8%" }
                  : transitionDir === "left"
                  ? { opacity: 0, x: "-8%" }
                  : { opacity: 0 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                transitionDir === "right"
                  ? { opacity: 0, x: "-4%" }
                  : transitionDir === "left"
                  ? { opacity: 0, x: "4%" }
                  : { opacity: 0 }
              }
              transition={{
                duration: DURATION.page / 1000,
                ease: EASE.outQuart,
              }}
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
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
            <TabBtn icon={<Sun size={22} strokeWidth={1.5} />} label="오늘" active={screen === "day"} accent={accent} onClick={() => setScreen("day")} />
            <TabBtn icon={<Calendar size={22} strokeWidth={1.5} />} label="캘린더" active={screen === "month" || screen === "week" || screen === "year" || screen === "daily"} accent={accent} onClick={() => setScreen("month")} />
            <div style={{ width: 56 }} />
            <TabBtn icon={<Target size={22} strokeWidth={1.5} />} label="목표" active={screen === "mandala"} accent={accent} onClick={() => setScreen("mandala")} />
            <TabBtn icon={<BookOpen size={22} strokeWidth={1.5} />} label="일기" active={screen === "diary"} accent={accent} onClick={() => setScreen("diary")} />
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

        </>
        ) : (
          <div className="flex h-full w-full overflow-hidden">
            <aside
              className="flex h-full w-[320px] shrink-0 flex-col border-r"
              style={{ borderColor: "var(--hairline)", background: "var(--bg-canvas)" }}
            >
              <div className="flex items-center justify-between px-6 pt-8 pb-6">
                <LogoLockup color="#444444" accent={accent} size={32} />
                <button
                  onClick={() => setMenuOpen(true)}
                  aria-label="메뉴"
                  className="grid place-items-center transition-transform active:scale-95"
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 16,
                    background: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: 0,
                    cursor: "pointer",
                  }}
                >
                  <MenuIcon size={20} strokeWidth={1.9} />
                </button>
              </div>

              <div className="px-5 pb-6">
                <div
                  className="grid grid-cols-2 gap-1 rounded-full p-1"
                  style={{ background: "var(--bg-tertiary)" }}
                >
                  {[
                    { key: "my", label: "나의 플랜", icon: <UserIcon size={15} strokeWidth={1.8} /> },
                    { key: "group", label: "공동 플랜", icon: <UsersIcon size={15} strokeWidth={1.8} /> },
                  ].map((item) => {
                    const active = item.key === "my" ? planKind === "my" : planKind !== "my";
                    return (
                      <button
                        key={item.key}
                        onClick={() => {
                          if (item.key === "my") setPlanKind("my");
                          else if (myGroups.length > 0) setActivePlan(myGroups[0].id);
                          else setGroupSheetOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-all"
                        style={{
                          background: active ? "var(--bg-elevated)" : "transparent",
                          color: active ? accent : "var(--text-secondary)",
                          boxShadow: active ? "0 2px 10px rgba(0,0,0,0.08)" : "none",
                        }}
                      >
                        {item.icon}
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 pb-5">
                <div className="flex flex-col gap-2.5">
                  {ALL_SCREENS.map((item) => {
                    const active =
                      item.screen === "month"
                        ? screen === "month" || screen === "week"
                        : screen === item.screen;
                    return (
                      <button
                        key={item.screen}
                        onClick={() => setScreen(item.screen)}
                        className="flex w-full items-center gap-3.5 rounded-[22px] px-4 py-3 text-left transition-all active:scale-[0.98]"
                        style={{
                          background: active ? `${accent}14` : "transparent",
                          color: active ? accent : "var(--text-primary)",
                        }}
                      >
                        <span
                          className="grid place-items-center rounded-[15px]"
                          style={{
                            width: 42,
                            height: 42,
                            background: active ? `${accent}18` : "var(--bg-tertiary)",
                            color: active ? accent : "var(--text-primary)",
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </span>
                        <span className="min-w-0">
                          <span style={{ display: "block", fontSize: 16.5, fontWeight: 800 }}>
                            {item.label}
                          </span>
                          <span
                            style={{
                              display: "block",
                              marginTop: 3,
                              color: "var(--text-secondary)",
                              fontSize: 12,
                              lineHeight: 1.32,
                              whiteSpace: "normal",
                              wordBreak: "keep-all",
                            }}
                          >
                            {item.helper}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              <div className="px-4 pb-6 pt-2">
                <button
                  onClick={() => setAiChatOpen(true)}
                  className="flex w-full items-center gap-3 rounded-[22px] px-4 py-3.5 text-left transition-transform active:scale-[0.98]"
                  style={{
                    background: isDark ? `${accent}22` : `${accent}16`,
                    border: `0.5px solid ${accent}33`,
                    color: "var(--text-primary)",
                  }}
                >
                  <LogoMark size={32} accent={accent} rounded={11} />
                  <span className="min-w-0">
                    <span style={{ display: "block", fontSize: 14, fontWeight: 700, color: accent }}>
                      하루온봇
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      일정과 계획을 도와드려요
                    </span>
                  </span>
                </button>
              </div>
            </aside>

            <main
              ref={contentCallbackRef}
              className="flex-1 overflow-y-auto"
              style={{
                background: "var(--bg-canvas)",
                touchAction: "pan-y",
              }}
              key={planKind + screen}
            >
              <div className="mx-auto w-full px-8 py-10 xl:px-10 2xl:px-12" style={{ maxWidth: 1540 }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={screen}
                    initial={
                      transitionDir === "right"
                        ? { opacity: 0, x: "3%" }
                        : transitionDir === "left"
                        ? { opacity: 0, x: "-3%" }
                        : { opacity: 0 }
                    }
                    animate={{ opacity: 1, x: 0 }}
                    exit={
                      transitionDir === "right"
                        ? { opacity: 0, x: "-2%" }
                        : transitionDir === "left"
                        ? { opacity: 0, x: "2%" }
                        : { opacity: 0 }
                    }
                    transition={{
                      duration: DURATION.page / 1000,
                      ease: EASE.outQuart,
                    }}
                  >
                    {renderScreen()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>
          </div>
        ))}
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
            groups={myGroups}
            currentUid={user?.uid ?? null}
            onSelectGroup={(gid) => {
              setActivePlan(gid);
              setStage("app");
            }}
            onOpenGroupManage={() => {
              setStage("app");
              setGroupSheetOpen(true);
            }}
            onSelect={(k) => {
              if (k === "my") {
                setPlanKind("my");
                setStage("app");
              } else {
                // "공동" 선택 — 그룹이 있으면 첫 그룹 진입, 없으면 그룹 시트 열어 안내
                // (2개 이상이어도 첫 그룹 자동 활성화 — 사용자는 미니 카드로 다른 그룹 직접 선택 가능)
                if (myGroups.length > 0) {
                  setActivePlan(myGroups[0].id);
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
          constrainToFrame={isMobile}
          onNavigate={(s) => setScreen(s as Screen)}
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
          onSelectGroup={(gid) => setActivePlan(gid)}
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
      className="flex-1 flex flex-col items-center gap-0.5 active:scale-95 relative"
      style={{ color: active ? accent : "var(--text-muted)", transition: "color 180ms" }}
    >
      {/* 활성 indicator — layoutId 로 부드럽게 슬라이드 */}
      {active && (
        <motion.div
          layoutId="tabbar-active-dot"
          transition={SPRING.snap}
          style={{
            position: "absolute",
            top: -6,
            width: 4,
            height: 4,
            borderRadius: 999,
            background: accent,
          }}
        />
      )}
      {icon}
      <span style={{ fontSize: 11, fontWeight: active ? 600 : 500, letterSpacing: "-0.12px" }}>{label}</span>
    </button>
  );
}

