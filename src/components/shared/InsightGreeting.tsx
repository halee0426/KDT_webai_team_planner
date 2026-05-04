// src/components/shared/InsightGreeting.tsx
// 앱 진입 시 1회 표시되는 AI 인사이트 인사말 모달.
// "오늘 하루 보지 않기" 시 localStorage 'kdt-insight-dismissed-date' = 'YYYY-MM-DD'.

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

const STORAGE_KEY = "kdt-insight-dismissed-date";

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 오늘 이미 닫혔는지(같은 날 다시 안 띄움) */
export function shouldShowInsightToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== todayKey();
  } catch {
    return true;
  }
}

export function InsightGreeting({
  onClose,
  message = "오늘 일정과 할 일을 살펴보고 있어요.\n잠시 후 더 알맞은 제안을 보여드릴게요.",
  accent = "#0066cc",
}: {
  onClose: () => void;
  message?: string;
  accent?: string;
}) {
  // visible: 마운트 후 진입 트랜지션, leaving: 페이드아웃 단계
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const close = (dismissForToday = false) => {
    if (dismissForToday) {
      try { localStorage.setItem(STORAGE_KEY, todayKey()); } catch {}
    }
    setLeaving(true);
    setTimeout(onClose, 200);
  };

  const opacity = leaving ? 0 : visible ? 1 : 0;
  const scale = leaving ? 0.98 : visible ? 1 : 0.95;

  return (
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center"
      style={{
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        opacity,
        transition: leaving
          ? "opacity 0.2s ease-in"
          : "opacity 0.3s ease-out",
      }}
      onClick={() => close(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="insight-greeting-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginLeft: 24,
          marginRight: 24,
          width: "calc(100% - 48px)",
          maxWidth: 380,
          padding: "28px 24px",
          borderRadius: 24,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          transform: `scale(${scale})`,
          transition: leaving
            ? "transform 0.2s ease-in"
            : "transform 0.3s ease-out",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* 아이콘 — 하루온 로고 마크 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            borderRadius: 16,
            boxShadow: `0 8px 24px ${accent}33, 0 0 0 6px ${accent}0F`,
          }}
        >
          <LogoMark size={48} accent={accent} rounded={16} />
        </div>

        {/* 제목 */}
        <div
          id="insight-greeting-title"
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.4px",
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          오늘도 함께 채워볼까요?
        </div>

        {/* 본문 */}
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: "var(--text-secondary)",
            letterSpacing: "-0.24px",
            whiteSpace: "pre-line",
            textWrap: "pretty" as any,
          }}
        >
          {message}
        </div>

        {/* 20px 간격 */}
        <div style={{ height: 20 }} />

        {/* 메인 버튼 */}
        <button
          onClick={() => close(false)}
          className="active:scale-[0.98] transition-transform"
          style={{
            width: "100%",
            height: 44,
            borderRadius: 980,
            background: accent,
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "-0.24px",
            border: 0,
            cursor: "pointer",
            boxShadow: `0 6px 16px ${accent}40`,
          }}
        >
          확인
        </button>

        {/* 서브 버튼 */}
        <button
          onClick={() => close(true)}
          style={{
            marginTop: 10,
            width: "100%",
            height: 32,
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: "-0.2px",
            border: 0,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            textDecorationColor: "rgba(0,0,0,0.15)",
          }}
        >
          오늘 하루 보지 않기
        </button>
      </div>
    </div>
  );
}
