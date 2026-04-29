// 도메인 데이터 단일 진실 공급원
// localStorage(게스트) ↔ Firestore(로그인) 자동 머지
// 담당: A(스토어 골격) + D(Firestore 동기화)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Event, Highlight, Todo, Diary } from '@/types/event';
import type { MandalaCell } from '@/types/mandala';
import { EMPTY_MANDALA } from '@/types/mandala';

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

      // ── Firestore 동기화 (D 담당) ───────────────────
      syncFromFirestore: async (uid) => {
        // TODO: lib/firebase/sync.ts에서 users/{uid}/* 전체 읽어와 set
        void uid;
      },
      syncToFirestore: async (uid) => {
        // TODO: 현재 state를 Firestore에 업서트
        void uid;
      },
      mergeOnLogin: async (uid) => {
        // 1. 로컬 state 백업
        // 2. Firestore에서 읽어옴
        // 3. 로컬 데이터 우선 충돌 해결
        // 4. 결과를 다시 Firestore에 업서트
        void uid;
      },
    }),
    {
      name: 'kdt-planner-data',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
