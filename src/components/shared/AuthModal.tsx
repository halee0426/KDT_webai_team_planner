// 로그인 / 회원가입 통합 모달 — Haru:on 톤 (sheet-style)

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";
import { useUserStore } from "@/store/userStore";

type Mode = "signin" | "signup";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "이메일 또는 비밀번호가 잘못되었습니다",
  "auth/wrong-password": "이메일 또는 비밀번호가 잘못되었습니다",
  "auth/user-not-found": "이메일 또는 비밀번호가 잘못되었습니다",
  "auth/email-already-in-use": "이미 사용 중인 이메일입니다",
  "auth/weak-password": "비밀번호는 6자 이상이어야 합니다",
  "auth/invalid-email": "이메일 형식이 올바르지 않습니다",
  "auth/popup-closed-by-user": "Google 로그인이 취소되었습니다",
  "auth/popup-blocked": "팝업이 차단되었습니다. 브라우저 설정을 확인해주세요",
  "auth/network-request-failed": "네트워크 연결을 확인해주세요",
};

function mapError(e: unknown): string {
  if (e && typeof e === "object" && "code" in e) {
    const code = String((e as { code: unknown }).code);
    if (ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  }
  if (e instanceof Error && e.message) return e.message;
  return "로그인에 실패했습니다. 잠시 후 다시 시도해주세요";
}

export function AuthModal({
  open,
  onClose,
  accent,
  initialMode = "signin",
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useUserStore((s) => s.signIn);
  const signUp = useUserStore((s) => s.signUp);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setLoading(false);
      setError(null);
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleEmail = async () => {
    setError(null);
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("이름을 입력해주세요");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn("email", email, password);
      } else {
        await signUp(email, password, displayName.trim());
      }
      onClose();
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn("google");
      onClose();
    } catch (e) {
      setError(mapError(e));
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "signin" ? "로그인" : "회원가입";
  const sub =
    mode === "signin"
      ? "Haru:on 에 오신 걸 환영합니다"
      : "계정을 만들어 일정을 안전하게 보관하세요";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 backdrop-fade"
        style={{ background: "rgba(0,0,0,0.3)" }}
      />
      <div
        className="relative w-full max-w-[375px] mx-auto rounded-t-3xl sheet-slide-up"
        style={{
          background: "var(--bg-elevated)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div
            className="w-9 h-1 rounded-full"
            style={{ background: "var(--separator)" }}
          />
        </div>

        {/* 헤더 — 취소만 (모드 토글이 본문에 있어 헤더는 단순) */}
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--text-secondary)",
              padding: 0,
            }}
          >
            취소
          </button>
          <div style={{ width: 32 }} />
        </div>

        {/* 본문 */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 20px 24px",
          }}
        >
          {/* 로고 + 타이틀 */}
          <div style={{ textAlign: "center", padding: "12px 0 24px" }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: "0 auto 14px",
                display: "grid",
                placeItems: "center",
              }}
            >
              <LogoMark size={56} accent={accent} rounded={14} />
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.6px",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginTop: 6,
                letterSpacing: "-0.2px",
              }}
            >
              {sub}
            </div>
          </div>

          {/* 입력 카드 */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {mode === "signup" && (
              <>
                <div style={fieldStyle}>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="이름"
                    style={inputStyle}
                    autoComplete="name"
                  />
                </div>
                <div style={dividerStyle} />
              </>
            )}
            <div style={fieldStyle}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일"
                style={inputStyle}
                autoComplete="email"
                inputMode="email"
              />
            </div>
            <div style={dividerStyle} />
            <div style={fieldStyle}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "비밀번호 (6자 이상)" : "비밀번호"}
                style={inputStyle}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleEmail();
                }}
              />
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "#ef4444",
                letterSpacing: "-0.2px",
                paddingLeft: 4,
              }}
            >
              {error}
            </div>
          )}

          {/* 이메일 버튼 (accent) */}
          <button
            onClick={handleEmail}
            disabled={loading}
            className="active:scale-[0.99]"
            style={{
              width: "100%",
              height: 48,
              marginTop: 16,
              borderRadius: 12,
              background: accent,
              color: "#fff",
              border: 0,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
              transition: "opacity 120ms",
            }}
          >
            {loading
              ? "처리 중…"
              : mode === "signin"
              ? "이메일로 로그인"
              : "회원가입"}
          </button>

          {/* 구분선 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "16px 0",
            }}
          >
            <div style={{ flex: 1, height: 0.5, background: "var(--hairline)" }} />
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                letterSpacing: "0.3px",
              }}
            >
              또는
            </div>
            <div style={{ flex: 1, height: 0.5, background: "var(--hairline)" }} />
          </div>

          {/* Google 버튼 */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="active:scale-[0.99]"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 12,
              background: "#fff",
              color: "#1f1f1f",
              border: "0.5px solid var(--hairline)",
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "opacity 120ms",
            }}
          >
            <GoogleLogo />
            Google로 계속하기
          </button>

          {/* 모드 토글 */}
          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 13,
              color: "var(--text-secondary)",
              letterSpacing: "-0.2px",
            }}
          >
            {mode === "signin" ? "계정이 없나요? " : "이미 계정이 있나요? "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                color: accent,
                letterSpacing: "-0.2px",
                padding: 0,
              }}
            >
              {mode === "signin" ? "회원가입" : "로그인"}
            </button>
          </div>

          {/* 하단 안내 */}
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--bg-tertiary)",
              fontSize: 11,
              color: "var(--text-muted)",
              textAlign: "center",
              letterSpacing: "-0.1px",
              lineHeight: 1.5,
            }}
          >
            로그인 시 일정이 자동으로 동기화됩니다
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "transparent",
  border: 0,
  outline: "none",
  fontSize: 15,
  letterSpacing: "-0.3px",
  color: "var(--text-primary)",
  fontFamily: "inherit",
  padding: 0,
};

const fieldStyle: React.CSSProperties = {
  padding: "12px 16px",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
};

const dividerStyle: React.CSSProperties = {
  marginLeft: 16,
  borderBottom: "0.5px solid var(--hairline)",
};

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
