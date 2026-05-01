// 계정 시트 — 로그인된 사용자 정보 + 로그아웃 + 계정 삭제

import { useState } from "react";
import { LogOut, Trash2 } from "lucide-react";
import { useUserStore } from "@/store/userStore";

export function AccountSheet({
  open,
  onClose,
  accent,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
}) {
  const user = useUserStore((s) => s.user);
  const signOut = useUserStore((s) => s.signOut);
  const deleteAccount = useUserStore((s) => s.deleteAccount);

  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSignOut = async () => {
    setError(null);
    setBusy(true);
    try {
      await signOut();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그아웃 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      await deleteAccount();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "계정 삭제 실패");
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  // 비로그인 상태인데 시트가 열린 경우 — 안전 가드
  if (!user) {
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
            padding: "24px 20px 32px",
            textAlign: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              padding: "20px 0",
            }}
          >
            로그인 정보를 불러올 수 없습니다
          </div>
        </div>
      </div>
    );
  }

  const initial = (user.displayName || user.email || "?").trim().charAt(0).toUpperCase();

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

        {/* 헤더 */}
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
            닫기
          </button>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.3px",
            }}
          >
            계정
          </div>
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
          {/* 사용자 카드 */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 14,
              padding: "20px 16px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 8,
            }}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 999,
                  background: `${accent}26`,
                  color: accent,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.displayName || "이름 없음"}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 4,
                  letterSpacing: "0.2px",
                  textTransform: "uppercase",
                }}
              >
                {user.provider === "google" ? "Google 계정" : "이메일 계정"}
              </div>
            </div>
          </div>

          {/* 에러 */}
          {error && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#ef4444",
                paddingLeft: 4,
              }}
            >
              {error}
            </div>
          )}

          {/* 로그아웃 */}
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="active:scale-[0.99]"
            style={{
              width: "100%",
              height: 48,
              marginTop: 16,
              borderRadius: 12,
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: 0,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.3px",
              cursor: busy ? "default" : "pointer",
              opacity: busy ? 0.6 : 1,
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "opacity 120ms",
            }}
          >
            <LogOut size={16} strokeWidth={1.8} />
            로그아웃
          </button>

          {/* 계정 삭제 */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#ef4444",
                  letterSpacing: "-0.2px",
                  padding: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Trash2 size={12} strokeWidth={1.8} />
                계정 삭제
              </button>
            ) : (
              <div
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "0.5px solid rgba(239,68,68,0.3)",
                  borderRadius: 12,
                  padding: "14px 16px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.2px",
                  }}
                >
                  정말 계정을 삭제할까요?
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 4,
                    lineHeight: 1.5,
                  }}
                >
                  계정과 동기화된 일정 데이터가 모두 삭제되며 되돌릴 수 없습니다.
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={busy}
                    className="active:scale-[0.99]"
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      background: "var(--bg-elevated)",
                      color: "var(--text-primary)",
                      border: "0.5px solid var(--hairline)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="active:scale-[0.99]"
                    style={{
                      flex: 1,
                      height: 40,
                      borderRadius: 10,
                      background: "#ef4444",
                      color: "#fff",
                      border: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                      opacity: busy ? 0.6 : 1,
                      fontFamily: "inherit",
                    }}
                  >
                    {busy ? "삭제 중…" : "삭제"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
