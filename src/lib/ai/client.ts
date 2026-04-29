// OpenAI 호출 래퍼 — Vercel Edge Functions 경유
// 담당: C
// API 키는 절대 클라이언트에 노출 X (Edge Function 환경변수에만)

import { auth } from '@/lib/firebase/client';

const API_BASE = '/api/ai';

async function getIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

type FetchOptions = {
  signal?: AbortSignal;
  /** 재시도 횟수 (기본 3) */
  retries?: number;
};

/** 지수 백오프 재시도 */
async function fetchWithRetry(url: string, init: RequestInit, retries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok) return res;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr ?? new Error('AI 호출 실패');
}

/** Edge Function 호출 헬퍼 */
export async function callAI<TBody, TResp>(
  endpoint: 'insight' | 'parse-event' | 'mandala' | 'recap',
  body: TBody,
  opts: FetchOptions = {},
): Promise<TResp> {
  const idToken = await getIdToken();
  const res = await fetchWithRetry(
    `${API_BASE}/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: opts.signal,
    },
    opts.retries,
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI 호출 실패 (${res.status}): ${text}`);
  }
  return (await res.json()) as TResp;
}

/** Streaming 호출 (인사이트 인사말, 회고용) */
export async function* streamAI(
  endpoint: 'insight' | 'recap',
  body: unknown,
  opts: FetchOptions = {},
): AsyncGenerator<string, void, void> {
  const idToken = await getIdToken();
  const res = await fetch(`${API_BASE}/${endpoint}?stream=1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error('Stream 실패');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}
