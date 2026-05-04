// AI 호출 상태 + 캐시
// Edge Function (/api/ai/*) 경유

import { create } from 'zustand';
import { callAI } from '@/lib/ai/client';
import { ParseEventResultSchema, MandalaDecompositionSchema, InsightSchema, WeeklyRecapSchema } from '@/lib/ai/schemas';
import type { Insight, ParseEventResult, MandalaDecomposition, WeeklyRecap } from '@/types/ai';

type InsightRequestOptions = {
  scope?: 'personal' | 'group';
  groupId?: string;
  referenceDate?: string;
  context?: unknown;
};

type AIStore = {
  insight: Insight | null;
  insightLoading: boolean;
  insightError: string | null;

  fetchInsight: (force?: boolean, opts?: InsightRequestOptions) => Promise<void>;
  parseEvent: (text: string) => Promise<ParseEventResult>;
  decomposeMandala: (
    centerGoal: string,
    opts?: { scope?: 'personal' | 'group'; groupId?: string },
  ) => Promise<MandalaDecomposition>;
  generateRecap: (
    weekStart: string,
    opts?: { scope?: 'personal' | 'group'; groupId?: string; context?: unknown },
  ) => Promise<WeeklyRecap>;
};

const INSIGHT_CACHE_KEY = 'kdt-insight-cache';
const INSIGHT_TTL = 60 * 60 * 1000; // 1시간

function hashText(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function insightCacheKey(body: InsightRequestOptions): string {
  const scope = body.scope ?? 'personal';
  const group = body.groupId ?? 'none';
  const date = body.referenceDate ?? 'today';
  const signature = hashText(JSON.stringify(body.context ?? {}));
  return `${INSIGHT_CACHE_KEY}:${scope}:${group}:${date}:${signature}`;
}

export const useAIStore = create<AIStore>((set) => ({
  insight: null,
  insightLoading: false,
  insightError: null,

  fetchInsight: async (force = false, opts = {}) => {
    const body: InsightRequestOptions = {
      scope: opts.scope ?? 'personal',
      groupId: opts.groupId,
      referenceDate: opts.referenceDate,
      context: opts.context ?? {},
    };
    const cacheKey = insightCacheKey(body);

    // 캐시 확인
    if (!force) {
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as Insight;
          if (Date.now() - cached.generatedAt < INSIGHT_TTL) {
            set({ insight: cached, insightLoading: false });
            return;
          }
        }
      } catch {}
    }

    set({ insightLoading: true, insightError: null });
    try {
      const data = await callAI<InsightRequestOptions, unknown>('insight', body);
      const parsed = InsightSchema.parse(data);
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      set({ insight: parsed, insightLoading: false });
    } catch (e) {
      // AI 미연결 상태에서도 앱은 정상 동작 — 조용히 폴백
      console.warn('인사이트 호출 실패 (AI 미연결 가능):', e);
      set({
        insightError: e instanceof Error ? e.message : 'AI 호출 실패',
        insightLoading: false,
      });
    }
  },

  parseEvent: async (text) => {
    const data = await callAI<{ text: string }, unknown>('parse-event', { text });
    return ParseEventResultSchema.parse(data);
  },

  decomposeMandala: async (centerGoal, opts = {}) => {
    const data = await callAI<
      { centerGoal: string; scope?: 'personal' | 'group'; groupId?: string },
      unknown
    >('mandala', { centerGoal, ...opts });
    return MandalaDecompositionSchema.parse(data);
  },

  generateRecap: async (weekStart, opts = {}) => {
    const data = await callAI<
      { weekStart: string; scope?: 'personal' | 'group'; groupId?: string; context?: unknown },
      unknown
    >('recap', { weekStart, ...opts });
    return WeeklyRecapSchema.parse(data);
  },
}));
