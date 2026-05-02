// 그룹 할일 실시간 동기화 훅 — useGroupEventsSync 와 동일 패턴

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Todo } from '@/components/eventStore';
import {
  saveGroupTodos,
  subscribeGroupTodos,
} from '@/lib/firebase/groupTodosAdapter';
import { isFirebaseConfigured } from '@/lib/firebase/client';

const DEBOUNCE_MS = 800;
const cacheKey = (groupId: string) => `kdt-group-todos:${groupId}`;

type Setter = (action: Todo[] | ((prev: Todo[]) => Todo[])) => void;

function loadCache(groupId: string): Todo[] {
  try {
    const raw = localStorage.getItem(cacheKey(groupId));
    if (raw) return JSON.parse(raw) as Todo[];
  } catch {
    // ignore
  }
  return [];
}

function saveCache(groupId: string, todos: Todo[]) {
  try {
    localStorage.setItem(cacheKey(groupId), JSON.stringify(todos));
  } catch {
    // ignore
  }
}

export function useGroupTodosSync(groupId: string | null): [Todo[], Setter] {
  const [todos, setTodosState] = useState<Todo[]>(() =>
    groupId ? loadCache(groupId) : [],
  );
  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const groupIdRef = useRef<string | null>(groupId);
  useEffect(() => {
    groupIdRef.current = groupId;
  }, [groupId]);

  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!groupId) {
      todosRef.current = [];
      setTodosState([]);
      return;
    }

    const cached = loadCache(groupId);
    todosRef.current = cached;
    setTodosState(cached);

    if (!isFirebaseConfigured) return;

    const unsub = subscribeGroupTodos(groupId, (remote) => {
      todosRef.current = remote;
      setTodosState(remote);
      saveCache(groupId, remote);
    });

    return () => {
      unsub();
    };
  }, [groupId]);

  const setTodos = useCallback<Setter>((action) => {
    const currentGroupId = groupIdRef.current;
    if (!currentGroupId) return;

    const prev = todosRef.current;
    const next =
      typeof action === 'function'
        ? (action as (p: Todo[]) => Todo[])(prev)
        : action;

    todosRef.current = next;
    setTodosState(next);
    saveCache(currentGroupId, next);

    if (!isFirebaseConfigured) return;

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      saveGroupTodos(currentGroupId, next).catch((err) =>
        console.error('GroupTodos 저장 실패:', err),
      );
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  return [todos, setTodos];
}
