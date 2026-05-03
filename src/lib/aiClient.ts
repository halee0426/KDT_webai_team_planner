// AI Orchestrator 클라이언트 호출 래퍼.
//
// 클라이언트 컴포넌트(.tsx) 에서만 import 한다.
// fetch 로 /api/ai/orchestrate 만 호출 — 서버 코드 직접 import 금지.

import { auth } from "@/lib/firebase/client";
import type { SharedEvent } from "@/components/eventStore";
import type { AIEvent } from "@/components/ai/AIChatModal";

export type AICallContext = {
  scope: "personal" | "group";
  groupId?: string;
  groupName?: string | null;
  personalEvents?: SharedEvent[];
  personalTodos?: unknown[];
  personalMandala?: { cells?: string[] } | null;
  groupEvents?: SharedEvent[];
  groupTodos?: unknown[];
  holidays?: Array<{ date: string; name: string }>;
  currentScreen?: string;
};

export type AIChatResponse = {
  reply: string;
  events?: AIEvent[];
  /** preview 의 todos / mandala 도 함께 — 향후 UI 확장용 */
  todos?: unknown[];
  mandala?: unknown;
  warnings?: string[];
  ambiguities?: string[];
};

export async function askAI(
  userRequest: string,
  ctx: AICallContext,
): Promise<AIChatResponse> {
  const user = auth?.currentUser;
  if (!user) throw new Error("로그인 후 사용할 수 있어요");

  const idToken = await user.getIdToken();
  const referenceDate = new Date().toISOString().slice(0, 10);

  const res = await fetch("/api/ai/orchestrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      userRequest,
      scope: ctx.scope,
      groupId: ctx.groupId,
      referenceDate,
      currentScreen: ctx.currentScreen,
      context: {
        personalEvents: ctx.personalEvents,
        personalTodos: ctx.personalTodos,
        personalMandala: ctx.personalMandala,
        groupName: ctx.groupName,
        groupEvents: ctx.groupEvents,
        groupTodos: ctx.groupTodos,
        holidays: ctx.holidays,
      },
    }),
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      message?: string;
    };
    if (res.status === 401) {
      throw new Error("로그인이 만료됐어요. 다시 로그인해주세요");
    }
    throw new Error(errBody.message ?? `요청 실패 (${res.status})`);
  }

  const data = (await res.json()) as {
    composer?: {
      replyText?: string;
      preview?: {
        events?: Array<{
          title: string;
          date: string | null;
          startTime: string | null;
          endTime: string | null;
          allDay: boolean;
        }>;
        todos?: unknown[];
        mandala?: unknown;
      };
      warnings?: string[];
      ambiguities?: string[];
    };
  };

  const composer = data.composer ?? {};
  const preview = composer.preview ?? {};
  const draftEvents = preview.events ?? [];

  // ScheduleEventDraft → AIEvent (AIChatModal 이 기대하는 형식)
  const events: AIEvent[] = draftEvents.map((e, i) => ({
    id: `ai-${Date.now()}-${i}`,
    date: e.date ?? referenceDate,
    title: e.title,
    startTime: e.startTime ?? undefined,
    endTime: e.endTime ?? undefined,
    color: pickColor(i),
  }));

  return {
    reply: composer.replyText ?? "확인해보세요.",
    events,
    todos: preview.todos,
    mandala: preview.mandala,
    warnings: composer.warnings,
    ambiguities: composer.ambiguities,
  };
}

const PALETTE = [
  "#0066cc",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#5AC8FA",
];
function pickColor(i: number): string {
  return PALETTE[i % PALETTE.length];
}
