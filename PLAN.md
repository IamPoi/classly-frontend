# Classly MVP 전체 플랜

## Context

인터뷰 결과 기반으로 MVP 방향 확정. 성취도 입력은 귀찮아서 안 한다는 피드백 → 제거하고 성적 기록 + 학생 개인 메모로 대체. 전체 플로우(회원가입 → 대시보드 → 각 기능)를 프론트 위주로 구현.

---

## 작업 범위 (프론트 UI 전용, 백엔드 없음)

### 기존 유지
- globals.css 디자인 토큰 (--accent, --sidebar-bg 등)
- Sidebar.tsx 구조 (네비게이션 패턴)
- @/* path alias, Tailwind + inline style 혼용 패턴

---

## 1. 라우트 구조 재설계

```
/                       → 로그인
/signup                 → 회원가입
/dashboard              → 메인 대시보드
/students               → 학생 목록
/students/[id]          → 학생 상세 (모달 or 페이지)
/timetable              → 시간표 관리
/calendar               → 일정 관리
/attendance             → 출석체크 QR 생성
/messages               → 부모님 연락 (카톡)
```

---

## 2. 파일별 변경/생성 목록

### A. 수정 파일

**`src/app/page.tsx` (로그인)**
- 현재 이메일/비밀번호 UI 유지
- "자동로그인" 체크박스 추가
- "회원가입" 링크(/signup) 추가

**`src/components/Sidebar.tsx`**
- 현재 3개 메뉴 → 5개로 확장
  - 학생 관리 (/students)
  - 시간표 관리 (/timetable)
  - 일정 관리 (/calendar)
  - 출석체크 QR (/attendance)
  - 부모님 연락 (/messages)
- 각 메뉴에 아이콘 추가

**`src/lib/dummyData.ts`**
- students에 필드 추가: school(학교), age(나이), phone(학생 전화번호), parentName(부모님 이름), memo(학생 메모)
- grades 배열 추가: 최근 3년 성적 데이터 (학생별)
- scheduleEvents 배열 추가: 일정 더미 데이터
- timetable 객체 추가: 요일별 수업 시간표
- groups 배열 추가: 부모님 연락 그룹

### B. 신규 생성 파일

**`src/app/signup/page.tsx`**
- 필드: 아이디, 비밀번호, 비밀번호 확인, 이메일, 학원 이름, 학원 주소
- 주소 입력 시 카카오 주소 API 연동 (다음 주소 검색 팝업)
- "3개월 무료 체험" 문구 강조
- 유효성 검사 UI (비밀번호 불일치 등)

**`src/app/dashboard/page.tsx` (전면 재작성)**
- 상단: 학원명 + 오늘 날짜
- 위젯 3개 (grid):
  1. 오늘 일정 (Today's Schedule)
  2. 이번 주 출석률
  3. 최근 연락 안 한 학생 (7일 이상)
- 달력 미니 위젯 (이번 달)
- 최근 발송 메시지 3개

**`src/app/students/page.tsx` (수정)**
- 테이블 컬럼: 이름, 학교, 학년, 나이, 학생 전화, 부모님 이름, 부모님 전화
- 행 클릭 → StudentDetailModal 팝업

**`src/components/StudentDetailModal.tsx` (신규)**
- 좌측: 기본 정보 (이름, 학교, 학년, 나이, 전화, 부모님 정보)
- 중앙: 학생 메모 (textarea, 자유 입력)
- 우측: 최근 3년 성적 테이블 (연도/학기별 점수)
- 모달 오버레이, ESC로 닫기

**`src/app/timetable/page.tsx` + layout.tsx (신규)**
- 7열(월~일) 그리드 시간표
- 각 셀 클릭 → 수업 추가/삭제
- 인쇄/PDF 버튼 (`window.print()` 활용)

**`src/app/calendar/page.tsx` + layout.tsx (신규)**
- 월간 달력 뷰
- 날짜 클릭 → 일정 추가 인라인 폼
- 일정 표시 (색상 점)

**`src/app/attendance/page.tsx` + layout.tsx (신규)**
- QR 코드 생성 영역 (qrcode.react 라이브러리 사용)
- 반/수업 선택 드롭다운
- QR 이미지 미리보기
- "PDF로 저장" + "인쇄하기" 버튼
- 출석 현황 최근 기록 테이블 (더미)

**`src/app/messages/page.tsx` (전면 재작성)**
- 좌측: 부모님 목록 (체크박스 + 이름 + 그룹 태그)
  - 검색창 (부모님 이름 or 그룹명)
  - 그룹 필터 탭
- 우측: 메시지 작성 패널
  - 선택된 수신자 표시
  - 메시지 textarea
  - "카카오톡으로 발송" 버튼 (노란색)
- 상단: 그룹 관리 버튼 → 그룹 추가/편집 모달

---

## 3. 설치 필요 패키지

```bash
npm install qrcode.react
```

---

## 4. 더미 데이터 확장 스키마

```typescript
// students 필드 추가
{
  school: "OO중학교",
  age: 14,
  phone: "010-0000-0000",
  parentName: "김OO",
  memo: "수업 집중도 높음. 서술형 약함.",
  grades: [
    { year: "2024", semester: "1학기", score: 85, rank: "3/30" },
    { year: "2024", semester: "2학기", score: 88, rank: "2/30" },
    { year: "2025", semester: "1학기", score: 91, rank: "1/30" },
  ]
}

// timetable
{
  월: [{ time: "15:00~17:00", class: "중2 수학", room: "A반" }],
  화: [...],
  ...
}

// groups
[
  { id: 1, name: "OO중학교", members: [1, 2, 3] },
  { id: 2, name: "2025학번", members: [4, 5] },
]

// scheduleEvents
[
  { id: 1, date: "2026-04-01", title: "중간고사 대비 특강", type: "수업" },
  { id: 2, date: "2026-04-10", title: "학부모 상담 주간", type: "상담" },
]
```

---

## 5. 레이아웃 공통화

현재 각 route마다 `layout.tsx`에 `<Sidebar />`가 중복 → 공통 layout으로 통합

**`src/app/(dashboard)/layout.tsx`** (Route Group 사용)
- dashboard, students, timetable, calendar, attendance, messages를 묶음
- 한 번만 Sidebar 선언

---

## 6. 구현 순서

1. `dummyData.ts` 확장
2. Sidebar 메뉴 5개로 확장 + Route Group layout 통합
3. 로그인 페이지 (자동로그인 체크박스, 회원가입 링크)
4. 회원가입 페이지
5. 대시보드 재작성 (위젯 3개 + 미니 달력)
6. 학생 관리 + StudentDetailModal
7. 시간표 관리
8. 일정 관리 (달력)
9. 출석체크 QR 생성
10. 부모님 연락 (메시지 전면 재작성)

---

## 7. 검증

- `npm run build` 타입 에러 없이 통과
- 각 라우트 localhost:3000/{route} 직접 접근 정상 렌더
- 학생 클릭 → 모달 오픈/클로즈 동작
- QR 코드 화면 출력 확인
- 인쇄 버튼 → 브라우저 print dialog 열림

---

## 8. TODO 리스트

### 인프라 / 공통
- [ ] Route Group `(dashboard)` 으로 Sidebar layout 통합
- [ ] `dummyData.ts` 확장 (school, age, phone, parentName, memo, grades, timetable, scheduleEvents, groups)
- [ ] `qrcode.react` 패키지 설치

### 페이지 구현
- [ ] `/` 로그인 — 자동로그인 체크박스, 회원가입 링크 추가
- [ ] `/signup` 회원가입 — 아이디/비밀번호/이메일/학원이름/학원주소, 카카오 주소 API
- [ ] `/dashboard` 대시보드 재작성 — 위젯 3개(오늘 일정, 출석률, 미연락 학생) + 미니 달력
- [ ] `/students` 학생 관리 — 테이블 컬럼 확장, 행 클릭 → 모달
- [ ] `/timetable` 시간표 관리 — 7열 그리드, 수업 추가/삭제, PDF 인쇄
- [ ] `/calendar` 일정 관리 — 월간 달력, 일정 추가, 색상 점
- [ ] `/attendance` 출석체크 QR — QR 생성, PDF/인쇄 버튼, 출석 현황 테이블
- [ ] `/messages` 부모님 연락 — 체크박스 목록, 그룹 필터, 카톡 발송 버튼

### 컴포넌트
- [ ] `Sidebar.tsx` — 메뉴 5개로 확장 + 아이콘
- [ ] `StudentDetailModal.tsx` — 기본정보 + 메모 + 성적 테이블, ESC 닫기

### 최종 확인
- [ ] `npm run build` 통과
- [ ] 전체 라우트 동작 확인
