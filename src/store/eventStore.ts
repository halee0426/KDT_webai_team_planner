// 도메인 데이터 단일 진실 공급원
// localStorage(게스트) ↔ Firestore(로그인) 자동 머지
// 담당: A(스토어 골격) + D(Firestore 동기화)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Event, Highlight, Todo, Diary } from '@/types/event';
import type { MandalaCell, Mandala } from '@/types/mandala';
import { EMPTY_MANDALA } from '@/types/mandala';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import {
  fetchEvents, fetchTodos, fetchHighlights,
  fetchMandala, fetchDiaries, bulkUpload,
} from '@/lib/firebase/sync';

type State = {
  events: Event[];
  highlights: Highlight[];
  todos: Record<string, Todo[]>;       // key = 'YYYY-MM-DD'
  mandala: { id: string; cells: MandalaCell[] };
  diaries: Record<string, Diary>;      // key = 'YYYY-MM-DD'
};

type Actions = {
  // Events
  addEvent: (e: Omit<Event, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<Event>) => void;
  removeEvent: (id: string) => void;
  // Highlights
  addHighlight: (h: Omit<Highlight, 'id'>) => void;
  removeHighlight: (id: string) => void;
  updateHighlightLabel: (id: string, label: string) => void;
  // Todos
  addTodo: (date: string, text: string) => void;
  toggleTodo: (date: string, id: string) => void;
  updateTodoText: (date: string, id: string, text: string) => void;
  removeTodo: (date: string, id: string) => void;
  rolloverTodos: (fromDate: string, toDate: string) => void;
  // Mandala
  setMandalaCell: (idx: number, value: string) => void;
  resetMandala: () => void;
  // Diary
  setDiary: (date: string, text: string, mood?: Diary['mood']) => void;
  // Sync (D 담당)
  syncFromFirestore: (uid: string) => Promise<void>;
  syncToFirestore: (uid: string) => Promise<void>;
  mergeOnLogin: (uid: string) => Promise<void>;
};

const initial: State = {
  events: [],
  highlights: [],
  todos: {},
  mandala: { id: 'default', cells: EMPTY_MANDALA() },
  diaries: {},
};

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const useEventStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      addEvent: (e) => set((s) => ({
        events: [...s.events, { ...e, id: genId(), createdAt: Date.now() }],
      })),
      updateEvent: (id, patch) => set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),
      removeEvent: (id) => set((s) => ({
        events: s.events.filter((e) => e.id !== id),
      })),

      addHighlight: (h) => set((s) => ({
        highlights: [...s.highlights, { ...h, id: genId() }],
      })),
      removeHighlight: (id) => set((s) => ({
        highlights: s.highlights.filter((h) => h.id !== id),
      })),
      updateHighlightLabel: (id, label) => set((s) => ({
        highlights: s.highlights.map((h) => (h.id === id ? { ...h, label } : h)),
      })),

      addTodo: (date, text) => set((s) => {
        const list = s.todos[date] || [];
        return {
          todos: { ...s.todos, [date]: [...list, { id: genId(), text, done: false, createdAt: Date.now() }] },
        };
      }),
      toggleTodo: (date, id) => set((s) => {
        const list = s.todos[date] || [];
        return {
          todos: { ...s.todos, [date]: list.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) },
        };
      }),
      updateTodoText: (date, id, text) => set((s) => {
        const list = s.todos[date] || [];
        return {
          todos: { ...s.todos, [date]: list.map((t) => (t.id === id ? { ...t, text } : t)) },
        };
      }),
      removeTodo: (date, id) => set((s) => {
        const list = s.todos[date] || [];
        return {
          todos: { ...s.todos, [date]: list.filter((t) => t.id !== id) },
        };
      }),
      rolloverTodos: (fromDate, toDate) => {
        const fromList = get().todos[fromDate] || [];
        const incomplete = fromList.filter((t) => !t.done);
        if (incomplete.length === 0) return;
        const toList = get().todos[toDate] || [];
        const alreadyRolled = new Set(
          toList.filter((t) => t.rolledFrom === fromDate).map((t) => t.rolledId),
        );
        const toAdd = incomplete.filter((t) => !alreadyRolled.has(t.id));
        if (toAdd.length === 0) return;
        set((s) => ({
          todos: {
            ...s.todos,
            [toDate]: [
              ...toList,
              ...toAdd.map((t) => ({
                id: genId(),
                text: t.text,
                done: false,
                rolledFrom: fromDate,
                rolledId: t.id,
                createdAt: Date.now(),
              })),
            ],
          },
        }));
      },

      setMandalaCell: (idx, value) => set((s) => {
        const cells = [...s.mandala.cells];
        cells[idx] = value;
        return { mandala: { ...s.mandala, cells } };
      }),
      resetMandala: () => set((s) => ({
        mandala: { ...s.mandala, cells: EMPTY_MANDALA() },
      })),

      setDiary: (date, text, mood) => set((s) => ({
        diaries: { ...s.diaries, [date]: { date, text, mood, updatedAt: Date.now() } },
      })),

      // ── Firestore 동기화 ──────────────────────────────
      syncFromFirestore: async (uid) => {
        if (!isFirebaseConfigured) return;
        const [events, todos, highlights, mandala, diaries] = await Promise.all([
          fetchEvents(uid),
          fetchTodos(uid),
          fetchHighlights(uid),
          fetchMandala(uid),
          fetchDiaries(uid),
        ]);
        set({
          events,
          todos,
          highlights,
          mandala: mandala ?? { id: 'default', cells: EMPTY_MANDALA() },
          diaries,
        });
      },

      syncToFirestore: async (uid) => {
        if (!isFirebaseConfigured) return;
        const s = get();
        await bulkUpload(uid, {
          events: s.events,
          todos: s.todos,
          highlights: s.highlights,
          mandala: s.mandala as Mandala,
          diaries: s.diaries,
        });
      },

      // 게스트 로컬 데이터 + Firestore 원격 데이터를 로컬 우선으로 머지
      mergeOnLogin: async (uid) => {
        if (!isFirebaseConfigured) return;
        const local = get();

        const [remoteEvents, remoteTodos, remoteHighlights, remoteMandala, remoteDiaries] =
          await Promise.all([
            fetchEvents(uid),
            fetchTodos(uid),
            fetchHighlights(uid),
            fetchMandala(uid),
            fetchDiaries(uid),
          ]);

        const localEventIds = new Set(local.events.map((e) => e.id));
        const localHlIds   = new Set(local.highlights.map((h) => h.id));

        const merged = {
          events: [
            ...local.events,
            ...remoteEvents.filter((e) => !localEventIds.has(e.id)),
          ],
          highlights: [
            ...local.highlights,
            ...remoteHighlights.filter((h) => !localHlIds.has(h.id)),
          ],
          todos: { ...remoteTodos, ...local.todos },
          mandala: local.mandala.cells.some((c) => c !== '')
            ? (local.mandala as Mandala)
            : (remoteMandala ?? (local.mandala as Mandala)),
          diaries: { ...remoteDiaries, ...local.diaries },
        };

        set(merged);
        await bulkUpload(uid, merged);
      },
    }),
    {
      name: 'kdt-planner-data',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
