// 그룹 일정 어댑터 — groups/{groupId}/events 경로
// 패턴: sharedEventsAdapter 와 유사 + onSnapshot 실시간 구독 지원

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './client';
import type { SharedEvent } from '@/components/eventStore';

const groupEventsCol = (groupId: string) =>
  collection(db, 'groups', groupId, 'events');

function sanitize(e: SharedEvent): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(e)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function eventFromDoc(docId: string, raw: any): SharedEvent {
  const data = raw as Omit<SharedEvent, 'id'> & { id?: number };
  const id = typeof data.id === 'number' ? data.id : Number(docId);
  return { ...data, id } as SharedEvent;
}

export async function loadGroupEvents(groupId: string): Promise<SharedEvent[]> {
  const snap = await getDocs(groupEventsCol(groupId));
  return snap.docs.map((d) => eventFromDoc(d.id, d.data()));
}

export async function saveGroupEvents(
  groupId: string,
  events: SharedEvent[],
): Promise<void> {
  const col = groupEventsCol(groupId);
  const existing = await getDocs(col);
  const batch = writeBatch(db);
  existing.docs.forEach((d) => batch.delete(d.ref));
  events.forEach((e) => {
    batch.set(doc(col, String(e.id)), sanitize(e));
  });
  await batch.commit();
}

/** 실시간 구독 — 멤버가 변경하면 즉시 반영. 반환값으로 unsubscribe 호출 */
export function subscribeGroupEvents(
  groupId: string,
  onChange: (events: SharedEvent[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    groupEventsCol(groupId),
    (snap) => {
      const events = snap.docs.map((d) => eventFromDoc(d.id, d.data()));
      onChange(events);
    },
    (err) => {
      console.error('GroupEvents 구독 실패:', err);
      onError?.(err);
    },
  );
}
