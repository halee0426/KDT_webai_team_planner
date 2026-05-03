// /api/ai/orchestrate — Vercel Function (Node runtime, firebase-admin 호환).
//
// 흐름:
//   1) verifyRequest 로 idToken 검증 → uid 추출 (실패 시 401)
//   2) body 파싱 + 필수 필드 검증
//   3) resolveContext 로 클라이언트 context → ResolvedContext 변환
//   4) runOrchestration 으로 Orchestrator → specialists → Composer 실행
//   5) 결과 JSON 반환

import { verifyRequest } from "../../src/server/gateway/auth";
import {
  resolveContext,
  type OrchestrateRequestBody,
} from "../../src/server/context/clientContextAdapter";
import { runOrchestration } from "../../src/server/orchestratorRunner";

// Node runtime — firebase-admin / openai SDK 모두 호환
export const config = { runtime: "nodejs", maxDuration: 60 };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "METHOD_NOT_ALLOWED" });
  }

  // 1. 인증
  let user;
  try {
    user = await verifyRequest(req);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse(401, { error: "UNAUTHORIZED", message });
  }

  // 2. body 파싱
  let body: OrchestrateRequestBody;
  try {
    body = (await req.json()) as OrchestrateRequestBody;
  } catch {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "invalid JSON body",
    });
  }

  if (!body.userRequest || typeof body.userRequest !== "string") {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "userRequest 필요",
    });
  }
  if (body.scope !== "personal" && body.scope !== "group") {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "scope 는 'personal' 또는 'group'",
    });
  }
  if (body.scope === "group" && !body.groupId) {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "group scope 시 groupId 필요",
    });
  }

  const referenceDate =
    body.referenceDate ?? new Date().toISOString().slice(0, 10);
  const resolved = resolveContext(user.uid, body);

  // 3. Orchestration 실행
  const result = await runOrchestration(
    body.userRequest,
    resolved,
    referenceDate,
    body.currentScreen,
  );

  if (!result.ok) {
    return jsonResponse(500, {
      error: result.error.code,
      message: result.error.message,
    });
  }

  return jsonResponse(200, result);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
