// 테마 (라이트/다크/시스템) + 액센트 컬러
// 담당: B (UI/UX)

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentKey = 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'mint';

type ThemeStore = {
  mode: ThemeMode;
  accent: AccentKey;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      accent: 'mint',
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: 'kdt-planner-theme',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
