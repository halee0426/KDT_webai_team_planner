// LLM 응답 Zod 스키마 — Edge Function에서 검증 후 클라이언트로 전달
// 담당: C

import { z } from 'zod';

// ── Insight ───────────────────────────────────────
export const InsightSchema = z.object({
  message: z.string().min(1).max(120),
  generatedAt: z.number(),
});

// ── Parse Event ───────────────────────────────────
const EventInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const ParseEventResultSchema = z.object({
  events: z.array(EventInputSchema).max(50),
});

// ── Mandala ───────────────────────────────────────
const StringTuple8 = z.tuple([
  z.string(), z.string(), z.string(), z.string(),
  z.string(), z.string(), z.string(), z.string(),
]);

export const MandalaDecompositionSchema = z.object({
  center: z.string().min(1).max(20),
  subgoals: StringTuple8,
  actions: z.tuple([
    StringTuple8, StringTuple8, StringTuple8, StringTuple8,
    StringTuple8, StringTuple8, StringTuple8, StringTuple8,
  ]),
});

// ── Weekly Recap ──────────────────────────────────
export const WeeklyRecapSchema = z.object({
  summary: z.string().min(10).max(500),
  highlights: z.array(z.string()).length(3),
  suggestions: z.array(z.string()).length(3),
  generatedAt: z.number(),
});
