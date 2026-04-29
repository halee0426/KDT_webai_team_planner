# 웹기반 AI 플래너 — 팀 프로젝트 가이드

> KDT WebAI Team Planner · 2026.04 · v1.0

---

## 📌 한 줄 요약

**"1년의 흐름부터 10분의 집중까지, 함께 채우는 AI 플래너."**

연력의 큰 그림과 10분 플래너의 미시적 실행을 한 앱에서 잇고, 그 사이의 번거로움을 AI가 거드는 모바일 우선 웹앱.

---

## 1. 프로젝트 개요

### 1.1 배경
- 시중 디지털 플래너는 대부분 **월·주·일 단위에 갇혀 있다.** 1년의 큰 흐름을 한 화면에서 보거나, 하루를 10분 단위로 쪼개어 분석하는 도구는 드물다.
- 반면 한국에서 오래 사랑받아 온 종이 다이어리(굳이어플·모트모트 등)는 **연 → 월 → 주 → 일 → 10분**으로 시간을 점점 잘게 쪼개는 "줌인" 구조를 갖고 있다. 이 사상이 디지털에 제대로 옮겨진 사례는 거의 없다.
- 우리는 이 종이 다이어리의 시간관을 디지털로 살리되, **연력의 큰 그림 그리기**와 **10분 플래너의 세밀한 실행 추적**이라는 양 끝을 함께 제공하는 것을 코어로 잡는다.
- 다만 이 둘을 일일이 연결하고 채우는 일은 손이 많이 간다. **AI는 이 흐름의 빈틈을 메우는 보조 도구**로 자리한다 — 자연어로 일정 추가, 목표 분해 도움, 주간 회고 정리. 결정과 입력의 주도권은 사용자에게 있다.

### 1.2 타깃 사용자
- 1차: 여행 계획·자기계발 목표를 가진 20–30대
- 2차: 학습/공부 루틴을 짜는 학생, 직장인 회고 사용자

### 1.3 차별화 포인트
**시간 줌인 구조(연력 ↔ 10분)** 가 코어, **AI는 거드는 보조**라는 큰 원칙 아래 5가지로 정리.

| 구분 | 내용 |
|------|------|
| 🗓 **연력으로 1년을 한눈에** | 1년 365일을 한 화면에 펼쳐 형광펜으로 기간을 그린다. 큰 흐름·중요 시즌·휴가·프로젝트 마감 같은 거시 일정을 즉시 시각화. 시중 디지털 플래너에 거의 없는 뷰. |
| ⏱️ **10분 단위 시간 시각화** | 18시간 × 6칸(10분) = 108칸 그리드를 색칠해서 하루 시간 사용을 직관적으로 분석. 종이 다이어리의 미시 추적을 디지털로 옮긴 핵심 자산. |
| 🔗 **연력 ↔ 10분의 연결성** | 연력에 그은 형광펜 기간이 → 일력의 종일 띠로, 만다라트의 실행 셀이 → 일정으로, 같은 데이터가 6개 뷰에서 다르게 보인다. |
| ✨ **AI 인사이트 인사말** | 앱을 켤 때마다 사용자의 일정·할일·만다라트·일기 데이터를 바탕으로 한두 줄 코멘트 — "이번 주 운동 3회 채우셨어요. 한 번 더면 이번 달 목표 달성!" 같은 격려·요약·환기. |
| 🤝 **AI는 거드는 손길** | 자연어로 일정 추가, 만다라트 분해 도움, 주간 회고 정리. 단 결정과 입력의 주도권은 사용자에게. AI가 만든 결과는 항상 미리보기 → 승인 단계를 거친다. |

### 1.4 일정 (4~5일 스프린트)
| Day | 큰 그림 |
|-----|---------|
| D1 | 환경 셋업 + 6개 뷰 통합 |
| D2 | AI 인사이트·자연어 일정 + 사용자 인증 |
| D3 | Firestore 동기화 + 만다라트 분해 |
| D4 | 통합·QA·모바일·다크모드 |
| D5 | 배포 + 데모 + 발표 |

> 단계별 상세 매핑은 **§4.3 일정 매핑** 참조.

---

## 2. 핵심 기능 명세

### 2.1 6가지 뷰
| 뷰 | 용도 | 핵심 인터랙션 |
|----|------|----------------|
| **연력** (Year) | 1년 전체 · 형광펜으로 기간 표시 | 드래그로 기간 선택 → 형광펜 색·라벨 부여 |
| **달력** (Month) | 월간 일정 한눈에 | 셀 탭 → 일력으로 이동 |
| **주력** (Week) | 주간 시간표 | 빈 슬롯 탭 → 빠른 추가 |
| **일력** (Day) | 30분 단위 타임그리드 + 할일 | 드래그로 시간대 선택 → 일정 추가 / 이벤트 드래그로 시간 이동 |
| **10분 플래너** | 18×6 그리드 색칠로 시간 분석 | 작업 선택 → 셀 드래그로 페인팅 |
| **만다라트** | 9×9 목표 분해 | 중심 목표 입력 → AI 분해 → 셀 편집 |
| **일기** | 날짜별 텍스트 일기 | 자동 저장 |

### 2.2 AI 차별화 기능
| 기능 | 설명 | 예시 입력 |
|------|------|-----------|
| **자연어 → 일정 분해** | 자유 텍스트 → 다중 일정 자동 생성 | "다음 주 제주 3박 4일, 첫째 날 한라산" |
| **만다라트 자동 분해** | 핵심 목표 → 8개 세부 + 64개 실행 | "영어 회화 마스터" → 발음/문법/회화/… |
| **주간 회고 요약** | 한 주 데이터 → 자연어 회고 | 자동 생성, 사용자 수정 가능 |
| **할일 패턴 분석** | 자주 미루는 할일 감지 → 재배치 제안 | "이 항목은 3주째 미뤄짐, 시간을 옮길까요?" |

---

## 3. 기술 스택

### 3.1 프론트엔드
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| **언어** | TypeScript | 타입 안정성 · 협업 시 인터페이스 명확화 |
| **프레임워크** | React 18 | Figma Make가 React 기반 코드를 출력 → 그대로 활용 |
| **빌드 도구** | Vite | 빠른 HMR · 최소 설정 · Figma Make 기본값 |
| **스타일링** | Tailwind CSS + shadcn/ui | 약 50개 UI 컴포넌트 즉시 사용 · 커스터마이즈 자유도 높음 |
| **폰트** | Pretendard (한글) | 가독성·디자인 일관성 |
| **상태 관리** | React useState + Zustand 패턴 (`eventStore.ts`) | 작은 규모에 가벼움 |
| **라우팅** | React Router v6 | 6개 뷰 SPA 라우팅 |
| **차트/시각화** | Recharts | 회고 대시보드 · 시간 통계 |
| **PWA** | Vite PWA Plugin | 모바일 홈화면 추가 · 오프라인 동작 |
| **아이콘** | Lucide React | shadcn/ui 기본 아이콘 세트 |

### 3.2 백엔드 / 데이터
| 분류 | 기술 | 선정 이유 |
|------|------|-----------|
| **사용자 인증** | Firebase Auth — Google · 이메일/비밀번호 · 카카오(선택) | 사용자 식별이 필요한 모든 기능(데이터 동기화·AI 인사이트·공유 링크)의 진입점. **앱의 핵심 기능 중 하나**로 격상 |
| **사용자 DB** | Firebase Firestore — `users/{uid}` 컬렉션 | 사용자 프로필(이름·아바타·생성일·마지막 접속) + 환경설정(테마·언어) 보관 |
| **개인 데이터 DB** | Firebase Firestore — `users/{uid}/{events,todos,highlights,mandala,diaries}` 서브컬렉션 | 일정·할일·만다라트·일기 등 모든 도메인 데이터를 사용자 단위로 격리 저장 |
| **로컬 저장** | localStorage (`eventStore.ts`) | 비로그인 사용자 또는 오프라인 상태 즉시 동작 · 로그인 시 클라우드와 자동 머지 |
| **호스팅 / 배포** | Vercel | git push만으로 자동 배포 · 환경변수(`OPENAI_API_KEY`, Firebase config) 안전 보관 |
| **CDN** | jsDelivr | Pretendard 폰트 등 정적 자원 |

> AI 모델·SDK·기법은 분량이 많아 **§3.5 AI · 인공지능 스택**으로 별도 정리.

### 3.3 개발 도구
- **버전 관리**: Git + GitHub
- **에디터**: VS Code
- **린트/포맷**: ESLint + Prettier
- **타입 체크**: TypeScript strict mode
- **로컬 서버**: Vite dev server (port 5173)

### 3.4 인프라 · 운영
| 분류 | 기술 | 비고 |
|------|------|------|
| **CI/CD** | Vercel 자동 빌드 | `main` 푸시 시 자동 배포 |
| **에러 모니터링** | Sentry (선택) | 프로덕션 단계에서 도입 검토 |
| **분석** | Vercel Analytics (무료) | 페이지 뷰·기기 통계 |
| **비밀 관리** | Vercel 환경 변수 | API 키는 절대 커밋 X |

### 3.5 AI · 인공지능 스택
> 이 섹션이 우리 프로젝트의 **AI 보조 기능**을 구현하기 위한 모든 기술을 한 곳에 정리한다.
> 사용자의 주도권을 해치지 않는 선에서 — 자연어 입력, 목표 분해, 회고 코칭, 패턴 감지를 담당.

#### 3.5.1 모델 (LLM Provider)
> **비용 최적화를 위해 OpenAI `gpt-4o-mini` 단일 모델로 운영한다.**
> 단일 모델로 통일함으로써 SDK·인증·프롬프트 관리가 한 곳으로 모이고, 학생 프로젝트 수준의 비용 한도 안에서 모든 기능을 구현 가능.

| 모델 | 용도 | 선정 이유 |
|------|------|-----------|
| **OpenAI `gpt-4o-mini`** | 모든 LLM 작업 — 인사이트 인사말, 자연어 일정 추가, 만다라트 분해, 주간 회고, 일기 무드 태깅, 형광펜 라벨 제안 | 입력 $0.15 / 출력 $0.60 per 1M tokens 수준의 저비용 · Function Calling / Structured Output / Streaming 모두 지원 · 한국어 출력 안정적 · 응답 빠름 (대부분 1~3초) |
| **`text-embedding-3-small`** (선택) | 패턴 감지용 임베딩 | 과거 todo·event 의미 검색. v2에서 도입 검토 |

> **모델 단일화의 트레이드오프**
> - 장점: 토큰 1개로 모든 기능 운영 · 호출 라이브러리 단일화 · 디버깅 쉬움
> - 단점: 분해 같은 무거운 작업에서 더 큰 모델 대비 품질이 약할 수 있음
> - 대응: **프롬프트 엔지니어링과 Few-shot 예시**로 품질을 끌어올리고, 결과는 항상 사용자 미리보기로 보정 가능

#### 3.5.2 호출 방식 (API & SDK)
| 항목 | 기술 | 설명 |
|------|------|------|
| **공식 SDK** | `openai` (Node/TypeScript) | TypeScript 타입 지원 · 재시도 내장 · Function Calling/Structured Output 풍부 |
| **호출 위치** | 프론트 → 서버리스 함수 (Vercel Edge Functions) | API 키(`OPENAI_API_KEY`)를 환경 변수로만 보관, 클라이언트에 노출하지 않음 |
| **응답 검증** | Zod 스키마 | LLM 응답이 정해진 구조를 어기면 즉시 재시도 |
| **재시도 정책** | 지수 백오프 3회 (1s → 2s → 4s) | 네트워크·rate limit 대응 |
| **캐싱** | localStorage + sessionStorage | 같은 입력 반복 호출 차단 → 비용↓ |
| **시스템 프롬프트 단일화** | `lib/ai/prompts.ts` 한 파일 | 동일 시스템 프롬프트 재사용으로 응답 일관성 + 디버깅 용이 |

#### 3.5.3 적용 기법 (LLM Techniques)

각 기법이 **이 앱에서 구체적으로 어떤 역할**을 하고, **사용자에게 어떤 경험**을 만드는지 함께 정리.

| 기법 | 적용 기능 | 앱에서의 역할 | 사용자 효과 |
|------|-----------|--------------|--------------|
| **Function Calling / Tool Use** | 자연어 → 일정 추가 | LLM의 출력을 `addEvent(date, title, time)` 같은 우리 store 함수 호출로 직접 매핑. LLM이 텍스트를 답하는 게 아니라 **앱의 액션을 실행**하게 만든다. | "다음 주 화요일 두 시 미팅" 한 줄 입력만으로 일력에 정확한 시간·날짜의 카드가 꽂힌다. |
| **Structured Output (JSON Schema)** | 만다라트 81칸 자동 분해 | LLM 응답이 `{ center, subgoals[8], actions[8][8] }` 스키마를 반드시 따르도록 강제. 누락·오타 자동 거부. | "TOEIC 900점" 한 단어만 넣어도 81칸이 빈틈없이 채워져 즉시 보임 — 형식 깨진 결과로 화면이 어색해지는 일이 없다. |
| **Few-shot Prompting** | 만다라트 분해 · 주간 회고 | 시스템 프롬프트에 **좋은 예시 2~3개**(예: "영어 회화 → 발음/문법/회화…")를 박아넣어 톤·구체성을 학습. | AI가 "공부하기" 같은 두루뭉술한 셀을 채우지 않고, "주 3회 섀도잉 30분"처럼 **실행 가능한 문장**을 내놓는다. |
| **Chain-of-Thought** | 다중 일자 일정 분해 (여행 등) | "먼저 일정의 큰 흐름을 정한 뒤, 각 일자에 활동을 배치하라" 같은 단계적 사고 지시. 일자 간 모순(겹침·이동시간 무시) 방지. | "제주 3박 4일"이 4일치 일정으로 풀릴 때 첫째 날 공항→호텔→저녁, 마지막 날 체크아웃→공항이 자연스럽게 잡힌다. |
| **Self-Consistency** (선택) | 만다라트 핵심 목표 정제 | 모호한 입력("성장하기")이 들어오면 **여러 번 분해 → 공통점 추출** → 가장 합의된 안 채택. | 똑같은 입력을 두 번 눌러도 결과가 크게 흔들리지 않아 사용자가 신뢰감을 가진다. |
| **Constrained Decoding** | 시간 형식·날짜 형식 강제 | 출력 토큰을 정규식(`HH:MM`, `YYYY-MM-DD`) 안에서만 생성하도록 제약. | "오후 두 시반" → `14:30`으로 항상 정확히 들어옴. 사용자가 시간 수정 안 해도 됨. |
| **Streaming** | 주간 회고 생성 UI · 인사이트 인사말 | 응답을 한꺼번에 받지 않고 **토큰 단위로 흘려 보여줌**. | 5~8초 회고가 생성되는 동안 사용자가 빈 화면을 보지 않고, 글이 타이핑되듯 떠올라 체감 대기 시간이 절반으로. |
| **Context Summarization** | AI 인사이트 인사말 (앱 진입 시) | 최근 일정·todo·만다라트·일기 데이터를 짧은 컨텍스트로 압축 후, 그 위에서 한두 줄 코멘트를 생성. 매번 전체 데이터를 보내지 않아 비용·지연 최소화. | 앱을 열 때마다 "어제 못 끝낸 할일 2개 있어요. 오늘 오전에 끝낼까요?" 같은 **나만의 인사**가 떠 있어 시작이 부드럽다. |

#### 3.5.4 보조 알고리즘 (Non-LLM)
> "AI"라고 다 LLM은 아니다. 가벼운 처리는 규칙·간단 머신러닝으로 — 비용 0, 응답 즉시.

| 알고리즘 | 적용 기능 | 앱에서의 역할 | 사용자 효과 |
|----------|-----------|--------------|--------------|
| **Rule-based Heuristics** | 미완료 할일 자동 이전 | LLM 없이 규칙으로만 처리 — 어제 todo 중 `done=false`인 항목을 오늘 목록 맨 위에 "이월" 라벨과 함께 자동 추가 (`rolloverTodos` 로직). | 매일 아침 어제 못 끝낸 일이 오늘로 자연히 따라온다. 아무것도 안 해도 됨. |
| **임베딩 + 코사인 유사도** (선택) | 유사 일정·작업 추천 | 과거 일정·todo를 `text-embedding-3-small`로 벡터화해 저장. 새 입력이 들어오면 가장 가까운 과거 항목을 찾아 색상·시간대·소요 분을 제안. | "헬스" 입력하면 본인이 평소 쓰던 색·시간(예: 화/목 19:00, 60분)이 자동 채워진다. |
| **간단 통계 집계** | 10분 플래너 분석 · 주간 대시보드 | 작업별 셀 개수 × 10분 = 누적 시간 계산. 카테고리별 비율을 막대·도넛 차트로. | 한 주 끝에 "공부 12시간, 운동 3시간, SNS 8시간" 같은 객관적 사실이 즉시 보인다. |
| **EMA (지수가중이동평균)** (선택) | 습관 점수 · 만다라트 진행도 | 최근 7일에 더 큰 가중치를 두고 평균을 계산해 점수화. 옛날 잘했던 점수가 현재를 가리지 않게. | "이번 주 운동 점수 72점 (지난주 65)" 같은 추세가 한눈에. 동기부여가 즉각적. |
| **충돌 감지 규칙** | 일정 시간대 겹침 검사 | AI 또는 사용자가 일정 추가 시 같은 날짜·시간 범위 다른 이벤트와 겹치는지 즉시 검사. | 미팅 두 개를 같은 시간에 잡으면 화면에서 빨간 줄로 즉시 알려준다. |

#### 3.5.5 AI 기능 ↔ 적용 뷰 매핑

> 모든 AI 기능은 **`gpt-4o-mini` 단일 모델**로 동작 (§3.5.1 참조). 각 위치에서 적용하는 **기법**이 다를 뿐.

| 위치 | AI가 거드는 것 | 적용 기법 |
|----|------------------|-----------|
| **앱 진입 (홈 상단)** | ✨ **AI 인사이트 인사말** — 사용자의 최근 일정·todo·만다라트·일기 데이터를 보고 한두 줄 격려·요약·환기 코멘트 (예: "어제 못 끝낸 할일 2개, 오전에 정리해볼까요?" / "이번 주 운동 3회 채우셨어요. 한 번 더면 목표 달성!") | Context Summarization + Streaming |
| **연력** | 형광펜 라벨 자동 제안 ("여행", "프로젝트 마감 주간") | Few-shot Prompting |
| **달력 · 주력 · 일력** | 자연어로 일정 추가 ("다음 주 화요일 미팅 두 시") | Function Calling (Tool Use) |
| **10분 플래너** | 작업 자동 카테고리 분류 + 색상 제안 | Few-shot + Structured Output |
| **만다라트** | 핵심 목표 → 8 세부 + 64 실행 자동 분해 | Structured Output (JSON Schema) |
| **일기** | 무드 자동 태깅 (😊/😐/😢) · 한 주 감정 요약 | Few-shot Classification |
| **(주간) 회고** | 한 주 데이터 → 자연어 코멘트 + 다음 주 제안 | Chain-of-Thought + Streaming |

#### 3.5.6 비용·성능 가드레일
- **단일 모델**: `gpt-4o-mini` — 입력 $0.15 / 출력 $0.60 per 1M tokens (한 번 호출 평균 0.001~0.005달러 수준)
- **호출 빈도 예상**:
  - 인사이트 인사말: 앱 진입당 1회 (캐시되면 0회)
  - 자연어 일정 추가: 사용자 액션당 1회
  - 만다라트 분해: 드물게(주 1~2회 수준)
  - 주간 회고: 주 1회
- **캐싱 3단계**:
  1. **동일 입력**: localStorage 캐시 즉시 반환 — 비용 0
  2. **인사이트**: 1시간 이내 같은 사용자 데이터 → 캐시 재사용
  3. **회고/만다라트 결과**: Firestore에 7일 보관, 사용자가 다시 보기 가능
- **레이트 리밋**: 사용자당 분당 5회, 일당 50회 (예산 보호)
- **타임아웃**: 12초 — 초과 시 사용자에게 "다시 시도" 버튼 제공
- **토큰 절약**:
  - 인사이트 입력: 최근 7일 데이터만 요약(Context Summarization)
  - 시스템 프롬프트: 짧고 명확하게 유지
  - `max_tokens` 명시 (인사이트 80, 회고 400 등)
- **장애 대응**: 호출 실패 시 → 친절한 에러 안내 + 수동 입력 폴백 (인사이트는 정적 메시지로 대체)

#### 3.5.7 프롬프트 거버넌스
- 모든 시스템 프롬프트는 `lib/ai/prompts.ts`에 한 곳으로 모음
- 각 프롬프트마다 **버전 태그** 부여 (`mandala_v1`, `events_v2`)
- A/B 테스트 결과를 README에 누적 기록
- 한국어 출력만 허용 (영어 섞임 방지 규칙)
- AI는 **결과를 직접 저장하지 않는다 — 항상 사용자 미리보기 → 승인 필수**

---

## 4. 작업 파이프라인

> **아이디어 → 차별화 → 디자인 → 프론트엔드 → 백엔드/DB → 배포 → 시연** 까지의 전체 흐름.
> 각 단계마다 **목적 · 산출물 · 사용 도구 · 다음 단계로 넘어갈 체크포인트**를 정의한다.
> 4~5일 스프린트 안에 1~3단계는 압축, 4~7단계는 병렬로 진행한다.

### 4.1 단계별 흐름 (한눈에)

```
[1] 아이디어 수립
        │  (문제 정의 · 사용자 가설)
        ▼
[2] 차별화 전략 수립
        │  (코어 5개 + AI 보조 원칙)
        ▼
[3] 디자인 (UX → UI)
        │  (Figma Make 베이스 + 토큰 정리)
        ▼
[4] 프론트엔드 개발  ─┐
                      │  (병렬 진행)
[5] 백엔드 / DB 구축  ─┤
                      │
[6] AI 통합           ─┘
        ▼
[7] 통합 · QA · 최적화
        ▼
[8] 배포
        ▼
[9] 시연 · 발표 · 회고
```

### 4.2 단계별 상세

#### 1단계 — 아이디어 수립
- **목적**: "누구의 어떤 불편을 해결할 것인가"를 한 문장으로 정의.
- **활동**: 시중 플래너(굳이어플·모트모트·구글캘린더·Notion) 비교, 종이 다이어리의 시간 줌인 구조 발견, 타깃 사용자 가설 수립.
- **산출물**:
  - 한 줄 요약 — *"1년의 흐름부터 10분의 집중까지, 함께 채우는 AI 플래너"*
  - 1차 타깃: 자기계발·여행 계획 20–30대
- **도구**: Notion / 구글 닥스, 화이트보드, 사용자 인터뷰(가능하면 3명)
- **체크포인트**: 한 문장으로 컨셉 설명 가능? 비슷한 앱과 차별점이 있는가?

#### 2단계 — 차별화 전략 수립
- **목적**: 코어 자산 vs 보조 도구 명확히 분리. AI가 메인이 아니라 **거드는 보조** 원칙 합의.
- **활동**: 5가지 차별화 포인트 도출 (연력 1년 한눈에 · 10분 단위 시각화 · 연력↔10분 연결 · AI 인사이트 인사말 · AI 보조).
- **산출물**:
  - §1.3 차별화 포인트 5개
  - §3.5 AI 인공지능 스택 (모델·기법·뷰 매핑)
  - 시연 시나리오 초안
- **도구**: PROJECT_GUIDE.md, 팀 회의록
- **체크포인트**: "왜 우리 앱이 필요한가"에 30초 안에 답할 수 있는가?

#### 3단계 — 디자인 (UX → UI)
- **목적**: 머릿속 컨셉을 눈으로 검증할 수 있는 화면으로 만들기.
- **활동**:
  - **3-1. UX 설계**: 6개 뷰의 모바일 와이어프레임, 사용자 흐름(USER FLOW), 핵심 인터랙션 정의
  - **3-2. 디자인 토큰**: 색상(라이트/다크) · 타이포(Pretendard) · radius · shadow · 간격
  - **3-3. UI 시안**: Figma Make로 8개 화면 (오늘 / 캘린더 / 연력 / 주력 / 10분 / 만다라트 / 일기 / 설정) + AI 입력 모달, 인사이트 인사말 영역
  - **3-4. 라이트 + 다크 모드** 동시
- **산출물**: Figma 파일, `tokens.ts` 초안, 화면 캡처 8장, 인터랙션 노트
- **도구**: Figma / Figma Make, Pretendard
- **체크포인트**: 모바일 375px에서 모든 화면이 동작하는가? 토큰 변수만 바꿔도 다크/라이트 자동 전환되는가?

#### 4단계 — 프론트엔드 개발
- **목적**: Figma Make 코드를 워크스페이스로 가져와 동작하는 앱으로 다듬기.
- **활동**:
  - **4-1. 환경 셋업**: Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui, ESLint+Prettier, Pretendard 폰트
  - **4-2. 라우팅**: React Router v6로 6개 뷰 SPA 구성
  - **4-3. 디자인 토큰 적용**: `tokens.ts` + `theme.css` 라이트/다크
  - **4-4. 6개 뷰 구현**:
    - 연력(YearView) — 형광펜 드래그 선택
    - 10분 플래너(TenMinPlanner) — 그리드 페인팅
    - 일력(DayView) — 30분 타임그리드
    - 달력(MonthView) · 주력(WeekView) · 만다라트 · 일기
  - **4-5. 공통 컴포넌트**: TabBar, FAB, Sheet, Splash, Settings, AIInputSheet, AIPreview, **InsightGreeting**
  - **4-6. 모바일 반응형 + PWA 설정**: `manifest.json`, Service Worker, 홈화면 추가
- **산출물**: `src/` 코드 트리, `vite.config.ts`, `package.json`, PWA manifest
- **도구**: VS Code, Vite dev server, Chrome DevTools
- **체크포인트**: 6개 뷰가 폰에서 무난히 동작? 폰 홈에 설치 가능? 라이트/다크 토글 무리 없음?

#### 5단계 — 백엔드 / 사용자 인증 / DB 구축
- **목적**: 사용자 식별 + 개인 데이터 영속 + 공유 링크 + AI 키 보관소.
- **활동**:
  - **5-1. 로컬 저장 (게스트 모드)**: `eventStore.ts`로 localStorage 단일 진실 공급원 — 비로그인 상태에서도 앱이 즉시 동작
  - **5-2. 사용자 인증 (Firebase Auth)**:
    - 로그인 옵션: Google OAuth (1순위) · 이메일+비밀번호 (2순위) · 카카오 로그인 (선택, v2)
    - 회원가입 페이지: 이름·프로필 사진(선택)·약관 동의(개인정보·AI 데이터 사용)
    - 로그인 페이지: 소셜 버튼 + 이메일 로그인 폼
    - 비밀번호 재설정 (이메일 링크)
    - 로그아웃 / 회원 탈퇴 (계정 삭제 시 Firestore 데이터 함께 제거)
  - **5-3. 사용자 DB (Firestore `users/{uid}`)**:
    - User 프로필 + 환경설정 + 동의 시점 저장
    - 도메인 데이터(events·todos·highlights·mandala·diaries)는 모두 `users/{uid}/...` 서브컬렉션
    - 컬렉션 7개 설계 + 인덱스 정의
  - **5-4. 데이터 머지 흐름**: 비로그인으로 쌓인 localStorage 데이터를 로그인 시 Firestore로 자동 업로드 (로컬 우선 충돌 해결)
  - **5-5. Security Rules (`firestore.rules`)**: 본인 `uid`의 데이터만 read/write 허용 (백엔드 코드 0)
  - **5-6. 공유 링크**: 읽기 전용 스냅샷 → `shares/{shareId}` 컬렉션, QR 코드 생성
  - **5-7. AI 호출 백엔드 (Vercel Edge Functions)**:
    - `/api/ai/insight` — 인사이트 인사말 (사용자 데이터 컨텍스트 압축 포함)
    - `/api/ai/parse-event` — 자연어 → 일정
    - `/api/ai/mandala` — 만다라트 분해
    - `/api/ai/recap` — 주간 회고 (Streaming)
    - **API 키는 서버 환경변수에만 두고 클라이언트엔 절대 노출 X**
    - 호출 시 사용자 토큰(idToken) 검증 → 익명 호출 차단
- **산출물**: User 모델 정의, 로그인/회원가입/탈퇴 화면, Firestore 스키마 문서, `firestore.rules`, `/api/*` 함수 4개, `.env.local` 템플릿
- **도구**: Firebase 콘솔, Vercel CLI, Postman
- **체크포인트**: 비로그인 게스트도 앱 동작? 로그인하면 게스트 데이터가 자동 머지됨? 공유 링크는 보기 전용? AI 키가 빌드물에 노출 안 됨? 본인 외 다른 uid 데이터 접근 시도하면 권한 거부?

#### 6단계 — AI 통합 (4·5단계와 병렬)
- **목적**: §3.5 AI 스택을 실제로 동작하게 하기.
- **활동**:
  - **6-1. SDK 셋업**: `openai` (메인), 추후 `@anthropic-ai/sdk` (백업) — 본인 OpenAI 토큰 사용
  - **6-2. 프롬프트 작성** (`lib/ai/prompts.ts`): 인사이트 / 일정 분해 / 만다라트 / 회고 4종 + 버전 태그
  - **6-3. JSON 스키마 (`lib/ai/schemas.ts`)**: Zod로 응답 검증
  - **6-4. 호출 래퍼 (`lib/ai/client.ts`)**: 재시도 3회, 타임아웃 12초, 캐시 3단계
  - **6-5. UI 통합**: AIInputSheet → AIPreview → 사용자 승인 → store 반영
  - **6-6. Streaming**: 인사이트 인사말과 회고에 토큰 단위 출력 적용
- **산출물**: `lib/ai/*` 모듈, 프롬프트 템플릿 4종, 호출 로그 샘플
- **도구**: OpenAI Playground, Vercel logs, Zod
- **체크포인트**: 같은 입력을 두 번 보내면 캐시되어 비용 0인가? AI 결과가 항상 미리보기를 거쳐 저장되는가? Rate limit 걸리면 친절한 에러 안내가 뜨는가?

#### 7단계 — 통합 · QA · 최적화
- **목적**: 4·5·6단계 결과를 합쳐 끝까지 동작하는 한 흐름 만들기.
- **활동**:
  - **7-1. 사용자 시나리오 3개 끝까지 통과**: 여행 / 자기계발 / 회고
  - **7-2. 디바이스 점검**: 안드로이드 / iOS Safari / 데스크톱 Chrome
  - **7-3. 접근성 점검**: 키보드 탭 이동, 색 대비(WCAG AA), 폰트 크기
  - **7-4. 성능**: Lighthouse 점수, 번들 사이즈, Lazy load
  - **7-5. 에러 핸들링**: 네트워크 끊김 / AI 타임아웃 / Firestore 권한 거부
  - **7-6. 카피 & 마이크로 텍스트 다듬기**: 한국어만 사용, 친절한 톤
- **산출물**: QA 체크리스트, 버그 트래커, Lighthouse 리포트
- **도구**: Chrome DevTools, Lighthouse, BrowserStack(가능 시)
- **체크포인트**: 시연 시나리오 3개를 끊김 없이 시연 가능한가?

#### 8단계 — 배포
- **목적**: 발표장에서 누구나 URL/QR로 접속할 수 있게.
- **활동**:
  - **8-1. Vercel 프로젝트 연결**: `main` 브랜치 자동 배포
  - **8-2. 환경 변수 등록**: `OPENAI_API_KEY`, Firebase 설정 등 (대시보드에서만)
  - **8-3. 도메인**: 무료 `*.vercel.app` 또는 학교/팀 서브도메인
  - **8-4. PWA 설치 안내 페이지**: 모바일 사용자에게 "홈에 추가" 한 줄 안내
  - **8-5. QR 코드 인쇄**: 발표장에서 청중이 바로 접속
- **산출물**: 라이브 URL, QR 이미지, 배포 노트, 롤백 절차
- **도구**: Vercel, QR generator, 도메인 관리 콘솔
- **체크포인트**: 한 번의 git push로 자동 배포되는가? 폰 카메라로 QR 찍으면 3초 안에 앱이 뜨는가?

#### 9단계 — 시연 · 발표 · 회고
- **목적**: 4~5일의 결과를 명확한 메시지로 전달하고, 다음 버전 방향 정리.
- **활동**:
  - **9-1. 시연 대본**: 3분 안에 차별화 5개를 보여주는 동선
  - **9-2. 데모 데이터 사전 입력**: 빈 화면이 아니라 풍성한 일정·만다라트가 보이도록
  - **9-3. 발표 슬라이드**: §1 한 줄 요약 → §1.3 차별화 → §3.5 AI 스택 → 라이브 시연 → §8 시나리오 → 마무리
  - **9-4. 백업 플랜**: 인터넷 끊김 / Vercel 장애 / AI 응답 지연 — 각각 대응
  - **9-5. 팀 회고**: 잘된 점 / 막혔던 점 / v2에서 고칠 것
- **산출물**: 발표 슬라이드, 시연 동영상(녹화), 회고 문서
- **도구**: Keynote / 구글 슬라이드, OBS Studio(녹화)
- **체크포인트**: 청중에게 "이 앱이 다른 플래너와 뭐가 달라요?"를 30초 안에 보여줄 수 있는가?

### 4.3 일정 매핑 (4~5일 스프린트와 연결)

| Day | 단계 | 주요 작업 |
|-----|------|-----------|
| **D0 (사전)** | 1 · 2 | 아이디어 / 차별화 합의 — 본 가이드 작성 완료 |
| **D1** | 3 · 4 (셋업) | 디자인 토큰 정리 + 프론트 환경 셋업 + 라우팅 |
| **D2** | 4 · 6 | 6개 뷰 구현(병렬) + AI SDK 셋업 + 인사이트 인사말 MVP |
| **D3** | 5 · 6 | Firestore 셋업 + 자연어 일정 추가 + 만다라트 분해 |
| **D4** | 7 | 통합·QA·모바일·다크모드 마무리 |
| **D5** | 8 · 9 | 배포 + 데모 데이터 + 시연 리허설 + 슬라이드 |

### 4.4 단계 간 의존성 & 위험 신호

- **3단계(디자인)가 24h 이상 지연되면** → 4단계(프론트)는 기존 Figma Make 출력본으로 시작, 디자인 다듬기는 D4로 미룸.
- **5단계(Firebase)가 막히면** → 공유 링크는 v2로 미루고 localStorage 단독 운영. 데모 시나리오에서 공유 부분만 빼면 됨.
- **6단계(AI)가 막히면** → 인사이트 인사말은 정적 메시지로 폴백, 그 외 AI 기능은 비활성화 토글로 숨김. 코어(연력·10분)만으로도 차별화 성립.
- **8단계(배포)가 막히면** → 발표 PC에서 로컬 `npm run dev` 직접 시연. 단 무선 공유기 필수.

> **원칙**: AI 기능이 모두 빠져도 "1년 한눈에 + 10분 시각화 + 연결성" 코어는 살아남는다. 그래서 발표는 무조건 성립한다.

---

## 5. 사용 툴 정리

> 본 프로젝트에 실제로 사용한 도구·서비스·라이브러리를 한 곳에 모아 정리.
> 4~5일 스프린트 안에서 빠르게 결과를 내기 위해 **이미 검증된 무료/저비용 도구**를 우선 채택했다.

### 5.1 디자인 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| **Figma** | UI 시안 작성, 디자인 토큰 정의, 팀원 간 디자인 리뷰 | Pro 팀 워크스페이스 사용 (Dev Mode 활성화) |
| **Figma Make** | 자연어 프롬프트로 React+Tailwind 코드 자동 생성 → 본 프로젝트의 **베이스 코드 출처** | shadcn/ui 약 50개 컴포넌트 + 6개 뷰가 자동 스캐폴딩됨 |
| **Figma MCP 서버** | Claude(Cowork)가 Figma 파일을 직접 읽고 분석 | 디자인-기획 연결을 자동화 |
| **Pretendard** | 한글 본문/제목 단일 폰트 | jsDelivr CDN 호스팅, 무료 오픈 폰트 |
| **Lucide Icons** | 아이콘 세트 | shadcn/ui 기본, React 컴포넌트로 사용 |

### 5.2 AI · LLM 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| **Anthropic Claude** | **기획·문서 작성·코드 보조** — 본 가이드 작성, 차별화 전략 수립, 다이어리 뷰어(`guide.html`) 구현, 디자인 분석 등 프로젝트 전 과정의 사고 파트너 역할 | Cowork(데스크톱) 환경에서 사용 |
| **OpenAI `gpt-4o-mini`** | **앱 런타임의 AI 기능** — 인사이트 인사말, 자연어 일정 추가, 만다라트 분해, 주간 회고, 일기 무드 태깅, 형광펜 라벨 제안 | 비용 최적화를 위해 단일 모델 운영. §3.5 참조 |
| **OpenAI Playground** | 프롬프트 테스트, 파라미터 튜닝 | 배포 전 사전 검증 |
| **`text-embedding-3-small`** (선택) | 패턴 감지용 임베딩 (v2 후보) | 과거 todo·event 의미 검색 |

> **두 AI의 역할 분리가 명확함:**
> - **Claude** = 우리가(개발팀이) 만드는 과정에서 쓰는 도구 (기획·문서·코드 작성)
> - **OpenAI** = 사용자가 앱 안에서 만나는 도구 (런타임 AI 기능)

### 5.3 프론트엔드 라이브러리
| 라이브러리 | 용도 | 비고 |
|------------|------|------|
| **React 18** | UI 프레임워크 | Figma Make 기본 출력 |
| **TypeScript** | 정적 타입 검사 | strict mode |
| **Vite** | 빌드 도구 / dev server | 빠른 HMR, 최소 설정 |
| **Tailwind CSS** | 유틸리티 기반 스타일링 | 디자인 토큰과 함께 사용 |
| **shadcn/ui** | 사전 디자인된 React UI 컴포넌트 약 50개 (Button, Dialog, Sheet, Tabs, Calendar, Drawer 등) | Tailwind 기반, 코드를 직접 복사·수정 가능 |
| **Radix UI** | shadcn/ui의 내부 의존성 (접근성 + 키보드 이벤트) | 자동 포함 |
| **Lucide React** | 아이콘 라이브러리 | shadcn/ui와 짝 |
| **React Router v6** | SPA 라우팅 | 6개 뷰 전환 |
| **Recharts** | 차트 시각화 | 10분 플래너 분석, 회고 대시보드 |
| **clsx · tailwind-merge** | 조건부 className 결합 | shadcn/ui 표준 패턴 |
| **date-fns** | 날짜 유틸 (포맷·연산) | dayjs/moment 대체, 가벼움 |
| **Zod** | 런타임 스키마 검증 | LLM 응답 검증, 폼 검증 |
| **Zustand** (또는 React Context) | 가벼운 상태 관리 | `eventStore.ts` 패턴 |
| **Sonner** | 토스트 알림 | shadcn/ui 표준 |
| **Vite PWA Plugin** | PWA 매니페스트, Service Worker 자동 생성 | 모바일 홈화면 추가, 오프라인 |

### 5.4 백엔드 · 데이터 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| **Firebase Auth** | 로그인 / 회원가입 — Google OAuth, 이메일/비밀번호, (선택) 카카오 | 비로그인 게스트 → 로그인 시 자동 마이그레이션 |
| **Firebase Firestore** | 사용자별 데이터 영속 저장소 — 프로필, 일정, 할일, 만다라트, 일기, 공유 스냅샷 | 무료 티어로 시작, 보안 규칙으로 본인 데이터 접근 제한 |
| **Firebase Security Rules** | 본인 `uid`의 데이터만 read/write 허용 | 백엔드 코드 없이 권한 처리 |
| **Vercel Edge Functions** | AI API 키 보호용 서버리스 (4개 엔드포인트) | `/api/ai/insight`, `/parse-event`, `/mandala`, `/recap` |
| **Vercel** | 호스팅 + 자동 배포 + 환경변수 | main 푸시 시 자동 |
| **localStorage / sessionStorage** | 비로그인·오프라인 즉시 동작 + 캐시 | 로그인 시 Firestore와 자동 머지 |
| **OpenAI Node SDK (`openai`)** | LLM 호출 | TypeScript 타입 |

### 5.5 개발 환경 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| **VS Code** | 코드 에디터 | Source Control 내장으로 Git 작업도 |
| **Git + GitHub** | 버전 관리, 팀 협업 | `halee0426/KDT_webai_team_planner` |
| **GitHub Desktop** (선택) | GUI Git 클라이언트 | 명령어 부담될 때 |
| **ESLint** | 코드 품질 검사 | 협업 일관성 |
| **Prettier** | 코드 포맷터 | 자동 포맷 |
| **PostCSS** | Tailwind 프로세서 | Vite 통합 |
| **Chrome DevTools** | 디버깅, 네트워크, Lighthouse | 모바일 디바이스 에뮬레이션 |
| **Lighthouse** | 성능·접근성·PWA 점수 측정 | 배포 전 최종 점검 |

### 5.6 협업 · 운영 도구
| 도구 | 용도 | 비고 |
|------|------|------|
| **Notion / 구글 닥스** | 회의록·아이디어 정리 | 팀 커뮤니케이션 |
| **카카오톡 / Slack** | 실시간 소통 + 작업 잠금 공지 ("이 파일 만집니다") | 충돌 예방 |
| **Vercel Analytics** | 페이지 뷰·기기 통계 | 무료 |
| **QR Generator** | 발표 시 라이브 URL → QR 변환 | 청중 즉시 접속 |
| **OBS Studio** (선택) | 시연 영상 녹화 | 백업용 |

### 5.7 외부 CDN · 자원
| 자원 | 용도 |
|------|------|
| **jsDelivr** | Pretendard 폰트 호스팅 |
| **OpenAI API endpoint** | LLM 호출 (Edge Functions 경유) |
| **Firebase API** | Firestore + Auth |

### 5.8 향후 도입 검토
| 도구 | 도입 시점 | 용도 |
|------|-----------|------|
| **Sentry** | 베타 단계 이후 | 프로덕션 에러 모니터링 |
| **Anthropic SDK** | 사용자 베타 이후 | OpenAI 장애 시 폴백 모델 |
| **Playwright** | 안정화 단계 | E2E 테스트 자동화 |
| **i18n (react-i18next)** | 글로벌 확장 시 | 영문 출시 |

---

## 6. 파일 구조

### 6.1 전체 구조 (Figma Make 베이스 → 정리 후)
```
KDT_webai_team_planner/
├─ public/
│  └─ favicon.svg, manifest.json, icons/
├─ src/
│  ├─ App.tsx                       # 진입점 · 라우팅
│  ├─ main.tsx                      # ReactDOM mount
│  │
│  ├─ components/
│  │  ├─ views/                    # 6개 메인 뷰
│  │  │  ├─ DayView.tsx            # 일력 (30분 그리드 + 할일)
│  │  │  ├─ DailyFlipView.tsx      # 일일 플립 뷰 (선택)
│  │  │  ├─ MonthView.tsx          # 달력
│  │  │  ├─ WeekView.tsx           # 주력
│  │  │  ├─ YearView.tsx           # 연력 (형광펜)
│  │  │  ├─ TenMinPlanner.tsx      # 10분 플래너
│  │  │  ├─ MandalaView.tsx        # 만다라트
│  │  │  └─ DiaryView.tsx          # 일기
│  │  │
│  │  ├─ ai/                       # ⭐ 차별화 — 신규
│  │  │  ├─ AIInputSheet.tsx       # 자연어 입력 모달
│  │  │  ├─ AIPreview.tsx          # AI 결과 확인/수정 화면
│  │  │  └─ MandalaAIButton.tsx    # 만다라트 자동 분해 버튼
│  │  │
│  │  ├─ auth/                    # 🔑 사용자 인증 — 신규
│  │  │  ├─ LoginPage.tsx          # 로그인 (Google / 이메일)
│  │  │  ├─ SignupPage.tsx         # 회원가입 + 약관 동의
│  │  │  ├─ AccountMenu.tsx        # 프로필 드롭다운 (로그아웃·탈퇴)
│  │  │  ├─ ProtectedRoute.tsx     # 라우트 가드
│  │  │  └─ MergeOnLogin.tsx       # 게스트 → 로그인 데이터 머지
│  │  │
│  │  ├─ shared/                   # 공통 컴포넌트
│  │  │  ├─ TabBar.tsx             # 하단 탭바 (모바일)
│  │  │  ├─ FAB.tsx                # 플로팅 액션 버튼 (AI 진입점)
│  │  │  ├─ Sheet.tsx              # 바텀시트 래퍼
│  │  │  ├─ Splash.tsx             # 스플래시
│  │  │  ├─ PlanSelect.tsx         # 플랜 선택
│  │  │  ├─ Logo.tsx
│  │  │  └─ Settings.tsx           # 설정 패널 (프로필·환경설정·데이터 관리)
│  │  │
│  │  └─ ui/                       # shadcn/ui (자동 생성, 약 50개)
│  │     ├─ button.tsx, card.tsx, dialog.tsx, sheet.tsx, …
│  │
│  ├─ store/
│  │  ├─ userStore.ts              # 🔑 현재 사용자 · 로그인 상태 · 프로필
│  │  ├─ eventStore.ts             # 일정 · 할일 · 하이라이트 · 만다라트
│  │  ├─ themeStore.ts             # 테마 · 다크모드
│  │  └─ aiStore.ts                # AI 호출 큐 · 캐시
│  │
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ client.ts              # OpenAI SDK 래퍼 (재시도·캐싱·타임아웃)
│  │  │  ├─ prompts.ts             # 시스템 프롬프트 4종 + 버전 태그
│  │  │  ├─ schemas.ts             # Zod 스키마 (일정·만다라트·회고·인사이트)
│  │  │  └─ parser.ts              # 응답 파싱·검증
│  │  │
│  │  ├─ firebase/
│  │  │  ├─ client.ts              # Firebase 초기화 (Auth + Firestore)
│  │  │  ├─ share.ts               # 공유 링크 생성/조회
│  │  │  └─ auth.ts                # Firebase Auth (Google·이메일·카카오)
│  │  │
│  │  └─ utils/
│  │     ├─ date.ts                # fmtDate, parseDate, daysInMonth …
│  │     ├─ time.ts                # timeToSlot, slotToTime
│  │     └─ rollover.ts            # 미완료 할일 자동 이전
│  │
│  ├─ hooks/
│  │  ├─ useStore.ts               # 스토어 구독
│  │  ├─ useAI.ts                  # AI 호출 훅 (loading·error 관리)
│  │  ├─ useTheme.ts               # 라이트/다크 토글
│  │  └─ useShareLink.ts           # 공유 링크
│  │
│  ├─ styles/
│  │  ├─ globals.css               # 전역 + Pretendard
│  │  ├─ theme.css                 # 라이트/다크 변수
│  │  ├─ tokens.ts                 # 디자인 토큰 (색·폰트·간격)
│  │  ├─ tailwind.css
│  │  └─ fonts.css
│  │
│  └─ types/
│     ├─ event.ts                  # Event, Highlight, Todo 타입
│     ├─ mandala.ts                # MandalaCell
│     └─ ai.ts                     # AI 입출력 타입
│
├─ guidelines/
│  └─ Guidelines.md
├─ index.html
├─ package.json
├─ vite.config.ts
├─ postcss.config.mjs
├─ tsconfig.json
└─ README.md
```

### 6.2 핵심 파일 책임 정리
| 파일 | 책임 |
|------|------|
| `App.tsx` | 라우팅 · 전역 상태 부트스트랩 · 라이트/다크 테마 적용 |
| `userStore.ts` | 현재 로그인 사용자 · 인증 상태 · 프로필 |
| `eventStore.ts` | 도메인 데이터(events, highlights, todos, mandala, diaries) 단일 진실 공급원 |
| `lib/ai/client.ts` | OpenAI 호출 래퍼 · 재시도 3회 · 캐싱 3단계 · 타임아웃 12초 |
| `lib/ai/prompts.ts` | 시스템 프롬프트 4종 (인사이트·일정·만다라트·회고) + 버전 태그 |
| `lib/ai/schemas.ts` | Zod 스키마로 LLM 응답 검증 |
| `lib/firebase/auth.ts` | Firebase Auth — 로그인·회원가입·탈퇴·idToken 발급 |
| `lib/firebase/share.ts` | 읽기 전용 공유 링크 생성/조회 |
| `firestore.rules` | 본인 uid 데이터만 read/write 허용 |
| `tokens.ts` | 색·폰트·radius·shadow 디자인 토큰 |

---

## 7. 데이터 모델

> 모든 도메인 데이터는 **사용자 단위(uid)로 격리**되어 Firestore에 저장된다.
> 비로그인 사용자는 동일한 구조를 localStorage에 보관하다가, 로그인 시 자동으로 Firestore와 머지된다.

### 7.1 사용자 모델 (User)

```ts
type User = {
  uid: string;                       // Firebase Auth UID (PK)
  provider: 'google' | 'email' | 'kakao';
  email: string;
  displayName: string;
  photoURL?: string;                 // 프로필 사진 URL
  createdAt: number;                 // 가입 일시
  lastLoginAt: number;               // 마지막 접속
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: 'ko' | 'en';           // 기본 ko
    aiInsightEnabled: boolean;       // 인사이트 인사말 on/off
    weekStartsOn: 0 | 1;             // 0=일, 1=월
  };
  consent: {
    privacyAcceptedAt: number;       // 개인정보 동의
    aiDataUsageAcceptedAt?: number;  // AI에 데이터 전달 동의
  };
};
```

### 7.2 도메인 데이터 (User 하위)

```ts
type Event = {
  id: string;
  date: string;            // 'YYYY-MM-DD'
  title: string;
  color: string;           // hex
  startTime?: string;      // 'HH:MM' (없으면 종일)
  endTime?: string;
  createdBy: string;       // uid — 동기화·공유 시 식별용
};

type Highlight = {
  id: string;
  startDate: string;
  endDate: string;
  color: string;           // 6가지 형광펜 색
  label?: string;
};

type Todo = {
  id: string;
  text: string;
  done: boolean;
  rolledFrom?: string;     // 어제에서 이월된 경우 원본 날짜
  rolledId?: string;
};

type MandalaCell = string; // 81개 칸, index 0–80

type Diary = {
  date: string;
  text: string;
  mood?: '😊' | '😐' | '😢';   // 선택, AI 자동 분류 가능
};

type ShareLink = {
  id: string;
  ownerUid: string;
  scope: 'day' | 'week' | 'mandala';
  payload: any;            // 스냅샷
  expiresAt?: number;
};
```

### 7.3 Firestore 컬렉션 구조

```
firestore/
├─ users/{uid}                         # User 프로필
│   ├─ events/{eventId}                # Event[]
│   ├─ todos/{date}                    # Todo[] (날짜를 문서 ID로)
│   ├─ highlights/{highlightId}        # Highlight[]
│   ├─ mandala/{mandalaId}             # MandalaCell[81]
│   └─ diaries/{date}                  # Diary (날짜를 문서 ID로)
│
└─ shares/{shareId}                    # 읽기 전용 공유 스냅샷
    └─ { ownerUid, scope, payload, expiresAt }
```

### 7.4 Security Rules (요지)

```
match /users/{uid}/{collection}/{docId} {
  // 본인만 read·write
  allow read, write: if request.auth != null && request.auth.uid == uid;
}

match /shares/{shareId} {
  // 누구나 읽기 가능 (공유 링크), 쓰기는 소유자만
  allow read: if true;
  allow write: if request.auth != null
            && request.auth.uid == resource.data.ownerUid;
}
```

### 7.5 비로그인 ↔ 로그인 데이터 머지 정책

1. **비로그인 사용자**가 앱을 사용 → 모든 데이터는 localStorage에만
2. **로그인하면**:
   - localStorage 데이터를 읽어 Firestore의 `users/{uid}/...`에 업로드
   - 충돌 시 **로컬 데이터 우선** (사용자가 방금 만든 데이터)
   - 머지 완료 후 localStorage는 캐시로만 유지
3. **로그아웃하면**: 캐시는 비움, 새 게스트 세션 시작

---

## 8. AI 호출 흐름 (예시: 자연어 → 일정 추가)

```
[사용자]            [Frontend]      [Edge Function]      [OpenAI API]
   │                    │                 │                    │
   │ "제주 3박4일"       │                 │                    │
   │───────────────────▶│                 │                    │
   │                    │ idToken+text    │                    │
   │                    │────────────────▶│                    │
   │                    │                 │ 시스템 프롬프트     │
   │                    │                 │ + JSON Schema      │
   │                    │                 │ + 사용자 텍스트     │
   │                    │                 │───────────────────▶│
   │                    │                 │                    │
   │                    │                 │  tool_call:        │
   │                    │                 │  addEvents([...])  │
   │                    │                 │◀───────────────────│
   │                    │ JSON 결과       │                    │
   │                    │◀────────────────│ Zod 검증           │
   │  [확인/수정 화면]   │                 │                    │
   │◀───────────────────│                 │                    │
   │ "이대로 저장"       │                 │                    │
   │───────────────────▶│ store.addEvents()                    │
   │                    │ Firestore 동기화                      │
```

**핵심 포인트**:
- API 키는 Edge Function 환경변수에만 보관 (클라이언트 노출 X)
- `idToken` 검증으로 익명 호출 차단
- LLM 응답은 항상 Zod 스키마 검증 후 사용자 미리보기를 거쳐야 저장됨

### 시스템 프롬프트 예시 (일정 분해)
```
당신은 한국어 일정 분해 전문가입니다.
사용자의 자유 텍스트를 받아 addEvents(events: Event[]) 함수를
정확한 JSON 인자로 호출해야 합니다.

규칙:
1. 시작 날짜를 명시하지 않으면 오늘 + 1일을 기본값으로.
2. "3박 4일"은 4일치 events를 만든다.
3. 한 일자에 2~4개의 활동을 적절히 배치 (이동/식사/주요활동/휴식).
4. 시간은 09:00–22:00 사이에서 자연스럽게.
5. 지명·활동을 짧고 명확하게(예: "한라산 등반", "흑돼지 점심").
```

---

## 9. 팀원 작업 분담 제안

> 4명 기준 예시. 실제 팀에 맞게 조정.

| 역할 | 담당 영역 | 주요 산출물 |
|------|----------|-------------|
| **A. 프론트 리드** | App 셸·라우팅·디자인 토큰·6개 뷰 통합·PWA 설정 | `App.tsx`, `tokens.ts`, `vite.config.ts`, 6개 뷰 통합 |
| **B. UI/UX** | shadcn 커스터마이즈·모바일 반응형·다크모드·인사이트 인사말 UI | `components/shared/*`, `InsightGreeting.tsx`, 모바일 레이아웃 |
| **C. AI 엔지니어** | OpenAI 통합·프롬프트 4종·Zod 스키마·미리보기 UI·Streaming | `lib/ai/*`, `AIInputSheet.tsx`, `AIPreview.tsx`, Edge Functions |
| **D. 백엔드/인증/배포** | Firebase Auth(로그인·회원가입·탈퇴)·Firestore 스키마·공유 링크·Vercel 배포 | `components/auth/*`, `lib/firebase/*`, `firestore.rules`, `userStore.ts` |

### 협업 규칙
- 브랜치: `main` (배포) / `dev` (통합) / `feat/*` (개인 작업)
- PR: 최소 1명 리뷰 후 머지
- 일일 스탠드업: 10분 (어제·오늘·블로커)
- 커밋 메시지: `[영역] 내용` — 예: `[ai] 만다라트 분해 프롬프트 추가`

### 페어링·블로커
- C가 만든 Edge Function 인터페이스가 결정되면 → A·B는 그걸 호출하는 UI를 병렬로
- D가 Firestore 스키마 확정 → 나머지 셋이 데이터 모델을 동시에 사용
- 블로커 발생 시 즉시 채팅 공유 — "이 PR 누가 좀 봐줘"

---

## 10. 차별화 시연 시나리오 (발표용)

### 시나리오 1 — 여행 (일반 사용자 어필)
1. 앱 실행 → 빈 캘린더
2. FAB ✨ 탭 → "다음 주 부산 2박 3일 가족 여행, 첫날 해운대"
3. 3초 후 일정 9개 자동 생성 → 미리보기
4. "그대로 저장" → 캘린더에 컬러풀하게 채워짐
5. 공유 링크 생성 → QR 코드로 부모님께 전송 시연

### 시나리오 2 — 자기계발 (차별화 어필)
1. 만다라트 진입 → "TOEIC 900점" 입력
2. ✨ AI 분해 → 81칸 자동 채움 (단어/문법/리스닝/모의고사/…)
3. 셀 하나 탭해서 수정 가능 보여줌
4. 실행 셀 중 하나를 일정으로 드래그 → 일력에 추가됨

### 시나리오 3 — 회고 (만족도 어필)
1. 한 주 후 일요일에 "주간 회고" 자동 생성
2. AI가 "이번 주 운동 3회 완료, 독서는 1회만 — 다음 주 시간 재배치 제안"
3. 사용자 확인 → 다음 주 일정 자동 조정

---

## 11. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| AI 응답 시간 (1~3초, 회고 5~8초) | 로딩 스켈레톤 · "AI가 일정 짜는 중" 애니메이션 · Streaming UI |
| AI 응답 부정확 | 항상 미리보기 → 사용자 수정 후 저장. Zod 스키마 검증으로 형식 깨진 응답 즉시 재시도 |
| **AI 비용 초과** | gpt-4o-mini 단일화 · localStorage 캐싱 3단계 · 사용자당 분당 5회 / 일당 50회 레이트 리밋 |
| **AI 키 노출** | Vercel Edge Functions 경유로만 호출, 클라이언트 빌드물에 키 포함 X |
| **Firebase 무료 한도** (Spark plan) | 일일 50K 읽기 · 20K 쓰기 한도. 발표 데모 한정 사용, 사용량 모니터링 필수 |
| **사용자 데이터 보안** | Security Rules로 본인 uid만 read/write · idToken 검증으로 익명 호출 차단 · 약관 동의 시점 기록 |
| **Figma Make 코드 통합 난이도** | D1에 1명이 풀타임으로 환경 셋업 전담 |
| **4~5일 타이트** | 폴백 우선순위: 만다라트 분해 > 자연어 일정 > 인사이트 인사말 > 회고. 막히면 위에서부터 v2로 |
| **API 키 도용 / API 키 만료** | OpenAI 대시보드에서 사용량 알림 설정 + 비상 시 키 회전 매뉴얼 |
| **공유 링크 악용** | 만료 시간 필수 (기본 30일), payload는 스냅샷이라 원본과 격리 |

---

## 12. 참고 자료

- **OpenAI API** (런타임 LLM): https://platform.openai.com/docs
- **Anthropic Claude** (개발 보조용): https://docs.claude.com
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com
- **Firebase Auth**: https://firebase.google.com/docs/auth
- **Firebase Firestore**: https://firebase.google.com/docs/firestore
- **Vercel Edge Functions**: https://vercel.com/docs/functions
- **Vite PWA**: https://vite-pwa-org.netlify.app
- **Pretendard**: https://github.com/orioncactus/pretendard
- **React Router v6**: https://reactrouter.com
- **Zustand**: https://zustand-demo.pmnd.rs
- **Zod**: https://zod.dev
- **Recharts**: https://recharts.org
- **date-fns**: https://date-fns.org

---

## 부록 A. D1 즉시 시작 가이드

### A.1 저장소 클론 + 환경 셋업

```bash
# 1) 저장소 클론
git clone https://github.com/halee0426/KDT_webai_team_planner.git
cd KDT_webai_team_planner

# 2) 새 Vite + React + TS 프로젝트로 초기화 (기존 코드 위에 덧입힘)
npm create vite@latest . -- --template react-ts

# 3) 핵심 의존성 설치
npm install \
  react-router-dom \
  zustand \
  zod \
  date-fns \
  recharts \
  clsx tailwind-merge \
  lucide-react \
  sonner

# 4) Tailwind + PostCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 5) PWA
npm install -D vite-plugin-pwa

# 6) Firebase + OpenAI
npm install firebase openai

# 7) shadcn/ui 초기화 (CLI가 components/ui 자동 생성)
npx shadcn@latest init
# 그 후 필요한 컴포넌트만 개별 추가:
npx shadcn@latest add button card dialog sheet tabs drawer toast input textarea select switch
```

### A.2 환경 변수 (`.env.local`)

> **절대 깃에 커밋 X.** `.gitignore`에 이미 `.env*` 등록됨.

```
# OpenAI
OPENAI_API_KEY=sk-...

# Firebase (콘솔의 프로젝트 설정에서 복사)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### A.3 첫 커밋 전 체크리스트

- [ ] `.env.local` 작성됐는가
- [ ] `npm run dev` 가 5173 포트에서 뜨는가
- [ ] Pretendard 폰트가 화면에 적용되었는가
- [ ] `tokens.ts`에 라이트/다크 변수가 정의됐는가
- [ ] React Router로 라우트 6개가 매핑됐는가

### A.4 D1 종료 시점에 있어야 할 것

- 라우팅 동작하는 빈 셸 (오늘/캘린더/연력/주력/10분/만다라트/일기)
- 하단 탭바 + FAB
- 디자인 토큰 + 라이트/다크 토글
- `src/lib/firebase/client.ts` 초기화만 (실제 호출은 D3)
- `src/lib/ai/client.ts` 빈 함수 시그니처 (구현은 D2)
- localStorage 기반 `eventStore.ts` (D2에 useStore 연결)

### A.5 팀 공유 슬랙 메시지 템플릿

```
🚀 KDT 플래너 D1 작업 시작합니다

[저장소] https://github.com/halee0426/KDT_webai_team_planner
[가이드] guide.html (브라우저에서 열어주세요)
[브랜치 규칙] feat/<영역>-<짧은이름> · main 직접 푸시 X · PR 1명 리뷰

오늘 합의한 작업 분담:
- A: 환경 셋업 + 라우팅 + 디자인 토큰
- B: 모바일 레이아웃 + shadcn 커스터마이즈
- C: OpenAI SDK + Edge Functions 스켈레톤
- D: Firebase 콘솔 셋업 + Auth 화면

질문/블로커 → 채팅 즉시. 18시 스탠드업 10분.
```

---

> 본 문서는 팀원 공유용 가이드라인입니다. 변경 사항은 PR로 제안하세요.
