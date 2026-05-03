// 그룹 관리 어댑터 — 생성 / 가입 / 탈퇴 / 삭제 / 이메일 초대
//
// Firestore 경로 (types/group.ts 참고).
// MVP 정책:
//   - owner 가 그룹을 떠나면 자동 삭제 (양도 미지원)
//   - 멤버 10명 제한 (클라이언트 + Rules 양쪽)
//   - 이메일 초대는 pendingInvites/{emailKey}/list/{inviteId} 에 저장,
//     해당 이메일로 로그인 시 claimPendingInvites 가 자동 합류 처리

import {
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
  deleteField,
  updateDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './client';
import type { Group } from '@/types/group';
import { MAX_GROUP_MEMBERS } from '@/types/group';

/** 6자리 코드용 알파벳 — 혼동 문자 0/O/1/I 제외 */
const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** 6자리 invite code 생성 (충돌 검사는 호출자 책임 — createGroup 에서 처리) */
export function generateInviteCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return out;
}

/** 이메일을 pendingInvites 의 키로 정규화 (소문자 + trim + . 제외 안 함) */
export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-z0-9_.\-+@]/g, '_');
}

function groupFromDoc(id: string, data: any): Group {
  return {
    id,
    name: String(data.name ?? ''),
    ownerUid: String(data.ownerUid ?? ''),
    ownerName: String(data.ownerName ?? ''),
    memberUids: Array.isArray(data.memberUids) ? data.memberUids : [],
    memberNames:
      data.memberNames && typeof data.memberNames === 'object'
        ? data.memberNames
        : {},
    // memberPhotos 는 Phase 6 신규 — 기존 그룹 (필드 없음) 호환을 위해 빈 객체로 fallback
    memberPhotos:
      data.memberPhotos && typeof data.memberPhotos === 'object'
        ? data.memberPhotos
        : {},
    inviteCode: String(data.inviteCode ?? ''),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

/** 새 그룹 생성 — groups + invites + users/{uid}/myGroups 3 문서 batch */
export async function createGroup(
  uid: string,
  ownerName: string,
  ownerPhotoURL: string | undefined,
  name: string,
): Promise<Group> {
  // 코드 충돌 시 최대 5회 재시도
  let inviteCode = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode();
    const exist = await getDoc(doc(db, 'invites', candidate));
    if (!exist.exists()) {
      inviteCode = candidate;
      break;
    }
  }
  if (!inviteCode) throw new Error('초대 코드 생성 실패 — 잠시 후 다시 시도해주세요');

  const groupRef = doc(collection(db, 'groups'));
  const groupId = groupRef.id;
  const createdAt = Date.now();

  const memberPhotos: Record<string, string> = {};
  if (ownerPhotoURL) memberPhotos[uid] = ownerPhotoURL;

  const data = {
    name,
    ownerUid: uid,
    ownerName,
    memberUids: [uid],
    memberNames: { [uid]: ownerName },
    memberPhotos,
    inviteCode,
    createdAt,
  };

  const batch = writeBatch(db);
  batch.set(groupRef, data);
  batch.set(doc(db, 'invites', inviteCode), {
    groupId,
    groupName: name,
    ownerUid: uid,
    createdAt,
  });
  batch.set(doc(db, 'users', uid, 'myGroups', groupId), {
    joinedAt: createdAt,
  });
  await batch.commit();

  return { id: groupId, ...data };
}

/** 내가 속한 그룹 목록 — users/{uid}/myGroups 인덱스로 조회 후 그룹 본체 다중 fetch */
export async function listMyGroups(uid: string): Promise<Group[]> {
  const idxSnap = await getDocs(collection(db, 'users', uid, 'myGroups'));
  if (idxSnap.empty) return [];
  const groups = await Promise.all(
    idxSnap.docs.map(async (d) => {
      const gSnap = await getDoc(doc(db, 'groups', d.id));
      if (!gSnap.exists()) return null;
      return groupFromDoc(gSnap.id, gSnap.data());
    }),
  );
  return groups.filter((g): g is Group => g !== null).sort((a, b) => a.createdAt - b.createdAt);
}

/** 6자리 코드로 그룹 가입 — invites 조회 → 그룹 멤버 갱신 + 내 인덱스 추가 */
export async function joinByCode(
  uid: string,
  displayName: string,
  photoURL: string | undefined,
  rawCode: string,
): Promise<Group> {
  const code = rawCode.trim().toUpperCase();
  // 1. 초대 코드 조회 (invites 룰: 인증 사용자 누구나 read OK)
  const inviteSnap = await getDoc(doc(db, 'invites', code));
  if (!inviteSnap.exists()) throw new Error('유효하지 않은 초대 코드입니다');

  const { groupId } = inviteSnap.data() as { groupId: string };
  const groupRef = doc(db, 'groups', groupId);

  // 2. 비멤버 상태에서는 groups read 가 룰에 막힘 → 바로 update 시도
  //    update 룰의 "비멤버가 자기 자신 추가" 분기 활용
  //    실패 시 (이미 멤버 등) catch 로 분기 처리
  try {
    const updatePayload: Record<string, unknown> = {
      memberUids: arrayUnion(uid),
      [`memberNames.${uid}`]: displayName,
    };
    if (photoURL) updatePayload[`memberPhotos.${uid}`] = photoURL;

    const batch = writeBatch(db);
    batch.update(groupRef, updatePayload);
    batch.set(doc(db, 'users', uid, 'myGroups', groupId), {
      joinedAt: Date.now(),
    });
    await batch.commit();
  } catch (e: any) {
    // permission-denied 면 정원 초과거나 이미 멤버일 가능성
    // 멤버라면 다시 read 가능 → 그룹 정보 가져오기
    const groupSnap = await getDoc(groupRef).catch(() => null);
    if (groupSnap?.exists()) {
      const g = groupFromDoc(groupSnap.id, groupSnap.data());
      if (g.memberUids.includes(uid)) {
        // 이미 멤버 — 인덱스만 보정 후 반환
        await setDoc(
          doc(db, 'users', uid, 'myGroups', groupId),
          { joinedAt: Date.now() },
          { merge: true },
        );
        return g;
      }
      if (g.memberUids.length >= MAX_GROUP_MEMBERS) {
        throw new Error(`그룹 인원이 최대(${MAX_GROUP_MEMBERS}명)에 도달했습니다`);
      }
    }
    throw e;
  }

  // 3. 가입 성공 후 그룹 본체 read (이제 멤버이므로 룰 통과)
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) throw new Error('그룹을 찾을 수 없습니다');
  return groupFromDoc(groupSnap.id, groupSnap.data());
}

/** 그룹 나가기 — owner 면 deleteGroup 호출, 일반 멤버면 멤버 목록에서 제거 */
export async function leaveGroup(uid: string, groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) {
    // 이미 사라진 그룹 — 인덱스만 정리
    await deleteDoc(doc(db, 'users', uid, 'myGroups', groupId)).catch(() => {});
    return;
  }
  const group = groupFromDoc(groupSnap.id, groupSnap.data());

  if (group.ownerUid === uid) {
    await deleteGroup(uid, groupId);
    return;
  }

  await updateDoc(groupRef, {
    memberUids: arrayRemove(uid),
    [`memberNames.${uid}`]: deleteField(),
    [`memberPhotos.${uid}`]: deleteField(),
  });
  await deleteDoc(doc(db, 'users', uid, 'myGroups', groupId)).catch(() => {});
}

/** 그룹 삭제 (owner 만) — 모든 멤버의 myGroups 인덱스 + invites + 서브컬렉션 + 그룹 본체 */
export async function deleteGroup(uid: string, groupId: string): Promise<void> {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) return;
  const group = groupFromDoc(groupSnap.id, groupSnap.data());
  if (group.ownerUid !== uid) throw new Error('그룹 소유자만 삭제할 수 있습니다');

  // 서브컬렉션 일괄 삭제 (events / todos)
  const [evSnap, tdSnap] = await Promise.all([
    getDocs(collection(db, 'groups', groupId, 'events')),
    getDocs(collection(db, 'groups', groupId, 'todos')),
  ]);

  const batch = writeBatch(db);
  evSnap.docs.forEach((d) => batch.delete(d.ref));
  tdSnap.docs.forEach((d) => batch.delete(d.ref));
  // invites
  if (group.inviteCode) {
    batch.delete(doc(db, 'invites', group.inviteCode));
  }
  // 본인 myGroups 인덱스만 삭제 (Rules: 본인 외 다른 사용자 데이터 write 불가)
  // 다른 멤버들의 myGroups/{groupId} 는 stale 인덱스로 남는데,
  // useMyGroups 가 group 본체 read 실패(NotFound) 시 자동 정리하도록 처리됨
  batch.delete(doc(db, 'users', uid, 'myGroups', groupId));
  // 그룹 본체
  batch.delete(groupRef);

  await batch.commit();
}

/** 그룹 이름 변경 (owner 만) */
export async function renameGroup(
  uid: string,
  groupId: string,
  newName: string,
): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('이름을 입력해주세요');
  const groupRef = doc(db, 'groups', groupId);
  const snap = await getDoc(groupRef);
  if (!snap.exists()) throw new Error('그룹을 찾을 수 없습니다');
  const group = groupFromDoc(snap.id, snap.data());
  if (group.ownerUid !== uid) throw new Error('소유자만 이름을 변경할 수 있습니다');

  const batch = writeBatch(db);
  batch.update(groupRef, { name: trimmed });
  if (group.inviteCode) {
    batch.update(doc(db, 'invites', group.inviteCode), { groupName: trimmed });
  }
  await batch.commit();
}

/** 이메일로 초대 — 가입 전이라면 pendingInvites 에 보관 */
export async function inviteByEmail(
  uid: string,
  ownerName: string,
  group: Group,
  email: string,
): Promise<void> {
  const target = email.trim().toLowerCase();
  if (!target) throw new Error('이메일을 입력해주세요');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    throw new Error('올바른 이메일 형식이 아닙니다');
  }
  const emailKey = normalizeEmailKey(target);
  const inviteRef = doc(collection(db, 'pendingInvites', emailKey, 'list'));
  await setDoc(inviteRef, {
    groupId: group.id,
    groupName: group.name,
    inviteCode: group.inviteCode,
    invitedBy: uid,
    invitedByName: ownerName,
    invitedAt: Date.now(),
  });
}

/** 로그인 시 자동 호출 — 내 이메일로 온 대기 초대 모두 합류 + 처리 후 삭제 */
export async function claimPendingInvites(
  uid: string,
  displayName: string,
  photoURL: string | undefined,
  email: string | null | undefined,
): Promise<Group[]> {
  if (!email) return [];
  const emailKey = normalizeEmailKey(email);
  const snap = await getDocs(collection(db, 'pendingInvites', emailKey, 'list'));
  if (snap.empty) return [];

  const joined: Group[] = [];
  for (const d of snap.docs) {
    const data = d.data() as { groupId?: string; inviteCode?: string };
    const code = data.inviteCode;
    if (!code) {
      await deleteDoc(d.ref).catch(() => {});
      continue;
    }
    try {
      const g = await joinByCode(uid, displayName, photoURL, code);
      joined.push(g);
    } catch (err) {
      // 그룹 사라짐 / 인원 초과 — 무시하고 초대 정리
      console.warn('pending invite 처리 실패:', err);
    }
    await deleteDoc(d.ref).catch(() => {});
  }
  return joined;
}

