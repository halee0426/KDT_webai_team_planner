// Vercel Edge Function: /api/ai/insight
// 인사이트 인사말 생성 (Streaming 지원)
// 담당: C
//
// TODO:
//   1. idToken 검증 (Firebase Admin SDK)
//   2. 사용자 데이터(events·todos·mandala·diaries 최근 7일) 컨텍스트 압축
//   3. OpenAI gpt-4o-mini 호출 (시스템 프롬프트: PROMPTS.insight_v1)
//   4. Streaming 응답 또는 JSON 반환

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // TODO: 구현
  return new Response(
    JSON.stringify({
      message: '✨ 오늘 일정을 확인해보세요. (스텁 응답)',
      generatedAt: Date.now(),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
