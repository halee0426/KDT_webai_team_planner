// 라이트/다크 테마 적용 훅 — html data-theme 속성에 반영
// 담당: B

import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

export function useThemeApply() {
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
      // 시스템 변경 감지
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e: MediaQueryListEvent) => {
        root.dataset.theme = e.matches ? 'dark' : 'light';
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    root.dataset.theme = mode;
  }, [mode]);
}
