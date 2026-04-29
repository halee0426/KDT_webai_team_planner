// 인증 상태 구독 훅 — App 진입점에서 useEffect로 1회 호출
// 담당: D

import { useEffect } from 'react';
import { watchAuthState, toUser } from '@/lib/firebase/auth';
import { fetchUserProfile, upsertUserProfile } from '@/lib/firebase/sync';
import { useUserStore } from '@/store/userStore';

export function useAuthSubscription() {
  useEffect(() => {
    const unsub = watchAuthState(async (fbUser) => {
      if (!fbUser) {
        useUserStore.setState({ user: null, loading: false });
        return;
      }
      // Firestore에서 프로필 가져오기 (없으면 새로 생성)
      let profile = await fetchUserProfile(fbUser.uid);
      if (!profile) {
        profile = toUser(fbUser);
        await upsertUserProfile(profile);
      }
      useUserStore.setState({ user: profile, loading: false });
    });
    return () => unsub();
  }, []);
}
