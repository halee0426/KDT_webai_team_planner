// 앱 진입 시 AI 인사이트 인사말 — 홈 상단 카드
// 담당: B (UI) + C (호출 로직)

import { useEffect } from 'react';
import { useAIStore } from '@/store/aiStore';

export default function InsightGreeting() {
  const { insight, insightLoading, insightError, fetchInsight } = useAIStore();

  useEffect(() => {
    fetchInsight().catch(console.error);
  }, [fetchInsight]);

  if (insightLoading) return <div style={{ padding: 16 }}>✨ 인사말 준비 중…</div>;
  if (insightError) return null;
  if (!insight) return null;

  return (
    <div style={{
      padding: 16,
      background: 'var(--accent-soft, rgba(0,102,204,0.08))',
      borderRadius: 12,
      margin: 16,
      fontSize: 15,
    }}>
      ✨ {insight.message}
    </div>
  );
}
