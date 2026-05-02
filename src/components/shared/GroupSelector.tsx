// 헤더 플랜 토글 (기존 "나의 / 공동" 대체)
//   "나의" 버튼 + "그룹 ▼" 드롭다운
//   - planKind === "my" 면 "나의" 활성
//   - planKind === groupId 면 그 그룹 이름이 활성으로 표시
//   - 드롭다운 항목: 내 그룹 목록 + 마지막에 "+ 그룹 관리"
//   - 그룹 0개면 드롭다운 자리에 "+ 그룹 만들기" CTA

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, User as UserIcon, Users as UsersIcon, Crown } from "lucide-react";
import type { Group } from "@/types/group";
import { MemberAvatarStack, membersFromGroup } from "./MemberAvatar";

export function GroupSelector({
  accent,
  planKind,
  onSelectMy,
  onSelectGroup,
  onOpenGroupSheet,
  groups,
  currentUid,
}: {
  accent: string;
  planKind: string; // "my" | groupId
  onSelectMy: () => void;
  onSelectGroup: (groupId: string) => void;
  onOpenGroupSheet: () => void;
  groups: Group[];
  currentUid: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [open]);

  const isMy = planKind === "my";
  const activeGroup = !isMy ? groups.find((g) => g.id === planKind) ?? null : null;
  const activeGroupName = activeGroup?.name ?? "그룹";

  return (
    <div
      ref={containerRef}
      className="relative flex p-0.5 rounded-full"
      style={{ background: "var(--bg-tertiary)", height: 32 }}
    >
      {/* 슬라이딩 배경 */}
      <div
        className="absolute top-0.5 bottom-0.5 rounded-full transition-all duration-300 ease-out"
        style={{
          width: "calc(50% - 2px)",
          left: isMy ? 2 : "calc(50%)",
          background: "var(--bg-elevated)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      />

      {/* "나의" */}
      <button
        onClick={() => {
          setOpen(false);
          onSelectMy();
        }}
        aria-label="나의 플랜"
        className="relative flex items-center justify-center gap-1 px-2.5 rounded-full active:scale-[0.97] transition-transform"
        style={{
          fontSize: 12,
          fontWeight: isMy ? 600 : 500,
          color: isMy ? accent : "var(--text-secondary)",
          letterSpacing: "-0.2px",
          border: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <UserIcon size={12} strokeWidth={2} />
        나의
      </button>

      {/* 그룹 드롭다운 (또는 0개일 때 + 그룹) */}
      {groups.length === 0 ? (
        <button
          onClick={onOpenGroupSheet}
          aria-label="그룹 만들기"
          className="relative flex items-center justify-center gap-1 px-2.5 rounded-full active:scale-[0.97] transition-transform"
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-secondary)",
            letterSpacing: "-0.2px",
            border: 0,
            background: "transparent",
            cursor: "pointer",
          }}
        >
          <Plus size={12} strokeWidth={2} />
          그룹
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="그룹 선택"
          className="relative flex items-center justify-center gap-1 px-2 rounded-full active:scale-[0.97] transition-transform"
          style={{
            fontSize: 12,
            fontWeight: !isMy ? 600 : 500,
            color: !isMy ? accent : "var(--text-secondary)",
            letterSpacing: "-0.2px",
            border: 0,
            background: "transparent",
            cursor: "pointer",
            maxWidth: 130,
            overflow: "hidden",
          }}
        >
          {!isMy && activeGroup ? (
            <MemberAvatarStack
              members={membersFromGroup(activeGroup)}
              size={16}
              max={2}
              accent={accent}
              currentUid={currentUid}
              ringBg="var(--bg-elevated)"
            />
          ) : (
            <UsersIcon size={12} strokeWidth={2} />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {isMy ? "그룹" : activeGroupName}
          </span>
          <ChevronDown size={11} strokeWidth={2} />
        </button>
      )}

      {/* 드롭다운 패널 */}
      {open && groups.length > 0 && (
        <div
          className="absolute z-30"
          style={{
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: 200,
            maxWidth: 260,
            background: "var(--bg-elevated)",
            border: "0.5px solid var(--hairline)",
            borderRadius: 12,
            boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
            padding: "4px 0",
            overflow: "hidden",
          }}
        >
          {groups.map((g) => {
            const isOwner = g.ownerUid === currentUid;
            const isActive = !isMy && planKind === g.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  setOpen(false);
                  onSelectGroup(g.id);
                }}
                className="active:opacity-60"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  background: isActive ? `${accent}14` : "transparent",
                  border: 0,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <MemberAvatarStack
                  members={membersFromGroup(g)}
                  size={20}
                  max={3}
                  accent={accent}
                  currentUid={currentUid}
                  ringBg={isActive ? `color-mix(in srgb, ${accent} 8%, var(--bg-elevated))` : "var(--bg-elevated)"}
                />
                <div
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? accent : "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.name}
                  </span>
                  {isOwner && <Crown size={11} color={accent} />}
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {g.memberUids.length}명
                </span>
              </button>
            );
          })}
          <div
            style={{
              height: "0.5px",
              background: "var(--hairline)",
              margin: "4px 0",
            }}
          />
          <button
            onClick={() => {
              setOpen(false);
              onOpenGroupSheet();
            }}
            className="active:opacity-60"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              background: "transparent",
              border: 0,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              color: "var(--text-secondary)",
              fontSize: 12,
            }}
          >
            <Plus size={14} strokeWidth={2} />
            그룹 관리 / 만들기
          </button>
        </div>
      )}
    </div>
  );
}
