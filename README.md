# KDT WebAI Team Planner

> **1년의 흐름부터 10분의 집중까지, 함께 채우는 AI 플래너**

연력의 큰 그림과 10분 플래너의 미시적 실행을 한 앱에서 잇고, 그 사이의 번거로움을 AI가 거드는 모바일 우선 웹앱.

자세한 기획·기술·일정은 [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) 또는 [`guide.html`](./guide.html) (브라우저에서 열기) 참조.

---

## 🚀 시작하기

```bash
# 1) 의존성 설치
npm install

# 2) 환경 변수 설정
cp .env.example .env.local
# .env.local 열어서 OpenAI API 키와 Firebase 설정 입력

# 3) 개발 서버 실행 (port 5173)
npm run dev
```

---

## 📁 프로젝트 구조

```
src/
├─ App.tsx                  # 라우팅 · 부트스트랩
├─ main.tsx                 # ReactDOM mount
│
├─ components/
│  ├─ views/               # 6개 메인 뷰 (연력·달력·주력·일력·10분·만다라트·일기)
│  ├─ ai/                  # AI 입력·미리보기
│  ├─ auth/                # 로그인·회원가입·라우트 가드
│  ├─ shared/              # TabBar·FAB·InsightGreeting
│  └─ ui/                  # shadcn/ui (자동 생성, 추후 추가)
│
├─ store/                  # Zustand 전역 상태
│  ├─ userStore.ts         # 인증 + 프로필
│  ├─ eventStore.ts        # 도메인 데이터 (events·todos·highlights·mandala·diaries)
│  ├─ themeStore.ts        # 라이트/다크 + 액센트
│  └─ aiStore.ts           # AI 호출 큐·캐시
│
├─ lib/
│  ├─ ai/                  # OpenAI 호출 래퍼 + 프롬프트 + Zod 스키마
│  ├─ firebase/            # Firebase Auth + Firestore 동기화 + 공유
│  └─ utils/               # 날짜·시간·rollover
│
├─ hooks/                  # useAuth · useTheme
├─ types/                  # User · Event · Mandala · Share · AI
├─ styles/                 # globals.css · tokens.ts
└─ api/ai/                 # Vercel Edge Functions (insight·parse-event·mandala·recap)
```

---

## 👥 팀원 작업 분담

| 역할 | 담당 영역 | 주로 만지는 폴더 |
|------|----------|------------------|
| **A. 프론트 리드** | 라우팅·디자인 토큰·6개 뷰 통합 | `App.tsx`, `components/views/*`, `styles/tokens.ts` |
| **B. UI/UX** | shadcn 커스터마이즈·모바일·다크모드·인사이트 카드 | `components/shared/*`, `styles/globals.css` |
| **C. AI 엔지니어** | OpenAI 통합·프롬프트·미리보기·Streaming | `lib/ai/*`, `components/ai/*`, `api/ai/*` |
| **D. 백엔드/인증/배포** | Firebase Auth·Firestore·공유 링크·Vercel | `lib/firebase/*`, `components/auth/*`, `firestore.rules` |

---

## 🔧 협업 규칙

- 브랜치: `main` (배포) / `dev` (통합) / `feat/<영역>-<짧은이름>` (개인)
- PR: 최소 1명 리뷰 후 머지
- 커밋 메시지: `[영역] 내용` — 예: `[ai] 만다라트 분해 프롬프트 추가`
- 일일 스탠드업: 10분 (어제·오늘·블로커)
- 같은 파일 동시 작업 X — 시작 시 채팅에 한 줄 공지

---

## 🔐 보안 원칙

- `OPENAI_API_KEY`는 Vercel Edge Functions의 환경변수에만 (절대 클라이언트 코드에 X)
- Firebase Security Rules로 본인 `uid` 데이터만 read/write
- AI 호출 시 `idToken` 검증으로 익명 호출 차단
- AI 결과는 항상 사용자 미리보기 → 승인 단계를 거쳐야 저장

---

## 📝 라이선스

팀 프로젝트 — 학습 목적
