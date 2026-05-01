// 햄버거 메뉴 시트 — 사이트맵 형태로 모든 화면 + 설정 진입점
//
// 우측에서 슬라이드 인되는 패널, 카테고리별로 그룹화된 메뉴 목록.

import {
  Sun,
  Calendar,
  Target,
  CalendarDays,
  Clock,
  BookOpen,
  X,
  Settings as SettingsIcon,
  HelpCircle,
  LogIn,
  ChevronRight,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";

type Screen =
  | "day"
  | "month"
  | "year"
  | "week"
  | "tenmin"
  | "mandala"
  | "diary"
  | "daily";

type Item = {
  key: string;
  label: string;
  desc: string;
  icon: any;
  onClick: () => void;
};

export function AppMenuSheet({
  open,
  onClose,
  accent,
  onNavigate,
  onOpenSettings,
  onOpenAuth,
  onOpenAccount,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  onNavigate: (screen: Screen) => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onOpenAccount?: () => void;
}) {
  const user = useUserStore((s) => s.user);

  if (!open) return null;

  const sections: { title: string; items: Item[] }[] = [
    {
      title: "메인",
      items: [
        {
          key: "day",
          label: "오늘",
          desc: "오늘 일정과 할 일",
          icon: Sun,
          onClick: () => onNavigate("day"),
        },
        {
          key: "month",
          label: "캘린더",
          desc: "월간 일정 보기",
          icon: Calendar,
          onClick: () => onNavigate("month"),
        },
        {
          key: "mandala",
          label: "목표",
          desc: "만다라트 9×9",
          icon: Target,
          onClick: () => onNavigate("mandala"),
        },
      ],
    },
    {
      title: "캘린더",
      items: [
        {
          key: "year",
          label: "연력",
          desc: "1년 한눈에",
          icon: CalendarDays,
          onClick: () => onNavigate("year"),
        },
        {
          key: "month-cal",
          label: "월력",
          desc: "한 달 캘린더",
          icon: Calendar,
          onClick: () => onNavigate("month"),
        },
        {
          key: "daily",
          label: "일력",
          desc: "하루 시간표",
          icon: Calendar,
          onClick: () => onNavigate("daily"),
        },
      ],
    },
    {
      title: "도구",
      items: [
        {
          key: "tenmin",
          label: "10분 플래너",
          desc: "집중 시간 설계",
          icon: Clock,
          onClick: () => onNavigate("tenmin"),
        },
        {
          key: "diary",
          label: "일기",
          desc: "하루 기록",
          icon: BookOpen,
          onClick: () => onNavigate("diary"),
        },
      ],
    },
    {
      title: "기타",
      items: [
        {
          key: "settings",
          label: "설정",
          desc: "테마 · 액센트 · AI",
          icon: SettingsIcon,
          onClick: () => onOpenSettings(),
        },
        {
          key: "help",
          label: "도움말",
          desc: "사용 가이드",
          icon: HelpCircle,
          onClick: () => {
            // TODO: 도움말 추후
            onClose();
          },
        },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0)", animation: "none" }}
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 backdrop-fade"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />

      {/* 우측 슬라이드 패널 */}
      <div
        className="relative panel-slide-right"
        style={{
          width: "min(85vw, 320px)",
          height: "100%",
          background: "var(--bg-canvas)",
          borderLeft: "0.5px solid var(--hairline)",
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top, 0)",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "0.5px solid var(--hairline)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.4px",
            }}
          >
            메뉴
          </div>
          <button
            onClick={onClose}
            className="active:scale-90"
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "var(--bg-tertiary)",
              border: 0,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* 본문 — 섹션별 메뉴 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "12px 0 24px",
          }}
        >
          {/* 계정 섹션 */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                padding: "6px 20px",
              }}
            >
              계정
            </div>
            {user ? (
              <button
                onClick={() => {
                  onOpenAccount?.();
                  onClose();
                }}
                className="active:scale-[0.99]"
                style={{
                  width: "calc(100% - 24px)",
                  margin: "0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: "var(--bg-secondary)",
                  border: 0,
                  borderRadius: 12,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: `${accent}26`,
                      color: accent,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(user.displayName || user.email || "?").trim().charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.displayName || "이름 없음"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.email}
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={1.8}
                  color="var(--text-muted)"
                />
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth?.();
                  onClose();
                }}
                className="active:scale-[0.99]"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 20px",
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${accent}1A`,
                    color: accent,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <LogIn size={18} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    로그인 / 회원가입
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 1,
                    }}
                  >
                    일정을 안전하게 동기화
                  </div>
                </div>
              </button>
            )}
          </div>

          {sections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  padding: "6px 20px",
                }}
              >
                {sec.title}
              </div>
              {sec.items.map((it) => {
                const Ic = it.icon;
                return (
                  <button
                    key={it.key}
                    onClick={() => {
                      it.onClick();
                      onClose();
                    }}
                    className="active:scale-[0.99]"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "10px 20px",
                      background: "transparent",
                      border: 0,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "background 120ms",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: `${accent}1A`,
                        color: accent,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Ic size={18} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {it.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        {it.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
