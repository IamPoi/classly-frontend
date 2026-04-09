# Classly 기능 플로우 문서

> 신규 기능은 항상 **위쪽**에 추가할 것.
> 검증용 Claude에게 "테스트해줘"라고 하면 이 파일 기준으로 테스트 진행.

---

## [Ant Design 리뉴얼] 전체 UI 마이그레이션

**기능 설명**: Tailwind 커스텀 컴포넌트 → Ant Design 5.x 기반 어드민 UI 전면 교체. ConfigProvider(보라 테마 #7c6af7) + App 래핑.

**플로우**:
1. AntdRegistry(SSR) → AntdProvider(ConfigProvider + App) → 각 페이지
2. Layout.Sider(dark, #1e1e2e) + Menu → 사이드바
3. 각 페이지: Form/Table/Modal/Card/Tag/Result/Spin 등 Ant Design 컴포넌트 사용

**테스트 방법**:
- 브라우저 `http://localhost:3000` 접속 → 전체 페이지 UI 확인
- 콘솔에서 hydration 에러 없는지 확인
- 개발자 도구 → Elements에서 `.ant-*` 클래스 존재 여부 확인

**테스트 값**:
- 로그인: username=`test`, password=`test`
- 순서대로 확인: 로그인 → 대시보드 → 학생관리 → 시간표 → 캘린더 → 출석 → 메시지

---

## [학생 모바일] QR 출석 체크 (attend)

**기능 설명**: 학생이 교실 문의 QR을 스캔하면 `/attend?class=...&t=...`로 이동, 로그인 후 GPS+시간 검증하여 자동 출석 처리.

**플로우**:
1. 학생 QR 스캔 → `/attend?class={classId}&t={timestamp}` 접속
2. 이미 로그인된 경우 자동 출석 처리 (localStorage student_token 사용)
3. 미로그인 시 학생 로그인 폼 표시 → 로그인 후 자동 처리
4. GPS 위치 + 수업 시간 검증 → 출석/지각/실패 Result 화면

**테스트 방법**:
- `http://localhost:3000/attend?class=1&t=1234567890` 브라우저 직접 접속
- 학생 로그인 후 출석 결과 확인
- GPS 권한 거부 시에도 진행되는지 확인

**테스트 값**:
- 학생 username: `홍길동0001` (이름+전화뒷4)
- class 파라미터: 실제 등록된 수업 ID (DB에서 `SELECT id FROM schedules LIMIT 1`)

---

## [학생 모바일] 마이페이지 (student/mypage)

**기능 설명**: 학생이 본인 아이디(최초 1회) 및 비밀번호를 변경하는 페이지.

**플로우**:
1. `/student/mypage` 접속 → localStorage student_token 없으면 `/student/login` 리다이렉트
2. 내 정보(이름/학교/학년/아이디) 조회
3. 아이디 변경: `username_changed=0`인 경우만 카드 표시 → 변경 후 영구 잠금
4. 비밀번호 변경: 현재 비번 확인 후 새 비번(4자↑) 설정

**테스트 방법**:
- 학생 로그인 후 `http://localhost:3000/student/mypage` 접속
- `PATCH http://localhost:8000/auth/student/password` — 비밀번호 변경 API
- `PATCH http://localhost:8000/auth/student/username` — 아이디 변경 API

**테스트 값**:
- 학생 로그인: `/student/login`에서 username=`홍길동0001` 사용
- 비밀번호 변경: 현재=`홍길동0001`, 새 비번=`newpass1`
- 아이디 변경: `newid0001` (username_changed=0인 계정만 가능)

---

## [일정 관리] 캘린더 일정 CRUD

**기능 설명**: 월별 캘린더에서 날짜 클릭 시 일정 추가, 일정 클릭 시 상세/삭제 가능.

**플로우**:
1. `/calendar` 접속 → 현재 월 캘린더 표시
2. 날짜 클릭 → 일정 추가 모달 (제목 + 유형: 시험/수업/상담/휴원/기타)
3. 일정 클릭 → 상세 모달 → Popconfirm 삭제
4. `GET /events/` → 전체 일정 조회, 유형별 색상 표시

**테스트 방법**:
- 브라우저 `http://localhost:3000/calendar`
- `GET http://localhost:8000/events/?academy_id=1`
- `POST http://localhost:8000/events/` — 일정 추가
  ```json
  { "title": "중간고사", "date": "2026-04-15", "type": "시험", "description": "" }
  ```
- `DELETE http://localhost:8000/events/{id}` — 일정 삭제

**테스트 값**:
- 일정 제목: `중간고사`, 유형: `시험`, 날짜: 이번 달 아무 날
- 삭제: 추가한 일정 클릭 후 삭제 확인

---

## [출석 관리] QR 코드 생성 + 출석 현황

**기능 설명**: 반별 QR 코드 생성, 출석 스티커 인쇄, 최근 출석 기록 조회.

**플로우**:
1. `/attendance` 접속 → 시간표에서 반 목록 로드
2. 반 선택 → QR 코드 생성 (`/attend?class={id}&t={timestamp}`)
3. 인쇄 버튼 → `window.print()` (`.no-print` 요소 숨김)
4. 우측 패널: 최근 출석 10건 표시

**테스트 방법**:
- 브라우저 `http://localhost:3000/attendance`
- `GET http://localhost:8000/classes/?academy_id=1` — 반 목록
- `GET http://localhost:8000/attendance/?academy_id=1` — 출석 기록
- QR 코드 이미지 렌더 확인 (qrcode.react)

**테스트 값**:
- 시간표에 수업이 1개 이상 등록되어 있어야 반 선택 가능
- 등록된 수업 없을 경우 "등록된 반이 없습니다" Alert 표시 확인

---

## [학생 모바일] 성적 입력 세션 (grade-input)

**기능 설명**: 선생님이 성적 입력 세션을 생성하면 학생이 모바일에서 본인 성적을 입력하는 기능.

**플로우**:
1. 선생님이 세션 생성 → `POST /grade-sessions/` (academy_id 포함)
2. 학생이 `/grade-input/[sessionId]` 접속 → 학생 로그인 후 과목별 점수/등급 입력
3. 제출 완료 → `grade_session_entries` 테이블 저장 → Result(success) 화면
4. 이미 제출한 경우 `already_submitted=true` → 재제출 불가

**테스트 방법**:
- 백엔드: `GET http://localhost:8000/grade-sessions/?academy_id=1`
- 프론트: 브라우저 `/grade-input/[실제 세션ID]` 접속
- 학생 로그인: username=이름+전화뒷4자리, 비번 동일

**테스트 값**:
- 학생 username 예시: `강태양1234`
- 과목: 국어(85), 영어(90), 수학(78) / 등급: 각 2, 1, 3

---

## [대시보드] 오늘 일정 + 이번 주 출석률 위젯

**기능 설명**: 대시보드 상단에 오늘 수업 일정과 이번 주 출석률을 카드로 표시.

**플로우**:
1. 로그인 후 `/dashboard` 접속
2. 상단 2열: 오늘 일정(시간표 기반), 이번 주 출석률(attendance 기반)
3. 하단: 달력 + 다가오는 일정 + 관심 학생 위젯

**테스트 방법**:
- 브라우저 `http://localhost:3000/dashboard`
- 콘솔 hydration 에러 없는지 확인
- `GET http://localhost:8000/dashboard/summary` 응답 확인

**테스트 값**:
- 로그인: username=`test`, password=`test`
- 오늘 요일에 시간표 수업이 있어야 위젯 표시됨

---

## [부모님 연락] 메시지 발송 + AI 초안

**기능 설명**: 부모님 목록에서 학생 선택 후 메시지 작성, Claude Haiku로 AI 초안 생성 후 발송.

**플로우**:
1. `/messages` 접속 → 좌측 부모님 목록에서 학생 선택(체크박스)
2. 메시지 작성 또는 Drawer에서 "AI 초안 생성" 클릭
3. `[학생이름]` 자동 치환 후 발송

**테스트 방법**:
- 브라우저 `http://localhost:3000/messages`
- `POST http://localhost:8000/messages/generate` — AI 초안 API
  ```json
  { "student_name": "강태양", "context": "수학 성적 향상" }
  ```

**테스트 값**:
- 학생: `강태양` (test 학원 중2)
- AI 초안 컨텍스트: `이번 달 수학 성적이 많이 올랐습니다`

---

## [성적 관리] 학생 상세 모달 성적 탭

**기능 설명**: 학생 상세 팝업의 성적 탭에서 연도별/시험별 성적 조회 (rowspan 셀병합).

**플로우**:
1. `/students` → 학생 클릭 → 상세 모달 → "성적" 탭
2. 연도 → 학기/시험 순 정렬 (최신 순: 2학기 기말 → 중간 → 1학기 기말 → 중간)
3. `GET /grades/?student_id={id}` 응답 기반 렌더링

**테스트 방법**:
- 브라우저 `/students` → `강태양` 클릭 → 성적 탭
- `GET http://localhost:8000/grades/?student_id=1`

**테스트 값**:
- 성적 있는 학생: 강태양, 김민준, 이서연 (중2)
- 연도: 2024, 시험: 1학기 중간/기말, 2학기 중간/기말

---

## [시간표] 수업 블록 추가/조회

**기능 설명**: 요일별 09:00~22:00 시간 그리드에 수업 블록 표시, 추가 모달로 신규 수업 등록.

**플로우**:
1. `/timetable` 접속 → 요일별 그리드에 수업 블록 표시
2. 요일 헤더 "+" 클릭 → 모달에서 수업명/시작·종료 시간/교실/색상 입력
3. 겹치는 시간대 추가 시 Alert 에러 메시지 표시

**테스트 방법**:
- 브라우저 `http://localhost:3000/timetable`
- `GET http://localhost:8000/schedules/?academy_id=1`
- 중복 시간 추가: 동일 요일에 겹치는 시간 → 에러 Alert 확인

**테스트 값**:
- 요일: 월, 시작: 14:00, 종료: 16:00, 수업명: `수학`, 교실: `A실`
- 중복 테스트: 14:30~15:30 동일 요일 추가 시도 → 에러

---

## [학생 관리] 학생 목록/추가/검색

**기능 설명**: 학원 학생 목록 조회, 이름/학교/학년 검색, 학생 추가/삭제.

**플로우**:
1. `/students` 접속 → 전체 학생 목록 Table 표시
2. 검색: 이름(Input.Search) + 학교 자동완성(AutoComplete) + 학년 Select
3. "+ 학생 추가" 버튼 → Modal Form → 저장
4. 삭제: Popconfirm 확인 후 제거

**테스트 방법**:
- 브라우저 `http://localhost:3000/students`
- `GET http://localhost:8000/students/?academy_id=1`
- 검색: 이름=`강태양`, 학교=`중학교`, 학년=`중2`

**테스트 값**:
- 추가: 이름=`테스트학생`, 학교=`테스트중학교`, 학년=`중1`, 전화=`010-9999-0000`
- 삭제: 위에서 추가한 `테스트학생` Popconfirm 확인 후 목록 재확인

---

## [인증] 선생님 회원가입/로그인

**기능 설명**: 선생님 계정 생성 및 JWT 기반 로그인, 대시보드 auth guard.

**플로우**:
1. `/` (로그인 페이지) → username/password → JWT 발급 → localStorage 저장
2. 로그인 상태로 `/dashboard` → 정상 진입
3. 로그아웃 or 토큰 삭제 후 `/dashboard` → `/`로 리다이렉트

**테스트 방법**:
- `POST http://localhost:8000/auth/login`
  ```json
  { "username": "test", "password": "test" }
  ```
- 브라우저 `http://localhost:3000` → 로그인 후 대시보드 진입 확인
- localStorage 토큰 삭제 후 `/dashboard` 새로고침 → 리다이렉트 확인

**테스트 값**:
- 정상: username=`test`, password=`test`
- 실패: password=`wrong` → 에러 Alert 표시 확인

---

## [학생 모바일] 학원 가입 (join)

**기능 설명**: 선생님이 초대 링크를 생성하면 학생이 `/join/[code]`로 접속해 학원 등록.

**플로우**:
1. 선생님 `POST /academy/generate-code` → 초대 코드 발급
2. 학생 `/join/[code]` 접속 → 이름/학교/학년/전화 입력
3. 제출 → 아이디(이름+전화뒷4자리) 자동 생성 → Result 화면에 아이디 표시

**테스트 방법**:
- `POST http://localhost:8000/academy/generate-code` (Authorization: Bearer 토큰)
- 반환된 code로 `/join/[code]` 브라우저 접속

**테스트 값**:
- 선생님 계정: username=`test`, password=`test`
- 학생 이름: `홍길동`, 전화: `010-0000-0001` → 생성 아이디: `홍길동0001`
