# Classly 기능 플로우 문서

> 신규 기능은 항상 **위쪽**에 추가할 것.
> 검증용 Claude에게 "테스트해줘"라고 하면 이 파일 기준으로 테스트 진행.

---

## 🌐 현재 배포 환경

| 구분 | 주소 |
|------|------|
| 프론트 (배포) | Cloudflare Pages (pages.dev 도메인) |
| 백엔드 (로컬) | `http://localhost:8000` |
| 프론트 (로컬 dev) | `http://localhost:3000` |

### ⚠️ 프론트 배포 + 백엔드 로컬 조합 테스트 시
배포된 프론트는 `NEXT_PUBLIC_API_URL=http://localhost:8000`으로 빌드됨.
→ **같은 네트워크(로컬 브라우저)**에서 열어야 백엔드 연결 가능.
→ 외부에서 테스트하려면 ngrok으로 백엔드 노출 후 Cloudflare Pages 환경변수 재설정 필요.

### 서버 실행
```bash
# 백엔드
cd /Users/bagchang-yun/projects/classly/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 프론트 (로컬 테스트 시)
cd /Users/bagchang-yun/projects/classly
npm run dev
```

---

## [Ant Design 리뉴얼] 전체 UI 마이그레이션

**기능 설명**: 전 페이지 Ant Design 5.x 기반 어드민 UI. ConfigProvider(#7c6af7), 다크 사이드바.

**테스트 방법**:
- `http://localhost:3000` 접속 → 로그인 → 각 메뉴 순서대로 클릭
- 브라우저 콘솔에서 hydration 에러 없는지 확인

**테스트 값**: username=`test`, password=`test`

---

## [학생 모바일] QR 출석 체크 (attend)

**기능 설명**: 학생이 QR 스캔 → `/attend?class={id}&t={timestamp}` → 학생 로그인 → GPS+시간 검증 → 출석/지각 처리.

**플로우**:
1. `/attendance` 페이지에서 반 선택 → QR 코드 표시
2. 학생 QR 스캔 → `/attend?class={classId}&t={timestamp}` 접속
3. 이미 로그인된 경우(student_token) 자동 처리, 아니면 학생 로그인 폼
4. GPS + 수업 시간 검증 → 결과 화면(출석/지각/실패)

**테스트 방법**:
```bash
# 1. DB에서 실제 수업 ID 확인
mysql -h svc.sel5.cloudtype.app -P 30255 -u root -p'ckddbs8071!@' classly \
  -e "SELECT id, class_name FROM schedules LIMIT 5;"

# 2. 브라우저에서 직접 접속
http://localhost:3000/attend?class={위의ID}&t=1234567890
```

**테스트 값**:
- 학생 username: `홍길동0001` / password: `홍길동0001`
- GPS 거부해도 진행되는지 확인 (GPS 없으면 미확인으로 처리)

---

## [학생 모바일] 학원 가입 (join)

**기능 설명**: 선생님이 초대 코드 발급 → 학생이 `/join?code=XXXX` 접속 → 정보 입력 → 계정 자동 생성.

**플로우**:
1. 선생님 `POST /academy/generate-code` → `invite_url` 반환 (`classly.kr/join?code=XXXX`)
2. 학생이 URL 접속 → 이름/학교/학년/전화 입력
3. 아이디 자동 생성(이름+전화뒷4) → 완료 화면에서 아이디 확인

**테스트 방법**:
```bash
# 1. 선생님 로그인 → 토큰 획득
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. 초대 코드 발급
curl -X POST http://localhost:8000/academy/generate-code \
  -H "Authorization: Bearer $TOKEN"
# → {"academy_code": "ABCD1234", "invite_url": "classly.kr/join?code=ABCD1234"}

# 3. 브라우저에서 접속
http://localhost:3000/join?code=ABCD1234
```

**테스트 값**:
- 학생 이름: `테스트학생`, 학교: `테스트중`, 학년: `중1`, 전화: `010-9999-0001`
- 생성 아이디 확인: `테스트학생0001`

---

## [학생 모바일] 성적 입력 세션 (grade-input)

**기능 설명**: 선생님이 세션 생성 → 학생이 `/grade-input?session={id}` 접속 → 과목별 점수/등급 입력 → 제출.

**플로우**:
1. 선생님 `POST /grade-sessions` → `url` 반환 (`classly.kr/grade-input?session=XXXX`)
2. 학생 접속 → 학생 로그인 → 과목 행 추가하며 점수/등급 입력
3. 제출 → 완료 화면 (재제출 불가)

**테스트 방법**:
```bash
# 1. 선생님 토큰 획득 (위와 동일)
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 2. 성적 입력 세션 생성
curl -X POST http://localhost:8000/grade-sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":"2026","exam_type":"1학기_중간"}'
# → {"id": "uuid-...", "url": "classly.kr/grade-input?session=uuid-..."}

# 3. 브라우저에서 접속
http://localhost:3000/grade-input?session={위의id}
```

**테스트 값**:
- 학생 로그인 후 과목: 국어(85/2등급), 영어(90/1등급), 수학(78/3등급) 입력
- 이미 제출한 세션 재접속 시 "이미 제출" 화면 표시 확인

---

## [학생 모바일] 마이페이지 (student/mypage)

**기능 설명**: 학생이 아이디(최초 1회) 및 비밀번호 변경.

**플로우**:
1. `/student/login` → 학생 로그인
2. `/student/mypage` 접속 → 내 정보 확인
3. 아이디 변경 (username_changed=0인 계정만 카드 표시)
4. 비밀번호 변경 (현재 비번 확인 후 새 비번 설정)

**테스트 방법**:
```bash
http://localhost:3000/student/login
# → 로그인 후 /student/mypage 자동 이동 or 직접 접속
```

**테스트 값**:
- 학생 로그인: `홍길동0001` / `홍길동0001`
- 비밀번호 변경: 현재=`홍길동0001`, 새 비번=`newpass1`
- 아이디 변경: `newid0001` (username_changed=0인 계정만)

---

## [일정 관리] 캘린더 일정 CRUD

**기능 설명**: 월별 캘린더에서 날짜 클릭 → 일정 추가, 일정 클릭 → 상세/삭제.

**테스트 방법**:
```bash
# 일정 목록 조회
curl http://localhost:8000/events/ \
  -H "Authorization: Bearer $TOKEN"

# 일정 추가
curl -X POST http://localhost:8000/events/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"중간고사","date":"2026-04-15","type":"시험","description":""}'
```
- 브라우저: `http://localhost:3000/calendar` → 날짜 클릭 → 추가 → 표시 확인
- 일정 클릭 → 상세 모달 → Popconfirm 삭제 확인

**테스트 값**: 제목=`중간고사`, 유형=`시험`, 날짜=이번 달 아무 날

---

## [출석 관리] QR 코드 생성 + 출석 현황

**기능 설명**: 반별 QR 코드 생성, 인쇄, 최근 출석 기록 조회.

**테스트 방법**:
```bash
# 반 목록 확인 (시간표에 수업이 있어야 함)
curl http://localhost:8000/classes/ \
  -H "Authorization: Bearer $TOKEN"

# 최근 출석 기록
curl http://localhost:8000/attendance/ \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `http://localhost:3000/attendance` → 반 선택 → QR 렌더 확인
- 수업 없을 경우 "등록된 반이 없습니다" Alert 표시 확인

---

## [부모님 연락] 메시지 발송 + AI 초안

**기능 설명**: 학부모 선택 → 메시지 작성 또는 AI 초안(Claude Haiku) → 발송.

**테스트 방법**:
```bash
# AI 초안 생성 API
curl -X POST http://localhost:8000/messages/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student_name":"강태양","context":"이번 달 수학 성적이 많이 올랐습니다"}'
```
- 브라우저: `http://localhost:3000/messages` → 학생 선택 → 우측 AI Drawer → 초안 생성 확인

**테스트 값**: 학생=`강태양`, 컨텍스트=`수학 성적 향상`

---

## [성적 관리] 학생 상세 모달 성적 탭

**기능 설명**: 학생 상세 팝업 성적 탭 → 연도별/시험별 성적 (rowspan 셀병합).

**테스트 방법**:
```bash
# 성적 데이터 확인
curl "http://localhost:8000/grades/?student_id=1" \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `/students` → `강태양` 클릭 → 성적 탭 → rowspan 셀병합 확인

**테스트 값**: 강태양, 2024년 1학기 중간/기말, 2학기 중간/기말

---

## [시간표] 수업 블록 추가/조회

**기능 설명**: 요일별 09:00~22:00 그리드에 수업 블록 표시, 추가/삭제.

**테스트 방법**:
```bash
# 시간표 조회
curl "http://localhost:8000/schedules/" \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `/timetable` → 요일 `+` 클릭 → 수업 추가
- 동일 요일 겹치는 시간 추가 시 → Alert 에러 확인

**테스트 값**: 월요일, 14:00~16:00, 수학, A실 / 겹침 테스트: 14:30~15:30

---

## [학생 관리] 학생 목록/추가/검색/삭제

**기능 설명**: 학원 학생 목록 Table, 이름/학교/학년 검색, 추가(Modal Form), 삭제(Popconfirm).

**테스트 방법**:
```bash
# 학생 목록
curl "http://localhost:8000/students/" \
  -H "Authorization: Bearer $TOKEN"
```
- 브라우저: `/students` → 검색(이름=`강태양`) → 학생 클릭 → 상세 모달 확인
- `+ 학생 추가` → 저장 → 목록 갱신 확인
- 삭제 버튼 → Popconfirm → 삭제 확인

**테스트 값**: 추가 학생=`테스트학생`, 학교=`테스트중`, 학년=`중1`, 전화=`010-9999-0002`

---

## [인증] 선생님 로그인/auth guard

**기능 설명**: JWT 로그인, localStorage 저장, auth guard 리다이렉트.

**테스트 방법**:
```bash
# 로그인 API
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# 잘못된 비번
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"wrong"}'
# → 401 에러
```
- 브라우저: `/dashboard` 직접 접속 (토큰 없음) → `/`로 리다이렉트 확인
- 로그인 후 사이드바 로그아웃 클릭 → 토큰 삭제 → `/`로 이동 확인

**테스트 값**: 정상=`test/test`, 실패=`test/wrong`
