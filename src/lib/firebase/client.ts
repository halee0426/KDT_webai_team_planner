// Firebase 초기화 (Auth + Firestore)
// 더미 값이어도 앱이 죽지 않도록 lazy + try/catch

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** 실제 Firebase 키가 설정되어 있는지 확인 */
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.includes('dummy') &&
  !firebaseConfig.apiKey.includes('Dummy') &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'dummy-project'
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

try {
  _app = initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db = getFirestore(_app);
  if (!isFirebaseConfigured) {
    console.warn(
      '⚠️ Firebase: 더미 키로 초기화됨. 게스트 모드(localStorage)만 동작합니다.\n' +
      '실제 사용을 위해 .env.local에 진짜 Firebase 키를 입력하세요.',
    );
  }
} catch (e) {
  console.error('Firebase 초기화 실패:', e);
}

export const app = _app!;
export const auth = _auth!;
export const db = _db!;
