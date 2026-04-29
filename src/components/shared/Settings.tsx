// 설정 — 테마, 액센트, 계정, 데이터

import { useThemeStore, type ThemeMode, type AccentKey } from '@/store/themeStore';
import { ACCENT } from '@/styles/tokens';
import AccountMenu from '@/components/auth/AccountMenu';

const MODES: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
  { value: 'system', label: '시스템' },
];

export default function Settings() {
  const { mode, accent, setMode, setAccent } = useThemeStore();

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-4 pb-24">
      <h1 className="mb-6 text-2xl font-bold tracking-apple">설정</h1>

      {/* 계정 */}
      <section className="mb-6 rounded-2xl bg-[var(--bg-elev)] p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">계정</h2>
        <AccountMenu />
      </section>

      {/* 테마 */}
      <section className="mb-6 rounded-2xl bg-[var(--bg-elev)] p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">외관</h2>
        <div className="flex gap-2 rounded-pill bg-[var(--bg-tertiary)] p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`flex-1 rounded-pill px-3 py-2 text-sm font-medium ${
                mode === m.value ? 'bg-[var(--bg-elev)] text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* 색상 테마 */}
      <section className="mb-6 rounded-2xl bg-[var(--bg-elev)] p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">색상 테마</h2>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(ACCENT) as AccentKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setAccent(key)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${
                accent === key ? 'border-[color:var(--accent)] bg-[var(--accent-soft)]' : 'border-line'
              }`}
            >
              <div className="h-8 w-8 rounded-full" style={{ background: ACCENT[key] }} />
              <span className="text-xs font-medium">{key}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 데이터 */}
      <section className="rounded-2xl bg-[var(--bg-elev)] p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-mute">데이터</h2>
        <button
          onClick={() => {
            if (window.confirm('모든 로컬 데이터를 초기화할까요?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="w-full rounded-md py-2 text-sm font-medium text-red-600 hover:bg-red-500/10"
        >
          로컬 데이터 초기화
        </button>
      </section>

      <p className="mt-8 text-center text-xs text-ink-mute">v1.0.0</p>
    </div>
  );
}
