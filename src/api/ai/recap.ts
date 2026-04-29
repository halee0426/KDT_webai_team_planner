// Vercel Edge Function: /api/ai/recap
// 주간 회고 생성 (Streaming + Chain-of-Thought)
// 담당: C

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // TODO: 한 주 데이터 컨텍스트 + OpenAI Streaming 호출 (PROMPTS.recap_v1)
  return new Response(
    JSON.stringify({
      summary: '한 주 수고하셨어요. (스텁)',
      highlights: ['', '', ''],
      suggestions: ['', '', ''],
      generatedAt: Date.now(),
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
}
