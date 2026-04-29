// 회원가입 — 이메일·비밀번호·이름·약관 동의

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUpWithEmail } from '@/lib/firebase/auth';

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAI, setAgreeAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreePrivacy) {
      setError('개인정보 처리방침에 동의해주세요.');
      return;
    }
    setLoading(true); setError(null);
    try {
      await signUpWithEmail(email, password, name);
      navigate('/day');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-elev)] p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-bold tracking-apple">회원가입</h1>
        <p className="mb-6 text-sm text-ink-soft">함께 채우는 AI 플래너에 오신 걸 환영합니다.</p>

        {error && (
          <div className="mb-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            required
            className="w-full rounded-md border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          />
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
            placeholder="비밀번호 (6자 이상)"
            required
            minLength={6}
            className="w-full rounded-md border border-line-strong bg-[var(--bg-secondary)] px-3 py-2 text-sm outline-none focus:border-[color:var(--accent)]"
          />

          <div className="space-y-2 pt-2">
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={agreePrivacy} onChange={(e) => setAgreePrivacy(e.target.checked)} className="mt-0.5" />
              <span><strong className="text-ink">[필수]</strong> 개인정보 처리방침 동의</span>
            </label>
            <label className="flex items-start gap-2 text-xs">
              <input type="checkbox" checked={agreeAI} onChange={(e) => setAgreeAI(e.target.checked)} className="mt-0.5" />
              <span>[선택] AI 인사이트·분해 기능을 위한 데이터 사용 동의</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !agreePrivacy}
            className="w-full rounded-pill bg-[color:var(--accent)] py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? '가입 중…' : '회원가입'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-soft">
          이미 계정이 있나요?{' '}
          <Link to="/login" className="font-semibold text-[color:var(--accent)]">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
