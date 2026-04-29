// Firestore ↔ eventStore 동기화
// 담당: D
//
// 컬렉션 구조:
//   users/{uid}                       — User 프로필
//     /events/{eventId}               — Event[]
//     /todos/{date}                   — Todo[] (날짜를 문서 ID로)
//     /highlights/{highlightId}       — Highlight[]
//     /mandala/{mandalaId}            — MandalaCell[81]
//     /diaries/{date}                 — Diary

import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './client';
import type { User } from '@/types/user';
import type { Event, Highlight, Todo, Diary } from '@/types/event';
import type { Mandala } from '@/types/mandala';

// ── User 프로필 ────────────────────────────────────
export async function fetchUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as User) : null;
}

export async function upsertUserProfile(user: User): Promise<void> {
  await setDoc(doc(db, 'users', user.uid), user, { merge: true });
}

// ── Events ─────────────────────────────────────────
export async function fetchEvents(uid: string): Promise<Event[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'events'));
  return snap.docs.map((d) => d.data() as Event);
}

export async function upsertEvent(uid: string, event: Event): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'events', event.id), event, { merge: true });
}

export async function deleteEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'events', eventId));
}

// ── Todos (날짜를 문서 ID로) ───────────────────────
export async function fetchTodos(uid: string): Promise<Record<string, Todo[]>> {
  const snap = await getDocs(collection(db, 'users', uid, 'todos'));
  const out: Record<string, Todo[]> = {};
  snap.docs.forEach((d) => { out[d.id] = (d.data().items as Todo[]) ?? []; });
  return out;
}

export async function upsertTodosForDate(uid: string, date: string, items: Todo[]): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'todos', date), { items, updatedAt: serverTimestamp() });
}

// ── Highlights ─────────────────────────────────────
export async function fetchHighlights(uid: string): Promise<Highlight[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'highlights'));
  return snap.docs.map((d) => d.data() as Highlight);
}

export async function upsertHighlight(uid: string, h: Highlight): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'highlights', h.id), h, { merge: true });
}

export async function deleteHighlight(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'highlights', id));
}

// ── Mandala ────────────────────────────────────────
export async function fetchMandala(uid: string, id = 'default'): Promise<Mandala | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'mandala', id));
  return snap.exists() ? (snap.data() as Mandala) : null;
}

export async function upsertMandala(uid: string, m: Mandala): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'mandala', m.id), m, { merge: true });
}

// ── Diary ──────────────────────────────────────────
export async function fetchDiaries(uid: string): Promise<Record<string, Diary>> {
  const snap = await getDocs(collection(db, 'users', uid, 'diaries'));
  const out: Record<string, Diary> = {};
  snap.docs.forEach((d) => { out[d.id] = d.data() as Diary; });
  return out;
}

export async function upsertDiary(uid: string, diary: Diary): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'diaries', diary.date), diary, { merge: true });
}

// ── Bulk: 게스트 → 로그인 머지 ─────────────────────
export async function bulkUpload(uid: string, payload: {
  events: Event[];
  todos: Record<string, Todo[]>;
  highlights: Highlight[];
  mandala: Mandala;
  diaries: Record<string, Diary>;
}): Promise<void> {
  const batch = writeBatch(db);

  payload.events.forEach((e) => {
    batch.set(doc(db, 'users', uid, 'events', e.id), e, { merge: true });
  });
  Object.entries(payload.todos).forEach(([date, items]) => {
    batch.set(doc(db, 'users', uid, 'todos', date), { items });
  });
  payload.highlights.forEach((h) => {
    batch.set(doc(db, 'users', uid, 'highlights', h.id), h, { merge: true });
  });
  batch.set(doc(db, 'users', uid, 'mandala', payload.mandala.id), payload.mandala, { merge: true });
  Object.values(payload.diaries).forEach((d) => {
    batch.set(doc(db, 'users', uid, 'diaries', d.date), d, { merge: true });
  });

  await batch.commit();
}
