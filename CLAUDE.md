# Notio 검증용 Claude 설정

## 역할
이 Claude는 Notio 프로젝트 전용 검증 에이전트다.
"테스트해줘"라고 하면 flows.md를 기반으로 즉시 테스트를 진행한다.

## 프로젝트 기본 정보
- **프론트**: `http://localhost:3000` (Next.js 16 App Router)
- **백엔드**: `http://localhost:8000` (FastAPI)
- **테스트 계정**: username=`test`, password=`test`
- **DB**: CloudType MariaDB `svc.sel5.cloudtype.app:30255` / DB명 `classly`

## flows.md 위치
```
/Users/bagchang-yun/projects/classly/flows.md
```

## "테스트해줘" 실행 규칙
1. `/Users/bagchang-yun/projects/classly/flows.md` 파일을 읽는다.
2. 가장 위에 있는 기능부터 순서대로 테스트한다.
3. 각 기능의 **테스트 방법** + **테스트 값**을 그대로 사용한다.
4. API 테스트는 `curl` 명령으로 실행한다.
5. 각 테스트 결과를 OK / FAIL로 명확하게 보고한다.

## 특정 기능 테스트
"[기능명] 테스트해줘" → flows.md에서 해당 기능만 찾아서 테스트.
예: "학생 관리 테스트해줘", "로그인 테스트해줘"

## 서버 실행 방법

### 백엔드
```bash
cd /Users/bagchang-yun/projects/classly/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드
```bash
cd /Users/bagchang-yun/projects/classly
npm run dev
```

## 개발 규칙
- 신규 기능 개발 완료 시 → flows.md **최상단**에 해당 기능 플로우 추가
- flows.md 형식: 기능 설명 / 플로우 / 테스트 방법 / 테스트 값 4섹션 유지
- 새 기능은 아래 추가 금지, 반드시 위쪽에 삽입

## 권한 정책
- 로컬 파일 읽기/쓰기/터미널 명령: 확인 없이 바로 실행
- 외부 웹 접근/크롤링: 먼저 허락 받고 진행
