// 사용자 인증 상태 + 프로필
// 담당: D — Firebase Auth 연동, 게스트↔로그인 머지

import { create } from 'zustand';
import type { User } from '@/types/user';

type UserStore = {
  user: User | null;           // null === 비로그인 게스트
  loading: boolean;             // Auth 초기화 중
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
    // TODO: lib/firebase/auth.ts의 signInWithGoogle / signInWithEmail 호출
    void provider; void email; void password; void set; void get;
    throw new Error('Not implemented yet');
  },

  signUp: async (email, password, displayName) => {
    // TODO: createUserWithEmailAndPassword + Firestore users/{uid} 생성
    void email; void password; void displayName;
    throw new Error('Not implemented yet');
  },

  signOut: async () => {
    // TODO: Firebase signOut + 로컬 캐시 정리
    throw new Error('Not implemented yet');
  },

  deleteAccount: async () => {
    // TODO: Firestore users/{uid} 데이터 삭제 + Auth 계정 삭제
    throw new Error('Not implemented yet');
  },

  updatePreferences: async (patch) => {
    // TODO: Firestore users/{uid}.preferences 업데이트
    void patch;
    throw new Error('Not implemented yet');
  },
}));
