# Haru:on (하루온) — 프로젝트 가이드

> **AI 멀티 에이전트로 일정·할일·목표를 함께 설계하는 협업형 캘린더 PWA**

KDT WebAI 팀 프로젝트 · 2026-05 기준 최종본

---

## 📌 한 줄 요약

> "일정·할일·만다라트를 한 앱에서 관리하고, 친구·가족·팀과 그룹 단위로 협업하며, AI 멀티 에이전트가 자연어 입력을 일정 초안·할일 분해·목표 분해로 변환해 미리보기로 제공한다."

---

## 1. 프로젝트 개요

### 1.1 배경

기존 캘린더 앱은 일정 입력에만 충실하고 "할일·목표·회고"를 통합한 자기관리 흐름이 약하다. 또한 친구·연인·팀 단위 협업 캘린더는 별도 앱(가족 캘린더, 협업툴)으로 흩어져 있다. **하루온**은 한 앱 안에서 개인·그룹 모드를 자유롭게 전환하고, AI 가 자연어를 받아 즉시 실행 가능한 초안을 만들어 사용자가 검토 후 확정하는 흐름을 제공한다.

### 1.2 타깃 사용자

- 자기관리에 진심인 학생·직장인 (개인 모드)
- 연인·가족·동아리 등 작은 그룹 단위로 일정을 공유하려는 사용자 (그룹 모드)
- "타이핑 한 줄로 일주일 일정을 짜주는" 경험을 원하는 사용자 (AI 챗봇)

### 1.3 차별화 포인트

- **다중 그룹 협업** — 한 계정 안에서 연인/친구/가족 등 여러 그룹을 동시에 운영
- **AI 멀티 에이전트** — 단일 LLM 호출이 아니라 Orchestrator + Specialist 7종이 협력
- **항상 미리보기 → 사용자 승인** — AI 가 임의로 데이터를 저장하지 않음
- **6가지 뷰 통합** — 연력 / 월력 / 일력 / 10분 플래너 / 만다라트 / 일기
- **공휴일 자동 표시** — 공공데이터포털 API 연동
- **PWA + 모바일 우선** — 홈 화면 추가 시 네이티브 앱 같은 경험

### 1.4 일정 (4~5일 스프린트 기준)

| Day | 큰 그림 |
|-----|---------|
| D1 | 환경 셋업 + 6개 뷰 통합 + 디자인 토큰 |
| D2 | Firebase Auth + 로그인 UI + sharedEvents 동기화 |
| D3 | 그룹 모델 + 멤버 초대 + 그룹 데이터 동기화 |
| D4 | AI 멀티 에이전트 + 챗봇 통합 + 공휴일 |
| D5 | 통합 QA + Vercel 배포 + 시연 |

---

## 2. 핵심 기능 명세

### 2.1 6가지 뷰

| 뷰 | 컴포넌트 | 핵심 인터랙션 |
|----|---------|--------------|
| **연력** (Year) | `YearView.tsx` | 1년 전체, 월별 형광펜 plan, 미니 캘린더 |
| **월력** (Month) | `MonthView.tsx` | 월간 일정 + 멀티데이 막대 + 공휴일 + 검색 |
| **일력** (Day) | `DailyFlipView.tsx` | 30분 단위 타임그리드, 드래그로 시간 이동 |
| **10분 플래너** | `TenMinPlanner.tsx` | 18×6 그리드 색칠로 시간 분석 |
| **만다라트** | `MandalaView.tsx` | 9×9 목표 분해, 초기화 인라인 confirm |
| **일기** | `DiaryView.tsx` | 날짜별 텍스트 일기, 자동 저장 |

### 2.2 그룹 협업 (다중 그룹)

| 기능 | 설명 |
|------|------|
| **다중 그룹** | 한 계정에서 그룹 N개 운영 (멤버 최대 10명) |
| **6자리 초대 코드** | `XXXXXX` 형식, 카톡으로 공유 |
| **이메일 초대** | 가입 안 한 이메일도 초대 가능, 가입 시 자동 합류 |
| **실시간 동기화** | onSnapshot 기반, 800ms debounce 저장 |
| **멤버 썸네일** | Google 프로필 사진 또는 이니셜 폴백 |
| **owner 권한** | 그룹 이름 변경, 삭제, 멤버 강제 진행 |
| **자동 정리** | 그룹 삭제 시 다른 멤버의 stale 인덱스 자동 정리 |

### 2.3 AI 차별화 — 멀티 에이전트

| Agent | 역할 |
|-------|------|
| **Orchestrator** | 사용자 입력 분류 + 어떤 specialist 부를지 결정 |
| **Context Agent** | raw 데이터를 specialist 가 쓰기 좋은 요약으로 변환 |
| **Schedule Parser** | 자연어 → 일정 초안 (`events: ScheduleEventDraft[]`) |
| **Task Breakdown** | 큰 작업 → 실행 가능한 할일 초안 |
| **Goal/Mandala** | 목표 → 9×9 만다라트 초안 |
| **Conflict Agent** | 충돌·중복·과부하 검사 + 대안 제안 |
| **Response Composer** | 모든 결과 → 사용자용 짧은 한국어 preview 응답 |

모든 agent 는 GPT-4o-mini · JSON 모드 · 직접 DB 접근 X · 결과는 항상 preview.

### 2.4 보안 / 데이터

- **Firebase Authentication** — Google OAuth + Email/Password
- **Firestore Security Rules** — 본인 데이터만 read/write, 그룹은 멤버만, 6자리 코드 가입 케이스는 update 분기로 허용
- **localStorage 캐시** — 게스트 모드 대응 + 빠른 첫 페인트
- **로그아웃 시 캐시 정리** — `kdt-shared-events` 자동 삭제

---

## 3. UX / UI 디자인

### 3.1 디자인 철학

- **Apple HIG + iOS 캘린더 영감** — 익숙한 모바일 인터랙션, 학습비용 최소
- **모바일 우선** — 430px 기준 설계 (iPhone 14 Pro Max), 데스크탑은 가운데 정렬
- **컨텐츠 중심** — 장식 요소 최소화, 일정·할일·목표가 주인공
- **부담 없는 톤** — "등록했습니다" 대신 "잡아봤어요" 같은 친근한 한국어
- **AI 결과는 항상 미리보기** — 사용자가 통제권을 가짐
- **점진적 정보 노출** — 헤더는 깔끔, 디테일은 시트/모달에서

### 3.2 컬러 시스템

#### Accent (사용자 선택 가능)

```ts
// src/components/tokens.ts
export const accents = {
  mint:   "#1ec4b3",  // 기본 — 차분하고 활기 있음
  blue:   "#0066cc",
  purple: "#AF52DE",
  pink:   "#FF2D55",
  orange: "#FF9500",
  green:  "#34C759",
};
```

설정 → "테마 색상" 에서 6개 중 선택. accent 색은 **버튼·강조 텍스트·활성 탭·그룹 캐릭터** 에 일관 적용.

#### Highlight (일정 색상 — 형광펜 톤)

```ts
export const highlights = [
  { key: "red",    color: "rgba(255,59,48,0.38)" },
  { key: "orange", color: "rgba(255,149,0,0.42)" },
  { key: "yellow", color: "rgba(255,204,0,0.5)"  },
  { key: "green",  color: "rgba(52,199,89,0.38)" },
  { key: "blue",   color: "rgba(0,122,255,0.32)" },
  { key: "purple", color: "rgba(175,82,222,0.38)"},
];
```

**rgba 의 의도된 투명도** — 종이 위 형광펜처럼 부드럽게. 짙은 단색 X.

#### CSS 변수 (라이트 / 다크 모드 전환)

```css
--bg-primary       /* 메인 배경 */
--bg-secondary     /* 섹션 배경 */
--bg-elevated      /* 카드 / 시트 표면 */
--bg-tertiary      /* 토글 / 입력 배경 */
--text-primary     /* 본문 */
--text-secondary   /* 보조 */
--text-muted       /* 가장 약한 텍스트 */
--hairline         /* 0.5px 구분선 */
```

### 3.3 타이포그래피 스케일

폰트: **Pretendard** (한글 가독성 + 숫자 균형)

```ts
// src/styles/typography.ts — 모든 컴포넌트가 import
TYPE.titlePage     // 32 / 800 / -1.0px   — 페이지 메인 타이틀
TYPE.titleMonth    // 32 / 800 / -1.0px   — "5월" 같은 큰 월 표시
TYPE.titleSection  // 17 / 700 / -0.4px   — "오늘의 일정"
TYPE.titleCard     // 14 / 600 / -0.2px   — 카드 제목
TYPE.captionMeta   // 12 / 500 / -0.2px   — 부제 ("2026", "수요일")
TYPE.captionCount  // 11 / 700 / -0.1px   — "3개", "N명"
TYPE.body          // 15 / 400 / -0.3px   — 본문
TYPE.bodySmall     // 13 / 400 / -0.2px   — 보조
TYPE.pillTiny      //  9 / 600 / -0.1px   — 셀 안 일정 알약
TYPE.tabLabel      // 13 / 600 / -0.2px   — 캘린더 스코프 탭
```

원칙:
- **위계가 명확한 4단계**: titlePage(32) → titleSection(17) → body(15) → caption(11~13)
- **letter-spacing 음수**: 한글 + 영문 혼용 시 답답함 제거
- **font-weight 700~800**: 모바일 화면 대비 가독성 ↑

### 3.4 레이아웃 + 간격

- **모바일 frame**: 가로 430px 기준, safe-area-top/bottom 보정
- **좌우 padding**: 16px (콘텐츠) / 20px (시트 헤더)
- **카드 radius**: 14~16px (큰 카드) / 12px (시트 안 항목) / 999px (알약·아바타)
- **카드 그림자**: `0 1px 3px rgba(0,0,0,0.08)` (가벼움) / `0 10px 30px rgba(0,0,0,0.15)` (드롭다운)
- **셀 사이 hairline**: `0.5px solid var(--hairline)` (1px 선보다 섬세)

### 3.5 인터랙션 패턴

| 패턴 | 설명 | 사용처 |
|------|------|--------|
| **Sheet (Bottom Sheet)** | 화면 아래에서 슬라이드 업, `rounded-t-3xl` + 핸들바 | 그룹 시트, 신규 일정, 인증 모달 |
| **인라인 confirm** | `window.confirm` 대신 같은 자리에 인라인 카드로 확인 | 만다라트 초기화, 그룹 삭제 |
| **active:scale-95** | 탭 시 살짝 축소 — 피드백 즉시 | 모든 버튼·카드 |
| **transition-all 200ms** | 자연스러운 전환 | 토글, 상태 변화 |
| **드롭다운 안의 ring** | 본인 표시는 accent 색 외곽선 | 멤버 아바타 스택 |
| **debounce 800ms** | 빠른 연속 입력은 마지막만 저장 | useSharedEventsSync, useGroupEventsSync |
| **onSnapshot 실시간** | 다른 멤버 변경 즉시 반영 | 그룹 일정·할일·멤버 목록 |

### 3.6 컴포넌트 시스템

#### shadcn/ui 25종 — Radix UI 기반

`Dialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Switch`, `Select`, `Calendar`, `AlertDialog` 등.

**커스터마이즈 원칙**:
- shadcn 기본 스타일 위에 토큰(CSS 변수) 적용 → 라이트/다크 자동 전환
- 모서리 둥글게 (radius 14~16) — Apple 톤
- 그림자 가볍게

#### 자체 핵심 컴포넌트

| 컴포넌트 | 역할 |
|----------|------|
| `MemberAvatar` | 단일 원형 아바타 — Google 사진 / 이니셜 폴백 / accent ring |
| `MemberAvatarStack` | 여러 멤버 겹쳐 표시 + "+N" 배지 |
| `NewEventModal` | 시트 스타일 일정 생성/편집 통합 모달 |
| `AuthModal` | 시트 스타일 로그인/회원가입 (모드 토글) |
| `AccountSheet` | 사용자 카드 + 로그아웃 + 인라인 탈퇴 confirm |
| `AppMenuSheet` | 햄버거 메뉴 — 계정 카드 + 그룹 관리 진입 |
| `GroupSelector` | 헤더 토글 ("나의 / 그룹 ▾") — 멤버 사진 X, 그룹 이름 중심 |
| `GroupSheet` / `GroupDetailSheet` | 그룹 목록 / 상세 (코드 복사 + 이메일 초대 + 멤버 목록) |
| `SearchSheet` | 캘린더 일정 검색 |
| `CalendarScopeTabs` | 연/월/일/10분 탭 |

### 3.7 모바일 우선 + 데스크탑 대응

- **`Dimensions: iPhone 14 Pro Max`** 기준으로 모든 컴포넌트 설계
- 데스크탑(>768px) 에서는 모바일 frame 을 가운데 정렬 + 좌우 회색 띠
- PWA 설치 시 풀스크린 + 자체 상태바 숨김
- safe-area-inset (iOS notch / Android nav bar) 자동 보정

### 3.8 다크 모드

- `useTheme.ts` + `themeStore.ts` 로 system/light/dark 토글
- 모든 색상이 CSS 변수 기반 → 토큰만 바꾸면 자동 전환
- accent 는 그대로 유지 (밝은 미트색이 다크에서도 잘 보임)

### 3.9 톤 & 마이크로카피

| 상황 | 좋은 예 | 피해야 할 예 |
|------|--------|------------|
| AI 일정 생성 | "5/5 여행 일정 잡아봤어요. 확인해보세요." | "사용자 요청에 따라 일정을 생성했습니다." |
| AI 할일 분해 | "발표 준비 할일 나눠봤어요." | "다음과 같이 할일이 분해되었습니다." |
| 충돌 경고 | "겹치는 일정이 있어요. 조정해서 볼래요?" | "충돌이 감지되었습니다. 검토 후 승인하세요." |
| 빈 상태 | "오늘은 할일이 없어요 ☀" | "데이터가 존재하지 않습니다." |
| 에러 | "로그인이 만료됐어요. 다시 로그인해주세요" | "Authentication error: token expired" |

내부 용어 (agent, payload, commit, repository) 절대 노출 X. — Response Composer Agent 시스템 프롬프트 참조.

### 3.10 접근성 + UX 디테일

- **active:scale 피드백** — 모든 버튼에 적용 (탭 인지)
- **aria-label** — 아이콘 전용 버튼에 명시
- **키보드 Enter** — AuthModal 의 이메일 입력에서 제출
- **로딩 상태** — 버튼 disabled + opacity 변화
- **에러 메시지** — 빨강 (#ef4444), 12px, 입력 아래
- **빈 상태 메시지** — 이모지 한 개 + 짧은 한국어
- **사진 폴백** — `img onError` → 이니셜 + accent 배경
- **CRLF/LF** — `referrerPolicy="no-referrer"` 로 Google CDN 사진 CORS 우회

---

## 4. 기술 스택

### 3.1 프론트엔드

| 분류 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript | 5.5+ |
| 프레임워크 | React | 18.3.1 |
| 빌드 | Vite | 6.3.5 |
| 스타일링 | Tailwind CSS | 4.1.12 |
| UI 컴포넌트 | shadcn/ui (Radix) | 25개 모듈 |
| 폰트 | Pretendard | 한글 가독성 |
| 상태관리 | Zustand + 자체 훅 | 4.5.4 |
| 차트 | Recharts | 2.15.2 |
| 폼 | React Hook Form + Zod | 7.55 / 3.23 |
| 애니메이션 | motion (Framer Motion) | 12.23 |
| PWA | vite-plugin-pwa | 1.2.0 |
| 아이콘 | lucide-react | 0.487 |

### 3.2 백엔드 / 인프라

| 분류 | 기술 |
|------|------|
| 인증 | Firebase Auth (Google + Email/Password) |
| 데이터베이스 | Cloud Firestore (NoSQL) |
| Security Rules | `firestore.rules` (Firebase 콘솔 게시) |
| Edge Functions | Vercel `api/*.ts` (Node Runtime) |
| 서버 SDK | firebase-admin (idToken 검증) |
| 배포 | Vercel (HTTPS · 무료 · git push 자동 배포) |

### 3.3 AI 스택

| 분류 | 기술 |
|------|------|
| LLM Provider | OpenAI gpt-4o-mini (단일화) |
| SDK | openai 4.56.0 |
| 응답 형식 | JSON 모드 (`response_format: json_object`) |
| 호출 위치 | 서버 전용 (`src/server/agents/*`) |
| 키 보호 | `OPENAI_API_KEY` 서버 환경변수 (클라이언트 노출 X) |
| 캐싱 | (v2 후보) localStorage 결과 캐시 |
| 외부 API | 공공데이터포털 공휴일 API |

### 3.4 개발 도구

- pnpm/npm + Vite HMR
- TypeScript `strict` 모드
- VS Code + Prettier
- Git + GitHub
- Vercel CLI (`vercel dev` 로컬 Edge Function 테스트)

---

## 5. 디렉토리 구조

```
src/
├── api/                  # Vercel Edge Function (Node Runtime)
│   └── ai/               # AI 호출 진입점 (orchestrate)
│
├── components/           # React 컴포넌트
│   ├── ai/
│   │   └── AIChatModal.tsx
│   ├── shared/           # 시트·모달·셀렉터
│   │   ├── AppMenuSheet.tsx
│   │   ├── AuthModal.tsx
│   │   ├── AccountSheet.tsx
│   │   ├── NewEventModal.tsx
│   │   ├── CalendarScopeTabs.tsx
│   │   ├── GroupSheet.tsx
│   │   ├── GroupDetailSheet.tsx
│   │   ├── GroupSelector.tsx
│   │   ├── MemberAvatar.tsx
│   │   ├── SearchSheet.tsx
│   │   └── InsightGreeting.tsx
│   ├── ui/               # shadcn/ui 25종
│   ├── DailyFlipView.tsx
│   ├── DayView.tsx
│   ├── DiaryView.tsx
│   ├── MandalaView.tsx
│   ├── MonthView.tsx
│   ├── PlanSelect.tsx
│   ├── Settings.tsx
│   ├── Splash.tsx
│   ├── TenMinPlanner.tsx
│   ├── eventStore.ts     # SharedEvent / Todo 타입 + 초기 데이터
│   ├── tokens.ts         # accent / highlights 색상 토큰
│   └── Logo.tsx
│
├── hooks/                # 커스텀 훅
│   ├── useAuth.ts                  # 인증 상태 구독
│   ├── useSharedEventsSync.ts      # 개인 일정 동기화
│   ├── useGroupEventsSync.ts       # 그룹 일정 실시간
│   ├── useGroupTodosSync.ts        # 그룹 할일 실시간
│   ├── useMyGroups.ts              # 내 그룹 목록 onSnapshot
│   ├── useHolidays.ts              # 월/연 단위 공휴일
│   ├── usePersistedState.ts        # localStorage 상태
│   └── useTheme.ts
│
├── lib/                  # 클라이언트 인프라
│   ├── firebase/
│   │   ├── client.ts               # Firebase 초기화 (lazy + 더미 키 가드)
│   │   ├── auth.ts                 # 로그인/회원가입/로그아웃
│   │   ├── sync.ts                 # User 프로필
│   │   ├── sharedEventsAdapter.ts  # 개인 일정 ↔ Firestore
│   │   ├── groupsAdapter.ts        # 그룹 CRUD + 초대
│   │   ├── groupEventsAdapter.ts   # 그룹 일정 어댑터
│   │   ├── groupTodosAdapter.ts    # 그룹 할일 어댑터
│   │   └── share.ts                # 공유 링크 (확장 후보)
│   ├── ai/
│   │   ├── client.ts               # 클라이언트용 AI 호출 래퍼 (legacy)
│   │   ├── parser.ts
│   │   ├── prompts.ts
│   │   └── schemas.ts
│   ├── holidays.ts                 # 공공데이터포털 fetch + 캐시
│   └── utils/
│       ├── date.ts
│       ├── time.ts
│       └── rollover.ts
│
├── server/               # ⚠ 서버 전용 (Edge Function 에서만 import)
│   └── agents/
│       ├── client.ts               # OpenAI 호출 헬퍼 + JSON 모드
│       ├── orchestrator.ts         # intent 분류 + 라우팅
│       ├── contextAgent.ts         # raw → 요약
│       ├── scheduleParser.ts       # 자연어 → 일정 초안
│       ├── taskBreakdown.ts        # → 할일 초안
│       ├── goalMandala.ts          # → 만다라트 초안
│       ├── conflictAgent.ts        # 충돌·중복 검사
│       ├── responseComposer.ts     # → preview 응답
│       ├── index.ts                # 일괄 export
│       └── types/common.ts
│
├── store/                # Zustand 스토어
│   ├── userStore.ts                # 인증 상태 + signIn/signUp/signOut
│   ├── eventStore.ts               # 도메인 데이터 (legacy)
│   ├── aiStore.ts
│   └── themeStore.ts
│
├── styles/                         # 전역 CSS
│   ├── globals.css
│   └── fonts.css
│
├── types/                          # 공유 타입
│   ├── event.ts
│   ├── group.ts
│   ├── mandala.ts
│   ├── share.ts
│   ├── user.ts
│   └── ai.ts
│
├── App.tsx                         # 루트 — 라우팅 + AIChatModal mount + 인증 구독
└── main.tsx
```

---

## 6. 데이터 모델 (Firestore + 클라이언트 캐시)

### 6.1 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (PWA)                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ React Component (DayView, MonthView, ...)        │    │
│  │      ↑ ↓                                         │    │
│  │ Custom Hook (useSharedEventsSync, ...)           │    │
│  │      ↑ ↓                                         │    │
│  │  ┌──────────────┐    ┌──────────────────────┐  │    │
│  │  │ localStorage │    │ Firebase Web SDK     │  │    │
│  │  │ (즉시 캐시)  │    │ (실시간 onSnapshot)  │  │    │
│  │  └──────────────┘    └──────────┬───────────┘  │    │
│  └────────────────────────────────────┼──────────────┘    │
└──────────────────────────────────────┼──────────────────┘
                                        │ HTTPS + idToken
                                        ▼
                            ┌─────────────────────┐
                            │  Firebase Backend   │
                            │  ┌───────────────┐  │
                            │  │ Auth          │  │
                            │  │ (Google/Email)│  │
                            │  └───────────────┘  │
                            │  ┌───────────────┐  │
                            │  │ Firestore     │  │
                            │  │ + Rules       │  │
                            │  └───────────────┘  │
                            └─────────────────────┘
```

**핵심 원칙:**
- **로컬 우선 (Local-first)**: 모든 변경은 즉시 localStorage 에 반영 → 빠른 첫 페인트 + 오프라인 대응
- **백그라운드 동기화**: 800ms debounce 후 Firestore 에 저장 (개인 데이터)
- **실시간 동기화 (그룹)**: onSnapshot 리스너로 다른 멤버 변경 즉시 반영
- **권한 분리**: Firestore Security Rules 가 본인/멤버 데이터만 read/write 보장

### 6.2 Firestore 컬렉션 구조

```
users/{uid}                              ← User 프로필 + 개인 데이터
  ├ (root document)
  │   displayName: string
  │   email: string
  │   photoURL: string?
  │   provider: 'google' | 'email'
  │   preferences: { theme, accent, language, weekStartsOn }
  │   consent: { privacyAcceptedAt, aiDataUsageAcceptedAt }
  │   createdAt: timestamp
  │   lastLoginAt: timestamp
  │
  ├ sharedEvents/{eventId}               ← 개인 일정
  │   id: number
  │   year, month, startDay, endDay
  │   startSlot?, endSlot?  (30분 단위)
  │   title, color
  │
  └ myGroups/{groupId}                   ← 내가 속한 그룹 인덱스 (denormalized)
      joinedAt: number

groups/{groupId}                         ← 그룹 본체
  ├ (root document)
  │   name: string
  │   ownerUid: string
  │   ownerName: string
  │   memberUids: string[]               (최대 10)
  │   memberNames: { [uid]: string }
  │   memberPhotos: { [uid]: string }    (Google photoURL 또는 빈 값)
  │   inviteCode: string                 (6자리 대문자+숫자, 0/O/1/I 제외)
  │   createdAt: number
  │
  ├ events/{eventId}                     ← 그룹 일정 (멤버 모두 read/write)
  │   (SharedEvent 와 동일 구조)
  │
  └ todos/{todoId}                       ← 그룹 할일
      id: number
      text: string
      done: boolean
      later?: boolean
      rolled?: boolean

invites/{inviteCode}                     ← 6자리 코드 → 그룹 매핑
  groupId: string
  groupName: string
  ownerUid: string
  createdAt: number

pendingInvites/{emailKey}/list/{inviteId}  ← 가입 전 이메일 초대
  groupId, groupName
  invitedBy, invitedByName
  invitedAt: number
```

**emailKey 정규화 규칙**: `email.toLowerCase().replace(/[.@]/g, '_')`
(Firestore 문서 ID 에 `.` `@` 사용 불가 → 안전한 키로 변환)

### 6.3 핵심 TypeScript 타입

```ts
// src/components/eventStore.ts
type SharedEvent = {
  id: number;            // Date.now() + random
  year: number;
  month: number;         // 0-11 (JS Date 호환)
  startDay: number;      // 1-31
  endDay: number;        // 멀티데이는 startDay < endDay
  title: string;
  color: string;         // highlights 6색 중 1개
  startSlot?: number;    // 0-47 (30분 단위, undefined 면 종일)
  endSlot?: number;
};

type Todo = {
  id: number;
  text: string;
  done: boolean;
  later?: boolean;       // "내일 할일" 분류
  rolled?: boolean;      // 어제에서 이월된 항목
};

// src/types/group.ts
type Group = {
  id: string;
  name: string;
  ownerUid: string;
  ownerName: string;
  memberUids: string[];
  memberNames: Record<string, string>;
  memberPhotos: Record<string, string>;
  inviteCode: string;
  createdAt: number;
};

const MAX_GROUP_MEMBERS = 10;
const INVITE_CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

// src/types/user.ts
type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'email';
  preferences: UserPreferences;
  consent: UserConsent;
  createdAt: number;
  lastLoginAt: number;
};
```

### 6.4 동기화 패턴 — 4가지 흐름

#### A. 개인 일정 동기화 (`useSharedEventsSync`)

**localStorage + Firestore 자동 양방향 동기화** + 로그아웃 시 캐시 정리.

```
사용자 액션 → setSharedEvents([...prev, newEvent])
              │
              ├─ 즉시: state 갱신 + localStorage('kdt-shared-events') 저장
              │
              └─ 800ms debounce → Firestore users/{uid}/sharedEvents 저장

로그인 시 (uid 변화):
  1. lastLoadedUidRef 비교 → 새 uid 면 Firestore 1회 fetch
  2. 결과로 state 교체 + localStorage 갱신
  3. lastLoadedUidRef 갱신

로그아웃 시:
  1. uid 가 non-null → null 전환 감지
  2. localStorage.removeItem('kdt-shared-events')
  3. setEventsState([])
  4. 진행 중 debounce timer cancel (이전 uid 로 새는 것 방지)

게스트 모드 (한 번도 로그인 안 함):
  → localStorage 만 단독 동작, Firestore 호출 0
```

#### B. 그룹 데이터 실시간 동기화 (`useGroupEventsSync`, `useGroupTodosSync`)

**onSnapshot 리스너 기반** — 다른 멤버 변경 즉시 반영.

```
useGroupEventsSync(activeGroupId, [])
    │
    ├─ activeGroupId 변경 시:
    │   1. 이전 listener unsubscribe
    │   2. 새 그룹의 onSnapshot 등록
    │
    ├─ Firestore 변경 감지 (다른 멤버 포함):
    │   → snap.docs.map(d => d.data()) → state 갱신
    │
    └─ setEvents 호출 시:
        1. 즉시: state 갱신
        2. 800ms debounce → Firestore 저장
        3. 본인 변경이 onSnapshot 으로 다시 들어와도 멱등 (id 중복 X)
```

**listener 갯수 가드**: 사용자당 최대 3개
- `useMyGroups` — 내 그룹 목록 (1개)
- `useGroupEventsSync` — 활성 그룹의 events (1개)
- `useGroupTodosSync` — 활성 그룹의 todos (1개)

→ Firestore 무료 한도(50K read/일) 안에서 충분히 운영 가능

#### C. 그룹 멤버 추가 (`joinByCode`)

**Security Rules 우회 + 비멤버 가입 분기** — 닭/달걀 문제 해결.

```
사용자가 6자리 코드 "X7K2P9" 입력
    ↓
1. invites/X7K2P9 read (인증 사용자 누구나 OK)
   → { groupId, groupName, ownerUid }

2. groups/{gid} 직접 update 시도 (read 안 함)
   - memberUids: arrayUnion(uid)
   - memberNames.{uid}: displayName
   - memberPhotos.{uid}: photoURL

   Rules 검사:
   - 비멤버 + 자기 자신만 추가 + 기존 멤버 모두 보존 + size <= 10 → ✓

3. users/{uid}/myGroups/{gid} 생성

4. 위 3개를 batch.commit() 으로 atomic 처리

실패 케이스:
  - 권한 거부 → 정원 초과 또는 이미 멤버
  - 이미 멤버: groups/{gid} read 가능 → 인덱스만 보정
```

#### D. 그룹 삭제 (`deleteGroup`) + Stale 인덱스 자동 정리

**owner 만 삭제 가능 + 다른 멤버는 자동 정리** (다른 사용자 데이터 write 권한 없으니).

```
owner 가 "그룹 삭제" 클릭
    ↓
1. groups/{gid}/events 전체 fetch → batch.delete 모두
2. groups/{gid}/todos 전체 fetch → batch.delete 모두
3. invites/{inviteCode} delete
4. users/{owner_uid}/myGroups/{gid} delete (본인 인덱스만)
5. groups/{gid} delete (본체)
   ↓
batch.commit()

다른 멤버:
  - 다음 useMyGroups 가 그룹 본체 read 시도 → exists() === false
  - silently deleteDoc(users/{나}/myGroups/{gid}) — stale 인덱스 자동 정리
  - state 에서도 사라짐
```

### 6.5 Security Rules — 핵심 규칙

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 사용자 본인 데이터만
    match /users/{uid}/{collection=**} {
      allow read, write: if request.auth.uid == uid;
    }

    // 그룹 본체
    match /groups/{groupId} {
      // read: 멤버만
      allow read: if request.auth.uid in resource.data.memberUids;

      // create: 본인이 owner + memberUids 본인만 + size <= 10
      allow create: if request.auth.uid == request.resource.data.ownerUid
                  && request.resource.data.memberUids == [request.auth.uid]
                  && request.resource.data.memberUids.size() <= 10;

      // update: 두 분기 OR
      //   (a) 기존 멤버가 그룹 정보 수정
      //   (b) 비멤버가 자기 자신만 추가 + 기존 멤버 모두 보존 + size <= 10
      allow update: if request.auth.uid in resource.data.memberUids
                  || (
                    request.auth.uid in request.resource.data.memberUids
                    && request.resource.data.memberUids.hasAll(resource.data.memberUids)
                    && request.resource.data.memberUids.size() <= 10
                    && request.auth.uid !in resource.data.memberUids
                  );

      // delete: owner 만
      allow delete: if request.auth.uid == resource.data.ownerUid;

      // 서브컬렉션: 멤버만
      match /events/{eventId} {
        allow read, write: if request.auth.uid in
          get(/databases/$(database)/documents/groups/$(groupId)).data.memberUids;
      }
      match /todos/{todoId} {
        allow read, write: if request.auth.uid in
          get(/databases/$(database)/documents/groups/$(groupId)).data.memberUids;
      }
    }

    // 초대 코드: 인증 사용자 read OK (가입 흐름)
    match /invites/{inviteCode} {
      allow read: if request.auth != null;
      allow create, delete: if request.auth.uid == resource.data.ownerUid;
    }

    // 가입 전 이메일 초대
    match /pendingInvites/{emailKey}/list/{inviteId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6.6 데이터 보안 검증 — 실제 테스트 방법

**브라우저 콘솔(F12) 에서 직접 시도**:

```js
// 다른 uid 데이터 read 시도
const projectId = 'project-planner-5f39d';
const fakeUid = 'fake-uid-123';
const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${fakeUid}/sharedEvents`;
const r = await fetch(url);
console.log('상태:', r.status);  // 403 Forbidden 이면 정상
```

**기대 결과: `403 Forbidden`** — Security Rules 정상 작동 확인.

### 6.7 개인 데이터 영속화 정책

| 데이터 | 위치 | 동기화 | 로그아웃 시 |
|--------|------|--------|------------|
| sharedEvents | localStorage + Firestore | 800ms debounce | localStorage 삭제 |
| myTodos / sharedTodos | localStorage 만 | (v2 후보) | 유지 (기기별 설정) |
| diaries (Phase 9) | localStorage 만 | (v2 후보) | 유지 |
| accent / theme / planKind | localStorage 만 | 동기화 X | 유지 (UI 설정) |
| user profile | Firestore users/{uid} | 즉시 | (계정 자체 유지) |
| group events / todos | Firestore (그룹 본체 안) | 실시간 onSnapshot | 자동 unsubscribe |

---

## 7. AI 멀티 에이전트 시스템

> 하루온의 AI 는 단일 LLM 호출이 아니라 **7개 전문 에이전트가 병렬로 협력하는 멀티 에이전트 시스템**이다. 사용자의 자연어 입력을 다양한 관점(일정/할일/목표/충돌/응답)에서 동시 분석하고, 결과를 통합해 즉시 검토 가능한 미리보기로 반환한다.

### 7.1 사용자가 AI 에게 물어볼 수 있는 것 — 8가지 패턴

#### 패턴 A. 단순 일정 (Schedule Parser 단독 처리)

```
"내일 오전 10시 디자인 리뷰"
"다음 주 월요일 저녁 7시 가족 식사, 강남"
"5월 15일 오후 2시 치과 예약"
```

**처리 흐름**:
1. Orchestrator: intent = `schedule_create`, agentsToCall = `[schedule_parser_agent, conflict_agent, response_composer_agent]`
2. Schedule Parser: 자연어 → ScheduleEventDraft 1개
3. Conflict Agent: 기존 일정과 충돌 검사
4. Response Composer: "내일 10시 디자인 리뷰 잡아봤어요. 확인해보세요."
5. UI: 일정 카드 1개 + 저장 버튼

**응답 시간**: ~5초 (병렬 호출 후)

#### 패턴 B. 멀티데이 / 여행 일정 (분해 처리)

```
"다음 주 부산 2박 3일 가족 여행, 첫날 해운대"
"제주 3박 4일, 둘째 날 한라산 등반"
"5월 15~17일 워크숍, 첫째 날 키노트, 둘째 날 분임토의"
```

**처리 흐름**:
- Schedule Parser 가 한 요청에서 **여러 일정 자동 분해** (events 배열에 3~4개)
- Conflict Agent 가 각 일정 따로 검사
- Composer: "5/15~17 부산 여행 일정 잡아봤어요."

#### 패턴 C. 할일 분해 요청 (Task Breakdown 단독)

```
"발표 준비 할일 나눠줘"
"여행 가기 전 준비할 것"
"시험 공부 계획 쪼개줘"
"이사 준비 할일"
"면접 대비 할일 정리해줘"
```

**처리 흐름**: Task Breakdown 이 5~8개 todo 분해 + priority/category/dueHint 자동 부여.

#### 패턴 D. 만다라트 목표 분해 (Goal/Mandala)

```
"올해 영어 회화 마스터하고 싶어"
"토익 900점 달성"
"건강한 라이프스타일 만들기"
"개발자로 1년 안에 시니어 되기"
```

**처리 흐름**: Goal/Mandala Agent 가 centerGoal + subGoals 8개 + actionItems 8×8 = 81칸 생성.

#### 패턴 E. 복합 요청 (Mixed Request)

```
"내일 회의 일정 잡고, 회의 준비 할일도 나눠줘"
"부산 여행 일정 짜고 준비물 리스트도 만들어줘"
```

**처리 흐름**: Schedule Parser + Task Breakdown 병렬 호출.

#### 패턴 F. 충돌 가능성 자동 검사

위 패턴 A~E 어떤 것이든, 새 일정/할일 만들면 Conflict Agent 자동 호출:
- 시간 겹침, 공휴일 업무 일정, 종료 < 시작, 할일 중복, 과부하 → 경고 + 대안 제안

#### 패턴 G. 그룹 모드 (협업 일정)

헤더에서 그룹 활성화 후:

```
[그룹: "연인" 선택 후]
"이번 주 토요일 저녁 7시 데이트, 이태원"
[그룹: "친구들"]
"다음 주 금요일 저녁 술 약속"
```

→ scope/groupId 전달 → groups/{gid}/events 에 저장 → 다른 멤버에게 800ms 후 자동 반영.

#### 패턴 H. 모호한 입력

```
"점심 약속"  ← 시간 불명
"운동"       ← 추상적
```

→ ambiguities 에 명시 + Composer 가 "시간이 조금 모호해요" 안내.

---

### 7.2 전체 아키텍처 흐름도

```
[ AIChatModal (클라이언트) ]
   사용자: "내일 오전 10시 디자인 리뷰" 입력
        │
        │ ① POST /api/ai/orchestrate
        │   Authorization: Bearer {idToken}
        │   Body: { userRequest, scope, groupId?, referenceDate, context }
        ▼
[ /api/ai/orchestrate (Vercel Function · Node Runtime) ]
        │
        ├─ ② Auth Gateway (firebase-admin) — idToken 검증 → uid 추출
        │
        ├─ ③ Context Resolver — 클라이언트 context → ResolvedContext 변환
        │
        ▼
[ ④ Orchestrator Runner — 5개 Agent 동시 병렬 실행 ]
        │
        │   Promise.all([
        │     Orchestrator      ─ intent 분류 + 라우팅
        │     Context Agent     ─ raw → 요약
        │     Schedule Parser   ─ 자연어 → 일정 초안
        │     Task Breakdown    ─ 자연어 → 할일 초안
        │     Goal/Mandala      ─ 자연어 → 만다라트 초안
        │   ])
        │
        │   * 각 Specialist 는 본인 영역이 아니면
        │     "nonXxxRequest: true" 로 빈 결과 반환
        │
        ▼
[ Conflict Agent ] — proposed 가 있을 때만 호출
   → 시간 겹침, 공휴일, 중복, 과부하 검사 + 대안 제안
        │
        ▼
[ Response Composer ] — 사용자용 짧은 한국어 replyText + preview
        │
        │ ⑤ 200 OK + JSON
        │   { ok, intent, scope, composer: { replyText, preview, warnings }, raw }
        ▼
[ AIChatModal — 미리보기 표시 ]
   - replyText 메시지
   - preview.events → 일정 카드
   - 사용자 액션: ✏ 편집 / ❌ 삭제 / "그대로 저장"
        │
        │ ⑥ 사용자 "그대로 저장"
        ▼
[ handleSaveAIEvents → setSharedEvents(...) ]
        │
        │ ⑦ useSharedEventsSync 가 800ms 후
        ▼
[ Firestore (users/{uid}/sharedEvents 또는 groups/{gid}/events) ]
   - Security Rules 가 본인/멤버 데이터만 보장
   - 그룹 모드면 다른 멤버에게 onSnapshot 으로 800ms 후 실시간 반영
```

### 7.3 Agent 7종 — 역할 + 입출력

각 agent 의 시스템 프롬프트는 `src/server/agents/{agentName}.ts` 의 `XXX_SYSTEM_PROMPT` 상수로 관리. 모두 GPT-4o-mini · JSON 모드 · 한국어 출력 · 직접 DB 접근 X · 결과는 항상 preview.

| # | Agent | 파일 | 역할 |
|---|-------|------|------|
| 1 | Orchestrator | `orchestrator.ts` | intent 분류 + 라우팅 결정 |
| 2 | Context Agent | `contextAgent.ts` | raw → specialist 가 쓰기 좋은 요약 |
| 3 | Schedule Parser | `scheduleParser.ts` | 자연어 → 일정 초안 (date/time 정규화) |
| 4 | Task Breakdown | `taskBreakdown.ts` | 큰 작업 → 실행 가능한 할일 |
| 5 | Goal/Mandala | `goalMandala.ts` | 목표 → 9×9 만다라트 |
| 6 | Conflict Agent | `conflictAgent.ts` | 충돌·중복·과부하 + 대안 |
| 7 | Response Composer | `responseComposer.ts` | 짧은 한국어 replyText + preview |

#### Schedule Parser 핵심 처리 예시

- "오전 9시" → `09:00` / "오후 2시" → `14:00` / "정오" → `12:00`
- "내일", "다음 주 화요일" → `referenceDate` 기준 절대 날짜
- "3박 4일" → 4개 날짜 자동 분해
- 시간 모호 시 → `ambiguities` 명시 + `confidence: "low"`

#### Conflict Agent 검사 항목

- `time_overlap` (severity: high) — 시간 겹침
- `possible_duplicate_event` (warning) — 유사 일정 중복
- `holiday_warning` — 공휴일 + 업무성 일정
- `invalid_time` (high) — 종료 < 시작
- `overload_warning` — 연속 일정 과부하
- `duplicate_todo` — 할일 의미 중복
- `duplicate_goal` — 목표 중복

대안 제안:
```ts
adjustmentSuggestions: [{
  targetType: "event",
  suggestionType: "alternative_time",
  message: "오후 3시는 어떠신가요?",
  alternativeStartTime: "15:00"
}]
```

#### Response Composer 톤 가이드

좋은 예 (미완료 톤):
- "5/5 여행 일정 잡아봤어요. 확인해보세요."
- "발표 준비 할일 나눠봤어요."
- "겹치는 일정이 있어요. 조정해서 볼래요?"

피할 예 (이미 저장된 것처럼):
- "사용자 요청에 따라 일정을 생성했습니다."

### 7.4 응답 시간 분석 + 최적화

#### Before (직렬, 9~10초)
```
Orchestrator → Context → Specialists 병렬 → Conflict → Composer
```

#### After (Phase 8 최적화, ~5~6초)
```
[Orchestrator + Context + Specialists 모두 병렬] → Conflict → Composer
```

핵심 트릭: 모든 specialist 동시 호출, 본인 영역 아니면 `nonXxxRequest: true` 로 빈 결과 반환.

추가 최적화 (예상):
- `max_tokens` 제한 (Orchestrator 600, Context 800, Composer 1000)
- Conflict + Composer 도 병렬화 → ~3~4초
- 결과 캐싱 → 즉시 응답 (v2)
- Streaming → 체감 시간 단축 (v2)

### 7.5 Edge Function 진입점

```ts
// api/ai/orchestrate.ts
export const config = {
  runtime: 'nodejs',     // firebase-admin 호환
  maxDuration: 60,       // cold start 대비 (기본 30 → 60초)
};

export default async function handler(req: Request): Promise<Response> {
  // 1. POST 만 허용 (405)
  // 2. Authorization: Bearer {idToken} 검증 → uid (401)
  // 3. body 파싱 + 필수 필드 검증 (400)
  // 4. resolveContext(uid, body) → ResolvedContext
  // 5. runOrchestration(...) → OrchestrationResult
  // 6. 200 OK + JSON 또는 500
}
```

`vercel.json`:
```json
{
  "framework": "vite",
  "functions": {
    "api/ai/orchestrate.ts": { "maxDuration": 60 }
  }
}
```

### 7.6 비용 + 안전 가드

| 항목 | 정책 |
|------|------|
| 모델 | gpt-4o-mini 단일화 — ~$0.0001~0.0005/호출 |
| 응답 형식 | JSON 모드 — 후처리 0 |
| 병렬 호출 | 5개 동시 → latency 최소 |
| max_tokens | Orchestrator 600 / Context 800 / Composer 1000 |
| 키 보호 | OPENAI_API_KEY 서버 환경변수만 |
| 인증 필수 | idToken 없으면 401 |
| Auto-commit 금지 | AI 가 직접 저장 X — 항상 사용자 승인 |
| Rate limit (v2) | 분당 5회 / 일당 50회 |
| Cache (v2) | 입력 hash → localStorage 재사용 |

### 7.7 AI 가 못 하는 것 (의도된 제약)

**현재 미지원**:
- ❌ AI 가 직접 저장 (안전 — 항상 미리보기)
- ❌ 기존 일정 수정 ("회의 시간 11시로 변경")
- ❌ 삭제 명령 ("회의 취소해줘")
- ❌ 검색 명령 — 별도 SearchSheet 사용
- ❌ 외부 도구 호출
- ❌ 실시간 음성 입력

**v2 로드맵**:
- 📅 Streaming 응답
- 🔄 결과 캐싱
- ✏ 기존 일정 수정 명령
- 🗑 삭제 명령
- 🎙 음성 입력
- 📊 주간 회고 자동 생성

### 7.8 보안 — AI 호출 흐름

1. 클라이언트 → 서버: `idToken` 만 (자격증명 X)
2. 서버: `firebase-admin` 으로 `idToken` 검증 → `uid` 추출
3. 클라이언트가 보내는 `context` 는 본인 데이터만 (Rules 가 그 외 read 차단)
4. OpenAI 호출 시 식별 정보 최소화 (이메일 X, displayName X)
5. AI 결과는 서버 메모리에서만 — DB 영속화 X (사용자 승인 후 클라이언트가 저장)

---

## 8. 환경 변수

`.env.local` (절대 git 커밋 X — `.gitignore` 의 `.env*.local` 패턴):

```env
# 공공데이터포털 공휴일 API
VITE_HOLIDAY_API_KEY=...

# OpenAI (서버 전용 — VITE_ 접두어 X)
OPENAI_API_KEY=sk-...

# Firebase 웹 (클라이언트 노출 정상)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Firebase Admin (서버 전용 — idToken 검증)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`.env.example` 은 placeholder 만 (실키 X) — 팀원 인수인계용.

---

## 9. 핵심 흐름

### 9.1 인증

1. 햄버거 메뉴 → 로그인/회원가입 → `AuthModal`
2. Google OAuth 또는 이메일+비밀번호
3. `useAuth.useAuthSubscription()` 이 `onAuthStateChanged` 구독
4. 첫 로그인 시 Firestore `users/{uid}` 자동 생성
5. `useUserStore.user` 업데이트 → 모든 컴포넌트 리렌더

### 9.2 개인 일정 동기화

```
useState  →  useSharedEventsSync(initial)  →  [events, setEvents]
                  │
                  ├─ 초기: localStorage('kdt-shared-events') 에서 로드
                  ├─ 로그인 시: Firestore users/{uid}/sharedEvents 1회 fetch
                  ├─ setEvents 호출: 즉시 state + localStorage 갱신
                  └─ 800ms debounce: Firestore 저장
```

### 9.3 그룹 데이터 동기화 (실시간)

```
useGroupEventsSync(activeGroupId, [])  →  [events, setEvents]
                  │
                  └─ onSnapshot: groups/{gid}/events  ← 다른 멤버 변경 즉시 반영
```

사용자당 최대 3개 listener: `myGroups` + 활성 그룹의 `events` + `todos`.

### 9.4 AI 챗봇 사용 흐름

1. FAB ✨ 또는 메뉴 → AIChatModal 열림
2. 사용자 입력: "다음 주 월요일 오전 10시 디자인 리뷰"
3. `aiClient.askAI()` → `POST /api/ai/orchestrate` (idToken 첨부)
4. 서버: 7개 agent 병렬 협력 → preview 반환
5. 응답: `{ replyText, preview: { events, todos, mandala }, warnings }`
6. 모달에 일정 카드 미리보기 + "그대로 저장" 버튼
7. 저장 클릭 → `setSharedEvents([...prev, ...newEvents])`
8. `useSharedEventsSync` 가 800ms 후 Firestore 저장

### 9.5 그룹 가입 흐름 (6자리 코드)

1. 그룹 owner: `GroupDetailSheet` → 코드 복사 → 카톡 전달
2. 가입자: `GroupSheet` → "코드로 참여" → 6자리 입력
3. `joinByCode(uid, displayName, photoURL, code)`
4. Firestore: `invites/{code}` 조회 → `groups/{gid}.memberUids` 본인 추가 → `users/{uid}/myGroups/{gid}` 생성
5. (룰: 비멤버 자기 자신 추가 분기 + 기존 멤버 보존)
6. `useMyGroups` onSnapshot → 헤더 드롭다운에 즉시 새 그룹 표시

### 9.6 그룹 삭제 흐름

1. owner: `GroupDetailSheet` → "그룹 삭제" → 인라인 confirm
2. `deleteGroup(uid, groupId)`:
   - 서브컬렉션 (`events`, `todos`) 일괄 삭제
   - `invites/{code}` 삭제
   - 본인 `myGroups/{gid}` 삭제
   - 그룹 본체 삭제
3. 다른 멤버: `useMyGroups` 가 그룹 본체 read 실패 → stale 인덱스 자동 정리

---

## 10. 팀원 분담 (실제 진행 기준)

| 역할 | 담당 영역 | 산출물 |
|------|----------|-------|
| **A. 프론트 리드** | 라우팅, 6개 뷰, 디자인 토큰, PWA, 그룹 UI, AI 챗봇 통합 | App.tsx, 모든 뷰 컴포넌트, GroupSelector, AIChatModal 연결 |
| **B. UI/UX** | shadcn 커스터마이즈, 모달/시트, 모바일 레이아웃 | shared/*, MemberAvatar, NewEventModal, AuthModal |
| **C. AI 엔지니어** | OpenAI 통합, 멀티 에이전트 7종, 시스템 프롬프트, Edge Function | server/agents/*, api/ai/orchestrate.ts |
| **D. 백엔드/인증/배포** | Firebase Auth/Firestore, Security Rules, 그룹 데이터, Vercel 배포 | lib/firebase/*, hooks/useXxx Sync, firestore.rules |

### 협업 규칙

- 브랜치: `main` (배포) / `feat/*` (기능)
- 커밋: `[type(scope)]: 메시지`
- PR 1명 리뷰 후 머지
- 일일 스탠드업 10분

---

## 11. 시연 시나리오 (발표용)

### 시나리오 1 — 개인 모드 + AI 자연어 일정

1. 로그인 → 빈 캘린더
2. AI 챗봇 ✨ → "다음 주 부산 2박 3일 가족 여행, 첫날 해운대"
3. 3~5초 후 일정 3~4개 자동 미리보기
4. "그대로 저장" → 캘린더 자동 채움
5. 새로고침 → 데이터 그대로 유지

### 시나리오 2 — 그룹 협업 (실시간)

1. 그룹 만들기 → "연인" 이름 → 6자리 코드 발급
2. 카톡으로 코드 공유 → 상대방 합류
3. 양쪽 화면 나란히
4. 한쪽에서 일정 추가 → **800ms 안에 다른 쪽 자동 반영**
5. 헤더 멤버 썸네일 자동 갱신

### 시나리오 3 — AI 만다라트 분해

1. AI 챗봇 → "올해 영어 회화 마스터"
2. Goal/Mandala Agent → 9×9 만다라트 초안
3. 미리보기 확인 → 저장 (v2: 만다라 자동 매핑)

### 시나리오 4 — 보안 검증

1. 시크릿창 → 다른 계정 로그인
2. F12 콘솔에서 다른 uid 데이터 fetch 시도
3. → `403 Forbidden` (Security Rules 정상 작동)

---

## 12. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| AI 응답 시간 (5~10초) | 로딩 스켈레톤 · "AI가 일정 짜는 중" 애니메이션 · 병렬 호출 최적화 |
| AI 응답 부정확 | 항상 미리보기 → 사용자 수정 후 저장 + Conflict Agent 검증 |
| AI 비용 초과 | gpt-4o-mini 단일화 · JSON 모드 · max_tokens 제한 |
| AI 키 노출 | `src/server/*` 분리 + Vercel 환경변수 |
| Firebase 무료 한도 (Spark) | 일 50K read · 20K write · 시연 한정 |
| Firestore 권한 우회 | Security Rules 게시 + fetch 403 검증 |
| 그룹 삭제 후 stale 인덱스 | useMyGroups 자동 정리 |
| Google CDN photoURL CORS | `referrerPolicy="no-referrer"` + 이니셜 폴백 |
| Edge Function cold start | maxDuration 60 + Node Runtime |

---

## 13. 배포

### 13.1 Vercel 배포

1. GitHub 저장소 → Vercel 프로젝트 연결
2. 환경변수 등록:
   - `OPENAI_API_KEY`
   - `FIREBASE_ADMIN_*` 3개
   - `VITE_FIREBASE_*` 6개
   - `VITE_HOLIDAY_API_KEY`
3. `main` 푸시 → 자동 배포
4. URL 받기
5. Firebase Console → Authentication → Settings → 승인된 도메인 추가
6. Firestore Rules 게시 (한 번만)

### 13.2 PWA 시연 (모바일)

- iPhone Safari: 공유 → "홈 화면에 추가"
- Android Chrome: 메뉴 → "앱 설치"

### 13.3 발표장 시연 흐름

1. PC 에서 Vercel URL + 시크릿창 두 개
2. QR 코드로 청중 본인 폰에서 접속 가능
3. 시나리오 1 → 2 → 3 → 4 순서

---

## 14. 향후 작업 (v2)

| 우선순위 | 작업 |
|---------|------|
| P0 | Planner Write Service (`/api/planner/commit`) — 서버 검증 강화 |
| P0 | Repository Layer 분리 |
| P1 | todos / highlights / mandala / diaries Firestore 동기화 |
| P1 | 비밀번호 재설정 |
| P1 | 계정 탈퇴 시 Firestore 데이터 일괄 삭제 |
| P2 | AI 결과 캐시 |
| P2 | Streaming 응답 |
| P2 | 공유 링크 + QR |
| P3 | 회고 자동 생성 |
| P3 | 카카오 로그인 |
| P3 | iOS/Android 네이티브 (Capacitor) |

---

## 15. 참고 자료

- [Firebase Documentation](https://firebase.google.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Vercel Edge Functions](https://vercel.com/docs/functions)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [shadcn/ui](https://ui.shadcn.com/)
- [공공데이터포털 — 공휴일 API](https://www.data.go.kr/)

---

## 부록 A. 로컬 개발 셋업

```bash
git clone https://github.com/halee0426/KDT_webai_team_planner
cd KDT_webai_team_planner
npm install
cp .env.example .env.local
# .env.local 편집기로 열고 키 채움

# 클라이언트만 (AI 챗봇은 mock)
npm run dev

# Edge Function 까지 로컬 테스트
npm i -g vercel
vercel dev   # 포트 3000
```

체크리스트:
- [ ] `localhost:3000` 접속
- [ ] 콘솔에 "Firebase: 더미 키" 경고 X
- [ ] 햄버거 → 로그인 → Google 가능
- [ ] AI 챗봇에서 "내일 오전 10시 회의" → 일정 카드 미리보기
- [ ] "그대로 저장" → 캘린더 반영

---

## 부록 B. 보안 체크리스트

- [x] `.env.local` git ignore
- [x] `.env.example` placeholder 만
- [x] `OPENAI_API_KEY` 클라이언트 빌드물에 X
- [x] `FIREBASE_ADMIN_PRIVATE_KEY` 서버 전용
- [x] Firestore Rules 게시 + fetch 403 검증
- [x] 그룹 read 멤버만 / write owner + 비멤버 join 분기
- [x] 로그아웃 시 localStorage 정리
- [x] AI 호출 시 idToken 검증 + uid 만 추출
- [ ] OpenAI 사용량 알림 (콘솔 설정 필요)
- [ ] 시연 후 키 회전

---

> 본 문서는 팀원 인수인계 + 발표 평가 + 시연 가이드 통합본입니다.
> 변경 사항은 PR 로 제안하세요.
