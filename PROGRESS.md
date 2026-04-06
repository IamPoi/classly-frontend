# Classly 개발 진행 상황

## 완료된 작업

### 프론트엔드 (Next.js 16)
- 로그인 / 회원가입 페이지
- 대시보드 (오늘 일정, 출석률, 미연락 학생, 최근 메시지)
- 학생 관리 (테이블 + StudentDetailModal)
- 시간표 관리
- 일정 관리 (월간 달력)
- 출석체크 QR 페이지
- 부모님 연락 메시지 페이지
- Sidebar (5개 메뉴 + 아이콘)
- Route Group `(dashboard)` layout 통합
- 현재 더미데이터 기반 — 백엔드 연동 미완

---

### DB (CloudType MySQL — classly)

테이블 16개:

| 테이블 | 설명 |
|--------|------|
| academies | 학원 (GPS, 카카오 API 키, 초대 코드) |
| users | 원장/선생님 계정 |
| students | 학생 (username/hashed_pw 포함 — 학생 로그인용) |
| subjects | 과목 마스터 (학원별 커스텀) |
| grade_records | 성적 기록 (중간/기말/모의고사, 등급) |
| grade_sessions | 선생님이 만든 성적 입력 세션 |
| grade_session_entries | 학생이 직접 입력한 EAV 성적 (과목명 자유 입력) |
| classes | 반/수업 |
| class_students | 반-학생 M:N |
| schedules | 주간 시간표 |
| schedule_events | 학원 일정/행사 |
| attendances | 출석 기록 (GPS+시간 검증) |
| qr_codes | QR 코드 관리 |
| messages | 학부모 메시지 |
| groups | 연락 그룹 |
| group_members | 그룹-학생 M:N |

---

### 백엔드 (FastAPI — classly/backend)

#### 구현된 라우터

| 라우터 | 주요 엔드포인트 |
|--------|---------------|
| auth | POST /auth/signup, /auth/login, GET /auth/me |
| students | CRUD + PATCH /memo |
| grades | /subjects CRUD + /students/{id}/grades upsert |
| classes | CRUD + 학생 배정 |
| schedules | 주간 시간표 CRUD |
| events | 학원 일정 CRUD |
| attendance | POST /attendance/qr (QR 생성), POST /attendance/attend (GPS+시간 검증), GET 조회/통계 |
| messages | 메시지 초안/발송 |
| groups | 그룹 CRUD + 멤버 관리 |
| dashboard | 오늘 일정 + 출석률 + 미연락 학생 + 최근 메시지 |
| join | POST /join/{code} 학생 자가 가입, GET 학원 정보, POST /auth/student-login, POST /students/bulk-upload, POST /academy/generate-code |
| grade_sessions | 세션 생성/목록/마감, 학생 성적 제출(EAV), 결과 조회 |

#### 학생 계정 시스템
- 아이디/비번: 이름+핸드폰뒷4 자동 생성 (예: 홍길동1234)
- 가입 방법 A: 초대 링크 자가 가입 `/join/{academy_code}`
- 가입 방법 B: 선생님 직접 등록 (학생 등록 시 자동 생성)
- 가입 방법 C: 엑셀 일괄 등록 `/students/bulk-upload`
- JWT에 role 포함: student / teacher / headmaster

#### 엑셀 등록 컬럼 형식
```
A: 이름*  B: 학교*  C: 학년*  D: 학생전화*
E: 부모님이름  F: 부모님전화  G: 과목  H: 등록일
(* 필수)
```

#### 성적 셀프 입력 (EAV)
- 선생님: 세션 생성 시 연도/학기/시험 종류 설정 → 링크 발급
- 학생: 링크 접속 → 로그인 → 과목명 자유 입력 + 점수/등급 → 제출
- 과목별 고정 목록 없음 — 학생이 직접 타이핑 (학교마다 과목 다름)
- 제출 후 수정 불가

---

## 남은 작업

### 백엔드
- [ ] 카카오 알림톡 실제 API 연동
  - academies에 kakao_sender_key / kakao_access_token 저장 UI
  - 출석 완료 시 부모님 자동 발송
- [ ] 대리출결 추가 방어 (동일 기기 여러 학생 감지)

### 프론트엔드
- [ ] 백엔드 API 연동 (현재 더미데이터)
- [ ] 학생용 모바일 페이지
  - `/join/{code}` — 학생 자가 가입
  - `/grade-input/{session_id}` — 성적 입력 (EAV, 모바일 최적화)
- [ ] 선생님 UI 개선
  - 엑셀 업로드 버튼
  - 성적 입력 세션 생성 팝업 (경고 포함)
  - 초대 링크 복사 버튼

### 배포
- [ ] CloudType에 백엔드 배포
- [ ] 도메인 연결

---

## 로컬 실행

```bash
# 백엔드
cd classly/backend
PYTHONPATH=. .venv/bin/uvicorn app.main:app --reload --port 8000
# Swagger: http://localhost:8000/docs

# 프론트엔드
cd classly
npm run dev
# http://localhost:3000
```

## DB 접속
```
Host: svc.sel5.cloudtype.app:30255
DB: classly
User: onboardai / PW: ckddbs8071!@
```
