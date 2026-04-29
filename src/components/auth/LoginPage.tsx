// 로그인 — Google + 이메일

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithEmail } from '@/lib/firebase/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogle = async () => {
    setLoading(true); setError(null);
    try {
      await signInWithGoogle();
      navigate('/day');
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      await signInWithEmail(email, password);
      navigate('/day');
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-elev)] p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold tracking-apple">로그인</h1>
        <p className="mb-6 text-sm text-ink-soft">계정에 로그인하면 데이터가 동기화됩니다.</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-pill border border-line-strong bg-[var(--bg-elev)] py-3 text-sm font-medium hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
        >
          <span className="text-base">🔵</span> Google로 로그인
        </button>

        <div className="relative my-4 text-center">
          <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
          <span className="relative bg-[var(--bg-elev)] px-2 text-xs text-ink-mute">또는 이메일</span>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            className="w-full rounded-md border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            className="w-full rounded-md border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-pill bg-[color:var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          계정이 없나요?{' '}
          <Link to="/signup" className="font-semibold text-[color:var(--accent)]">
            회원가입
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link to="/day" className="text-xs text-ink-mute hover:underline">
            게스트로 둘러보기
          </Link>
        </p>
      </div>
    </div>
  );
}
