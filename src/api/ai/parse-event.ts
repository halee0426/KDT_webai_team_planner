// Vercel Edge Function: /api/ai/parse-event
// 자연어 → 일정 분해 (Function Calling / Tool Use)
// 담당: C

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // TODO: idToken 검증 → OpenAI 호출 (PROMPTS.events_v1) → ParseEventResultSchema 검증
  return new Response(JSON.stringify({ events: [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
