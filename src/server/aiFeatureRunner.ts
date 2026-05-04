import {
  callJsonAgent,
  callScheduleParser,
} from "./agents/index.js";
import type { RequestSubject } from "./agents/types/common.js";
import {
  InsightSchema,
  MandalaDecompositionSchema,
  ParseEventResultSchema,
  WeeklyRecapSchema,
} from "../lib/ai/schemas.js";
import type {
  Insight,
  MandalaDecomposition,
  ParseEventResult,
  WeeklyRecap,
} from "../types/ai.js";
import type { ScheduleEventDraft } from "./agents/scheduleParser.js";

type Scope = "personal" | "group";

type CommonInput = {
  uid: string;
  scope?: Scope;
  groupId?: string;
  referenceDate?: string;
};

const PALETTE = [
  "#0066cc",
  "#FF9500",
  "#34C759",
  "#AF52DE",
  "#FF3B30",
  "#5AC8FA",
];

function subject(input: CommonInput): RequestSubject {
  return {
    uid: input.uid,
    scope: input.scope ?? "personal",
    groupId: input.groupId,
  };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function compact(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function maxText(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

function extractDate(text: string, referenceDate: string): string | null {
  const iso = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (iso) {
    return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  }
  if (/오늘/.test(text)) return referenceDate;
  if (/내일/.test(text)) return addDays(referenceDate, 1);
  if (/모레/.test(text)) return addDays(referenceDate, 2);
  return null;
}

function extractTime(text: string): string | null {
  const match = text.match(/(오전|오후)?\s*(\d{1,2})\s*시(?:\s*(반|\d{1,2})\s*분?)?/);
  if (!match) return null;
  const meridiem = match[1];
  let hour = Number(match[2]);
  const minute = match[3] === "반" ? 30 : match[3] ? Number(match[3]) : 0;
  if (meridiem === "오후" && hour < 12) hour += 12;
  if (meridiem === "오전" && hour === 12) hour = 0;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function extractTitle(text: string): string {
  return text
    .replace(/\b20\d{2}[-/.]\d{1,2}[-/.]\d{1,2}\b/g, " ")
    .replace(/오늘|내일|모레/g, " ")
    .replace(/(오전|오후)?\s*\d{1,2}\s*시(?:\s*(반|\d{1,2})\s*분?)?/g, " ")
    .replace(/일정\s*(만들어줘|추가해줘|등록해줘|잡아줘|넣어줘|생성해줘)/g, " ")
    .replace(/(만들어줘|추가해줘|등록해줘|잡아줘|넣어줘|생성해줘|해줘)/g, " ")
    .replace(/^[\s,.;:~\-에에서]+/g, "")
    .replace(/[\s,.;:~\-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim() || "일정";
}

export function buildFallbackScheduleEventDraft(
  text: string,
  input: CommonInput,
  referenceDate: string,
): ScheduleEventDraft | null {
  const sourceText = compact(text);
  const date = extractDate(sourceText, referenceDate);
  if (!date) return null;

  const startTime = extractTime(sourceText);
  return {
    title: maxText(extractTitle(sourceText), 60),
    date,
    startTime,
    endTime: null,
    allDay: !startTime,
    scope: input.scope ?? "personal",
    targetGroupId: input.groupId ?? null,
    location: null,
    description: null,
    sourceText,
    confidence: "medium",
  };
}

function eightStrings(value: unknown): [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
] {
  const arr = Array.isArray(value) ? value : [];
  return Array.from({ length: 8 }, (_, i) => compact(arr[i])) as [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
}

function eightRows(value: unknown): MandalaDecomposition["actions"] {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({ length: 8 }, (_, i) => eightStrings(rows[i])) as MandalaDecomposition["actions"];
}

export async function generateMandalaDraft(input: CommonInput & {
  centerGoal: string;
  existingActiveGoals?: Array<{ centerGoal: string }>;
}): Promise<MandalaDecomposition> {
  const centerGoal = compact(input.centerGoal);
  if (!centerGoal) throw new Error("centerGoal is required");

  const result = await callJsonAgent<MandalaDecomposition>(
    "mandala_decomposition",
    [
      "You are Haru:on goal coach. Create a Korean mandala chart draft.",
      "Return only JSON with fields: center, subgoals, actions.",
      "center must be the user's goal, max 20 Korean characters when possible.",
      "subgoals must be exactly 8 short Korean strings.",
      "actions must be exactly 8 arrays, each with exactly 8 concrete action strings.",
      "Do not return markdown. Do not add extra keys.",
    ].join("\n"),
    {
      centerGoal,
      scope: input.scope ?? "personal",
      groupId: input.groupId ?? null,
      existingActiveGoals: input.existingActiveGoals ?? [],
    },
    { temperature: 0.35, maxTokens: 2200 },
  );

  if (!result.ok || !result.data) {
    throw new Error(result.error?.message ?? "Mandala agent failed");
  }

  const normalized = {
    center: maxText(compact(result.data.center) || centerGoal, 20),
    subgoals: eightStrings(result.data.subgoals).map((v) => maxText(v, 20)),
    actions: eightRows(result.data.actions).map((row) =>
      row.map((v) => maxText(v, 30)),
    ),
  };

  return MandalaDecompositionSchema.parse(normalized) as MandalaDecomposition;
}

export async function parseEventDrafts(input: CommonInput & {
  text: string;
  busyTimeHints?: Array<{ date: string; startTime?: string; endTime?: string; title?: string }>;
  holidays?: Array<{ date: string; name: string }>;
}): Promise<ParseEventResult> {
  const text = compact(input.text);
  if (!text) throw new Error("text is required");

  const referenceDate = input.referenceDate ?? today();
  const result = await callScheduleParser({
    userRequest: `다음 문장을 일정 초안으로 파싱해줘: ${text}`,
    subject: subject(input),
    referenceDate,
    busyTimeHints: input.busyTimeHints,
    holidays: input.holidays,
    contextSummary: [],
  });

  if (!result.ok || !result.data) {
    throw new Error(result.error?.message ?? "Schedule parser failed");
  }

  const fallback = buildFallbackScheduleEventDraft(text, input, referenceDate);
  const rawEvents =
    (result.data.events ?? []).length > 0
      ? result.data.events
      : fallback
        ? [fallback]
        : [];

  const events = rawEvents
    .filter((event) => compact(event.title))
    .map((event, index) => ({
      date: event.date ?? referenceDate,
      title: maxText(compact(event.title), 60),
      color: PALETTE[index % PALETTE.length],
      ...(event.startTime ? { startTime: event.startTime } : {}),
      ...(event.endTime ? { endTime: event.endTime } : {}),
    }));

  return ParseEventResultSchema.parse({ events }) as ParseEventResult;
}

export async function generateInsight(input: CommonInput & {
  context?: unknown;
}): Promise<Insight> {
  const generatedAt = Date.now();
  const result = await callJsonAgent<{ message?: string }>(
    "insight",
    [
      "You write one short Korean daily planning insight for Haru:on.",
      "Use the supplied schedule, todo, mandala, and diary context if present.",
      "Return only JSON with a message field. Keep it warm, factual, and under 80 Korean characters.",
    ].join("\n"),
    {
      referenceDate: input.referenceDate ?? today(),
      context: input.context ?? {},
    },
    { temperature: 0.4, maxTokens: 180 },
  );

  if (!result.ok || !result.data) {
    throw new Error(result.error?.message ?? "Insight agent failed");
  }

  const fallback = "오늘 일정과 할 일을 가볍게 정리해볼까요?";
  const message = maxText(compact(result.data.message) || fallback, 120);
  return InsightSchema.parse({ message, generatedAt }) as Insight;
}

export async function generateWeeklyRecap(input: CommonInput & {
  weekStart: string;
  context?: unknown;
}): Promise<WeeklyRecap> {
  const weekStart = compact(input.weekStart);
  if (!weekStart) throw new Error("weekStart is required");

  const generatedAt = Date.now();
  const result = await callJsonAgent<Partial<WeeklyRecap>>(
    "weekly_recap",
    [
      "You write a Korean weekly planning recap for Haru:on.",
      "Return only JSON: summary, highlights, suggestions.",
      "summary must be 3-4 sentences. highlights and suggestions must each contain exactly 3 concise strings.",
    ].join("\n"),
    {
      weekStart,
      referenceDate: input.referenceDate ?? today(),
      context: input.context ?? {},
    },
    { temperature: 0.35, maxTokens: 700 },
  );

  if (!result.ok || !result.data) {
    throw new Error(result.error?.message ?? "Weekly recap agent failed");
  }

  const highlights = normalizeThree(result.data.highlights, "이번 주 기록을 더 채워보세요");
  const suggestions = normalizeThree(result.data.suggestions, "다음 주 첫 할 일을 하나 정해보세요");
  const summary =
    compact(result.data.summary) ||
    "이번 주 기록이 아직 충분하지 않아요. 일정과 할 일을 조금 더 채우면 더 정확한 회고를 만들 수 있어요.";

  return WeeklyRecapSchema.parse({
    summary: maxText(summary, 500),
    highlights,
    suggestions,
    generatedAt,
  }) as WeeklyRecap;
}

function normalizeThree(value: unknown, fallback: string): [string, string, string] {
  const arr = Array.isArray(value) ? value : [];
  return Array.from({ length: 3 }, (_, i) => compact(arr[i]) || fallback) as [
    string,
    string,
    string,
  ];
}
