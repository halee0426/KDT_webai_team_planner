// 사용자 인증 상태 + 프로필
// 실제 구현은 lib/firebase/auth.ts와 useAuth 훅 조합

import { create } from 'zustand';
import type { User } from '@/types/user';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut as fbSignOut,
  deleteAccount as fbDeleteAccount,
} from '@/lib/firebase/auth';
import { upsertUserProfile } from '@/lib/firebase/sync';

type UserStore = {
  user: User | null;
  loading: boolean;
  signIn: (provider: 'google' | 'email', email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updatePreferences: (patch: Partial<User['preferences']>) => Promise<void>;
};

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: true,

  signIn: async (provider, email, password) => {
    if (provider === 'google') {
      await signInWithGoogle();
    } else if (provider === 'email' && email && password) {
      await signInWithEmail(email, password);
    } else {
      throw new Error('잘못된 로그인 정보');
    }
    // 실제 user 상태는 useAuthSubscription 훅이 업데이트
  },

  signUp: async (email, password, displayName) => {
    await signUpWithEmail(email, password, displayName);
    // useAuthSubscription이 자동으로 user 업데이트 + Firestore 프로필 생성
  },

  signOut: async () => {
    await fbSignOut();
    set({ user: null });
  },

  deleteAccount: async () => {
    // TODO: Firestore의 users/{uid} 데이터 삭제 (D 담당이 sync.ts에 deleteUserData 추가)
    await fbDeleteAccount();
    set({ user: null });
  },

  updatePreferences: async (patch) => {
    const current = get().user;
    if (!current) return;
    const updated: User = {
      ...current,
      preferences: { ...current.preferences, ...patch },
    };
    await upsertUserProfile(updated);
    set({ user: updated });
  },
}));
