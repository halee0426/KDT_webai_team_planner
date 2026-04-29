// 라우트 가드 — 비로그인이어도 게스트 모드로 진입 가능
// 단, 공유 링크 생성 같은 일부 기능은 로그인 강제
// 담당: D

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';

type Props = {
  children: ReactNode;
  /** 로그인 강제 여부. 기본 false (게스트 허용) */
  requireAuth?: boolean;
};

export default function ProtectedRoute({ children, requireAuth = false }: Props) {
  const { user, loading } = useUserStore();
  if (loading) return <div style={{ padding: 24 }}>로딩 중…</div>;
  if (requireAuth && !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
