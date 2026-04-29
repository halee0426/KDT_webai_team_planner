// 사용자 모델 — Firebase Auth + Firestore users/{uid} 컬렉션

export type AuthProvider = 'google' | 'email' | 'kakao';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'ko' | 'en';

export type UserPreferences = {
  theme: ThemePreference;
  language: Language;
  aiInsightEnabled: boolean;       // 인사이트 인사말 on/off
  weekStartsOn: 0 | 1;             // 0=일요일, 1=월요일
};

export type UserConsent = {
  privacyAcceptedAt: number;       // 개인정보 동의 시점 (epoch ms)
  aiDataUsageAcceptedAt?: number;  // AI에 데이터 전달 동의
};

export type User = {
  uid: string;                     // Firebase Auth UID (PK)
  provider: AuthProvider;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: number;
  lastLoginAt: number;
  preferences: UserPreferences;
  consent: UserConsent;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'ko',
  aiInsightEnabled: true,
  weekStartsOn: 1,
};
