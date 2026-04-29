// AI 호출 큐 · 캐시 · 로딩 상태
// 담당: C (AI 엔지니어)

import { create } from 'zustand';
import type { Insight, ParseEventResult, MandalaDecomposition, WeeklyRecap } from '@/types/ai';

type AIStore = {
  insight: Insight | null;
  insightLoading: boolean;
  insightError: string | null;

  // 호출 함수
  fetchInsight: (force?: boolean) => Promise<void>;
  parseEvent: (text: string) => Promise<ParseEventResult>;
  decomposeMandala: (centerGoal: string) => Promise<MandalaDecomposition>;
  generateRecap: (weekStart: string) => Promise<WeeklyRecap>;
};

export const useAIStore = create<AIStore>((set, get) => ({
  insight: null,
  insightLoading: false,
  insightError: null,

  fetchInsight: async (force = false) => {
    // TODO: lib/ai/client.ts의 fetchInsight 호출 (캐시 + Streaming)
    void force; void set; void get;
    throw new Error('Not implemented yet');
  },

  parseEvent: async (text) => {
    // TODO: /api/ai/parse-event 호출 + Zod 검증
    void text;
    throw new Error('Not implemented yet');
  },

  decomposeMandala: async (centerGoal) => {
    // TODO: /api/ai/mandala 호출 + Zod 검증
    void centerGoal;
    throw new Error('Not implemented yet');
  },

  generateRecap: async (weekStart) => {
    // TODO: /api/ai/recap 호출 (Streaming)
    void weekStart;
    throw new Error('Not implemented yet');
  },
}));
