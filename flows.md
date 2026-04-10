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

**테스트 값**: username=`test` / password=`test`

---

## [대시보드] 위젯 조회

**플로우**: 로그인 후 오늘 수업 일정 + 이번 주 출석률 + 미니 캘린더 + 다가오는 일정 표시

**테스트**:
```bash
curl https://classly-backend.onrender.com/dashboard \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/dashboard → 각 위젯 데이터 표시 확인

---

## [학생 관리] 목록 / 추가 / 검색 / 삭제

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

**플로우**: 09:00~22:00 그리드, 요일 `+` 클릭 → 수업 추가, 겹치는 시간 → Alert 에러

**테스트**:
```bash
curl https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/timetable
- 월요일 `+` → 14:00~16:00, 수학, A실 추가
- 동일 요일 14:30~15:30 추가 시도 → 에러 Alert 확인
- 수업 블록 X 버튼 → 삭제 확인

---

## [캘린더] 일정 CRUD

**플로우**: 날짜 클릭 → 일정 추가 Modal, 일정 클릭 → 상세/삭제

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
- 날짜 클릭 → 제목=`중간고사`, 유형=`시험` 추가 → 캘린더에 표시 확인
- 추가한 일정 클릭 → 삭제 Popconfirm 확인

---

## [출석 관리] QR 코드 생성

**플로우**: 반 선택 → QR 렌더 → 인쇄

**테스트**:
```bash
curl https://classly-backend.onrender.com/classes/ \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: https://classly-frontend.pages.dev/attendance
- 반 선택 드롭다운 → QR 코드 이미지 렌더 확인
- 시간표에 수업이 없으면 "등록된 반이 없습니다" Alert 확인

---

## [부모님 연락] 메시지 + AI 초안

**플로우**: 학부모 선택 → 메시지 작성 or AI 초안 생성(Drawer) → 발송

**테스트**:
```bash
# AI 초안 생성
curl -X POST https://classly-backend.onrender.com/messages/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"{학생UUID}","message_type":"custom","tone":"formal","reason":"이번 달 수학 성적이 많이 올랐습니다"}'
```
- 브라우저: https://classly-frontend.pages.dev/messages
- 학생 선택 → 우측 "AI 초안" 버튼 → Drawer 열림 → 초안 생성 확인

---

## [학생 모바일] 학원 가입 (join)

**플로우**: 초대 코드 발급 → `/join?code=XXXX` 접속 → 학생 정보 입력 → 계정 생성

**테스트**:
```bash
# 1. 초대 코드 발급
curl -X POST https://classly-backend.onrender.com/academy/generate-code \
  -H "Authorization: Bearer $TOKEN"
# → {"academy_code":"ABCD1234","invite_url":"classly.kr/join?code=ABCD1234"}

# 2. 브라우저에서 접속
# https://classly-frontend.pages.dev/join?code=ABCD1234
```
- 이름=`홍길동`, 학교=`테스트중`, 학년=`중1`, 전화=`010-0000-0001` 입력
- 완료 후 생성 아이디 확인: `홍길동0001`
- 초기 비밀번호 = 아이디와 동일

---

## [학생 모바일] QR 출석 체크 (attend)

**플로우**: QR 스캔 → `/attend?class={id}&t={timestamp}` → 학생 로그인 → GPS 검증 → 출석/지각

**테스트**:
```bash
# 수업 ID 확인
curl https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN"

# 브라우저 직접 접속
# https://classly-frontend.pages.dev/attend?class={위의ID}&t=1234567890
```
- 학생 로그인: `홍길동0001` / `홍길동0001`
- GPS 허용 → 위치 확인 후 출석/지각 결과 화면
- GPS 거부 → "GPS 미확인"으로 처리되는지 확인

---

## [학생 모바일] 성적 입력 세션 (grade-input)

**플로우**: 세션 생성 → `/grade-input?session={id}` → 학생 로그인 → 과목 입력 → 제출

**테스트**:
```bash
# 1. 세션 생성
curl -X POST https://classly-backend.onrender.com/grade-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026","exam_type":"1학기_중간"}'
# → {"id":"uuid-...","url":"https://classly-frontend.pages.dev/grade-input?session=uuid-..."}

# 2. 브라우저 접속
# https://classly-frontend.pages.dev/grade-input?session={위의id}
```
- 학생 로그인 후 국어(85/2등급), 영어(90/1등급), 수학(78/3등급) 입력 → 제출
- 같은 세션 재접속 → "이미 제출" 화면 확인

---

## [학생 모바일] 마이페이지 (student/mypage)

**플로우**: 학생 로그인 → 내 정보 확인 → 아이디/비밀번호 변경

**테스트**:
- 브라우저: https://classly-frontend.pages.dev/student/login
- `홍길동0001` / `홍길동0001` 로그인 → `/student/mypage` 이동
- 비밀번호 변경: 현재=`홍길동0001`, 새 비번=`newpass1` → 변경 후 재로그인 확인
- 아이디 변경 카드: `username_changed=0`인 계정만 표시되는지 확인

---

## [성적 관리] 학생 상세 성적 탭

**플로우**: 학생 클릭 → 상세 모달 → 성적 탭 → 연도별/시험별 rowspan 테이블

**테스트**:
```bash
# 학생 UUID 확인 후
curl "https://classly-backend.onrender.com/students/{student_id}/grades" \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `/students` → `강태양` 클릭 → 성적 탭 → 연도/학기별 rowspan 확인
