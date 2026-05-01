// SharedEvent[] 의 localStorage + Firestore 자동 동기화 훅
//   - 게스트 모드 (Firebase 미설정 또는 비로그인): localStorage 만 사용
//   - 로그인 상태: 첫 로드 시 Firestore 에서 가져오고, 변경 시 800ms debounce 로 자동 저장
//   - localStorage 는 항상 갱신 (오프라인/로그아웃 백업 + 빠른 첫 페인트)

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SharedEvent } from '@/components/eventStore';
import {
  loadSharedEvents,
  saveSharedEvents,
} from '@/lib/firebase/sharedEventsAdapter';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { useUserStore } from '@/store/userStore';

const STORAGE_KEY = 'kdt-shared-events';
const DEBOUNCE_MS = 800;

type SharedEventsSetter = (
  action: SharedEvent[] | ((prev: SharedEvent[]) => SharedEvent[]),
) => void;

function loadFromLocal(fallback: SharedEvent[]): SharedEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SharedEvent[];
  } catch {
    // ignore
  }
  return fallback;
}

function saveToLocal(events: SharedEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function useSharedEventsSync(
  initial: SharedEvent[],
): [SharedEvent[], SharedEventsSetter] {
  const [events, setEventsState] = useState<SharedEvent[]>(() =>
    loadFromLocal(initial),
  );

  // ref 들 — setEvents 가 stable callback 이라 latest 값 참조에 ref 사용
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  // user 객체가 아니라 uid 만 구독해서 불필요한 리렌더 방지
  const uid = useUserStore((s) => s.user?.uid ?? null);
  const uidRef = useRef<string | null>(uid);
  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  const lastLoadedUidRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // 로그인 상태 변화 → Firestore 에서 로드 (한 uid 당 1회)
  useEffect(() => {
    if (!isFirebaseConfigured) return; // 게스트 모드 영구
    if (!uid) {
      lastLoadedUidRef.current = null;
      return;
    }
    if (lastLoadedUidRef.current === uid) return;
    lastLoadedUidRef.current = uid;

    loadSharedEvents(uid)
      .then((remote) => {
        eventsRef.current = remote;
        setEventsState(remote);
        saveToLocal(remote);
      })
      .catch((err) => console.error('SharedEvents 로드 실패:', err));
  }, [uid]);

  // unmount 시 pending debounce timer 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  const setEvents = useCallback<SharedEventsSetter>((action) => {
    const prev = eventsRef.current;
    const next =
      typeof action === 'function'
        ? (action as (p: SharedEvent[]) => SharedEvent[])(prev)
        : action;

    eventsRef.current = next;
    setEventsState(next);
    saveToLocal(next);

    if (!isFirebaseConfigured) return;
    const currentUid = uidRef.current;
    if (!currentUid) return;

    // debounce: 빠른 연속 호출 시 마지막 호출만 실행
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      saveSharedEvents(currentUid, next).catch((err) =>
        console.error('SharedEvents 저장 실패:', err),
      );
    }, DEBOUNCE_MS);
  }, []);

  return [events, setEvents];
}
