// Firebase Admin 초기화 + idToken 검증.
//
// 서버 전용. 절대 클라이언트 컴포넌트(.tsx) 에서 import 하지 마세요.
// FIREBASE_ADMIN_PRIVATE_KEY 등 비밀 환경변수가 빌드물에 노출됩니다.
//
// 환경변수 (Vercel + .env.local):
//   FIREBASE_ADMIN_PROJECT_ID
//   FIREBASE_ADMIN_CLIENT_EMAIL
//   FIREBASE_ADMIN_PRIVATE_KEY  — \n 이스케이프 OK (자동 복원)

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let _app: App | null = null;

function getAdminApp(): App {
  if (_app) return _app;
  const existing = getApps();
  if (existing.length > 0) {
    _app = existing[0]!;
    return _app;
  }
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin 환경변수가 설정되지 않았습니다 (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY)",
    );
  }
  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return _app;
}

export type VerifiedUser = {
  uid: string;
  email?: string;
  displayName?: string;
};

/** Authorization 헤더 문자열에서 idToken 검증 → uid 추출. 실패 시 throw */
export async function verifyAuthHeader(
  authHeader: string | undefined | null,
): Promise<VerifiedUser> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("인증 토큰이 없습니다");
  }
  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) throw new Error("빈 토큰");
  const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
  return {
    uid: decoded.uid,
    email: decoded.email,
    displayName: (decoded as { name?: string }).name,
  };
}

/**
 * Web Request (Edge runtime) 또는 Node IncomingMessage (Node runtime) 양쪽 호환.
 * @deprecated Node runtime 에서는 verifyAuthHeader 직접 사용 권장
 */
export async function verifyRequest(
  req: Request | { headers: Record<string, string | string[] | undefined> | Headers },
): Promise<VerifiedUser> {
  let authHeader: string | undefined;
  // Web Request (headers 가 Headers 인스턴스)
  const h = (req as Request).headers;
  if (h && typeof (h as Headers).get === "function") {
    authHeader =
      (h as Headers).get("authorization") ??
      (h as Headers).get("Authorization") ??
      undefined;
  } else {
    // Node IncomingMessage (headers 가 plain object, key 는 lowercase)
    const obj = h as unknown as Record<string, string | string[] | undefined>;
    const v = obj["authorization"] ?? obj["Authorization"];
    authHeader = Array.isArray(v) ? v[0] : v;
  }
  return verifyAuthHeader(authHeader);
}
