// 플랜 선택 진입 화면 — 인사 헤더 + 가로 풀폭 카드 두 장
//
// props (App.tsx 호환 유지):
//   accent: 사용자가 선택한 액센트 색상
//   onSelect: (kind: "my" | "shared") => void

import { useMemo } from "react";
import { LogoLockup } from "./Logo";

type PlanKind = "my" | "shared";

export type PlanSelectProps = {
  accent: string;
  userName?: string;
  recentPlanKind?: PlanKind;
  stats?: {
    todayCount?: number;
    weekCount?: number;
    teamMembers?: number;
    teamWeekShared?: number;
  };
  onSelect: (kind: PlanKind) => void;
  /** @deprecated — 더 이상 사용하지 않지만 App.tsx 호환을 위해 유지 */
  onOpenSettings?: () => void;
  /** @deprecated */
  onOpenHelp?: () => void;
};

export function PlanSelect({
  accent,
  userName = "",
  recentPlanKind = "my",
  stats,
  onSelect,
}: PlanSelectProps) {
  // accent 색상의 10% 톤 (배경) — RGB 변환 후 alpha 합성 대신 hex+1A 사용
  const accentSoft = `${accent}1A`;     // ~10% alpha
  const accentSofter = `${accent}33`;   // ~20% alpha (강조 시)

  const dateLabel = useMemo(() => {
    const d = new Date();
    const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${w}요일`;
  }, []);

  return (
    <div
      className="absolute inset-0 z-[70] flex flex-col"
      style={{
        background: "var(--bg-secondary)",
        // 메인 앱 헤더와 동일하게: 위는 safe-area + 헤더 영역만큼, 좌우 20px
        paddingTop: "env(safe-area-inset-top, 0)",
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: "max(env(safe-area-inset-bottom), 24px)",
        boxSizing: "border-box",
      }}
    >
      {/* 상단 미니 헤더 — 메인 앱과 동일한 72px 높이, 동일한 LogoLockup */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          flexShrink: 0,
        }}
      >
        <LogoLockup color="var(--text-primary)" accent={accent} size={28} />
        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
          {dateLabel}
        </div>
      </div>

      {/* 인사 헤딩 */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 13, color: accent, fontWeight: 600, letterSpacing: "-0.2px" }}>
          {userName ? `안녕하세요, ${userName}님 👋` : "안녕하세요 👋"}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "-0.8px",
            marginTop: 8,
            lineHeight: 1.3,
          }}
        >
          오늘은 어떤 하루를
          <br />
          계획해볼까요?
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5 }}>
          플랜을 선택해 일정을 시작하세요.
        </div>
      </div>

      {/* 카드 두 장 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
        <BigPlanCard
          kind="my"
          accent={accent}
          accentSoft={accentSoft}
          accentSofter={accentSofter}
          highlight={recentPlanKind === "my"}
          stats={stats}
          onClick={() => onSelect("my")}
        />
        <BigPlanCard
          kind="shared"
          accent={accent}
          accentSoft={accentSoft}
          accentSofter={accentSofter}
          highlight={recentPlanKind === "shared"}
          stats={stats}
          onClick={() => onSelect("shared")}
        />

        {/* 하루온봇 오늘의 추천 (액센트 컬러 카드) */}
        <HarubotRecommendCard accent={accent} stats={stats} onClick={() => onSelect("my")} />
      </div>
    </div>
  );
}

function BigPlanCard({
  kind,
  accent,
  accentSoft,
  accentSofter,
  highlight,
  stats,
  onClick,
}: {
  kind: PlanKind;
  accent: string;
  accentSoft: string;
  accentSofter: string;
  highlight?: boolean;
  stats?: PlanSelectProps["stats"];
  onClick: () => void;
}) {
  const isMy = kind === "my";
  void accentSofter;
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: 20,
        background: "var(--bg-elevated)",
        border: highlight ? `1.5px solid ${accent}` : "0.5px solid var(--hairline)",
        boxShadow: highlight ? `0 8px 24px ${accent}26` : "var(--card-shadow)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: accentSoft,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        {isMy ? <PersonIcon size={26} color={accent} /> : <PeopleIcon size={26} color={accent} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.4px",
            }}
          >
            {isMy ? "나의 플랜" : "공동 플랜"}
          </div>
          {highlight && (
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: accent,
                background: accentSoft,
                padding: "2px 6px",
                borderRadius: 4,
                letterSpacing: "-0.1px",
              }}
            >
              최근
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            marginTop: 3,
            letterSpacing: "-0.2px",
          }}
        >
          {isMy ? "혼자 차분하게 하루를 설계해요" : "팀과 함께 일정을 맞춰요"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 10,
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          {isMy ? (
            <>
              <span>오늘 일정 {stats?.todayCount ?? 0}개</span>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 999,
                  background: "var(--hairline)",
                }}
              />
              <span>이번 주 {stats?.weekCount ?? 0}개</span>
            </>
          ) : (
            <>
              <AvatarStack count={stats?.teamMembers ?? 0} />
              <span>{stats?.teamMembers ?? 0}명 참여 중</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight size={16} color="var(--text-muted)" />
    </button>
  );
}

function HarubotRecommendCard({
  accent,
  stats,
  onClick,
}: {
  accent: string;
  stats?: PlanSelectProps["stats"];
  onClick: () => void;
}) {
  const todayCount = stats?.todayCount ?? 0;
  const message =
    todayCount > 0
      ? `오늘 일정 ${todayCount}개,\n오전에 정리해볼까요?`
      : `오늘은 일정이 가벼워요.\n새로운 계획을 세워볼까요?`;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "20px",
        borderRadius: 20,
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}E0 100%)`,
        border: "none",
        boxShadow: `0 8px 24px ${accent}33`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 16,
          background: "rgba(255,255,255,0.22)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <SunIconWhite size={28} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "-0.1px",
            opacity: 0.9,
            marginBottom: 4,
          }}
        >
          ✨ 하루온봇 · 오늘의 추천
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            lineHeight: 1.4,
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </div>
      </div>
      <ChevronRight size={16} color="rgba(255,255,255,0.8)" />
    </button>
  );
}

function SunIconWhite({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="4.6" fill="#fff" />
      <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 5.5v2.5" />
        <path d="M16 24v2.5" />
        <path d="M5.5 16h2.5" />
        <path d="M24 16h2.5" />
        <path d="M8.5 8.5l1.8 1.8" />
        <path d="M21.7 21.7l1.8 1.8" />
        <path d="M8.5 23.5l1.8-1.8" />
        <path d="M21.7 10.3l1.8-1.8" />
      </g>
    </svg>
  );
}

function AvatarStack({ count }: { count: number }) {
  const palette = ["#FF3B30", "#FF9500", "#34C759", "#0066CC", "#AF52DE", "#5856D6"];
  const max = Math.min(count, 4);
  return (
    <div style={{ display: "flex" }}>
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: palette[i % palette.length],
            border: "1.5px solid var(--bg-elevated)",
            marginLeft: i === 0 ? 0 : -6,
          }}
        />
      ))}
    </div>
  );
}

function PersonIcon({ size = 22, color = "#0066cc" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  );
}

function PeopleIcon({ size = 22, color = "#0066cc" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.8" />
      <path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <path d="M15.5 13.7a5.5 5.5 0 0 1 6 6.3" />
    </svg>
  );
}

function ChevronRight({ size = 14, color = "#999" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
