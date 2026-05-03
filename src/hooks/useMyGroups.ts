// 내 그룹 목록 훅 — users/{uid}/myGroups 인덱스 onSnapshot 구독 후 그룹 본체 fetch
//
// 게스트 모드 / 비로그인: 빈 배열 반환
// 로그아웃 시: 자동으로 빈 배열 + listener 정리

import { useCallback, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase/client';
import { useUserStore } from '@/store/userStore';
import type { Group } from '@/types/group';

type State = {
  groups: Group[];
  loading: boolean;
};

function groupFromDoc(id: string, data: any): Group {
  return {
    id,
    name: String(data.name ?? ''),
    ownerUid: String(data.ownerUid ?? ''),
    ownerName: String(data.ownerName ?? ''),
    memberUids: Array.isArray(data.memberUids) ? data.memberUids : [],
    memberNames:
      data.memberNames && typeof data.memberNames === 'object'
        ? data.memberNames
        : {},
    memberPhotos:
      data.memberPhotos && typeof data.memberPhotos === 'object'
        ? data.memberPhotos
        : {},
    inviteCode: String(data.inviteCode ?? ''),
    createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
  };
}

export function useMyGroups(): State & { refetch: () => void } {
  const uid = useUserStore((s) => s.user?.uid ?? null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured || !uid) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    let cancelled = false;
    const indexCol = collection(db, 'users', uid, 'myGroups');
    const unsub = onSnapshot(
      indexCol,
      async (idxSnap) => {
        if (cancelled) return;
        if (idxSnap.empty) {
          setGroups([]);
          setLoading(false);
          return;
        }
        const fetched = await Promise.all(
          idxSnap.docs.map(async (d) => {
            try {
              const gSnap = await getDoc(doc(db, 'groups', d.id));
              if (!gSnap.exists()) {
                // stale 인덱스 자동 정리 — 그룹 본체가 사라진 경우
                deleteDoc(doc(db, 'users', uid, 'myGroups', d.id)).catch(() => {});
                return null;
              }
              return groupFromDoc(gSnap.id, gSnap.data());
            } catch {
              // permission-denied 등 — 멤버에서 제외된 경우도 정리
              deleteDoc(doc(db, 'users', uid, 'myGroups', d.id)).catch(() => {});
              return null;
            }
          }),
        );
        if (cancelled) return;
        const valid = fetched
          .filter((g): g is Group => g !== null)
          .sort((a, b) => a.createdAt - b.createdAt);
        setGroups(valid);
        setLoading(false);
      },
      (err) => {
        console.error('myGroups 구독 실패:', err);
        if (!cancelled) {
          setGroups([]);
          setLoading(false);
        }
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { groups, loading, refetch };
}
