// 그룹 할일 어댑터 — groups/{groupId}/todos 경로
// 패턴: groupEventsAdapter 와 동일

import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './client';
import type { Todo } from '@/components/eventStore';

const groupTodosCol = (groupId: string) =>
  collection(db, 'groups', groupId, 'todos');

function sanitize(t: Todo): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function todoFromDoc(docId: string, raw: any): Todo {
  const data = raw as Omit<Todo, 'id'> & { id?: number };
  const id = typeof data.id === 'number' ? data.id : Number(docId);
  return { ...data, id } as Todo;
}

export async function loadGroupTodos(groupId: string): Promise<Todo[]> {
  const snap = await getDocs(groupTodosCol(groupId));
  return snap.docs.map((d) => todoFromDoc(d.id, d.data()));
}

export async function saveGroupTodos(
  groupId: string,
  todos: Todo[],
): Promise<void> {
  const col = groupTodosCol(groupId);
  const existing = await getDocs(col);
  const batch = writeBatch(db);
  existing.docs.forEach((d) => batch.delete(d.ref));
  todos.forEach((t) => {
    batch.set(doc(col, String(t.id)), sanitize(t));
  });
  await batch.commit();
}

export function subscribeGroupTodos(
  groupId: string,
  onChange: (todos: Todo[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    groupTodosCol(groupId),
    (snap) => {
      const todos = snap.docs.map((d) => todoFromDoc(d.id, d.data()));
      onChange(todos);
    },
    (err) => {
      console.error('GroupTodos 구독 실패:', err);
      onError?.(err);
    },
  );
}
