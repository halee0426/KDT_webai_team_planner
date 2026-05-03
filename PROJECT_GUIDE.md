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

## 6. 데이터 모델

### 5.1 Firestore 컬렉션

```
users/{uid}                      ← User 프로필
  ├ displayName, email, photoURL, provider, preferences, consent
  ├ sharedEvents/{eventId}       ← 개인 일정 (SharedEvent)
  └ myGroups/{groupId}           ← 내가 속한 그룹 인덱스 (denormalized)

groups/{groupId}                 ← 그룹 본체
  ├ name, ownerUid, ownerName
  ├ memberUids: string[]         (최대 10)
  ├ memberNames: { [uid]: string }
  ├ memberPhotos: { [uid]: string }
  ├ inviteCode: string (6자리)
  ├ createdAt: number
  ├ events/{eventId}             ← 그룹 일정
  └ todos/{todoId}               ← 그룹 할일

invites/{inviteCode}             ← 6자리 코드 → 그룹 매핑
  └ groupId, groupName, ownerUid, createdAt

pendingInvites/{emailKey}/list/{inviteId}
  └ groupId, groupName, invitedBy, invitedByName, invitedAt
```

### 5.2 핵심 타입

```ts
// src/components/eventStore.ts
type SharedEvent = {
  id: number;
  year: number;
  month: number;     // 0-11
  startDay: number;
  endDay: number;
  title: string;
  color: string;
  startSlot?: number;  // 0-47 (30분 단위)
  endSlot?: number;
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
```

### 5.3 Security Rules (요약)

```
match /users/{uid}/{collection=**} {
  allow read, write: if request.auth.uid == uid;
}

match /groups/{groupId} {
  allow read: if request.auth.uid in resource.data.memberUids;
  allow create: if 본인 owner + memberUids 본인만 + size <= 10;
  allow update: if 멤버이거나 (비멤버가 자기 자신 추가하는 경우 + 기존 멤버 보존);
  allow delete: if request.auth.uid == resource.data.ownerUid;

  match /events/{eventId}, /todos/{todoId} {
    allow read, write: if 멤버;
  }
}

match /invites/{inviteCode} {
  allow read: if 인증 사용자;
  allow create/delete: if owner;
}
```

---

## 7. AI 멀티 에이전트 아키텍처

### 6.1 흐름도

```
[ AIChatModal ]
      │ 자연어 입력
      ▼
[ /api/ai/orchestrate (Vercel Edge Function · Node Runtime) ]
      │
      ├─ ① Auth Gateway: idToken 검증 (firebase-admin)
      ├─ ② Context Resolver: 클라이언트 컨텍스트 + scope/group 정리
      │
      ▼
[ Orchestrator Agent ] — intent 분류 + 라우팅
      │
      ├─ Context Agent (선택)
      │
      ├─ Schedule Parser  ┐
      ├─ Task Breakdown   ├─ 병렬 실행
      └─ Goal/Mandala     ┘
      │
      ▼
[ Conflict Agent ] — 충돌·중복·과부하 검사
      │
      ▼
[ Response Composer ] — 사용자용 짧은 preview 응답
      │
      ▼
[ Preview Action Bundle ] (events/todos/mandala + warnings)
      │
      │ 사용자 승인
      ▼
[ AIChatModal "그대로 저장" 버튼ヲ ]
      │
      ▼
[ useSharedEventsSync.setEvents(...) ]
      │ Firestore 직접 write (Rules 가 본인 데이터만 보장)
      ▼
[ Firestore ]
```

### 6.2 Agent 별 책임

각 agent 의 시스템 프롬프트는 `src/server/agents/{agentName}.ts` 의 `XXX_SYSTEM_PROMPT` 상수로 관리. 모든 agent 공통:

- 직접 DB 접근 X
- 직접 저장/수정 X
- JSON 응답 강제
- 한국어 출력
- 추측 금지 → ambiguities 로 명시
- personal/group scope 분리

### 6.3 Edge Function 진입점

```ts
// api/ai/orchestrate.ts
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  // 1. POST 만 허용
  // 2. Authorization: Bearer {idToken} 검증
  // 3. body: { userRequest, scope, groupId?, referenceDate, context? }
  // 4. resolveContext(uid, body) → ResolvedContext
  // 5. runOrchestration(...) → OrchestrationResult
  // 6. 200 + JSON 또는 401/400/500 + error
}
```

### 6.4 비용 가드

- **단일 모델**: gpt-4o-mini 만 사용
- **JSON 모드**: 후처리 비용 0
- **선택적 Context Agent**: 단순 요청은 생략
- **병렬 specialist**: latency 최소화
- **사용자당 분당 5회 / 일당 50회 rate limit** (v2 — 현재 미구현)
- **cache** (v2 후보): 같은 입력 hash 시 LLM 호출 skip

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

# Firebase Admin (서버 전용 — idToken 검증용)
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
4. 서버: Orchestrator → Schedule Parser → Conflict → Composer
5. 응답: `{ replyText, preview: { events, todos, mandala }, warnings }`
6. 모달에 일정 카드 미리보기 + "그대로 저장" 버튼
7. 저장 클릭 → `setSharedEvents([...prev, ...newEvents])`
8. `useSharedEventsSync` 가 800ms 후 Firestore 저장

### 9.5 그룹 가입 흐름 (6자리 코드)

1. 그룹 owner: `GroupDetailSheet` → 코드 복사 → 카톡 전달
2. 가입자: `GroupSheet` → "코드로 참여" → 6자리 입력
3. 클라이언트: `joinByCode(uid, displayName, photoURL, code)`
4. Firestore: `invites/{code}` 조회 → `groups/{gid}.memberUids` 에 본인 추가 → `users/{uid}/myGroups/{gid}` 생성
5. (룰: 비멤버의 자기 자신 추가 분기 허용 + 기존 멤버 보존)
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
- 커밋: `[type(scope)]: 메시지` (예: `feat(group): 6자리 코드 가입`)
- PR 1명 리뷰 후 머지
- 일일 스탠드업 10분

---

## 11. 시연 시나리오 (발표용)

### 시나리오 1 — 개인 모드 + AI 자연어 일정

1. 로그인 → 빈 캘린더
2. AI 챗봇 ✨ → "다음 주 부산 2박 3일 가족 여행, 첫날 해운대"
3. 3초 후 일정 3~5개 자동 미리보기
4. "그대로 저장" → 캘린더 자동 채움 (800ms 후 Firestore 동기화)
5. 새로고침 → 데이터 그대로 유지

### 시나리오 2 — 그룹 협업 (실시간)

1. 그룹 만들기 → "연인" 이름 → 6자리 코드 발급
2. 카톡으로 코드 공유 → 상대방 합류
3. 양쪽 화면 나란히
4. 한쪽에서 일정 추가 → **800ms 안에 다른 쪽 자동 반영**
5. 헤더 멤버 썸네일 자동 갱신

### 시나리오 3 — AI 만다라트 분해

1. AI 챗봇 → "올해 영어 회화 마스터하고 싶어"
2. Goal/Mandala Agent → 9×9 만다라트 초안
3. 미리보기 확인 → 저장
4. 만다라트 뷰에서 81칸 자동 채움

### 시나리오 4 — 보안 검증 (선택)

1. 시크릿창 → 다른 계정 로그인
2. F12 콘솔에서 다른 uid 데이터 fetch 시도
3. → `403 Forbidden` (Security Rules 정상 작동)

---

## 12. 리스크 & 대응

| 리스크 | 대응 |
|--------|------|
| AI 응답 시간 (1~3초) | 로딩 스켈레톤 · "AI가 일정 짜는 중" 애니메이션 |
| AI 응답 부정확 | 항상 미리보기 → 사용자 수정 후 저장 + Conflict Agent 검증 |
| AI 비용 초과 | gpt-4o-mini 단일화 · JSON 모드 · 병렬 호출로 latency 최소 |
| AI 키 노출 | `src/server/*` 분리 + Vercel 환경변수 + 클라이언트 빌드물에 키 X |
| Firebase 무료 한도 (Spark) | 일 50K read · 20K write · 시연 한정 사용 |
| Firestore 권한 우회 | Security Rules 콘솔 게시 + 콘솔 fetch 테스트로 검증 |
| 그룹 삭제 후 stale 인덱스 | useMyGroups 자동 정리 |
| Google CDN photoURL CORS | `referrerPolicy="no-referrer"` + 이니셜 폴백 |
| Edge Function cold start | Node Runtime · 첫 호출만 ~500ms · 이후 빠름 |

---

## 13. 배포

### 13.1 Vercel 배포

1. GitHub 저장소 → Vercel 프로젝트 연결
2. 환경변수 등록 (Vercel 대시보드 → Project Settings → Environment Variables):
   - `OPENAI_API_KEY`
   - `FIREBASE_ADMIN_PROJECT_ID` / `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`
   - `VITE_FIREBASE_*` 6개 (클라이언트 빌드물에 포함)
   - `VITE_HOLIDAY_API_KEY`
3. `main` 푸시 → 자동 배포
4. URL 받기 (예: `https://haruon.vercel.app`)
5. Firebase Console → Authentication → Settings → 승인된 도메인 에 vercel 도메인 추가
6. Firestore Rules 게시 (한 번만)

### 13.2 PWA 시연 (모바일)

- iPhone Safari: 공유 → "홈 화면에 추가"
- Android Chrome: 메뉴 → "앱 설치"
- 설치 후 풀스크린 네이티브 앱 경험

### 13.3 발표장 시연 흐름

1. PC 에서 Vercel URL 띄움 + 시크릿창 두 개 (개인 / 그룹 멤버 두 계정)
2. QR 코드로 청중이 본인 폰에서 접속 가능 (선택)
3. 시나리오 1 → 2 → 3 순서로 시연
4. 마지막에 시나리오 4 (보안 검증) 로 차별화 강조

---

## 14. 향후 작업 (v2)

| 우선순위 | 작업 |
|---------|------|
| P0 | Planner Write Service (`/api/planner/commit`) — 서버 측 검증 강화 |
| P0 | Repository Layer 분리 — 도메인별 Firestore 래퍼 |
| P1 | todos / highlights / mandala / diaries Firestore 동기화 (sharedEvents 패턴 확장) |
| P1 | 비밀번호 재설정 (`sendPasswordResetEmail`) |
| P1 | 계정 탈퇴 시 Firestore 데이터 일괄 삭제 (`deleteUserData`) |
| P2 | AI 결과 캐시 (입력 hash → 결과 localStorage) |
| P2 | Streaming 응답 (인사이트 인사말 / 회고) |
| P2 | 공유 링크 + QR (1회성 스냅샷 공유) |
| P3 | 회고 자동 생성 (주간) |
| P3 | 카카오 로그인 |
| P3 | iOS/Android 진짜 네이티브 앱 (Capacitor) |

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
# 1. 클론
git clone https://github.com/halee0426/KDT_webai_team_planner
cd KDT_webai_team_planner

# 2. 의존성
npm install

# 3. .env.local 작성 (실제 키 입력)
cp .env.example .env.local
# 편집기로 .env.local 열고 키 채움

# 4. 개발 서버 (클라이언트만 — AI 챗봇은 mock 동작)
npm run dev

# 5. Edge Function 까지 로컬에서 테스트하려면 Vercel CLI
npm i -g vercel
vercel dev   # 포트 3000, /api/* 도 함께 동작
```

체크리스트:
- [ ] `localhost:5173` (또는 `:3000`) 접속
- [ ] 콘솔에 "Firebase: 더미 키로 초기화됨" 경고 X
- [ ] 햄버거 → 로그인 → Google 가능
- [ ] 일정 추가 → Firebase 콘솔 Firestore 에 문서 생성 확인

---

## 부록 B. 보안 체크리스트

- [x] `.env.local` git ignore
- [x] `.env.example` placeholder 만
- [x] `OPENAI_API_KEY` 클라이언트 빌드물에 X (`src/server/*` 분리)
- [x] `FIREBASE_ADMIN_PRIVATE_KEY` 서버 전용
- [x] Firestore Rules 게시 + fetch 403 검증
- [x] 그룹 read: 멤버만
- [x] 그룹 write: owner + 비멤버 join 분기
- [x] 로그아웃 시 localStorage 정리
- [ ] OpenAI 사용량 알림 (콘솔 설정 필요)
- [ ] 시연 후 키 회전 (배포 후)

---

> 본 문서는 팀원 인수인계 + 발표 평가 + 시연 가이드 통합본입니다.
> 변경 사항은 PR 로 제안하세요.
