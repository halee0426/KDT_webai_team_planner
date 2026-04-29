// 게스트 → 로그인 시 localStorage 데이터를 Firestore에 자동 머지
// 담당: D

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useEventStore } from '@/store/eventStore';

export default function MergeOnLogin() {
  const user = useUserStore((s) => s.user);
  const mergeOnLogin = useEventStore((s) => s.mergeOnLogin);

  useEffect(() => {
    if (user) {
      mergeOnLogin(user.uid).catch(console.error);
    }
  }, [user, mergeOnLogin]);

  return null;
}
