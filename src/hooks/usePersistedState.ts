// localStorage에 자동 영속화되는 useState 훅
// 사용 예: const [theme, setTheme] = usePersistedState<Theme>('kdt:theme', 'light');

import { useEffect, useState } from 'react';

const PREFIX = 'kdt:';

export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = key.startsWith(PREFIX) ? key : PREFIX + key;

  // 1) 초기값을 localStorage에서 lazy load
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(fullKey);
      if (raw === null) return initial;
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  });

  // 2) 변경될 때마다 저장
  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(state));
    } catch {
      // private mode 등에서 실패 가능 — 무시
    }
  }, [fullKey, state]);

  // 3) 다른 탭에서 변경 시 동기화 (선택, 멀티탭에서 색 바꾸면 같이 따라옴)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== fullKey || e.newValue === null) return;
      try {
        setState(JSON.parse(e.newValue));
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fullKey]);

  return [state, setState];
}

/** 모든 설정 한 번에 초기화 (설정 화면의 "초기화" 버튼용) */
export function clearPersistedSettings() {
  if (typeof window === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}
