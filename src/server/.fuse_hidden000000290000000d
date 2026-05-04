// Orchestrator Runner — Orchestrator → 라우팅 → specialist 병렬 실행
// → ConflictAgent → ResponseComposer 흐름.
//
// 서버 전용. /api/ai/orchestrate 엔드포인트의 핵심 로직.

import {
  callOrchestrator,
  callContextAgent,
  callScheduleParser,
  callTaskBreakdown,
  callGoalMandala,
  callConflictAgent,
  callResponseComposer,
} from "@/server/agents";
import type {
  OrchestratorOutput,
  ContextAgentOutput,
  ScheduleParserOutput,
  TaskBreakdownOutput,
  GoalMandalaOutput,
  ConflictAgentOutput,
  ResponseComposerOutput,
} from "@/server/agents";
import type { ResolvedContext } from "./context/clientContextAdapter";

// 개별 agent 호출에 timeout 을 강제. 5개 병렬 호출 중 하나가 hang 되어도
// 나머지는 진행 → 부분 결과로 응답 가능.
// callJsonAgent 는 내부 catch 로 ok:false 를 반환하므로 정상 경로에선 reject 안 함.
// 하지만 withTimeout 이 reject 할 수 있으므로 .catch 로 ok:false 모양 정규화.
type AgentLike<TData> = {
  ok: boolean;
  data?: TData;
  error?: { code: string; message: string };
};

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function withTimeout<T extends AgentLike<unknown>>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timeout ${ms}ms`)),
        ms,
      ),
    ),
  ]).catch((e) => {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[runner] ${label} timeout/reject`, message);
    return {
      ok: false,
      error: { code: "TIMEOUT", message: `${label}: ${message}` },
    } as T;
  });
}

export type OrchestrationResult =
  | {
      ok: true;
      intent: string;
      scope: "personal" | "group";
      composer: ResponseComposerOutput;
      raw: {
        orchestrator: OrchestratorOutput;
        context?: ContextAgentOutput;
        scheduleParser?: ScheduleParserOutput;
        taskBreakdown?: TaskBreakdownOutput;
        goalMandala?: GoalMandalaOutput;
        conflict?: ConflictAgentOutput;
      };
    }
  | {
      ok: false;
      error: { code: string; message: string };
    };

export async function runOrchestration(
  userRequest: string,
  resolved: ResolvedContext,
  referenceDate: string,
  currentScreen?: string,
): Promise<OrchestrationResult> {
  // ── 최적화: Orchestrator + Context + Specialists 모두 동시 실행
  //    Orchestrator 의 라우팅 판정은 사후 메타로만 사용 (Composer 가 빈 결과는 자동 무시).
  //    각 specialist 는 본인 영역이 아니면 nonXxxRequest=true 로 빈 배열 반환 (이미 구현됨).
  //    이로써 직렬 9~10초 → 병렬 ~3초 로 단축. agent 7종 모두 그대로 사용.

  const PARALLEL_TIMEOUT_MS = 40_000;
  console.log("[runner] parallel agents start");

  const [
    orchRes,
    contextRes,
    scheduleRes,
    taskRes,
    mandalaRes,
  ] = await Promise.all([
    withTimeout(
      callOrchestrator({
        userRequest,
        subject: resolved.subject,
        rawContext: resolved.rawContext,
        currentScreen,
        referenceDate,
      }),
      PARALLEL_TIMEOUT_MS,
      "orchestrator",
    ),
    withTimeout(
      callContextAgent({
        userRequest,
        subject: resolved.subject,
        rawContext: resolved.rawContext,
        referenceDate,
      }),
      PARALLEL_TIMEOUT_MS,
      "context",
    ),
    withTimeout(
      callScheduleParser({
        userRequest,
        subject: resolved.subject,
        referenceDate,
        busyTimeHints: resolved.busyTimeHints,
        holidays: resolved.holidays,
        contextSummary: [],
      }),
      PARALLEL_TIMEOUT_MS,
      "schedule",
    ),
    withTimeout(
      callTaskBreakdown({
        userRequest,
        subject: resolved.subject,
        referenceDate,
        existingTodoSummaries: resolved.existingTodos,
        contextSummary: [],
      }),
      PARALLEL_TIMEOUT_MS,
      "task",
    ),
    withTimeout(
      callGoalMandala({
        userRequest,
        subject: resolved.subject,
        existingActiveGoals: resolved.existingActiveGoals,
        contextSummary: [],
      }),
      PARALLEL_TIMEOUT_MS,
      "mandala",
    ),
  ]);

  console.log("[runner] parallel agents done", {
    orchestrator: orchRes.ok,
    context: contextRes.ok,
    schedule: scheduleRes.ok,
    task: taskRes.ok,
    mandala: mandalaRes.ok,
  });

  // 모든 specialist + orchestrator 가 실패하면 명시적으로 graceful 에러 반환.
  if (
    !orchRes.ok &&
    !contextRes.ok &&
    !scheduleRes.ok &&
    !taskRes.ok &&
    !mandalaRes.ok
  ) {
    const firstMsg =
      orchRes.error?.message ??
      scheduleRes.error?.message ??
      taskRes.error?.message ??
      mandalaRes.error?.message ??
      "unknown";
    return {
      ok: false,
      error: {
        code: "ALL_AGENTS_FAILED",
        message: `모든 agent 호출이 실패했어요. ${firstMsg}`,
      },
    };
  }

  // Orchestrator 실패는 치명적 — 에러 반환 (다른 agent 결과 있어도 라우팅 메타 없음)
  if (!orchRes.ok || !orchRes.data) {
    return {
      ok: false,
      error: orchRes.error ?? { code: "ORCH_FAILED", message: "unknown" },
    };
  }
  const plan = orchRes.data;

  const contextOut = contextRes.ok ? contextRes.data : undefined;
  // 본인 영역이 아닌 specialist 는 자동으로 nonXxxRequest=true + 빈 배열 반환 — 그대로 사용
  const scheduleOut = scheduleRes.ok ? scheduleRes.data : undefined;
  const taskOut = taskRes.ok ? taskRes.data : undefined;
  const mandalaOut = mandalaRes.ok ? mandalaRes.data : undefined;

  // 4. Conflict Agent (proposed 가 하나라도 있고 라우팅에 포함되면)
  let conflictOut: ConflictAgentOutput | undefined;
  const hasProposed =
    (scheduleOut?.events.length ?? 0) > 0 ||
    (taskOut?.todos.length ?? 0) > 0 ||
    (mandalaOut && !mandalaOut.nonMandalaRequest);
  if (hasProposed && plan.agentsToCall.includes("conflict_agent")) {
    const conf = await withTimeout(
      callConflictAgent({
        subject: resolved.subject,
        scope: resolved.subject.scope,
        proposedEvents: scheduleOut?.events,
        proposedTodos: taskOut?.todos,
        proposedMandala: mandalaOut ?? null,
        existingEvents: resolved.existingEvents,
        existingTodos: resolved.existingTodos,
        existingActiveGoals: resolved.existingActiveGoals,
        holidays: resolved.holidays,
        busyTimeHints: resolved.busyTimeHints,
      }),
      PARALLEL_TIMEOUT_MS,
      "conflict",
    );
    if (conf.ok && conf.data) conflictOut = conf.data;
  }

  // 5. Response Composer — 항상 호출 (UI 표시용 최종 텍스트)
  const allWarnings = [
    ...asArray(contextOut?.warnings),
    ...asArray(scheduleOut?.warnings),
    ...asArray(taskOut?.warnings),
    ...asArray(mandalaOut?.warnings),
  ];
  const allAmbiguities = [
    ...asArray(contextOut?.ambiguities),
    ...asArray(scheduleOut?.ambiguities),
    ...asArray(taskOut?.ambiguities),
    ...asArray(mandalaOut?.ambiguities),
  ];

  const composer = await withTimeout(
    callResponseComposer({
      scope: resolved.subject.scope,
      groupName: resolved.groupName,
      proposedEvents: scheduleOut?.events,
      proposedTodos: taskOut?.todos,
      proposedMandala: mandalaOut ?? null,
      conflicts: conflictOut?.conflicts,
      conflictWarnings: conflictOut?.warnings,
      adjustmentSuggestions: conflictOut?.adjustmentSuggestions,
      ambiguities: allAmbiguities,
      warnings: allWarnings,
    }),
    PARALLEL_TIMEOUT_MS,
    "composer",
  );
  if (!composer.ok || !composer.data) {
    return {
      ok: false,
      error: composer.error ?? {
        code: "COMPOSER_FAILED",
        message: "unknown",
      },
    };
  }

  return {
    ok: true,
    intent: plan.intent,
    scope: resolved.subject.scope,
    composer: composer.data,
    raw: {
      orchestrator: plan,
      context: contextOut,
      scheduleParser: scheduleOut,
      taskBreakdown: taskOut,
      goalMandala: mandalaOut,
      conflict: conflictOut,
    },
  };
}
