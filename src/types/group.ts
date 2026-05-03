// 그룹 모델 — 다중 그룹, 6자리 코드 + 이메일 초대, 멤버 최대 10명
//
// Firestore 구조:
//   groups/{groupId}                  — 그룹 본체
//   groups/{groupId}/events/{eventId} — 그룹 일정
//   groups/{groupId}/todos/{todoId}   — 그룹 할일
//   users/{uid}/myGroups/{groupId}    — 내 그룹 인덱스 (denormalized)
//   invites/{inviteCode}              — 6자리 코드 → 그룹 매핑
//   pendingInvites/{emailKey}/list/{inviteId} — 가입 전 이메일 초대 보관

export type Group = {
  id: string;
  name: string;
  ownerUid: string;
  ownerName: string;
  memberUids: string[];
  memberNames: Record<string, string>;
  /** uid → photoURL. 사진이 없는 멤버는 키 자체가 없음 */
  memberPhotos: Record<string, string>;
  inviteCode: string;
  createdAt: number;
};

export const MAX_GROUP_MEMBERS = 10;

/** 6자리 invite code 정규식 (대문자 + 숫자, 혼동 문자 0/O/1/I 제외) */
export const INVITE_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;
