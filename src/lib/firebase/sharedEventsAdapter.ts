// SharedEvent (id: number) ↔ Firestore 동기화 어댑터
// 경로: users/{uid}/sharedEvents/{eventId}
// 단순 전략: saveSharedEvents 는 기존 컬렉션 비우고 다시 쓰기 (1단계)

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from './client';
import type { SharedEvent } from '@/components/eventStore';

const sharedEventsCol = (uid: string) =>
  collection(db, 'users', uid, 'sharedEvents');

/** Firestore 에 저장 시 undefined 필드 제거 (Firestore 가 거부함) */
function sanitize(e: SharedEvent): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(e)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function loadSharedEvents(uid: string): Promise<SharedEvent[]> {
  const snap = await getDocs(sharedEventsCol(uid));
  return snap.docs.map((d) => {
    const data = d.data() as Omit<SharedEvent, 'id'> & { id?: number };
    // 문서 ID(string) → SharedEvent.id(number) 복원. 데이터에 id 가 있으면 우선 사용.
    const id = typeof data.id === 'number' ? data.id : Number(d.id);
    return { ...data, id } as SharedEvent;
  });
}

export async function saveSharedEvents(
  uid: string,
  events: SharedEvent[],
): Promise<void> {
  const col = sharedEventsCol(uid);
  const existing = await getDocs(col);
  const batch = writeBatch(db);
  existing.docs.forEach((d) => batch.delete(d.ref));
  events.forEach((e) => {
    batch.set(doc(col, String(e.id)), sanitize(e));
  });
  await batch.commit();
}
