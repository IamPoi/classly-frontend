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

### 선생님 (대시보드/관리 기능)
| 역할 | username | password |
|------|----------|----------|
| 선생님 | `test` | `test` |

### 학생 (모바일 기능) — DB 기적재
> 선생님이 직접 등록한 계정. 초기 비밀번호 = 아이디 (한글→영자판 변환 + 전화뒷4자리)

| 이름 | username | password | 학교/학년 | 소속 반 |
|------|----------|----------|----------|---------|
| 강태양 | `강태양0000` | `강태양0000` | 푸른중학교 / 중2 | 중등수학반 |
| 오재원 | `오재원8888` | `오재원8888` | 늘봄중학교 / 중2 | 중등수학반 |
| 한소희 | `한소희7777` | `한소희7777` | 늘봄중학교 / 중1 | 중등수학반 |
| 배준혁 | `배준혁3001` | `배준혁3001` | 강남고등학교 / 고1 | 고등영어반 |
| 송지아 | `송지아3002` | `송지아3002` | 강남고등학교 / 고2 | 고등영어반 |
| 황민찬 | `황민찬3003` | `황민찬3003` | 서울고등학교 / 고1 | 고등영어반 |

> ⚠️ 위 학생들은 DB에 직접 적재된 계정(한글 아이디)이라 기존 방식 유지. 신규 join 계정은 아이디 직접 입력.

### DB 기적재 데이터 요약
| 항목 | 내용 |
|------|------|
| 학생 | 16명 (강태양, 오재원, 한소희 등) |
| 반 | 중등수학반(A실/수학), 고등영어반(B실/영어), 초등국어반(C실/국어) |
| 시간표 | 중등수학반 월/수/금 14-16시, 고등영어반 화/목 16-18시, 초등국어반 토 10-12시 |
| 캘린더 | 4월~5월 시험/상담/휴원 일정 다수 |
| 성적 | 강태양(25건), 황민찬(36건), 배준혁(36건) 등 |
| 상담일지 | 강태양(2건), 배준혁, 송지아, 박지훈 각 1건 |

---

## 공통 — 선생님 토큰 발급 (모든 API 테스트 전 실행)

```bash
TOKEN=$(curl -s -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
echo $TOKEN
```
**기대 결과**: `$TOKEN` 에 JWT 문자열 저장 (eyJ... 형태)

---

## [인증] 선생님 로그인 / auth guard

> **로그인 계정**: `test` / `test`

**플로우**:
1. 로그인 → JWT 발급 → localStorage 저장 → 대시보드 이동
2. 토큰 없이 `/dashboard` 접속 → `/`로 리다이렉트

**테스트 & 기대 결과**:
```bash
# 정상 로그인 → 200 + access_token
curl -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

```bash
# 잘못된 비밀번호 → 401
curl -X POST https://classly-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'
```
```json
{"detail": "아이디 또는 비밀번호가 올바르지 않습니다."}
```

- 브라우저: https://classly-frontend.pages.dev 로그인 → `/dashboard` 이동 확인
- localStorage `token` 삭제 후 `/dashboard` 접속 → `/` 리다이렉트 확인

---

## [대시보드] 위젯 조회

> **로그인 계정**: `test` / `test`

**플로우**: 오늘 수업 일정 + 이번 주 출석률 + 미니 캘린더 + 연락 안 한 학생 목록

**테스트 & 기대 결과**:
```bash
curl https://classly-backend.onrender.com/dashboard \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "today_events": [...],
  "attendance_rate": 0,
  "attendance_total": 0,
  "no_contact_students": [...],
  "recent_messages": [...]
}
```
> `attendance_rate`는 이번 주 출석 데이터 없으면 `0` (null 아님)

- 브라우저: https://classly-frontend.pages.dev/dashboard → 4개 위젯 렌더 확인

---

## [학생 관리] 목록 / 추가 / 검색 / 삭제

> **로그인 계정**: `test` / `test`

**플로우**:
1. 전체 학생 목록 Table 표시
2. 이름 검색 / 학교 자동완성 / 학년 Select 필터
3. `+ 학생 추가` → Modal Form → 저장
4. 삭제 버튼 → Popconfirm → 삭제

**테스트 & 기대 결과**:
```bash
# 학생 목록 → 200, 16명 배열
curl https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN"
```
```json
[
  {"id": "7886e6fa-...", "name": "강태양", "school": "푸른중학교", "grade": "중2",
   "phone": "010-9999-0000", "username": "강태양0000", ...},
  ...
]
```

```bash
# 학생 추가 → 201 + id, username
curl -X POST https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트학생","school":"테스트중학교","grade":"중1","phone":"010-9999-0002"}'
```
```json
{"id": "uuid-...", "username": "xptmxjgktkr9002"}
```
> username = `테스트학생` 한글→영자판 변환 + 전화뒷4자리 `0002`

```bash
# 삭제 → 204 응답 본문 없음
curl -X DELETE https://classly-backend.onrender.com/students/{위의id} \
  -H "Authorization: Bearer $TOKEN"
```

- 브라우저: https://classly-frontend.pages.dev/students
- 이름 검색 `강태양` → 1건 필터링 확인
- `강태양` 클릭 → 상세 모달 (기본정보 / 성적 / 상담일지 탭) 확인
- 성적 탭 → 연도별/시험별 rowspan 테이블 확인
- 상담일지 탭 → 기적재 2건 확인

---

## [시간표] 수업 블록 추가 / 조회 / 삭제

> **로그인 계정**: `test` / `test`

**플로우**: 09:00~22:00 그리드, 요일 `+` 클릭 → 수업 추가, 겹치는 시간 → 409 에러

**기적재 시간표**:
- 중등수학반: 월/수/금 14:00~16:00 (A실)
- 고등영어반: 화/목 16:00~18:00 (B실)
- 초등국어반: 토 10:00~12:00 (C실)

**테스트 & 기대 결과**:
```bash
# 시간표 조회 → 요일별 그룹핑 객체
curl https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "월": [{"id":"bbb...", "class_name":"중등수학반", "start_time":"14:00", "end_time":"16:00", "room":"A실", ...}],
  "화": [{"class_name":"고등영어반", "start_time":"16:00", "end_time":"18:00", ...}],
  "수": [...], "목": [...], "금": [...],
  "토": [{"class_name":"초등국어반", "start_time":"10:00", "end_time":"12:00", ...}],
  "일": []
}
```

```bash
# 겹치지 않는 시간 추가 → 201 성공
curl -X POST https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"day_of_week":"월","start_time":"18:00","end_time":"20:00","class_name":"테스트반","color":"#000000"}'
```
```json
{"id": "uuid-..."}
```

```bash
# 겹치는 시간 추가 → 409
curl -X POST https://classly-backend.onrender.com/schedules/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"day_of_week":"월","start_time":"14:30","end_time":"15:30","class_name":"겹치는반","color":"#000000"}'
```
```json
{"detail": "해당 시간대에 이미 수업이 있습니다."}
```

- 브라우저: https://classly-frontend.pages.dev/timetable → 기적재 블록 표시 확인
- 겹치는 시간 추가 시도 → 에러 Alert 확인, 추가되지 않음 확인

---

## [캘린더] 일정 CRUD

> **로그인 계정**: `test` / `test`

**플로우**: 날짜 클릭 → 일정 추가 Modal, 일정 클릭 → 상세/삭제

**기적재 일정**: 4/14 중간고사 시작, 4/20 중간고사, 4/25 학부모 상담 주간, 5/5 어린이날 휴원 등 8건

**테스트 & 기대 결과**:
```bash
# 일정 목록 → 200, 배열
curl https://classly-backend.onrender.com/events/ \
  -H "Authorization: Bearer $TOKEN"
```
```json
[
  {"id":"ccc...", "title":"봄학기 중간고사 시작", "event_date":"2026-04-14", "type":"시험", "color":"#ef4444"},
  {"id":"ccc...", "title":"중간고사", "event_date":"2026-04-20", "type":"시험", ...},
  ...
]
```

```bash
# 일정 추가 → 201 + id
curl -X POST https://classly-backend.onrender.com/events/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트일정","event_date":"2026-04-30","type":"기타"}'
```
```json
{"id": "uuid-..."}
```

```bash
# 삭제 → 204
curl -X DELETE https://classly-backend.onrender.com/events/{위의id} \
  -H "Authorization: Bearer $TOKEN"
```

- 브라우저: https://classly-frontend.pages.dev/calendar → 기적재 일정 배지 표시 확인
- 날짜 클릭 → 추가 모달 → 저장 → 캘린더에 즉시 반영 확인
- 일정 클릭 → Popconfirm 삭제 확인

---

## [출석 관리] QR 코드 생성

> **로그인 계정**: `test` / `test`

**플로우**: 반 선택 → QR 렌더 → 인쇄

**기적재 반 ID**:
- 중등수학반: `aaa00001-0000-0000-0000-000000000001`
- 고등영어반: `aaa00001-0000-0000-0000-000000000002`
- 초등국어반: `aaa00001-0000-0000-0000-000000000003`

**테스트 & 기대 결과**:
```bash
# 반 목록 → 200
curl https://classly-backend.onrender.com/classes/ \
  -H "Authorization: Bearer $TOKEN"
```
```json
[
  {"id":"aaa00001-...-000000000001", "label":"중등수학반", "subject":"수학", "room":"A실", "student_count":6},
  {"id":"aaa00001-...-000000000002", "label":"고등영어반", "subject":"영어", "room":"B실", "student_count":4},
  {"id":"aaa00001-...-000000000003", "label":"초등국어반", "subject":"국어", "room":"C실", "student_count":6}
]
```

```bash
# QR 생성 → 201 + code
curl -X POST https://classly-backend.onrender.com/attendance/qr \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"class_id":"aaa00001-0000-0000-0000-000000000001"}'
```
```json
{"id": "uuid-...", "code": "classly://attend?class=aaa00001-0000-0000-0000-000000000001&t=1744372800"}
```

- 브라우저: https://classly-frontend.pages.dev/attendance
- 반 선택 드롭다운 → `중등수학반` → QR 이미지 렌더 확인

---

## [부모님 연락] 메시지 + AI 초안 (Groq)

> **로그인 계정**: `test` / `test`

**플로우**: 학부모 선택 → 메시지 작성 or AI 초안 생성(Drawer) → 발송

> ⚠️ Render 환경변수 `GROQ_API_KEY` 설정 필요. 키 발급: https://console.groq.com

**테스트 & 기대 결과**:
```bash
# AI 초안 생성 (강태양 UUID 고정)
curl -X POST https://classly-backend.onrender.com/messages/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795","message_type":"grade","tone":"formal","reason":"이번 달 수학 성적이 많이 올랐습니다"}'
```
```json
{
  "draft": "안녕하세요 강순희 학부모님, test 학원입니다. ...(한국어 메시지)...",
  "student_name": "강태양",
  "parent_phone": "010-9009-9999",
  "student_id": "7886e6fa-59fd-424c-a27f-175fdfa72795"
}
```
> `draft`는 150자 이내 한국어 메시지. GROQ_API_KEY 미설정 시 503 에러.

```bash
# 메시지 발송 저장 → 201
curl -X POST https://classly-backend.onrender.com/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795","content":"테스트 메시지","type":"custom"}'
```
```json
{"id": "uuid-..."}
```

- 브라우저: https://classly-frontend.pages.dev/messages
- `강태양` 선택 → AI 초안 버튼 → Drawer → 초안 생성 → 복사 후 발송 확인

---

## [학생 모바일] 학원 가입 (join)

> **인증 불필요** — 학원 코드로 접속 후 신규 계정 생성

**플로우**: 초대 코드 발급 → `/join?code=XXXX` → 이름/학교/학년/아이디/비밀번호 입력 → 가입 완료

**테스트 & 기대 결과**:
```bash
# 1. 초대 코드 발급 → 200
curl -X POST https://classly-backend.onrender.com/academy/generate-code \
  -H "Authorization: Bearer $TOKEN"
```
```json
{"academy_code": "ABCD1234", "invite_url": "https://classly-frontend.pages.dev/join?code=ABCD1234"}
```

```bash
# 2. 가입 API 직접 호출 → 201
curl -X POST https://classly-backend.onrender.com/join/ABCD1234 \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","school":"테스트중","grade":"중1","username":"testjoin01","password":"pass1234"}'
```
```json
{"id": "uuid-...", "username": "testjoin01", "message": "가입 완료."}
```

```bash
# 중복 아이디 재시도 → 409
curl -X POST https://classly-backend.onrender.com/join/ABCD1234 \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동2","school":"테스트중","grade":"중1","username":"testjoin01","password":"pass1234"}'
```
```json
{"detail": "이미 사용 중인 아이디입니다. (아이디: testjoin01)"}
```

- 브라우저: https://classly-frontend.pages.dev/join?code={위 코드}
- 이름/학교/학년/아이디(`testjoin01`)/비밀번호(`pass1234`) 입력
- 비밀번호 확인 불일치 → 클라이언트 에러 표시 확인
- 가입 완료 → 아이디 표시 화면 → 로그인 페이지 이동

---

## [학생 모바일] QR 출석 체크 (attend)

> **로그인 계정**: `강태양0000` / `강태양0000` (학생 계정)

**플로우**: `/attend?class={id}&t={timestamp}` → 학생 로그인 → GPS 검증 → 출석/지각

**테스트 & 기대 결과**:
```bash
# 학생 로그인 → 200 + access_token
curl -X POST https://classly-backend.onrender.com/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"username":"강태양0000","password":"강태양0000"}'
```
```json
{"access_token": "eyJ...", "token_type": "bearer"}
```

```bash
# 출석 처리 (GPS 없음) → 200
STUDENT_TOKEN=$(...)
curl -X POST https://classly-backend.onrender.com/attendance/attend \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"classly://attend?class=aaa00001-0000-0000-0000-000000000001&t=1234567890","student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795"}'
```
```json
{
  "ok": true,
  "status": "출석",
  "gps_verified": false,
  "time_verified": false,
  "distance_m": null
}
```
> `gps_verified: false` = GPS 미제공. `time_verified: false` = 수업 시간 외 스캔.
> 수업 시간 내 스캔 시 `time_verified: true`, 시작 10분 후면 `status: "지각"`
> 동일 학생 동일 반 당일 재스캔 → 409 "이미 출석 처리되었습니다."

- 브라우저: https://classly-frontend.pages.dev/attend?class=aaa00001-0000-0000-0000-000000000001&t=1234567890
- 학생 로그인 화면 → `강태양0000` / `강태양0000` 입력
- GPS 허용 → `gps_verified`, 거리 표시 확인
- GPS 거부 → `gps_verified: false` 로 처리 확인

---

## [학생 모바일] 성적 입력 세션 (grade-input)

> **선생님**: `test` / `test` (세션 생성)
> **학생**: `강태양0000` / `강태양0000` (성적 제출)

**플로우**: 세션 생성 → `/grade-input?session={id}` → 학생 로그인 → 과목 입력 → 제출

**테스트 & 기대 결과**:
```bash
# 1. 세션 생성 → 201
curl -X POST https://classly-backend.onrender.com/grade-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026","exam_type":"1학기_중간"}'
```
```json
{
  "id": "uuid-...",
  "url": "https://classly-frontend.pages.dev/grade-input?session=uuid-..."
}
```

```bash
# 2. 성적 제출 → 200
SESSION_ID="위의id"
curl -X PUT "https://classly-backend.onrender.com/grade-sessions/$SESSION_ID/submit" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795","entries":[{"subject_name":"국어","score":85,"grade_level":2},{"subject_name":"영어","score":90,"grade_level":1},{"subject_name":"수학","score":78,"grade_level":3}]}'
```
```json
{"ok": true, "message": "성적 제출 완료"}
```

```bash
# 3. 재제출 시도 → 409
```
```json
{"detail": "이미 제출한 성적입니다."}
```

```bash
# 4. 결과 조회 → 200
curl "https://classly-backend.onrender.com/grade-sessions/$SESSION_ID/results" \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "session": {"id":"...", "year":"2026", "exam_type":"1학기_중간", "is_active":1, ...},
  "submitted_students": [
    {"student_name":"강태양", "grades":[{"subject_name":"국어","score":85,"grade_level":2}, ...]}
  ],
  "submitted_count": 1
}
```

- 브라우저: https://classly-frontend.pages.dev/grade-input?session={위의id}
- 학생 로그인 → 과목 행 추가/삭제 → 제출 → 완료 화면 확인
- 같은 URL 재접속 → "이미 제출한 성적입니다" 화면 확인

---

## [학생 모바일] 마이페이지 (student/mypage)

> **로그인 계정**: join으로 생성한 계정 (예: `testjoin01` / `pass1234`)
> join 테스트 전이라면: `강태양0000` / `강태양0000` 사용

**플로우**: 학생 로그인 → 내 정보 확인 → 아이디/비밀번호 변경

**테스트 & 기대 결과**:
```bash
# 학생 정보 조회 → 200
STUDENT_TOKEN=$(curl -s -X POST https://classly-backend.onrender.com/auth/student-login \
  -H "Content-Type: application/json" \
  -d '{"username":"강태양0000","password":"강태양0000"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

curl https://classly-backend.onrender.com/auth/student/me \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```
```json
{"id":"7886e6fa-...", "name":"강태양", "school":"푸른중학교", "grade":"중2",
 "username":"강태양0000", "username_changed":0}
```

```bash
# 비밀번호 변경 → 200
curl -X PATCH https://classly-backend.onrender.com/auth/student/password \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"강태양0000","new_password":"newpass1"}'
```
```json
{"message": "비밀번호가 변경되었습니다."}
```
> 변경 후 기존 비밀번호로 로그인 시 → 401 확인
> 테스트 후 반드시 원복: `{"current_password":"newpass1","new_password":"강태양0000"}`

```bash
# 현재 비밀번호 틀림 → 401
```
```json
{"detail": "현재 비밀번호가 올바르지 않습니다."}
```

- 브라우저: https://classly-frontend.pages.dev/student/login
- 로그인 → `/student/mypage` 이동 확인
- 아이디 변경 카드: `username_changed=0`인 계정만 표시 확인
- 비밀번호 변경 → 재로그인 확인

---

## [성적 관리] 학생 상세 성적 탭

> **로그인 계정**: `test` / `test`

**플로우**: 학생 클릭 → 상세 모달 → 성적 탭 → 연도별/시험별 rowspan 테이블

**테스트 & 기대 결과**:
```bash
# 강태양 성적 조회 → 200, 25건
curl "https://classly-backend.onrender.com/students/7886e6fa-59fd-424c-a27f-175fdfa72795/grades" \
  -H "Authorization: Bearer $TOKEN"
```
```json
[
  {"id":"...", "subject_name":"국어", "year":"2025", "exam_type":"1학기_중간",
   "score":85, "grade_level":2, "total_students":null, "my_rank":null},
  ...
]
```
> 최근 2년치 데이터 반환. 연도 → 학기 → 과목 순으로 rowspan 렌더.

- 브라우저: `/students` → `강태양` 클릭 → 성적 탭 → 연도/학기별 rowspan 테이블 확인 (25건)
- 상담일지 탭 → 기적재 2건 표시 확인
