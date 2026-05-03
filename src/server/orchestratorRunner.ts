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
  // 1. Orchestrator — intent 분류 + 라우팅
  const orch = await callOrchestrator({
    userRequest,
    subject: resolved.subject,
    rawContext: resolved.rawContext,
    currentScreen,
    referenceDate,
  });
  if (!orch.ok || !orch.data) {
    return {
      ok: false,
      error: orch.error ?? { code: "ORCH_FAILED", message: "unknown" },
    };
  }
  const plan = orch.data;

  // 2. Context Agent (선택)
  let contextOut: ContextAgentOutput | undefined;
  if (plan.agentsToCall.includes("context_agent")) {
    const ctx = await callContextAgent({
      userRequest,
      subject: resolved.subject,
      rawContext: resolved.rawContext,
      referenceDate,
    });
    if (ctx.ok && ctx.data) contextOut = ctx.data;
  }

  const contextSummary = contextOut?.contextSummary ?? [];

  // 3. Specialist Agents — 병렬 실행
  const wantsSchedule = plan.agentsToCall.includes("schedule_parser_agent");
  const wantsTask = plan.agentsToCall.includes("task_breakdown_agent");
  const wantsMandala = plan.agentsToCall.includes("goal_mandala_agent");

  const [schedulePromise, taskPromise, mandalaPromise] = [
    wantsSchedule
      ? callScheduleParser({
          userRequest,
          subject: resolved.subject,
          referenceDate,
          busyTimeHints: resolved.busyTimeHints,
          holidays: resolved.holidays,
          contextSummary,
        })
      : null,
    wantsTask
      ? callTaskBreakdown({
          userRequest,
          subject: resolved.subject,
          referenceDate,
          existingTodoSummaries: resolved.existingTodos,
          contextSummary,
        })
      : null,
    wantsMandala
      ? callGoalMandala({
          userRequest,
          subject: resolved.subject,
          existingActiveGoals: resolved.existingActiveGoals,
          contextSummary,
        })
      : null,
  ];

  const [scheduleRes, taskRes, mandalaRes] = await Promise.all([
    schedulePromise,
    taskPromise,
    mandalaPromise,
  ]);
  const scheduleOut =
    scheduleRes && scheduleRes.ok ? scheduleRes.data : undefined;
  const taskOut = taskRes && taskRes.ok ? taskRes.data : undefined;
  const mandalaOut = mandalaRes && mandalaRes.ok ? mandalaRes.data : undefined;

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
