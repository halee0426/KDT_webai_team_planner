// 그룹 관리 시트 — 내 그룹 목록 / 새 그룹 만들기 / 코드로 참여
//
// 탭: "내 그룹" | "+ 새 그룹" | "코드로 참여"

import { useState } from "react";
import { X, Users as UsersIcon, ChevronRight, Crown } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useMyGroups } from "@/hooks/useMyGroups";
import { createGroup, joinByCode } from "@/lib/firebase/groupsAdapter";
import type { Group } from "@/types/group";

type Tab = "list" | "create" | "join";

export function GroupSheet({
  open,
  onClose,
  accent,
  onSelectGroup,
  onOpenDetail,
}: {
  open: boolean;
  onClose: () => void;
  accent: string;
  /** 그룹 선택 시 plan 진입 */
  onSelectGroup: (groupId: string) => void;
  /** 그룹 상세(관리) 화면 열기 */
  onOpenDetail: (groupId: string) => void;
}) {
  const user = useUserStore((s) => s.user);
  const { groups, loading } = useMyGroups();
  const [tab, setTab] = useState<Tab>("list");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleCreate = async () => {
    if (!user) {
      setError("로그인이 필요합니다");
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      setError("그룹 이름을 입력해주세요");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const ownerName = user.displayName || user.email || "이름없음";
      const g = await createGroup(user.uid, ownerName, trimmed);
      setName("");
      setTab("list");
      onSelectGroup(g.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "그룹 생성 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      setError("로그인이 필요합니다");
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError("6자리 코드를 입력해주세요");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const displayName = user.displayName || user.email || "이름없음";
      const g = await joinByCode(user.uid, displayName, trimmed);
      setCode("");
      setTab("list");
      onSelectGroup(g.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "그룹 가입 실패");
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 backdrop-fade"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />
      <div
        className="relative w-full max-w-[375px] mx-auto rounded-t-3xl sheet-slide-up"
        style={{
          background: "var(--bg-elevated)",
          maxHeight: "82vh",
          display: "flex",
          flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom, 0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px 8px",
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.4px" }}>
            그룹
          </div>
          <button
            onClick={onClose}
            className="active:scale-90"
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: "var(--bg-tertiary)",
              border: 0, display: "grid", placeItems: "center", cursor: "pointer",
              color: "var(--text-secondary)",
            }}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, padding: "0 16px 12px" }}>
          {[
            { k: "list", label: "내 그룹" },
            { k: "create", label: "+ 새 그룹" },
            { k: "join", label: "코드로 참여" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => switchTab(t.k as Tab)}
              style={{
                flex: 1,
                padding: "8px 10px",
                fontSize: 12,
                fontWeight: tab === t.k ? 700 : 500,
                color: tab === t.k ? accent : "var(--text-secondary)",
                background: tab === t.k ? `${accent}1A` : "var(--bg-tertiary)",
                border: 0,
                borderRadius: 10,
                cursor: "pointer",
                letterSpacing: "-0.2px",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
          {!user && (
            <div style={{ padding: "20px 8px", fontSize: 13, color: "var(--text-muted)" }}>
              그룹 기능은 로그인이 필요합니다.
            </div>
          )}

          {user && tab === "list" && (
            <GroupList
              groups={groups}
              loading={loading}
              accent={accent}
              currentUid={user.uid}
              onSelect={(gid) => {
                onSelectGroup(gid);
                onClose();
              }}
              onOpenDetail={(gid) => {
                onOpenDetail(gid);
              }}
            />
          )}

          {user && tab === "create" && (
            <div style={{ padding: "8px 4px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                그룹 이름
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 연인, 가족, 친구들"
                maxLength={30}
                style={inputStyle}
              />
              <button
                onClick={handleCreate}
                disabled={busy || !name.trim()}
                style={primaryBtn(accent, busy || !name.trim())}
              >
                {busy ? "만드는 중..." : "그룹 만들기"}
              </button>
              <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                만들면 6자리 초대 코드가 발급됩니다. 다른 사람에게 코드를 공유하거나 이메일로 초대할 수 있어요.
              </div>
            </div>
          )}

          {user && tab === "join" && (
            <div style={{ padding: "8px 4px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                초대 코드 (6자리)
              </label>
              <input
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))
                }
                placeholder="X7K2P9"
                maxLength={6}
                style={{
                  ...inputStyle,
                  letterSpacing: "0.3em",
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: 700,
                  fontFamily: "ui-monospace, Menlo, monospace",
                }}
              />
              <button
                onClick={handleJoin}
                disabled={busy || code.length !== 6}
                style={primaryBtn(accent, busy || code.length !== 6)}
              >
                {busy ? "참여하는 중..." : "참여하기"}
              </button>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                background: "#FF453A1A",
                color: "#FF453A",
                borderRadius: 10,
                fontSize: 12,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupList({
  groups,
  loading,
  accent,
  currentUid,
  onSelect,
  onOpenDetail,
}: {
  groups: Group[];
  loading: boolean;
  accent: string;
  currentUid: string;
  onSelect: (groupId: string) => void;
  onOpenDetail: (groupId: string) => void;
}) {
  if (loading && groups.length === 0) {
    return (
      <div style={{ padding: "24px 8px", fontSize: 13, color: "var(--text-muted)" }}>
        불러오는 중...
      </div>
    );
  }
  if (groups.length === 0) {
    return (
      <div style={{ padding: "24px 8px", textAlign: "center" }}>
        <UsersIcon size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
          아직 그룹이 없어요
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
          위 탭에서 새 그룹을 만들거나<br />초대 코드로 참여해보세요.
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {groups.map((g) => {
        const isOwner = g.ownerUid === currentUid;
        return (
          <div
            key={g.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 12px",
              background: "var(--bg-secondary)",
              borderRadius: 14,
            }}
          >
            <button
              onClick={() => onSelect(g.id)}
              className="active:scale-[0.98]"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${accent}26`, color: accent,
                  display: "grid", placeItems: "center", flexShrink: 0,
                }}
              >
                <UsersIcon size={18} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14, fontWeight: 600,
                    color: "var(--text-primary)", letterSpacing: "-0.2px",
                    display: "flex", alignItems: "center", gap: 6,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {g.name}
                  {isOwner && <Crown size={12} color={accent} />}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  멤버 {g.memberUids.length}명 · 코드 {g.inviteCode}
                </div>
              </div>
            </button>
            <button
              onClick={() => onOpenDetail(g.id)}
              className="active:scale-90"
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: "var(--bg-tertiary)",
                border: 0, display: "grid", placeItems: "center", cursor: "pointer",
                color: "var(--text-secondary)", flexShrink: 0,
              }}
              aria-label="그룹 관리"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontSize: 15,
  background: "var(--bg-secondary)",
  border: "0.5px solid var(--hairline)",
  borderRadius: 12,
  color: "var(--text-primary)",
  fontFamily: "inherit",
  outline: "none",
  marginBottom: 12,
};

function primaryBtn(accent: string, disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 14px",
    fontSize: 14,
    fontWeight: 700,
    background: disabled ? "var(--bg-tertiary)" : accent,
    color: disabled ? "var(--text-muted)" : "#fff",
    border: 0,
    borderRadius: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    letterSpacing: "-0.2px",
  };
}
