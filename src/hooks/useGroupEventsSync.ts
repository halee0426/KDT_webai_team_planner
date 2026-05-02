// 그룹 일정 실시간 동기화 훅
//   - groupId null: setter no-op + 빈 배열
//   - groupId 변경: 이전 구독 unsubscribe + 새 그룹 구독 시작
//   - 변경 시 800ms debounce 후 saveGroupEvents (Firestore)
//   - localStorage 캐시 'kdt-group-events:{groupId}' — 첫 페인트 가속

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SharedEvent } from '@/components/eventStore';
import {
  saveGroupEvents,
  subscribeGroupEvents,
} from '@/lib/firebase/groupEventsAdapter';
import { isFirebaseConfigured } from '@/lib/firebase/client';

const DEBOUNCE_MS = 800;
const cacheKey = (groupId: string) => `kdt-group-events:${groupId}`;

type Setter = (
  action: SharedEvent[] | ((prev: SharedEvent[]) => SharedEvent[]),
) => void;

function loadCache(groupId: string): SharedEvent[] {
  try {
    const raw = localStorage.getItem(cacheKey(groupId));
    if (raw) return JSON.parse(raw) as SharedEvent[];
  } catch {
    // ignore
  }
  return [];
}

function saveCache(groupId: string, events: SharedEvent[]) {
  try {
    localStorage.setItem(cacheKey(groupId), JSON.stringify(events));
  } catch {
    // ignore
  }
}

export function useGroupEventsSync(
  groupId: string | null,
): [SharedEvent[], Setter] {
  const [events, setEventsState] = useState<SharedEvent[]>(() =>
    groupId ? loadCache(groupId) : [],
  );
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  const groupIdRef = useRef<string | null>(groupId);
  useEffect(() => {
    groupIdRef.current = groupId;
  }, [groupId]);

  const debounceTimerRef = useRef<number | null>(null);

  // groupId 변경 시 — 이전 timer 취소 + 캐시 즉시 표시 + 실시간 구독
  useEffect(() => {
    // 진행 중인 debounce save 취소 (이전 그룹으로 저장되지 않도록)
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!groupId) {
      eventsRef.current = [];
      setEventsState([]);
      return;
    }

    // 캐시로 즉시 첫 페인트
    const cached = loadCache(groupId);
    eventsRef.current = cached;
    setEventsState(cached);

    if (!isFirebaseConfigured) return;

    const unsub = subscribeGroupEvents(groupId, (remote) => {
      eventsRef.current = remote;
      setEventsState(remote);
      saveCache(groupId, remote);
    });

    return () => {
      unsub();
    };
  }, [groupId]);

  const setEvents = useCallback<Setter>((action) => {
    const currentGroupId = groupIdRef.current;
    if (!currentGroupId) return; // no-op

    const prev = eventsRef.current;
    const next =
      typeof action === 'function'
        ? (action as (p: SharedEvent[]) => SharedEvent[])(prev)
        : action;

    eventsRef.current = next;
    setEventsState(next);
    saveCache(currentGroupId, next);

    if (!isFirebaseConfigured) return;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      saveGroupEvents(currentGroupId, next).catch((err) =>
        console.error('GroupEvents 저장 실패:', err),
      );
    }, DEBOUNCE_MS);
  }, []);

  // unmount 시 pending timer 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  return [events, setEvents];
}
