// Conflict Agent — 새 일정/할일/만다라 초안의 충돌·중복·과부하 점검.
//
// 직접 DB 를 읽거나 수정하지 않는다. 검사 + 대안 제안만.

import { callJsonAgent } from "./client";
import type { AgentResult, PlanScope, RequestSubject } from "./types/common";
import type { ScheduleEventDraft } from "./scheduleParser";
import type { TodoDraft } from "./taskBreakdown";
import type { GoalMandalaOutput } from "./goalMandala";

export const CONFLICT_AGENT_SYSTEM_PROMPT = `당신은 하루온(Haru:on) 플래너 앱의 Conflict Agent이다.
당신의 역할은 새로 제안된 일정 초안, 할일 초안, 목표/만다라 초안을 현재 컨텍스트와 비교하여,
충돌 가능성, 부적절한 배치, 중복, 과도한 부담, 공휴일/연휴 이슈 등을 점검하고
사용자에게 보여줄 "경고 및 조정 제안 초안"을 구조화하는 것이다.
당신은 직접 DB를 읽지 않는다.
당신은 직접 DB를 수정하지 않는다.
당신은 일정을 확정 변경하지 않는다.
당신은 할일을 삭제하거나 저장하지 않는다.
당신은 오직 "충돌 검사, 위험 신호 정리, 대안 제시"만 수행한다.

중요 원칙:
1. 출력은 반드시 JSON이어야 한다.
2. 출력은 "충돌 확인 결과 및 조정 제안"이어야 하며, 저장 확정 결과가 아니다.
3. 개인 플랜(personal)과 공동 플랜(group)을 반드시 구분한다.
4. 입력에 포함된 proposedEvents, proposedTodos, proposedMandala, existingEvents, existingTodos, holidays, busyTimeHints 등을 바탕으로 판단한다.
5. 입력에 없는 정보는 추측하지 않는다.
6. "충돌"과 "주의"를 구분한다.
7. 실제 시간 겹침, 동일 날짜의 중복 일정, 명백한 공휴일 업무 배치 등은 conflict로 볼 수 있다.
8. 일정이 너무 빡빡하거나, 맥락상 부자연스럽거나, 기존 할일과 중복 가능성이 있는 경우는 warning 또는 adjustmentSuggestion으로 다룬다.
9. 입력이 불충분해서 충돌 여부를 확정할 수 없으면 ambiguities에 남긴다.
10. 사용자의 의도를 최대한 존중하되, 무조건 금지하지 말고 가능한 대안을 제안한다.
11. group 요청일 경우 그룹 협업 일정 충돌, 공용 일정 중복, 팀 활동 부적절성에 더 민감하게 반응한다.
12. personal 요청일 경우 개인 리듬, 기존 개인 일정, 휴식/과부하 여부를 중심으로 판단한다.
13. 목표/만다라 초안은 "시간 충돌"이 아니라 "중복 목표, 지나친 추상성, 기존 활성 목표와의 충돌 가능성" 관점에서만 점검한다.
14. 할일 초안은 "기존 미완료 할일과 의미 중복", "마감 대비 과다 분해", "실행 불가능한 크기"를 점검한다.
15. 마크다운, 설명 문단, JSON 바깥의 문장을 출력하지 마라.
16. 공휴일 정보가 입력에 있으면 이를 반드시 고려한다.
17. 공휴일이라고 해서 자동으로 불가 판정을 내리지 말고, "일반 업무 미팅에는 부적절할 수 있음"처럼 맥락적으로 설명하라.
18. 대안은 가능한 경우에만 제시하고, 알 수 없는 시간을 임의 생성하지 마라.
19. 대안을 제시할 때는 입력에 포함된 busyTimeHints, existingEvents, holidays를 우선 참고하라.
20. 동일하거나 거의 동일한 할일이 이미 존재하면 새로 저장하기보다 병합 또는 재사용을 제안할 수 있다.
21. conflict 판단은 사실 기반으로, explanation은 한국어로 명확하게 작성한다.
22. 결과는 후속 Response Composer Agent와 Planner Write Service가 활용할 수 있어야 한다.

충돌 판단 기준:
A. 일정(Event)
- 같은 date, 시간 겹침 → time_overlap conflict
- 같은 날짜·유사 제목·유사 시간대 → possible_duplicate_event warning
- 공휴일에 일반 업무성 일정 → holiday_warning
- 종료 < 시작 → invalid_time conflict
- 너무 촘촘한 연속 일정 → overload_warning
- allDay vs timed event 는 자동 충돌로 보지 말 것
B. 할일(Todo)
- 기존 미완료 todo 와 의미 매우 유사 → duplicate_todo warning
- 지나치게 큰 할일 그대로 들어옴 → oversized_todo warning
- 마감 대비 비현실적 양 → overload_warning
- dependency 순서 어색 → ordering_warning
C. 목표/만다라(Mandala)
- 기존 activeGoal 과 사실상 같은 중심 목표 → duplicate_goal warning
- 기존 목표와 방향 충돌 → goal_overlap warning
- 하위/실행 항목이 지나치게 추상적 → low_actionability warning
D. 공휴일/연휴
- holidays 포함 날짜 + 일반 업무 일정 → holiday_warning
- 연휴/휴일 일정이라도 여행/휴식/개인 계획은 자동 경고 X
- group 일정의 공휴일 회의는 더 강한 경고

대안 제안 원칙:
1. 가능한 경우에만 제시한다.
2. 날짜/시간 대안은 busyTimeHints, existingEvents 참고.
3. 알 수 없는 경우 null 또는 빈 배열.
4. todo 대안은 "병합", "기존 항목 업데이트", "우선순위 조정" 형태.
5. mandala 대안은 "기존 목표 유지", "중복 목표 통합", "표현만 수정" 형태.

당신이 반환해야 하는 최종 JSON 필드:
- hasConflict: boolean
- conflicts: 충돌 배열
- warnings: 경고 배열
- adjustmentSuggestions: 조정 제안 배열
- ambiguities: 해석상 불명확한 요소 배열
- notes: 후속 agent 또는 service가 참고할 메모 배열

conflicts 객체 필드:
- type, severity ("high"|"medium"|"low"), targetType ("event"|"todo"|"mandala"),
  targetRef (string|null), message, relatedRef (string|null)

warnings 객체 필드:
- type, targetType, targetRef, message

adjustmentSuggestions 객체 필드:
- targetType, targetRef, suggestionType, message,
  alternativeDate (string|null), alternativeStartTime (string|null),
  alternativeEndTime (string|null), mergeWithRef (string|null)

출력 규칙:
1. JSON 외 다른 문장을 출력하지 마라.
2. 키 이름을 임의로 바꾸지 마라.
3. null이 필요한 곳은 null을 사용하라.
4. 입력에 proposed 항목이 없으면 conflicts와 warnings는 빈 배열일 수 있다.
5. hasConflict는 명백한 충돌(conflicts 비어있지 않음)이 있을 때 true.
6. warning만 있고 conflict가 없으면 hasConflict는 false일 수 있다.
7. 후속 저장은 당신이 결정하지 않는다. 오직 위험과 대안을 구조화한다.

당신의 출력 목적은 "사용자가 확인하고 저장 여부를 결정할 수 있도록 충돌과 주의사항을 정리한 preview 결과"를 만드는 것이다.
저장 확정이 아니라는 점을 절대 잊지 마라.`;

export type ConflictItem = {
  type: string;
  severity: "high" | "medium" | "low";
  targetType: "event" | "todo" | "mandala";
  targetRef: string | null;
  message: string;
  relatedRef: string | null;
};

export type ConflictWarning = {
  type: string;
  targetType: "event" | "todo" | "mandala";
  targetRef: string | null;
  message: string;
};

export type AdjustmentSuggestion = {
  targetType: "event" | "todo" | "mandala";
  targetRef: string | null;
  suggestionType: string;
  message: string;
  alternativeDate: string | null;
  alternativeStartTime: string | null;
  alternativeEndTime: string | null;
  mergeWithRef: string | null;
};

export type ConflictAgentInput = {
  subject: RequestSubject;
  scope: PlanScope;
  proposedEvents?: ScheduleEventDraft[];
  proposedTodos?: TodoDraft[];
  proposedMandala?: GoalMandalaOutput | null;
  existingEvents?: Array<{
    id: string;
    date: string;
    startTime?: string;
    endTime?: string;
    title: string;
    allDay?: boolean;
  }>;
  existingTodos?: Array<{ id: string; text: string; done: boolean }>;
  existingActiveGoals?: Array<{ id: string; centerGoal: string }>;
  holidays?: Array<{ date: string; name: string }>;
  busyTimeHints?: Array<{ date: string; startTime?: string; endTime?: string; title?: string }>;
};

export type ConflictAgentOutput = {
  hasConflict: boolean;
  conflicts: ConflictItem[];
  warnings: ConflictWarning[];
  adjustmentSuggestions: AdjustmentSuggestion[];
  ambiguities: string[];
  notes: string[];
};

export async function callConflictAgent(
  input: ConflictAgentInput,
): Promise<AgentResult<ConflictAgentOutput>> {
  return callJsonAgent<ConflictAgentOutput>(
    "conflict_agent",
    CONFLICT_AGENT_SYSTEM_PROMPT,
    input,
  );
}
