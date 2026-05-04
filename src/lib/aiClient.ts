// AI Orchestrator 클라이언트 호출 래퍼.
//
// 클라이언트 컴포넌트(.tsx) 에서만 import 한다.
// fetch 로 /api/ai/orchestrate 만 호출 — 서버 코드 직접 import 금지.

import { auth } from "@/lib/firebase/client";
import type { SharedEvent } from "@/components/eventStore";
import type { AIEvent, AIMandalaDraft, AITodo } from "@/components/ai/AIChatModal";

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
  todos?: AITodo[];
  mandala?: AIMandalaDraft | null;
  warnings?: string[];
  ambiguities?: string[];
};

function localDateKey(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function askAI(
  userRequest: string,
  ctx: AICallContext,
): Promise<AIChatResponse> {
  const user = auth?.currentUser;
  if (!user) throw new Error("로그인 후 사용할 수 있어요");

  const idToken = await user.getIdToken();
  const referenceDate = localDateKey();

  // 클라이언트 fetch 에 60초 timeout (서버 maxDuration 60초와 정렬).
  // 서버 hang 시에도 사용자에게 명확한 에러 메시지가 도달하도록 보장.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch("/api/ai/orchestrate", {
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
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("AI 응답이 60초 안에 오지 않았어요. 다시 시도해주세요");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }

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
        todos?: Array<Record<string, unknown>>;
        mandala?: Record<string, unknown> | null;
      };
      warnings?: string[];
      ambiguities?: string[];
    };
  };

  const composer = data.composer ?? {};
  const preview = composer.preview ?? {};
  const draftEvents = preview.events ?? [];
  const draftTodos = preview.todos ?? [];

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
    todos: draftTodos
      .map((todo, i) => normalizeTodo(todo, i))
      .filter((todo): todo is AITodo => todo !== null),
    mandala: normalizeMandala(preview.mandala),
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

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTodo(todo: Record<string, unknown>, index: number): AITodo | null {
  const text = asString(todo.text);
  if (!text) return null;
  const priority = asString(todo.priority);
  return {
    id: `todo-${Date.now()}-${index}`,
    text,
    priority:
      priority === "high" || priority === "medium" || priority === "low"
        ? priority
        : "medium",
    category: asString(todo.category) || null,
    dueHint: asString(todo.dueHint) || null,
    dependencyHint: asString(todo.dependencyHint) || null,
  };
}

function normalizeStringArray(value: unknown, max: number): string[] {
  return Array.isArray(value)
    ? value.map(asString).filter(Boolean).slice(0, max)
    : [];
}

function normalizeRows(value: unknown): string[][] {
  return Array.isArray(value)
    ? value.map((row) => normalizeStringArray(row, 8)).filter((row) => row.length > 0).slice(0, 8)
    : [];
}

function normalizeMandala(value: Record<string, unknown> | null | undefined): AIMandalaDraft | null {
  if (!value || value.nonMandalaRequest === true) return null;
  const centerGoal = asString(value.centerGoal);
  const subGoals = normalizeStringArray(value.subGoals, 8);
  const actionItems = normalizeRows(value.actionItems);
  if (!centerGoal && subGoals.length === 0 && actionItems.length === 0) return null;
  return {
    centerGoal: centerGoal || "목표",
    subGoals,
    actionItems,
  };
}
