// /api/ai/orchestrate — Vercel Function (Node runtime, firebase-admin 호환).
//
// 흐름:
//   1) verifyAuthHeader 로 idToken 검증 → uid 추출 (실패 시 401)
//   2) body 파싱 + 필수 필드 검증
//   3) resolveContext 로 클라이언트 context → ResolvedContext 변환
//   4) runOrchestration 으로 Orchestrator → specialists → Composer 실행
//   5) 결과 JSON 반환
//
// Vercel Node runtime 시그니처: (req: VercelRequest, res: VercelResponse)
// req.headers: plain object (lowercase keys)
// req.body: 자동 파싱된 JSON (Content-Type: application/json 일 때)
// res.status(n).json(obj) 로 응답

import { Agent, setGlobalDispatcher } from "undici";

// Node 글로벌 fetch (undici) 의 기본 headersTimeout(~10초) 우회.
// OpenAI SDK 의 timeout 옵션보다 undici dispatcher 가 우선되므로,
// 모듈 최상단에서 dispatcher 자체를 교체해야 함.
setGlobalDispatcher(
  new Agent({
    headersTimeout: 60_000,
    bodyTimeout: 60_000,
  }),
);

import { verifyAuthHeader } from "../../src/server/gateway/auth";
import {
  resolveContext,
  type OrchestrateRequestBody,
} from "../../src/server/context/clientContextAdapter";
import { runOrchestration } from "../../src/server/orchestratorRunner";

// Node runtime — firebase-admin / openai SDK 모두 호환
export const config = { runtime: "nodejs", maxDuration: 60 };

// Vercel Node runtime 의 req/res 타입 (의존성 추가 없이 최소 정의)
type VReq = {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};
type VRes = {
  status: (n: number) => VRes;
  json: (body: unknown) => VRes;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
};

function getHeader(req: VReq, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function handler(req: VReq, res: VRes): Promise<void> {
  console.log("[orchestrate] start", {
    method: req.method,
    hasAuth: !!getHeader(req, "authorization"),
  });

  if (req.method !== "POST") {
    res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    return;
  }

  // 1. 인증
  let user;
  try {
    user = await verifyAuthHeader(getHeader(req, "authorization"));
    console.log("[orchestrate] auth ok", { uid: user.uid });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[orchestrate] auth failed", message);
    res.status(401).json({ error: "UNAUTHORIZED", message });
    return;
  }

  // 2. body 파싱 — Vercel Node runtime 은 자동 파싱하지만 fallback 처리
  let body: OrchestrateRequestBody;
  try {
    if (req.body && typeof req.body === "object") {
      body = req.body as OrchestrateRequestBody;
    } else if (typeof req.body === "string") {
      body = JSON.parse(req.body) as OrchestrateRequestBody;
    } else {
      throw new Error("body 가 비어있거나 잘못됨");
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    res.status(400).json({ error: "BAD_REQUEST", message });
    return;
  }

  if (!body.userRequest || typeof body.userRequest !== "string") {
    res.status(400).json({ error: "BAD_REQUEST", message: "userRequest 필요" });
    return;
  }
  if (body.scope !== "personal" && body.scope !== "group") {
    res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "scope 는 'personal' 또는 'group'" });
    return;
  }
  if (body.scope === "group" && !body.groupId) {
    res
      .status(400)
      .json({ error: "BAD_REQUEST", message: "group scope 시 groupId 필요" });
    return;
  }

  const referenceDate =
    body.referenceDate ?? new Date().toISOString().slice(0, 10);
  const resolved = resolveContext(user.uid, body);

  console.log("[orchestrate] before runOrchestration", {
    scope: body.scope,
    userRequest: body.userRequest.slice(0, 60),
  });
  const t0 = Date.now();

  // 3. Orchestration 실행
  let result;
  try {
    result = await runOrchestration(
      body.userRequest,
      resolved,
      referenceDate,
      body.currentScreen,
    );
  } catch (e) {
    const message =
      e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error("[orchestrate] runOrchestration threw", message);
    res.status(500).json({ error: "ORCH_THREW", message });
    return;
  }

  console.log("[orchestrate] after runOrchestration", {
    ok: result.ok,
    elapsedMs: Date.now() - t0,
  });

  if (!result.ok) {
    res
      .status(500)
      .json({ error: result.error.code, message: result.error.message });
    return;
  }

  res.status(200).json(result);
}
