// 라이트/다크 테마 + 액센트 컬러 적용 훅

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { ACCENT } from '@/styles/tokens';

export function useThemeApply() {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);

  // 다크/라이트 모드
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => {
        root.dataset.theme = e.matches ? 'dark' : 'light';
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    root.dataset.theme = mode;
  }, [mode]);

  // 액센트 컬러
  useEffect(() => {
    const root = document.documentElement;
    const color = ACCENT[accent];
    root.style.setProperty('--accent', color);
    // 액센트의 10% 알파 버전 (RGB 변환)
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    root.style.setProperty('--accent-soft', `rgba(${r},${g},${b},0.10)`);
  }, [accent]);
}
