// AI 호출 상태 + 캐시
// Edge Function (/api/ai/*) 경유

import { create } from 'zustand';
import { callAI } from '@/lib/ai/client';
import { ParseEventResultSchema, MandalaDecompositionSchema, InsightSchema, WeeklyRecapSchema } from '@/lib/ai/schemas';
import type { Insight, ParseEventResult, MandalaDecomposition, WeeklyRecap } from '@/types/ai';

type AIStore = {
  insight: Insight | null;
  insightLoading: boolean;
  insightError: string | null;

  fetchInsight: (force?: boolean) => Promise<void>;
  parseEvent: (text: string) => Promise<ParseEventResult>;
  decomposeMandala: (centerGoal: string) => Promise<MandalaDecomposition>;
  generateRecap: (weekStart: string) => Promise<WeeklyRecap>;
};

const INSIGHT_CACHE_KEY = 'kdt-insight-cache';
const INSIGHT_TTL = 60 * 60 * 1000; // 1시간

export const useAIStore = create<AIStore>((set) => ({
  insight: null,
  insightLoading: false,
  insightError: null,

  fetchInsight: async (force = false) => {
    // 캐시 확인
    if (!force) {
      try {
        const raw = localStorage.getItem(INSIGHT_CACHE_KEY);
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
      const data = await callAI<{}, unknown>('insight', {});
      const parsed = InsightSchema.parse(data);
      localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(parsed));
      set({ insight: parsed, insightLoading: false });
    } catch (e) {
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

  decomposeMandala: async (centerGoal) => {
    const data = await callAI<{ centerGoal: string }, unknown>('mandala', { centerGoal });
    return MandalaDecompositionSchema.parse(data);
  },

  generateRecap: async (weekStart) => {
    const data = await callAI<{ weekStart: string }, unknown>('recap', { weekStart });
    return WeeklyRecapSchema.parse(data);
  },
}));
