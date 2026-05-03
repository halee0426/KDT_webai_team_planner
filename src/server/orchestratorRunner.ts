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

  const [
    orchRes,
    contextRes,
    scheduleRes,
    taskRes,
    mandalaRes,
  ] = await Promise.all([
    callOrchestrator({
      userRequest,
      subject: resolved.subject,
      rawContext: resolved.rawContext,
      currentScreen,
      referenceDate,
    }),
    callContextAgent({
      userRequest,
      subject: resolved.subject,
      rawContext: resolved.rawContext,
      referenceDate,
    }),
    callScheduleParser({
      userRequest,
      subject: resolved.subject,
      referenceDate,
      busyTimeHints: resolved.busyTimeHints,
      holidays: resolved.holidays,
      contextSummary: [],
    }),
    callTaskBreakdown({
      userRequest,
      subject: resolved.subject,
      referenceDate,
      existingTodoSummaries: resolved.existingTodos,
      contextSummary: [],
    }),
    callGoalMandala({
      userRequest,
      subject: resolved.subject,
      existingActiveGoals: resolved.existingActiveGoals,
      contextSummary: [],
    }),
  ]);

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
    const conf = await callConflictAgent({
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
    });
    if (conf.ok && conf.data) conflictOut = conf.data;
  }

  // 5. Response Composer — 항상 호출 (UI 표시용 최종 텍스트)
  const allWarnings = [
    ...(contextOut?.warnings ?? []),
    ...(scheduleOut?.warnings ?? []),
    ...(taskOut?.warnings ?? []),
    ...(mandalaOut?.warnings ?? []),
  ];
  const allAmbiguities = [
    ...(contextOut?.ambiguities ?? []),
    ...(scheduleOut?.ambiguities ?? []),
    ...(taskOut?.ambiguities ?? []),
    ...(mandalaOut?.ambiguities ?? []),
  ];

  const composer = await callResponseComposer({
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
  });
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
