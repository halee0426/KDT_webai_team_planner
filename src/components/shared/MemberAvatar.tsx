// 그룹 멤버 원형 아바타 + 다중 멤버 스택
//
// MemberAvatar: 단일 아바타 (photoURL 있으면 이미지, 없으면 이니셜)
// MemberAvatarStack: 여러 멤버를 겹쳐서 표시 (max 초과는 "+N")
//
// 디자인 메모: 기존 AccountSheet / AppMenuSheet 의 인라인 아바타 패턴은
// 큰 사이즈(36~56) + 카드 레이아웃에 묶여 있어 추출 비용 > 이득.
// 이 컴포넌트는 그룹 멤버 표시 (size 18~36) + 스택 오버랩 + 본인 ring 등
// 그룹 표시 전용 요구에 맞춤.

import { useState } from "react";

export type MemberLite = {
  uid: string;
  name: string;
  photoURL?: string;
};

export function MemberAvatar({
  name,
  photoURL,
  size = 24,
  accent,
  ring = false,
  ringBg,
}: {
  name: string;
  photoURL?: string;
  size?: number;
  accent: string;
  /** 본인 표시용 외곽 링 */
  ring?: boolean;
  /** 링 안쪽 spacer 색 (스택 위에 올릴 때 부모 배경과 맞춤) */
  ringBg?: string;
}) {
  // 이미지 로드 실패 시 이니셜로 fallback
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = !!photoURL && !imgFailed;

  const initial = (name?.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: showImg ? "var(--bg-tertiary)" : `${accent}26`,
        color: accent,
        display: "grid",
        placeItems: "center",
        fontSize: Math.max(9, Math.round(size * 0.4)),
        fontWeight: 700,
        overflow: "hidden",
        flexShrink: 0,
        boxShadow: ring
          ? `0 0 0 1.5px ${ringBg ?? "var(--bg-elevated)"}, 0 0 0 3px ${accent}`
          : `0 0 0 1.5px ${ringBg ?? "var(--bg-elevated)"}`,
      }}
    >
      {showImg ? (
        <img
          src={photoURL}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

export function MemberAvatarStack({
  members,
  max = 4,
  size = 24,
  accent,
  currentUid,
  ringBg,
}: {
  members: MemberLite[];
  max?: number;
  size?: number;
  accent: string;
  /** 본인 ring 표시용 */
  currentUid?: string | null;
  /** 부모 배경색 — 스택 spacer 와 맞추면 시각적으로 깨끗함 */
  ringBg?: string;
}) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  const overlap = Math.round(size * 0.32);

  return (
    <div style={{ display: "inline-flex", alignItems: "center" }}>
      {visible.map((m, i) => (
        <div
          key={m.uid}
          style={{
            marginLeft: i === 0 ? 0 : -overlap,
            zIndex: visible.length - i,
          }}
        >
          <MemberAvatar
            name={m.name}
            photoURL={m.photoURL}
            size={size}
            accent={accent}
            ring={!!currentUid && m.uid === currentUid}
            ringBg={ringBg}
          />
        </div>
      ))}
      {overflow > 0 && (
        <div
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
            fontSize: Math.max(9, Math.round(size * 0.38)),
            fontWeight: 700,
            display: "grid",
            placeItems: "center",
            boxShadow: `0 0 0 1.5px ${ringBg ?? "var(--bg-elevated)"}`,
            flexShrink: 0,
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/** Group → MemberLite[] 변환 헬퍼 (멤버 순서: owner 먼저, 본인은 currentUid 로 ring 표시) */
export function membersFromGroup(group: {
  memberUids: string[];
  memberNames: Record<string, string>;
  memberPhotos: Record<string, string>;
  ownerUid: string;
}): MemberLite[] {
  const sorted = [...group.memberUids].sort((a, b) => {
    if (a === group.ownerUid) return -1;
    if (b === group.ownerUid) return 1;
    return 0;
  });
  return sorted.map((uid) => ({
    uid,
    name: group.memberNames[uid] || "?",
    photoURL: group.memberPhotos[uid] || undefined,
  }));
}
