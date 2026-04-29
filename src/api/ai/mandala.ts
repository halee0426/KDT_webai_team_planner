// Vercel Edge Function: /api/ai/mandala
// 만다라트 자동 분해 (Structured Output / JSON Schema)
// 담당: C

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  // TODO: OpenAI 호출 (PROMPTS.mandala_v1) → MandalaDecompositionSchema 검증
  return new Response(JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' },
  });
}
