# 하루온 (HaruOn) — 발표 PPT 내용 정의

> 디자인 기준: Simple IR Deck 스타일 (흰/연회색 배경, 민트 포인트 #00C9A7, 굵은 검정 대문자 타이틀)

---

## SLIDE 01 — COVER (표지)

**레이아웃**: 중앙 대형 타원(둥근사각형) + 장식 곡선 2개

- 상단 작은 텍스트: `SIMPLE STYLE`
- 메인 타이틀: `하루온 HaruOn`
- 서브타이틀: `연간 계획부터 10분 실행까지, AI와 함께 채우는 플래너`
- 하단: `KDT WebAI 4팀 · 2026.05`

---

## SLIDE 02 — TABLE OF CONTENTS (목차)

**레이아웃**: 좌 하단 "TABLE OF CONTENTS" 텍스트 / 우측 번호 뱃지 리스트

| 번호 | 항목 |
|---|---|
| 01 | 프로젝트 주제 및 목적 |
| 02 | 서비스 주요 화면 |
| 03 | 기술 스택 |
| 04 | DB 구조 설명 |
| 05 | 데이터 등록 기능 |
| 06 | 데이터 조회 기능 |
| 07 | 수정·삭제 기능 |
| 08 | 검색·필터 기능 |
| 09 | 통계·분석 기능 |
| 10 | API 테스트 화면 |
| 11 | 프론트엔드-백엔드 연동 |
| 12 | 팀원별 역할 및 개선 방향 |

---

## SLIDE 03 — PROJECT OVERVIEW (프로젝트 주제 및 목적)

**레이아웃**: INFORMATION 스타일 — 좌: 원형 이미지, 우: 설명 + 키워드 뱃지 3개

**내용**:
> 하루온은 목표 수립부터 10분 단위 실행까지, AI가 함께하는 개인 플래너 웹 서비스입니다.

- **문제**: 구글·네이버 캘린더에 없는 '연력(年曆)' 부재, 목표와 일상 실행의 단절
- **목적**: 연→월→주→일→10분 다중 스케일 계획 + AI 인사이트 제공
- **대상**: 목표 관리와 일정 실행을 하나의 앱에서 관리하고 싶은 사용자

**키워드 뱃지**: `#연력` `#10분플래너` `#AI어시스턴트`

---

## SLIDE 04 — KEY FEATURES (서비스 주요 화면)

**레이아웃**: SOLUTION 스타일 — 4개 원형 + PROCESS 번호 + 설명

| Process | 화면 | 설명 |
|---|---|---|
| 1 | 연력 (Year View) | 1년 52주를 한눈에 — 구글/네이버에 없는 차별화 기능 |
| 2 | 캘린더 + 10분 플래너 | 월간 일정 관리와 집중 실행을 한 화면에서 |
| 3 | 만다라트 목표 분해 | 핵심 목표를 9×9 그리드로 구체화 |
| 4 | AI 하루온봇 | 일정 파싱·주간 리캡·만다라트 자동 생성 |

---

## SLIDE 05 — TECH STACK (기술 스택)

**레이아웃**: 2×3 카드 그리드

| 카드 | 기술 |
|---|---|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| State | Zustand + localStorage 캐싱 |
| Database | Firebase Firestore (NoSQL) |
| Auth | Firebase Auth (Google·Email·Kakao) |
| API/AI | Vercel Edge Functions + OpenAI GPT-4o-mini |
| 배포 | Vercel (CI/CD 자동화) |

---

## SLIDE 06 — DATABASE STRUCTURE (DB 컬렉션 구조)

**레이아웃**: 좌: 컬렉션 트리, 우: 필드 정의 표

**Firestore 컬렉션 구조**:
```
users/{uid}/
 ├─ profile      uid · email · displayName · preferences
 ├─ events       id · date · title · color · startTime · endTime
 ├─ todos/{date} 날짜별 할 일 목록
 ├─ mandala      id · cells[81] · updatedAt
 └─ diaries/{date} 날짜별 일기

shares/{shareId}  ownerUid · scope · payload · expiresAt(30일)
```

**events 주요 필드**:

| 필드명 | 타입 | 설명 |
|---|---|---|
| id | string | 이벤트 고유 ID |
| date | string | YYYY-MM-DD |
| title | string | 제목 |
| color | string | 색상 코드 (#hex) |
| startTime | string | HH:MM (선택) |
| createdBy | string | 작성자 uid |
| createdAt | number | 타임스탬프 |

---

## SLIDE 07 — CREATE (데이터 등록 기능)

**레이아웃**: 좌: 화면 캡처, 우: Firebase 함수 + 설명

**시연 항목**:
1. 캘린더에서 날짜 클릭 → 이벤트 등록 폼 → 저장
2. 오늘 뷰에서 할 일 입력 → 추가
3. 일기 탭에서 내용 작성 → 저장

**호출 함수**: `addEvent()` · `upsertTodosForDate()` · `upsertDiary()`

---

## SLIDE 08 — READ (데이터 조회 기능)

**레이아웃**: 화면 캡처 3개 수평 배치

**시연 항목**:
1. 연력 뷰 — 1년 전체 활동 조회
2. 월간 캘린더 — 이벤트 컬러바 표시
3. 오늘 뷰 — 당일 일정 + 할 일 목록

**호출 함수**: `fetchEvents()` · `fetchTodos()` · `fetchDiaries()`

---

## SLIDE 09 — UPDATE & DELETE (수정·삭제 기능)

**레이아웃**: 좌우 비교 (수정 팝업 / 삭제 확인)

**시연 항목**:
- 이벤트 클릭 → 수정 팝업 → 타이틀·시간·색상 변경 → 저장
- 이벤트 삭제 버튼 → 확인 → 목록에서 제거
- 할 일 완료 체크 / 삭제

**호출 함수**: `updateEvent()` · `removeEvent()` · `upsertMandala()`

---

## SLIDE 10 — SEARCH & FILTER (검색·필터 기능)

**레이아웃**: 화면 캡처 + 하단 설명 카드

**시연 항목**:
- 날짜 클릭 → 해당 날짜 이벤트만 필터링
- 주간 뷰에서 날짜 범위 탐색
- 만다라트에서 목표별 항목 조회

**API 엔드포인트**: `GET /api/events?uid=...&date=YYYY-MM-DD`

---

## SLIDE 11 — STATISTICS (통계·분석 기능)

**레이아웃**: TRACTION 스타일 — 3개 지표 카드 + 차트

| 지표 | 내용 |
|---|---|
| 할 일 완료율 | 완료된 할 일 / 전체 할 일 (오늘 뷰) |
| AI 주간 리캡 | 한 주 요약 + 하이라이트 + 제안 |
| 연간 달성 현황 | 연력에서 색상으로 활동 밀도 시각화 |

**활용 라이브러리**: Recharts (차트 렌더링)

---

## SLIDE 12 — API TEST (API 테스트 화면)

**레이아웃**: 엔드포인트 목록 + Vercel 대시보드 캡처

**Vercel Edge Functions 엔드포인트**:

| Method | Endpoint | 기능 |
|---|---|---|
| POST | /api/ai/insight | 일일 AI 인사이트 생성 |
| POST | /api/ai/parse-event | 자연어 → 이벤트 파싱 |
| POST | /api/ai/mandala | 목표 → 만다라트 자동 분해 |
| POST | /api/ai/recap | 주간 요약 생성 |

- Firebase Firestore 콘솔에서 데이터 저장 확인
- Vercel 함수 로그로 API 동작 확인 (Swagger 대체)

---

## SLIDE 13 — ARCHITECTURE (프론트엔드-백엔드 연동)

**레이아웃**: SOLUTION 4단계 프로세스 흐름도

```
[1] React 화면 (사용자 입력)
        ↓
[2] Zustand Store ←→ localStorage 캐시
        ↓  Firebase SDK
[3] Firebase Firestore (보안 규칙: 소유자만 접근)
        ↓  실시간 동기화
[4] 다기기 반영 / AI API 호출

React → Vercel Edge Function → Firebase ID Token 검증
                             → OpenAI GPT-4o-mini
                             → Zod 검증 → 화면 적용
```

---

## SLIDE 14 — OUR TEAM (팀원별 역할)

**레이아웃**: OUR TEAM 스타일 — 원형 프로필 4개

| 이름 | 역할 | 담당 기능 |
|---|---|---|
| 김태동 | 앱 개발 | 모바일 UI, React 컴포넌트, PWA 설정 |
| 박성훈 | 백엔드 설계 | Firebase 구조·Firestore 스키마·보안 규칙 |
| 이현아 | 기획·웹 개발 | 서비스 기획, 웹 반응형, 연력·플래너 뷰 |
| 이창민 | AI 챗봇 | Vercel Edge Functions, OpenAI 연동, 하루온봇 |

---

## SLIDE 15 — ROADMAP (개선 방향)

**레이아웃**: GROWTH STRATEGY 타임라인

| 단계 | 목표 | 내용 |
|---|---|---|
| 단기 | AI 기능 완성 | insight·parse-event·mandala·recap API 구현 완료 |
| 중기 | 협업 기능 강화 | 팀 플랜 공유, 실시간 협업 모드 |
| 장기 | 앱 출시 | PWA 앱, 오프라인 지원, 소셜 플래너 |

---

## SLIDE 16 — CLOSING (마무리)

**레이아웃**: 표지와 동일한 중앙 타원 구성

> "연간 계획부터 10분 실행까지, AI와 함께 채우는 하루온"

- GitHub: https://github.com/halee0426/KDT_webai_team_planner
- KDT WebAI 4팀 | 김태동 · 박성훈 · 이현아 · 이창민
