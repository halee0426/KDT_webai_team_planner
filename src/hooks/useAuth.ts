// 인증 상태 구독 훅 — App 진입점에서 useEffect로 1회 호출
// 더미 키일 때는 즉시 게스트 모드로

import { useEffect } from 'react';
import { watchAuthState, toUser } from '@/lib/firebase/auth';
import { fetchUserProfile, upsertUserProfile } from '@/lib/firebase/sync';
import { isFirebaseConfigured } from '@/lib/firebase/client';
import { useUserStore } from '@/store/userStore';

export function useAuthSubscription() {
  useEffect(() => {
    // 더미 키 상태에서는 즉시 게스트 모드
    if (!isFirebaseConfigured) {
      useUserStore.setState({ user: null, loading: false });
      return;
    }

    const unsub = watchAuthState(async (fbUser) => {
      if (!fbUser) {
        useUserStore.setState({ user: null, loading: false });
        return;
      }
      try {
        let profile = await fetchUserProfile(fbUser.uid);
        if (!profile) {
          profile = toUser(fbUser);
          await upsertUserProfile(profile);
        }
        useUserStore.setState({ user: profile, loading: false });
      } catch (e) {
        console.error('사용자 프로필 로드 실패:', e);
        useUserStore.setState({ user: null, loading: false });
      }
    });
    return () => unsub();
  }, []);
}
