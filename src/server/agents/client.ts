// OpenAI 클라이언트 + 공통 호출 헬퍼
//
// 서버 전용. 모든 agent 가 이 헬퍼를 통해 LLM 을 호출한다.
//
// 환경변수:
//   OPENAI_API_KEY  — 필수 (서버 전용, VITE_ 접두어 X)

import OpenAI from "openai";
import type { AgentMeta, AgentResult } from "./types/common";

const DEFAULT_MODEL = "gpt-4o-mini";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY 가 환경변수에 없습니다. .env.local 또는 Vercel 환경변수에 설정하세요.",
    );
  }
  // Node 기본 fetch (undici) 의 headers timeout 회피 위해 명시적 timeout 지정.
  // OpenAI SDK 가 내부 fetch 를 wrap 하므로 이 timeout 이 우선 적용됨.
  _client = new OpenAI({
    apiKey,
    timeout: 50_000, // 50초 (Vercel function maxDuration 60초보다 짧게)
    maxRetries: 1,   // 첫 시도 실패 시 1회 재시도
  });
  return _client;
}

/**
 * JSON 모드로 LLM 호출.
 * 시스템 프롬프트 + 사용자 입력을 받아 JSON 객체를 반환한다.
 */
export async function callJsonAgent<TOutput>(
  agentName: string,
  systemPrompt: string,
  userPayload: unknown,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  },
): Promise<AgentResult<TOutput>> {
  const model = options?.model ?? DEFAULT_MODEL;
  const startedAt = Date.now();

  try {
    const client = getClient();
    const completion = await client.chat.completions.create({
      model,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    });

    const finishedAt = Date.now();
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const meta: AgentMeta = {
      agentName,
      model,
      startedAt,
      finishedAt,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };

    let parsed: TOutput;
    try {
      parsed = JSON.parse(raw) as TOutput;
    } catch (_e) {
      return {
        ok: false,
        error: {
          code: "INVALID_JSON",
          message: `LLM 응답이 유효한 JSON 이 아닙니다. raw: ${raw.slice(0, 200)}`,
        },
        meta,
      };
    }

    return { ok: true, data: parsed, meta };
  } catch (e: unknown) {
    const finishedAt = Date.now();
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: { code: "AGENT_CALL_FAILED", message },
      meta: { agentName, model, startedAt, finishedAt },
    };
  }
}
