// Firebase Auth — 로그인 / 회원가입 / 로그아웃 / 탈퇴
// 담당: D

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  deleteUser,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './client';
import type { User, UserPreferences } from '@/types/user';
import { DEFAULT_PREFERENCES } from '@/types/user';

const googleProvider = new GoogleAuthProvider();

/** Google OAuth 로그인 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const { user } = await signInWithPopup(auth, googleProvider);
  return user;
}

/** 이메일/비밀번호 로그인 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

/** 이메일/비밀번호 회원가입 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<FirebaseUser> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  return user;
}

/** 로그아웃 */
export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

/** 회원 탈퇴 (Auth 계정 + Firestore 데이터는 별도 처리) */
export async function deleteAccount(): Promise<void> {
  if (auth.currentUser) {
    await deleteUser(auth.currentUser);
  }
}

/** 인증 상태 구독 — App 진입점에서 1회 등록 */
export function watchAuthState(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/** Firebase User → 우리 User 모델로 변환 */
export function toUser(fbUser: FirebaseUser, prefs?: Partial<UserPreferences>): User {
  return {
    uid: fbUser.uid,
    provider: fbUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email',
    email: fbUser.email ?? '',
    displayName: fbUser.displayName ?? '',
    photoURL: fbUser.photoURL ?? undefined,
    createdAt: Number(fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).getTime() : Date.now()),
    lastLoginAt: Number(fbUser.metadata.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).getTime() : Date.now()),
    preferences: { ...DEFAULT_PREFERENCES, ...prefs },
    consent: { privacyAcceptedAt: Date.now() },
  };
}
