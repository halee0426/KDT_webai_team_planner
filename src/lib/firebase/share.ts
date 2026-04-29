// 읽기 전용 공유 링크
// 담당: D

import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './client';
import type { ShareLink, ShareScope } from '@/types/share';

const genShareId = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30일

export async function createShareLink(
  ownerUid: string,
  scope: ShareScope,
  payload: unknown,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<ShareLink> {
  const id = genShareId();
  const now = Date.now();
  const link: ShareLink = {
    id,
    ownerUid,
    scope,
    payload,
    createdAt: now,
    expiresAt: now + ttlMs,
  };
  await setDoc(doc(db, 'shares', id), { ...link, _createdAt: serverTimestamp() });
  return link;
}

export async function fetchShareLink(id: string): Promise<ShareLink | null> {
  const snap = await getDoc(doc(db, 'shares', id));
  if (!snap.exists()) return null;
  const data = snap.data() as ShareLink;
  if (data.expiresAt && data.expiresAt < Date.now()) return null;
  return data;
}

export async function deleteShareLink(id: string): Promise<void> {
  await deleteDoc(doc(db, 'shares', id));
}
