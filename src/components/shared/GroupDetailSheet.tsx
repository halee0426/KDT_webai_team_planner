// 그룹 상세 시트 — 이름 / 초대 코드 / 이메일 초대 / 멤버 목록 / 나가기·삭제

import { useEffect, useState } from "react";
import {
  X, Copy, Check, Crown, LogOut, Trash2, Pencil,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SPRING, EASE, DURATION } from "@/styles/animations";
import { useUserStore } from "@/store/userStore";
import { useMyGroups } from "@/hooks/useMyGroups";
import {
  inviteByEmail,
  leaveGroup,
  renameGroup,
} from "@/lib/firebase/groupsAdapter";
import { MAX_GROUP_MEMBERS } from "@/types/group";
import { MemberAvatar } from "./MemberAvatar";

export function GroupDetailSheet({
  open,
  groupId,
  onClose,
  accent,
  onAfterLeaveOrDelete,
}: {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
  accent: string;
  /** 떠나거나 삭제 후 — App 에서 planKind 를 "my" 로 되돌리기 위함 */
  onAfterLeaveOrDelete: () => void;
}) {
  const user = useUserStore((s) => s.user);
  const { groups } = useMyGroups();
  const group = groups.find((g) => g.id === groupId) ?? null;

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [copied, setCopied] = useState(false);

  // groupId 변경 시 상태 초기화
  useEffect(() => {
    setEditingName(false);
    setNameDraft("");
    setInviteEmail("");
    setError(null);
    setInfo(null);
    setConfirmLeave(false);
    setCopied(false);
  }, [groupId]);

  if (!group || !user) {
    return (
      <Backdrop open={open} onClose={onClose}>
        <div style={{ padding: 24, fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          그룹 정보를 불러올 수 없습니다
        </div>
      </Backdrop>
    );
  }

  const isOwner = group.ownerUid === user.uid;

  const startEditName = () => {
    setNameDraft(group.name);
    setEditingName(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === group.name) {
      setEditingName(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renameGroup(user.uid, group.id, trimmed);
      setEditingName(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "이름 변경 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("복사 실패 — 코드를 직접 입력해 공유해주세요");
    }
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) {
      setError("이메일을 입력해주세요");
      return;
    }
    if (group.memberUids.length >= MAX_GROUP_MEMBERS) {
      setError(`그룹 인원이 최대(${MAX_GROUP_MEMBERS}명)에 도달했습니다`);
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const ownerName = user.displayName || user.email || "이름없음";
      await inviteByEmail(user.uid, ownerName, group, email);
      setInviteEmail("");
      setInfo(`${email} 으로 초대를 보냈어요. 해당 이메일로 로그인하면 자동 합류됩니다.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "초대 실패");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    setError(null);
    try {
      await leaveGroup(user.uid, group.id);
      onAfterLeaveOrDelete();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "그룹 나가기 실패");
    } finally {
      setBusy(false);
      setConfirmLeave(false);
    }
  };

  return (
    <Backdrop open={open} onClose={onClose}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px 8px",
        }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.4px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          {editingName ? (
            <>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={30}
                autoFocus
                style={{
                  flex: 1, fontSize: 16, fontWeight: 700,
                  padding: "6px 10px",
                  background: "var(--bg-secondary)",
                  border: "0.5px solid var(--hairline)",
                  borderRadius: 8, fontFamily: "inherit", outline: "none",
                  color: "var(--text-primary)",
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={busy}
                style={{
                  padding: "6px 10px", fontSize: 12, fontWeight: 700,
                  background: accent, color: "#fff",
                  border: 0, borderRadius: 8, cursor: "pointer",
                }}
              >
                저장
              </button>
            </>
          ) : (
            <>
              <span
                style={{
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {group.name}
              </span>
              {isOwner && (
                <button
                  onClick={startEditName}
                  className="active:scale-90"
                  style={{
                    width: 28, height: 28, borderRadius: 999,
                    background: "var(--bg-tertiary)",
                    border: 0, display: "grid", placeItems: "center", cursor: "pointer",
                    color: "var(--text-secondary)", flexShrink: 0,
                  }}
                  aria-label="이름 편집"
                >
                  <Pencil size={13} />
                </button>
              )}
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="active:scale-90"
          style={{
            width: 32, height: 32, borderRadius: 999,
            background: "var(--bg-tertiary)",
            border: 0, display: "grid", placeItems: "center", cursor: "pointer",
            color: "var(--text-secondary)", marginLeft: 8, flexShrink: 0,
          }}
          aria-label="닫기"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 20px" }}>
        {/* 초대 코드 카드 */}
        <div
          style={{
            background: `${accent}14`,
            borderRadius: 14,
            padding: "14px 16px",
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            초대 코드
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: accent,
                fontFamily: "ui-monospace, Menlo, monospace",
                letterSpacing: "0.2em",
                flex: 1,
              }}
            >
              {group.inviteCode}
            </div>
            <button
              onClick={handleCopyCode}
              className="active:scale-90"
              style={{
                padding: "8px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "0.5px solid var(--hairline)",
                borderRadius: 8,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
        </div>

        {/* 이메일 초대 */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            이메일로 초대
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: 14,
                background: "var(--bg-secondary)",
                border: "0.5px solid var(--hairline)",
                borderRadius: 10,
                color: "var(--text-primary)",
                fontFamily: "inherit",
                outline: "none",
              }}
            />
            <button
              onClick={handleInvite}
              disabled={busy || !inviteEmail.trim()}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: 700,
                background:
                  busy || !inviteEmail.trim()
                    ? "var(--bg-tertiary)"
                    : accent,
                color:
                  busy || !inviteEmail.trim() ? "var(--text-muted)" : "#fff",
                border: 0,
                borderRadius: 10,
                cursor:
                  busy || !inviteEmail.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              초대
            </button>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>멤버</span>
            <span>
              {group.memberUids.length} / {MAX_GROUP_MEMBERS}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {group.memberUids.map((memberUid) => {
              const memberName = group.memberNames[memberUid] || "알 수 없음";
              const memberPhoto = group.memberPhotos[memberUid];
              const isMe = memberUid === user.uid;
              const memberIsOwner = memberUid === group.ownerUid;
              return (
                <div
                  key={memberUid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    background: "var(--bg-secondary)",
                    borderRadius: 10,
                  }}
                >
                  <MemberAvatar
                    name={memberName}
                    photoURL={memberPhoto}
                    size={36}
                    accent={accent}
                    ring={isMe}
                    ringBg="var(--bg-secondary)"
                  />
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {memberName}
                    {isMe && <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>(나)</span>}
                  </div>
                  {memberIsOwner && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: accent, fontSize: 11, fontWeight: 600 }}>
                      <Crown size={12} />
                      소유자
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 나가기 / 삭제 */}
        <div style={{ marginTop: 24 }}>
          {!confirmLeave ? (
            <button
              onClick={() => setConfirmLeave(true)}
              className="active:scale-[0.99]"
              style={{
                width: "100%",
                padding: "12px 14px",
                fontSize: 14,
                fontWeight: 600,
                background: "transparent",
                color: "#FF453A",
                border: "0.5px solid #FF453A66",
                borderRadius: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              {isOwner ? <Trash2 size={14} /> : <LogOut size={14} />}
              {isOwner ? "그룹 삭제" : "그룹 나가기"}
            </button>
          ) : (
            <div
              style={{
                background: "#FF453A14",
                border: "0.5px solid #FF453A66",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#FF453A", marginBottom: 6 }}>
                {isOwner ? "이 그룹을 정말 삭제할까요?" : "이 그룹에서 정말 나갈까요?"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
                {isOwner
                  ? `그룹의 모든 일정과 할일이 영구 삭제되며, 멤버 ${group.memberUids.length}명 모두에게 영향이 갑니다.`
                  : "그룹의 일정·할일을 더 이상 볼 수 없습니다. 다시 참여하려면 초대 코드가 필요합니다."}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setConfirmLeave(false)}
                  disabled={busy}
                  style={{
                    flex: 1, padding: "10px 12px",
                    fontSize: 13, fontWeight: 600,
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--hairline)",
                    borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleLeave}
                  disabled={busy}
                  style={{
                    flex: 1, padding: "10px 12px",
                    fontSize: 13, fontWeight: 700,
                    background: "#FF453A", color: "#fff",
                    border: 0, borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  {busy ? "처리 중..." : isOwner ? "삭제" : "나가기"}
                </button>
              </div>
            </div>
          )}
        </div>

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
        {info && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              background: `${accent}1A`,
              color: accent,
              borderRadius: 10,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {info}
          </div>
        )}
      </div>
    </Backdrop>
  );
}

function Backdrop({
  open,
  children,
  onClose,
}: {
  open: boolean;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="groupdetail-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.base / 1000, ease: EASE.apple }}
          className="fixed inset-0 z-[70] flex items-end"
          onClick={onClose}
          style={{ background: "rgba(0,0,0,0.35)" }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={SPRING.sheet}
            className="relative w-full max-w-[375px] mx-auto rounded-t-3xl"
            style={{
              background: "var(--bg-elevated)",
              maxHeight: "82vh",
              display: "flex",
              flexDirection: "column",
              paddingBottom: "env(safe-area-inset-bottom, 0)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
