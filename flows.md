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
NEXT_PUBLIC_API_URL=https://classly-backend.onrender.com npm run build
CLOUDFLARE_API_TOKEN=$(cat ~/.cloudflare_token) \
  npx wrangler pages deploy dist --project-name=classly-frontend --commit-dirty=true
```
> ⚠️ `.env.local`이 localhost를 가리키므로 반드시 `NEXT_PUBLIC_API_URL` 주입 후 빌드

---

## 👤 테스트 계정 목록

### 선생님 (대시보드/관리 기능)
| 역할 | username | password |
|------|----------|----------|
| 선생님 | `test` | `test` |

### 학생 (모바일 기능) — DB 기적재
> 선생님이 직접 등록한 계정. 초기 비밀번호 = 아이디 (한글→영자판 변환 + 전화뒷4자리)

| 이름 | username | password | 학교/학년 | 비고 |
|------|----------|----------|----------|------|
| 강태양 | `강태양0000` | `강태양0000` | 푸른중학교 / 2학년 | - |
| 오재원 | `오재원8888` | `오재원8888` | 늘봄중학교 / 2학년 | - |
| 한소희 | `한소희7777` | `한소희7777` | 늘봄중학교 / 1학년 | - |
| 배준혁 | `배준혁3001` | `배준혁3001` | 강남고등학교 / 1학년 | - |
| 송지아 | `송지아3002` | `송지아3002` | 강남고등학교 / 2학년 | - |
| 황민찬 | `황민찬3003` | `황민찬3003` | 서울고등학교 / 1학년 | - |

> ⚠️ 위 학생들은 DB에 직접 적재된 계정(한글 아이디)이라 기존 방식 유지. 신규 join 계정은 아이디 직접 입력.

### DB 기적재 데이터 요약
| 항목 | 내용 |
|------|------|
| 학생 | 20명 (강태양, 오재원, 한소희 등) |
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

## [엑셀 일괄 등록] 학생 업로드 + 성적 포함

> **로그인 계정**: `test` / `test`  
> 화면: https://classly-frontend.pages.dev/students → `엑셀 업로드` 버튼

### 엑셀 파일 형식

**기본 컬럼 (A–H)** — 1행 헤더 없이 2행부터 바로 입력 가능

| 열 | 항목 | 필수 여부 | 예시 |
|----|------|----------|------|
| A | 이름 | ✅ 필수 | 홍길동 |
| B | 학교 | ✅ 필수 | 한빛중학교 |
| C | 학년 | ✅ 필수 | 2학년 |
| D | 학생 전화 | ✅ 필수 (아이디 생성용) | 01012345678 |
| E | 부모님 이름 | 선택 | 홍아버지 |
| F | 부모님 전화 | 선택 | 01098765432 |
| G | 수강과목 | 선택 | 수학 |
| H | 등록일 | 선택 | 2026-03-01 |

**성적 컬럼 (I–J + 동적)** — 선택사항, **1행에 헤더 필수**

| 열 | 항목 | 예시 |
|----|------|------|
| I | 연도 | 2025 |
| J | 시험종류 | 1학기_중간 / 1학기_기말 / 2학기_중간 / 2학기_기말 / 모의고사 |
| K~ | `과목명_점수` / `과목명_등급` | 국어_점수, 국어_등급, 수학_점수, 수학_등급 ... |

> ⚠️ K열 이후 헤더를 `국어_점수`, `수학_등급` 형식으로 작성하면 과목 수 제한 없이 인식  
> ⚠️ **한 행 = 학생 1명 × 시험 1개** — 같은 학생이 여러 시험이면 행 반복  
> ⚠️ 중복 학생(이름+전화 기준)은 학생 생성 스킵, **성적만 저장**  
> ⚠️ 전화번호는 하이픈 없이 숫자만 (`01012345678`)

### 아이디 자동 생성 규칙
> **아이디 = 이름(한글→영자판 변환) + 전화번호 뒷 4자리**  
> 예: `홍길동` + `5678` → `ghdrlfehd5678`  
> 초기 비밀번호 = 아이디와 동일

### 업로드 결과
```bash
curl -X POST https://classly-backend.onrender.com/students/bulk-upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@students.xlsx"
```
```json
{"created": 2, "skipped": 1, "grades_saved": 4, "errors": []}
```
> `grades_saved`: 저장된 성적 레코드 수

### 엑셀 샘플 (성적 포함)
```
이름      학교         학년   학생전화       ...  연도   시험종류      국어_점수  국어_등급  수학_점수  수학_등급
홍길동    한빛중학교   2학년  01012345678   ...  2025  1학기_중간    85         3          92         1
홍길동    한빛중학교   2학년  01012345678   ...  2025  1학기_기말    90         2          88         2
김영희    푸른초등학교 4학년  01023456789   ...
```
> 홍길동 → 학생 1명 생성 + 성적 4개 (중간/기말 × 국어/수학) 저장

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

**플로우**: 빠른 액션 카드 + 오늘 일정 + 이번 주 출석률 + 관심 학생 카드 + 미니 캘린더

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

- 브라우저: https://classly-frontend.pages.dev/dashboard
  - 빠른 액션 카드 (`+ 학생 추가` / `QR 출석` / `메시지 보내기` 버튼) 확인
  - 관심 학생 카드 항상 표시 (없으면 "관심 학생이 없습니다" 안내 메시지)
  - 달력 + 다가오는 일정 렌더 확인

---

## [학생 관리] 목록 / 추가 / 검색 / 삭제

> **로그인 계정**: `test` / `test`

**플로우**:
1. 전체 학생 목록 Table 표시
2. 이름 검색 / 학교 자동완성 / 학년 Select 필터
3. `+ 학생 추가` → Modal Form → 저장
4. 삭제 버튼 → Popconfirm → 삭제

**폼 입력 규칙**:
- 학교: `초등학교` / `중학교` / `고등학교` 중 하나 포함 필수 (예: 한빛중학교 ✓, 한빛중 ✗)
- 학년: 학교 입력 후 자동 드롭다운 표시 (초등=1~6학년, 중/고=1~3학년)
- 전화번호: `010-XXXX-XXXX` 형식 (입력 시 자동 하이픈 삽입)

**테스트 & 기대 결과**:
```bash
# 학생 목록 → 200, 배열
curl https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN"
```
```json
[
  {"id": "7886e6fa-...", "name": "강태양", "school": "푸른중학교", "grade": "2학년",
   "phone": "010-9999-0000", "username": "강태양0000", ...},
  ...
]
```
> grade 형식: `"2학년"` (이전 `"중2"` → 마이그레이션 완료)

```bash
# 학생 추가 → 201 + id, username
curl -X POST https://classly-backend.onrender.com/students/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"테스트학생","school":"테스트중학교","grade":"2학년","phone":"010-9999-0002"}'
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

```bash
# 성적 직접 입력 (선생님, 과목 자동 생성) → 201
curl -X POST "https://classly-backend.onrender.com/students/7886e6fa-59fd-424c-a27f-175fdfa72795/grades/direct" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026","exam_type":"1학기_중간","entries":[{"subject_name":"국어","score":85,"grade_level":3},{"subject_name":"수학","score":92,"grade_level":1}]}'
```
```json
{"ok": true}
```
> 해당 학원에 과목이 없으면 자동 생성 후 저장

- 브라우저: https://classly-frontend.pages.dev/students
- 이름 검색 `강태양` → 1건 필터링 확인
- `강태양` 클릭 → 상세 모달 (기본정보 / 성적 / 상담일지 탭) 확인
- 성적 탭 → **"성적 추가" 버튼** 클릭 → 연도/시험종류 선택 → 과목명 직접 입력 → 저장 → 목록 갱신 확인
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

## [출석 관리] QR 코드 생성 / 재발급

> **로그인 계정**: `test` / `test`

**플로우**: QR 생성 버튼 클릭 → 학원 단위 QR 렌더 → 인쇄 / 재발급 시 이전 QR 즉시 만료

**테스트 & 기대 결과**:
```bash
# QR 생성 (학원 단위, 반 없음) → 201 + code + url
curl -X POST https://classly-backend.onrender.com/attendance/qr \
  -H "Authorization: Bearer $TOKEN"
```
```json
{
  "id": "uuid-...",
  "code": "A1B2C3D4E5F6G7H8",
  "url": "https://classly-frontend.pages.dev/attend?code=A1B2C3D4E5F6G7H8&t=1744372800"
}
```
> 재발급 시 이전 모든 QR → `is_active=0` 만료 후 신규 생성

```bash
# 만료된 QR로 출석 시도 → 400
curl -X POST https://classly-backend.onrender.com/attendance/attend \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"OLD_EXPIRED_CODE","student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795"}'
```
```json
{"detail": "QR 코드가 만료되었습니다."}
```

- 브라우저: https://classly-frontend.pages.dev/attendance
- `QR 생성` 버튼 클릭 → QR 이미지 렌더 확인
- `QR 재발급` 버튼 클릭 → 새 QR 렌더, 이전 QR 만료 확인

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
- `강태양` 선택 → `AI 초안 생성` 버튼 → **Modal** 팝업 → 옵션 설정 → `AI 초안 생성 후 적용` 클릭
- 로딩 스피너 표시 → 완료 후 모달 자동 닫힘 + 메시지 작성란에 자동 삽입 확인

---

## [학생 모바일] 학원 가입 (join)

> **인증 불필요** — 학원 코드로 접속 후 신규 계정 생성

**플로우**: 초대 코드 발급 → `/join?code=XXXX` → 이름/학교/학년/아이디/비밀번호 입력 → 가입 완료

**폼 입력 규칙**:
- 학교: `초등학교` / `중학교` / `고등학교` 포함 필수 (학교급 자동 판별)
- 학년: 학교 입력 후 드롭다운 자동 활성화
- 전화: 선택, `010-XXXX-XXXX` 형식
- **부모님 관계**: 아버지(부) / 어머니(모) Radio 선택, 기본값 모

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
# 2. 가입 API 직접 호출 → 201 (parent_relation 포함)
curl -X POST https://classly-backend.onrender.com/join/ABCD1234 \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동","school":"테스트중학교","grade":"1학년","username":"testjoin01","password":"pass1234","parent_relation":"부"}'
```
```json
{"id": "uuid-...", "username": "testjoin01", "message": "가입 완료."}
```

```bash
# 중복 아이디 재시도 → 409
curl -X POST https://classly-backend.onrender.com/join/ABCD1234 \
  -H "Content-Type: application/json" \
  -d '{"name":"홍길동2","school":"테스트중학교","grade":"1학년","username":"testjoin01","password":"pass1234"}'
```
```json
{"detail": "이미 사용 중인 아이디입니다. (아이디: testjoin01)"}
```

- 브라우저: https://classly-frontend.pages.dev/join?code={위 코드}
- 이름 입력 → 학교명에 `중학교` 포함 → 학년 드롭다운 자동 활성화 (1~3학년)
- 아이디(`testjoin01`)/비밀번호(`pass1234`) 입력
- 비밀번호 확인 불일치 → 클라이언트 에러 표시 확인
- 가입 완료 → 아이디 표시 화면 → 로그인 페이지 이동

---

## [학생 모바일] QR 출석 체크 (attend)

> **로그인 계정**: `강태양0000` / `강태양0000` (학생 계정)

**플로우**: `/attend?code={token}&t={timestamp}` → 학생 로그인 → GPS 검증 → 출석

> QR 코드 token은 `/attendance/qr` 로 선생님이 미리 생성한 값 사용  
> ✅ 출석 시간 KST(서울) 기준으로 저장/표시 (백엔드 `Asia/Seoul` 적용)

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
# 출석 처리 (QR token 사용, GPS 없음) → 200
# ※ token은 /attendance/qr 에서 받은 code 값 사용
curl -X POST https://classly-backend.onrender.com/attendance/attend \
  -H "Content-Type: application/json" \
  -d '{"qr_code":"A1B2C3D4E5F6G7H8","student_id":"7886e6fa-59fd-424c-a27f-175fdfa72795"}'
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
> 동일 학생 동일 학원 당일 재스캔 → 409 "이미 출석 처리되었습니다."
> 만료된 code → 400 "QR 코드가 만료되었습니다."
> 존재하지 않는 code → 400 "유효하지 않은 QR 코드입니다."

```bash
# 만료 QR 접근 시 프론트 화면: /attend?code=EXPIRED_CODE
```
> "QR이 만료되었습니다. 선생님께 재발급을 요청하세요." 화면 표시

- 브라우저: /attendance에서 QR 생성 후 해당 URL 접속 (`url` 필드 값 그대로)
- 학생 로그인 화면 → `강태양0000` / `강태양0000` 입력 (아이디 저장 체크 시 다음 접속 자동 입력)
- 이미 로그인된 학생 → `/student/mypage` 자동 이동
- GPS 허용 → `gps_verified: true` 확인
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
{"id":"7886e6fa-...", "name":"강태양", "school":"푸른중학교", "grade":"2학년",
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
