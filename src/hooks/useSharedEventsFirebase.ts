// 연력·달력·일력이 공유하는 SharedEvent 배열을 Firebase와 동기화하는 훅
// - Firebase 미설정 시 localStorage만 사용
// - 로그인 시 Firestore에서 불러오고, 변경 시 자동 저장 (debounce 800ms)

import { useEffect, useState } from 'react';
import {
  collection, doc, getDocs, writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { useUserStore } from '@/store/userStore';
import { SharedEvent, initialSharedEvents } from '@/components/eventStore';

const COLL = 'sharedEvents';
const LS_KEY = 'kdt-shared-events';

// ── Firestore 읽기 / 쓰기 헬퍼 ──────────────────────

async function loadFromFirestore(uid: string): Promise<SharedEvent[]> {
  const snap = await getDocs(collection(db, 'users', uid, COLL));
  if (snap.empty) return [];
  return snap.docs.map((d) => d.data() as SharedEvent);
}

async function saveToFirestore(uid: string, events: SharedEvent[]): Promise<void> {
  const batch = writeBatch(db);
  const existing = await getDocs(collection(db, 'users', uid, COLL));
  existing.docs.forEach((d) => batch.delete(d.ref));
  events.forEach((e) =>
    batch.set(doc(db, 'users', uid, COLL, String(e.id)), e),
  );
  await batch.commit();
}

// ── localStorage 읽기 / 쓰기 ───────────────────────

function loadFromLocal(): SharedEvent[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialSharedEvents;
    const parsed = JSON.parse(raw) as SharedEvent[];
    return parsed.length > 0 ? parsed : initialSharedEvents;
  } catch {
    return initialSharedEvents;
  }
}

function saveToLocal(events: SharedEvent[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(events));
}

// ── 훅 ────────────────────────────────────────────

export function useSharedEventsFirebase() {
  const [events, setEventsState] = useState<SharedEvent[]>(loadFromLocal);
  const { user } = useUserStore();

  // 로그인 시 Firestore에서 불러오기 (Firestore 우선, 비어있으면 로컬 유지)
  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured) return;

    loadFromFirestore(user.uid).then((fetched) => {
      if (fetched.length > 0) {
        setEventsState(fetched);
        saveToLocal(fetched);
      } else {
        // 첫 로그인: 로컬 데이터를 Firestore에 업로드
        const local = loadFromLocal();
        if (local.length > 0) saveToFirestore(user.uid, local).catch(console.error);
      }
    }).catch(console.error);
  }, [user?.uid]);

  // 로그아웃 시 초기 상태로
  useEffect(() => {
    if (!user) {
      setEventsState(loadFromLocal());
    }
  }, [user]);

  // 변경 시 localStorage + Firestore(debounce 800ms) 저장
  const setEvents: React.Dispatch<React.SetStateAction<SharedEvent[]>> = (value) => {
    setEventsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveToLocal(next);
      return next;
    });
  };

  useEffect(() => {
    if (!user?.uid || !isFirebaseConfigured) return;
    const t = setTimeout(() => {
      saveToFirestore(user.uid, events).catch(console.error);
    }, 800);
    return () => clearTimeout(t);
  }, [events, user?.uid]);

  return [events, setEvents] as const;
}
