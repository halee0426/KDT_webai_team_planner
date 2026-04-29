// 프로필 드롭다운 — 로그아웃, 탈퇴, 설정

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { signOut, deleteAccount } from '@/lib/firebase/auth';

export default function AccountMenu() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="rounded-pill border border-line-strong px-3 py-1 text-xs"
      >
        로그인
      </button>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/day');
  };
  const handleDelete = async () => {
    if (!window.confirm('정말 탈퇴하시겠어요? 모든 데이터가 삭제됩니다.')) return;
    await deleteAccount();
    navigate('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-pill bg-[var(--bg-tertiary)] px-3 py-1 text-xs"
      >
        {user.photoURL && <img src={user.photoURL} alt="" className="h-5 w-5 rounded-full" />}
        <span>{user.displayName || user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-line bg-[var(--bg-elev)] py-1 shadow-lg z-50">
          <button onClick={handleSignOut} className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-tertiary)]">
            로그아웃
          </button>
          <button onClick={handleDelete} className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10">
            회원 탈퇴
          </button>
        </div>
      )}
    </div>
  );
}
