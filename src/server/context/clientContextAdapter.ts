// MVP: 서버가 직접 Firestore 를 read 하지 않고, 클라이언트가 보내준 컨텍스트를
// 그대로 Agent input 으로 변환. 클라이언트는 Rules 로 보호된 본인 데이터만 들고 옴.
//
// v2 에서는 서버가 firebase-admin 으로 Firestore 를 직접 읽어 만들 수 있음.

import type { RequestSubject } from "@/server/agents/types/common";

/** 클라이언트가 /api/ai/orchestrate 에 보내는 body */
export type OrchestrateRequestBody = {
  userRequest: string;
  scope: "personal" | "group";
  groupId?: string;
  /** 상대 날짜 해석 기준 (YYYY-MM-DD) */
  referenceDate: string;
  currentScreen?: string;
  /** 클라이언트가 묶어서 보낸 컨텍스트 — 본인 데이터만 (Rules 로 보호된 영역) */
  context?: {
    personalEvents?: unknown[];
    personalTodos?: unknown[];
    personalMandala?: { cells?: string[] } | null;
    groupName?: string | null;
    groupEvents?: unknown[];
    groupTodos?: unknown[];
    holidays?: Array<{ date: string; name: string }>;
  };
};

export type ResolvedContext = {
  subject: RequestSubject;
  rawContext: Record<string, unknown>;
  busyTimeHints: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
    title?: string;
  }>;
  existingEvents: Array<{
    id: string;
    date: string;
    startTime?: string;
    endTime?: string;
    title: string;
    allDay?: boolean;
  }>;
  existingTodos: Array<{ id: string; text: string; done: boolean }>;
  existingActiveGoals: Array<{ id: string; centerGoal: string }>;
  groupName: string | null;
  holidays: Array<{ date: string; name: string }>;
};

export function resolveContext(
  uid: string,
  body: OrchestrateRequestBody,
): ResolvedContext {
  const subject: RequestSubject = {
    uid,
    scope: body.scope,
    groupId: body.groupId,
  };

  const ctx = body.context ?? {};
  const events =
    body.scope === "group" ? ctx.groupEvents ?? [] : ctx.personalEvents ?? [];
  const todos =
    body.scope === "group" ? ctx.groupTodos ?? [] : ctx.personalTodos ?? [];

  // SharedEvent 형식 (year/month/startDay/startSlot/endSlot) → 표준 date/time 형식
  const existingEvents = (events as Array<Record<string, unknown>>).map(
    (e, i) => {
      const year = typeof e.year === "number" ? e.year : null;
      const month = typeof e.month === "number" ? e.month : null;
      const startDay = typeof e.startDay === "number" ? e.startDay : null;
      const date =
        year != null && month != null && startDay != null
          ? `${year}-${String(month + 1).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`
          : typeof e.date === "string"
            ? e.date
            : "";
      const startTime =
        typeof e.startSlot === "number"
          ? slotToTime(e.startSlot)
          : typeof e.startTime === "string"
            ? e.startTime
            : undefined;
      const endTime =
        typeof e.endSlot === "number"
          ? slotToTime(e.endSlot)
          : typeof e.endTime === "string"
            ? e.endTime
            : undefined;
      return {
        id: String(e.id ?? i),
        date,
        startTime,
        endTime,
        title: String(e.title ?? ""),
        allDay: e.startSlot == null && e.startTime == null,
      };
    },
  );

  const existingTodos = (todos as Array<Record<string, unknown>>).map(
    (t, i) => ({
      id: String(t.id ?? i),
      text: String(t.text ?? ""),
      done: !!t.done,
    }),
  );

  const mandala = body.scope === "group" ? null : ctx.personalMandala;
  const centerGoal = mandala?.cells?.[40];
  const existingActiveGoals = centerGoal
    ? [{ id: "default", centerGoal: String(centerGoal) }]
    : [];

  return {
    subject,
    rawContext: { ...ctx, scope: body.scope },
    busyTimeHints: existingEvents
      .filter((e) => e.date && e.startTime)
      .map((e) => ({
        date: e.date,
        startTime: e.startTime,
        endTime: e.endTime,
        title: e.title,
      })),
    existingEvents,
    existingTodos,
    existingActiveGoals,
    groupName: ctx.groupName ?? null,
    holidays: ctx.holidays ?? [],
  };
}

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2);
  const m = slot % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
}
