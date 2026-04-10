# Classly 기능 플로우 & 테스트 문서

> 신규 기능은 항상 **위쪽**에 추가할 것.
> "테스트해줘"라고 하면 이 파일 기준으로 순서대로 테스트 진행.

---

## 🌐 배포 환경

| 구분 | URL |
|------|-----|
| **프론트 (배포)** | https://classly-frontend.pages.dev |
| **백엔드 (배포)** | https://classly-backend.onrender.com |
| **프론트 (로컬)** | http://localhost:3000 |
| **백엔드 (로컬)** | http://localhost:8000 |

### ⚠️ Render 무료 플랜 주의
첫 요청 시 서버 재시작으로 **50초 대기**가 발생할 수 있음.
테스트 전 아래 명령어로 백엔드 먼저 깨워두기:
```bash
curl https://classly-backend.onrender.com/health
# → {"status":"ok"} 나올 때까지 대기
```

### 로컬 서버 실행
```bash
# 백엔드
cd /Users/bagchang-yun/projects/classly/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프론트
cd /Users/bagchang-yun/projects/classly
npm run dev
```

### 프론트 재배포
```bash
cd /Users/bagchang-yun/projects/classly
npm run build
CLOUDFLARE_API_TOKEN=cfut_NbgezPFm2bIZ5bUNjjjLop1lUQgpPrWyxA0oJqzia8f570bf \
  npx wrangler pages deploy dist --project-name=classly-frontend
```

---

## 👤 테스트 계정 목록

> 회원가입(join) 테스트를 제외한 모든 기능은 아래 계정으로 로그인해서 테스트.

### 선생님 (대시보드/관리 기능)
| 역할 | username | password | 비고 |
|------|----------|----------|------|
| 선생님 | `test` | `test` | 모든 선생님용 API 테스트에 사용 |

### 학생 (모바일 기능)
> 초기 비밀번호 = 아이디와 동일

| 이름 | username | password | 학교/학년 | 소속 반 |
|------|----------|----------|----------|---------|
| 강태양 | `강태양0000` | `강태양0000` | 푸른중학교 / 중2 | 중등수학반 |
| 오재원 | `오재원8888` | `오재원8888` | 늘봄중학교 / 중2 | 중등수학반 |
| 한소희 | `한소희7777` | `한소희7777` | 늘봄중학교 / 중1 | 중등수학반 |
| 배준혁 | `배준혁3001` | `배준혁3001` | 강남고등학교 / 고1 | 고등영어반 |
| 송지아 | `송지아3002` | `송지아3002` | 강남고등학교 / 고2 | 고등영어반 |
| 황민찬 | `황민찬3003` | `황민찬3003` | 서울고등학교 / 고1 | 고등영어반 |
| 홍길동 | `홍길동0001` | `홍길동0001` | 테스트중 / 중1 | 초등국어반 (join 테스트 후 생성) |

### DB 기적재 데이터 (test 계정 기준)
| 항목 | 내용 |
|------|------|
| 학생 | 16명 (강태양, 오재원, 한소희 등) |
| 반 | 중등수학반(A실/수학), 고등영어반(B실/영어), 초등국어반(C실/국어) |
| 시간표 | 중등수학반 월/수/금 14-16시, 고등영어반 화/목 16-18시, 초등국어반 토 10-12시 |
| 캘린더 | 4월~5월 시험/상담/휴원 일정 다수 |
| 성적 | 강태양, 황민찬, 배준혁 등 주요 학생 성적 데이터 |
| 상담일지 | 강태양, 배준혁, 송지아, 박지훈 상담 기록 |

---

## 공통 — 선생님 토큰 발급 (모든 API 테스트 전 실행)

```bash
TOKEN=$(curl -s -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo $TOKEN
```

---

## [인증] 선생님 로그인 / auth guard

> **로그인 계정**: username=`test` / password=`test`

**플로우**:
1. 로그인 → JWT 발급 → localStorage 저장 → 대시보드 이동
2. 토큰 없이 `/dashboard` 접속 → `/`로 리다이렉트

**테스트**:
```bash
# 정상 로그인
curl -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# → access_token 포함 응답

# 잘못된 비밀번호
curl -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'
# → 401 에러
```
- 브라우저: https://classly-frontend.pages.dev → 로그인 → 대시보드 진입 확인
- localStorage에서 `token` 삭제 후 `/dashboard` 새로고침 → `/`로 리다이렉트 확인

---

## [대시보드] 위젯 조회

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 로그인 후 오늘 수업 일정 + 이번 주 출석률 + 미니 캘린더 + 다가오는 일정 표시

**테스트**:
```bash
curl https://classly-backend.onrender.com/dashboard \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/dashboard → 각 위젯 데이터 표시 확인

---

## [학생 관리] 목록 / 추가 / 검색 / 삭제

> **로그인 계정**: username=`test` / password=`test`

**플로우**:
1. 전체 학생 목록 Table 표시
2. 이름 검색 / 학교 자동완성 / 학년 Select 필터
3. `+ 학생 추가` → Modal Form → 저장
4. 삭제 버튼 → Popconfirm → 삭제

**테스트**:
```bash
# 학생 목록
curl https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN"

# 학생 추가
curl -X POST https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트학생","school":"테스트중학교","grade":"중1","phone":"010-9999-0002","parent_type":"부"}'
```
- 브라우저: https://classly-frontend.pages.dev/students
- 이름 검색 `강태양` → 결과 확인
- 학생 클릭 → 상세 모달(기본정보 / 성적 / 상담일지 탭) 확인
- 추가한 `테스트학생` Popconfirm 삭제 확인

---

## [시간표] 수업 블록 추가 / 조회 / 삭제

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 09:00~22:00 그리드, 요일 `+` 클릭 → 수업 추가, 겹치는 시간 → Alert 에러

**기적재 시간표**:
- 중등수학반: 월/수/금 14:00~16:00 (A실)
- 고등영어반: 화/목 16:00~18:00 (B실)
- 초등국어반: 토 10:00~12:00 (C실)

**테스트**:
```bash
curl https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/timetable
- 기적재 블록 표시 확인
- 월요일 `+` → 18:00~20:00, 국어, D실 추가 (기존 14-16시와 시간 다름 → 성공)
- 월요일 14:30~15:30 추가 시도 → 겹침 에러 Alert 확인
- 수업 블록 X 버튼 → 삭제 확인

---

## [캘린더] 일정 CRUD

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 날짜 클릭 → 일정 추가 Modal, 일정 클릭 → 상세/삭제

**기적재 일정**: 4/14 봄학기 중간고사 시작, 4/20 중간고사, 4/25 학부모 상담 주간, 5/5 어린이날 휴원 등

**테스트**:
```bash
# 일정 목록
curl https://classly-backend.onrender.com/events/ \
  -H "Authorization: Bearer $TOKEN"

# 일정 추가
curl -X POST https://classly-backend.onrender.com/events/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"중간고사","event_date":"2026-04-20","type":"시험"}'
```
- 브라우저: https://classly-frontend.pages.dev/calendar
- 캘린더에 기적재 일정 표시 확인
- 날짜 클릭 → 제목=`중간고사`, 유형=`시험` 추가 → 캘린더에 표시 확인
- 추가한 일정 클릭 → 삭제 Popconfirm 확인

---

## [출석 관리] QR 코드 생성

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 반 선택 → QR 렌더 → 인쇄

**기적재 반 ID**:
- 중등수학반: `aaa00001-0000-0000-0000-000000000001`
- 고등영어반: `aaa00001-0000-0000-0000-000000000002`
- 초등국어반: `aaa00001-0000-0000-0000-000000000003`

**테스트**:
```bash
curl https://classly-backend.onrender.com/classes/ \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/attendance
- 반 선택 드롭다운 → `중등수학반` 선택 → QR 코드 이미지 렌더 확인

---

## [부모님 연락] 메시지 + AI 초안 (Grok)

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 학부모 선택 → 메시지 작성 or AI 초안 생성(Drawer) → 발송

> ⚠️ Render 환경변수 `GROK_API_KEY` 설정 필요. 키 발급: https://console.x.ai
> ⚠️ **주의**: 환경변수 이름이 `GROK_API_KEY`인지 확인 (`GROQ`가 아님)

**테스트**:
```bash
# 학생 UUID 먼저 확인 (강태양 사용)
STUDENT_ID=$(curl -s https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
students = json.load(sys.stdin)
t = next(s for s in students if s['name']=='강태양')
print(t['id'])
")
echo $STUDENT_ID

# AI 초안 생성
curl -X POST https://classly-backend.onrender.com/messages/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"student_id\":\"$STUDENT_ID\",\"message_type\":\"grade\",\"tone\":\"formal\",\"reason\":\"이번 달 수학 성적이 많이 올랐습니다\"}"
# → {"draft": "...", "student_name": "강태양", "parent_phone": "010-9009-9999"}
```
- 브라우저: https://classly-frontend.pages.dev/messages
- `강태양` 선택 → 우측 "AI 초안" 버튼 → Drawer 열림 → 초안 생성 확인

---

## [학생 모바일] 학원 가입 (join)

> **이 기능은 별도 로그인 불필요** — 학원 코드로 접속 후 신규 계정 생성

**플로우**: 초대 코드 발급 → `/join?code=XXXX` 접속 → 학생 정보 입력 → 계정 생성

**테스트**:
```bash
# 1. 선생님 토큰으로 초대 코드 발급
curl -X POST https://classly-backend.onrender.com/academy/generate-code \
  -H "Authorization: Bearer $TOKEN"
# → {"academy_code":"ABCD1234","invite_url":"https://classly-frontend.pages.dev/join?code=ABCD1234"}

# 2. 브라우저에서 접속 (위에서 받은 코드 사용)
# https://classly-frontend.pages.dev/join?code=ABCD1234
```
- 이름=`홍길동`, 학교=`테스트중`, 학년=`중1`, 전화=`010-0000-0001` 입력
- 완료 후 생성 아이디 확인: `홍길동0001`
- 초기 비밀번호 = 아이디와 동일 (`홍길동0001`)

> ⚠️ 동일한 전화번호로 재가입 시 409 "이미 가입된 계정" 에러 — 테스트 전 DB에서 삭제하거나 전화번호 변경

---

## [학생 모바일] QR 출석 체크 (attend)

> **로그인 계정**: `강태양0000` / `강태양0000` (학생 계정)

**플로우**: QR 스캔 → `/attend?class={id}&t={timestamp}` → 학생 로그인 → GPS 검증 → 출석/지각

**테스트**:
```bash
# 수업 ID 확인 (기적재: 중등수학반 = aaa00001-0000-0000-0000-000000000001)
curl https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN"

# 브라우저 직접 접속 (중등수학반 QR 시뮬레이션)
# https://classly-frontend.pages.dev/attend?class=aaa00001-0000-0000-0000-000000000001&t=1234567890
```
- 학생 로그인: `강태양0000` / `강태양0000`
- GPS 허용 → 위치 확인 후 출석/지각 결과 화면
- GPS 거부 → "GPS 미확인"으로 처리되는지 확인

---

## [학생 모바일] 성적 입력 세션 (grade-input)

> **로그인 계정**: `강태양0000` / `강태양0000` (학생 계정)

**플로우**: 세션 생성 → `/grade-input?session={id}` → 학생 로그인 → 과목 입력 → 제출

**테스트**:
```bash
# 1. 선생님 토큰으로 세션 생성
curl -X POST https://classly-backend.onrender.com/grade-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026","exam_type":"1학기_중간"}'
# → {"id":"uuid-...","url":"https://classly-frontend.pages.dev/grade-input?session=uuid-..."}

# 2. 브라우저 접속 (위에서 받은 URL 사용)
# https://classly-frontend.pages.dev/grade-input?session={위의id}
```
- 학생 로그인: `강태양0000` / `강태양0000`
- 국어(85/2등급), 영어(90/1등급), 수학(78/3등급) 입력 → 제출
- 같은 세션 재접속 → "이미 제출" 화면 확인

---

## [학생 모바일] 마이페이지 (student/mypage)

> **로그인 계정**: `홍길동0001` / `홍길동0001` (join 테스트 후 생성된 계정)
> join 테스트 전이라면: `강태양0000` / `강태양0000` 사용

**플로우**: 학생 로그인 → 내 정보 확인 → 아이디/비밀번호 변경

**테스트**:
- 브라우저: https://classly-frontend.pages.dev/student/login
- `홍길동0001` / `홍길동0001` 로그인 → `/student/mypage` 이동
- 비밀번호 변경: 현재=`홍길동0001`, 새 비번=`newpass1` → 변경 후 재로그인 확인
- 아이디 변경 카드: `username_changed=0`인 계정만 표시되는지 확인 (홍길동은 최초 가입이라 변경 가능)

---

## [성적 관리] 학생 상세 성적 탭

> **로그인 계정**: username=`test` / password=`test`

**플로우**: 학생 클릭 → 상세 모달 → 성적 탭 → 연도별/시험별 rowspan 테이블

**테스트**:
```bash
# 강태양 UUID = 7886e6fa-59fd-424c-a27f-175fdfa72795
curl "https://classly-backend.onrender.com/students/7886e6fa-59fd-424c-a27f-175fdfa72795/grades" \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `/students` → `강태양` 클릭 → 성적 탭 → 연도/학기별 rowspan 확인
- 상담일지 탭 → 강태양 기적재 상담 2건 확인
