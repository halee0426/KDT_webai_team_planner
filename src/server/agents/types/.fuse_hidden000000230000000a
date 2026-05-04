// 공통 타입 — 모든 agent 가 공유
//
// 주의: 이 파일과 server/* 전체는 서버 전용 (Edge Functions / Vercel) 에서만 import 한다.
// 클라이언트 빌드물에는 절대 들어가면 안 된다 (OPENAI_API_KEY 노출 위험).

/** 플랜 scope — 개인 vs 그룹 */
export type PlanScope = "personal" | "group";

/** 사용자 식별 + scope 정보 */
export type RequestSubject = {
  uid: string;
  scope: PlanScope;
  /** scope === "group" 일 때 필수 */
  groupId?: string;
};

/** 모든 agent 호출의 공통 메타 */
export type AgentMeta = {
  agentName: string;
  /** 모델 이름 — 기본 gpt-4o-mini */
  model: string;
  /** epoch ms */
  startedAt: number;
  /** epoch ms */
  finishedAt: number;
  /** 토큰 사용량 (선택) */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

/** agent 결과 표준 wrapper */
export type AgentResult<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: AgentMeta;
};
