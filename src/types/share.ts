// 공유 링크 — Firestore shares/{shareId}

export type ShareScope = 'day' | 'week' | 'mandala';

export type ShareLink = {
  id: string;
  ownerUid: string;
  scope: ShareScope;
  payload: unknown;        // 스냅샷 (도메인 타입은 scope에 따라 다름)
  createdAt: number;
  expiresAt?: number;      // 기본 30일
};
