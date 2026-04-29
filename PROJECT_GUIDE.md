# 웹기반 AI 플래너 — 팀 프로젝트 가이드

> KDT WebAI Team Planner · 2026.04 · v1.0

---

## 📌 한 줄 요약

**"AI가 같이 짜주는 일정·목표·회고 통합 플래너."**
여행이든 자기계발이든, 자연어 한 줄이면 AI가 일정과 목표를 분해해 채워주는 모바일 우선 웹앱.

---

## 1. 프로젝트 개요

### 1.1 배경
- 시중 플래너 앱은 **"입력은 사람이, AI는 부가 기능"** 인 경우가 대부분.
- 여행 계획·자기계발·운동 루틴처럼 **목표를 일정으로 분해하는 일**이 가장 귀찮은 부분.
- 우리는 이 "분해" 단계를 AI가 대신 해주는 플래너를 만든다.

### 1.2 타깃 사용자
- 1차: 여행 계획·자기계발 목표를 가진 20–30대
- 2차: 학습/공부 루틴을 짜는 학생, 직장인 회고 사용자

### 1.3 차별화 포인트 (3가지)
| 구분 | 내용 |
|------|------|
| 🌟 **AI 자연어 입력** | "제주 3박 4일 일정 짜줘" / "토익 900점 분해해줘" → 실제 일정·만다라트로 자동 변환 |
| 🎯 **만다라트 자동 분해** | 81칸 만다라트를 AI가 채워줌. 목표 → 8개 세부 → 64개 실행 |
| ⏱️ **10분 단위 시각화** | 18시간 × 6칸(10분) = 108칸 그리드를 색칠해서 시간 사용 직관적으로 분석 |

### 1.4 일정 (4~5일 스프린트)
| Day | 작업 |
|-----|------|
| D1 | 환경 셋업 · 기존 Figma Make 코드를 워크스페이스로 가져오기 · 라우팅 구성 |
| D2 | AI 자연어 입력 → 일정 자동 추가 MVP |
| D3 | AI 만다라트 자동 분해 + 회고 요약 |
| D4 | 공유 링크(Firebase) · UI 다듬기 · 모바일 반응형 |
| D5 | 데모 시나리오 · 발표자료 · 배포(Vercel) |

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
| **로컬 저장** | localStorage (`eventStore.ts`) | 개인 데이터 즉시 보존 · 백엔드 의존 0 |
| **클라우드 저장** | Firebase Firestore | 백엔드 코드 0줄 · 무료 티어 충분 · 실시간 동기화 |
| **인증** | Firebase Auth (Google OAuth) | 공유 링크 기능에 필요 |
| **호스팅 / 배포** | Vercel | git push만으로 자동 배포 · 발표 시 URL 공유 용이 |
| **AI 호출** | Anthropic Claude API · OpenAI API | 자연어 → 구조화 JSON 변환 (Function Calling) |
| **CDN** | jsDelivr | Pretendard 폰트 등 정적 자원 |

### 3.3 머신러닝 / AI 기법
| 기법 | 적용 위치 | 설명 |
|------|------------|------|
| **LLM 자연어 이해 (NLU)** | AI 자연어 입력 | Claude Sonnet 4.5 / GPT-4o-mini로 사용자 텍스트 → 의도 분류 |
| **Function Calling / Tool Use** | 일정 자동 추가 | LLM이 `addEvent(date, title, time)` 같은 함수 인자를 JSON으로 출력 → 그대로 store에 저장 |
| **Structured Output (JSON Schema)** | 만다라트 분해 | 81개 셀을 정해진 스키마로 강제 → 파싱 안정성 확보 |
| **Few-shot Prompting** | 만다라트 · 회고 | 좋은 예시 2~3개를 시스템 프롬프트에 포함 → 출력 품질↑ |
| **Chain-of-Thought** | 복잡한 일정 분해 | "단계적으로 생각하라" 지시 → 다중 일자 일정의 일관성↑ |
| **Retrieval (선택)** | 패턴 분석 | 과거 todo·event 임베딩(예: `text-embedding-3-small`) → 유사 패턴 검색 |
| **Rule-based Heuristics** | 미완료 자동 이전 | LLM 없이 규칙만으로 처리 (`store.rolloverTodos`) |
| **Sentiment Tagging (선택)** | 일기 무드 자동 라벨링 | 일기 텍스트 → 😊/😐/😢 자동 분류 (Claude Haiku로 비용↓) |

> **비용 최적화 전략**
> - 메인 분해 작업: Claude Sonnet 4.5 (품질 우선)
> - 가벼운 분류·요약: Claude Haiku 4.5 또는 GPT-4o-mini (비용 1/10)
> - 자주 호출되는 결과: localStorage 캐싱

### 3.4 개발 도구
- **버전 관리**: Git + GitHub
- **에디터**: VS Code
- **린트/포맷**: ESLint + Prettier
- **타입 체크**: TypeScript strict mode
- **로컬 서버**: Vite dev server (port 5173)

---

## 4. 파일 구조

### 4.1 전체 구조 (Figma Make 베이스 → 정리 후)
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
│  │  ├─ shared/                   # 공통 컴포넌트
│  │  │  ├─ TabBar.tsx             # 하단 탭바 (모바일)
│  │  │  ├─ FAB.tsx                # 플로팅 액션 버튼 (AI 진입점)
│  │  │  ├─ Sheet.tsx              # 바텀시트 래퍼
│  │  │  ├─ Splash.tsx             # 스플래시
│  │  │  ├─ PlanSelect.tsx         # 플랜 선택
│  │  │  ├─ Logo.tsx
│  │  │  └─ Settings.tsx           # 설정 패널
│  │  │
│  │  └─ ui/                       # shadcn/ui (자동 생성, 약 50개)
│  │     ├─ button.tsx, card.tsx, dialog.tsx, sheet.tsx, …
│  │
│  ├─ store/
│  │  ├─ eventStore.ts             # 일정 · 할일 · 하이라이트 · 만다라트
│  │  ├─ themeStore.ts             # 테마 · 다크모드
│  │  └─ aiStore.ts                # AI 호출 큐 · 캐시
│  │
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ client.ts              # Claude/OpenAI SDK 래퍼
│  │  │  ├─ prompts.ts             # 시스템 프롬프트 모음
│  │  │  ├─ schemas.ts             # JSON Schema (일정/만다라트/회고)
│  │  │  └─ parser.ts              # 응답 파싱·검증
│  │  │
│  │  ├─ firebase/
│  │  │  ├─ client.ts              # Firestore 초기화
│  │  │  ├─ share.ts               # 공유 링크 생성/조회
│  │  │  └─ auth.ts                # Google OAuth
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

### 4.2 핵심 파일 책임 정리
| 파일 | 책임 |
|------|------|
| `App.tsx` | 라우팅 · 전역 상태 부트스트랩 |
| `eventStore.ts` | 모든 도메인 데이터(events, highlights, todos, mandala, diaries) 단일 진실 공급원 |
| `lib/ai/client.ts` | Claude/OpenAI 호출 · 재시도 · 캐싱 |
| `lib/ai/prompts.ts` | 시스템 프롬프트 모음 (일정 분해·만다라트·회고) |
| `lib/ai/schemas.ts` | LLM 응답 JSON Schema → Zod 검증 |
| `lib/firebase/share.ts` | 읽기 전용 공유 링크 생성 |
| `tokens.ts` | 색·폰트·radius·shadow 디자인 토큰 |

---

## 5. 데이터 모델

```ts
type Event = {
  id: string;
  date: string;            // 'YYYY-MM-DD'
  title: string;
  color: string;           // hex
  startTime?: string;      // 'HH:MM' (없으면 종일)
  endTime?: string;
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

---

## 6. AI 호출 흐름 (예시: 자연어 → 일정 추가)

```
[사용자]                        [Frontend]                        [Claude API]
   │                               │                                   │
   │ "제주 3박4일 일정 짜줘"        │                                   │
   │──────────────────────────────▶│                                   │
   │                               │ 시스템 프롬프트 + JSON Schema +    │
   │                               │ 사용자 텍스트                       │
   │                               │──────────────────────────────────▶│
   │                               │                                   │
   │                               │              tool_use:            │
   │                               │  addEvents([{date:..., title:...},│
   │                               │              {date:..., title:...}│
   │                               │              ...])                │
   │                               │◀──────────────────────────────────│
   │                               │ Zod 검증 → 미리보기 렌더           │
   │      [확인/수정 화면]          │                                   │
   │◀──────────────────────────────│                                   │
   │  "이대로 저장"                 │                                   │
   │──────────────────────────────▶│ store.addEvents(...)              │
   │                               │ Firestore 동기화                   │
```

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

## 7. 팀원 작업 분담 제안

> 인원수 모르는 상태이므로 4명 기준 예시. 실제 팀에 맞게 조정.

| 역할 | 담당 영역 | 주요 산출물 |
|------|----------|-------------|
| **A. 프론트 리드** | App 셸 · 라우팅 · 디자인 토큰 · 6개 뷰 통합 | `App.tsx`, `tokens.ts`, 뷰 통합 |
| **B. UI/UX** | shadcn 커스터마이즈 · 모바일 반응형 · 다크모드 | `components/shared/*`, 모바일 레이아웃 |
| **C. AI 엔지니어** | Claude/OpenAI 통합 · 프롬프트 · 스키마 · 미리보기 | `lib/ai/*`, `AIInputSheet.tsx`, `AIPreview.tsx` |
| **D. 백엔드/배포** | Firebase 셋업 · 공유 링크 · 인증 · Vercel 배포 | `lib/firebase/*`, 배포 파이프라인 |

### 협업 규칙
- 브랜치: `main` (배포) / `dev` (통합) / `feat/*` (개인 작업)
- PR: 최소 1명 리뷰 후 머지
- 일일 스탠드업: 10분 (어제·오늘·블로커)
- 커밋 메시지: `[영역] 내용` — 예: `[ai] 만다라트 분해 프롬프트 추가`

---

## 8. 차별화 시연 시나리오 (발표용)

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

## 9. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| AI 응답 시간 (4~8초) | 로딩 스켈레톤 · "AI가 일정 짜는 중" 애니메이션 |
| AI 응답 부정확 | 항상 미리보기 → 사용자가 수정 후 저장 |
| API 비용 | Haiku 모델 활용 + localStorage 캐싱 + 무료 티어 |
| Firebase 무료 한도 초과 | 발표 데모 한정 사용, 일반 공개는 v2 |
| Figma Make 코드 통합 난이도 | D1에 1명이 풀타임으로 환경 셋업 전담 |
| 4~5일 타이트 | 차별화 기능 1~2개에만 집중, 나머지는 v2로 |

---

## 10. 참고 자료

- Anthropic Claude API: https://docs.claude.com
- OpenAI API: https://platform.openai.com/docs
- shadcn/ui: https://ui.shadcn.com
- Firebase Firestore: https://firebase.google.com/docs/firestore
- Vite PWA: https://vite-pwa-org.netlify.app
- Pretendard: https://github.com/orioncactus/pretendard

---

> 본 문서는 팀원 공유용 가이드라인입니다. 변경 사항은 PR로 제안하세요.
