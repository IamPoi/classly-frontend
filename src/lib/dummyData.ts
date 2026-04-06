// ── Students ──────────────────────────────────────────────────────────────────
export const students = [
  {
    id: 1, name: "김민준", grade: "중2", subject: "수학",
    school: "한빛중학교", age: 14, phone: "010-1234-5678",
    parentName: "김정숙", parent: "010-9001-1111", enrolled: "2024.03", lastContact: "3일 전",
    memo: "수업 집중도 높음. 서술형 문제에서 풀이 과정 생략하는 버릇 있음. 꼼꼼하게 쓰도록 지도 필요.",
    grades: [
      { year: "2023", semester: "2학기", score: 78, rank: "8/32" },
      { year: "2024", semester: "1학기", score: 83, rank: "6/32" },
      { year: "2024", semester: "2학기", score: 87, rank: "4/32" },
      { year: "2025", semester: "1학기", score: 91, rank: "3/32" },
    ],
  },
  {
    id: 2, name: "이서연", grade: "중2", subject: "수학",
    school: "한빛중학교", age: 14, phone: "010-2345-6789",
    parentName: "이미영", parent: "010-9002-2222", enrolled: "2024.03", lastContact: "1주 전",
    memo: "수학 경시대회 준비 중. 심화 문제 소화력 우수. 시간 관리 훈련 필요.",
    grades: [
      { year: "2023", semester: "2학기", score: 88, rank: "3/32" },
      { year: "2024", semester: "1학기", score: 92, rank: "2/32" },
      { year: "2024", semester: "2학기", score: 95, rank: "1/32" },
      { year: "2025", semester: "1학기", score: 97, rank: "1/32" },
    ],
  },
  {
    id: 3, name: "박지호", grade: "중2", subject: "수학",
    school: "서원중학교", age: 14, phone: "010-3456-7890",
    parentName: "박현숙", parent: "010-9003-3333", enrolled: "2024.04", lastContact: "2주 전",
    memo: "기초 연산 오류 반복. 매 수업 후 10분 기초 연산 훈련 중. 꾸준히 오면 회복 가능.",
    grades: [
      { year: "2023", semester: "2학기", score: 55, rank: "28/32" },
      { year: "2024", semester: "1학기", score: 61, rank: "25/32" },
      { year: "2024", semester: "2학기", score: 67, rank: "22/32" },
      { year: "2025", semester: "1학기", score: 72, rank: "18/32" },
    ],
  },
  {
    id: 4, name: "최아린", grade: "중2", subject: "수학",
    school: "한빛중학교", age: 14, phone: "010-4567-8901",
    parentName: "최은주", parent: "010-9004-4444", enrolled: "2024.03", lastContact: "5일 전",
    memo: "모의고사 성적 꾸준히 상승 중. 함수 단원 특히 강점. 방학 동안 선행 진행 예정.",
    grades: [
      { year: "2023", semester: "2학기", score: 82, rank: "5/32" },
      { year: "2024", semester: "1학기", score: 87, rank: "4/32" },
      { year: "2024", semester: "2학기", score: 90, rank: "3/32" },
      { year: "2025", semester: "1학기", score: 94, rank: "2/32" },
    ],
  },
  {
    id: 5, name: "정우진", grade: "중2", subject: "수학",
    school: "서원중학교", age: 14, phone: "010-5678-9012",
    parentName: "정명희", parent: "010-9005-5555", enrolled: "2024.05", lastContact: "1주 전",
    memo: "이해력 좋으나 복습 잘 안 함. 숙제 검사 강화 필요. 부모님께 가정 학습 요청 드림.",
    grades: [
      { year: "2023", semester: "2학기", score: 74, rank: "12/32" },
      { year: "2024", semester: "1학기", score: 76, rank: "11/32" },
      { year: "2024", semester: "2학기", score: 79, rank: "9/32" },
      { year: "2025", semester: "1학기", score: 82, rank: "7/32" },
    ],
  },
  {
    id: 6, name: "한소희", grade: "중1", subject: "수학",
    school: "늘봄중학교", age: 13, phone: "010-6789-0123",
    parentName: "한지영", parent: "010-9006-6666", enrolled: "2025.03", lastContact: "2일 전",
    memo: "중1 입학 후 빠른 적응. 수업 태도 모범적. 연립방정식까지 완벽 소화.",
    grades: [
      { year: "2025", semester: "1학기", score: 96, rank: "1/35" },
    ],
  },
  {
    id: 7, name: "오재원", grade: "중1", subject: "수학",
    school: "늘봄중학교", age: 13, phone: "010-7890-1234",
    parentName: "오수진", parent: "010-9007-7777", enrolled: "2025.03", lastContact: "3주 전",
    memo: "기초 연산 느림. 곱셈/나눗셈 암산 훈련 필요. 성격은 밝고 좋으나 집중 시간 짧음(20분).",
    grades: [
      { year: "2025", semester: "1학기", score: 58, rank: "33/35" },
    ],
  },
  {
    id: 8, name: "신예은", grade: "중3", subject: "수학",
    school: "푸른중학교", age: 15, phone: "010-8901-2345",
    parentName: "신미경", parent: "010-9008-8888", enrolled: "2023.03", lastContact: "4일 전",
    memo: "고교 선행 진행 중(수1). 이해 속도 빠르고 응용력 우수. 고입 특기자 전형 준비.",
    grades: [
      { year: "2023", semester: "1학기", score: 89, rank: "2/30" },
      { year: "2023", semester: "2학기", score: 93, rank: "1/30" },
      { year: "2024", semester: "1학기", score: 96, rank: "1/30" },
      { year: "2024", semester: "2학기", score: 98, rank: "1/30" },
    ],
  },
  {
    id: 9, name: "장현우", grade: "중3", subject: "수학",
    school: "푸른중학교", age: 15, phone: "010-9012-3456",
    parentName: "장은영", parent: "010-9009-9999", enrolled: "2023.09", lastContact: "1주 전",
    memo: "중간 정도 실력. 꾸준히 오는 성실한 학생. 고교 진학 목표 대비 현재 수준 약간 부족.",
    grades: [
      { year: "2023", semester: "2학기", score: 71, rank: "15/30" },
      { year: "2024", semester: "1학기", score: 75, rank: "13/30" },
      { year: "2024", semester: "2학기", score: 78, rank: "11/30" },
    ],
  },
  {
    id: 10, name: "윤지아", grade: "중1", subject: "수학",
    school: "늘봄중학교", age: 13, phone: "010-0123-4567",
    parentName: "윤혜진", parent: "010-9010-1010", enrolled: "2025.03", lastContact: "6일 전",
    memo: "정수/유리수 개념 이해 완료. 방정식 단원 진입 예정. 필기가 깔끔하고 오답 노트 잘 씀.",
    grades: [
      { year: "2025", semester: "1학기", score: 84, rank: "7/35" },
    ],
  },
  {
    id: 11, name: "강태양", grade: "중2", subject: "수학",
    school: "서원중학교", age: 14, phone: "010-1357-2468",
    parentName: "강보람", parent: "010-9011-1111", enrolled: "2024.09", lastContact: "2주 전",
    memo: "결석 잦음(월 2~3회). 진도 공백 큼. 부모님 상담 진행 후 개선 중. 지속 관찰 필요.",
    grades: [
      { year: "2024", semester: "2학기", score: 62, rank: "23/32" },
      { year: "2025", semester: "1학기", score: 65, rank: "21/32" },
    ],
  },
  {
    id: 12, name: "임나연", grade: "중3", subject: "수학",
    school: "푸른중학교", age: 15, phone: "010-2468-3579",
    parentName: "임선희", parent: "010-9012-2222", enrolled: "2023.03", lastContact: "어제",
    memo: "수능 수학 1등급 목표. 최근 모의 1등급 달성. 오개념 없고 응용력 최상. 모범 케이스.",
    grades: [
      { year: "2023", semester: "1학기", score: 91, rank: "2/30" },
      { year: "2023", semester: "2학기", score: 95, rank: "1/30" },
      { year: "2024", semester: "1학기", score: 97, rank: "1/30" },
      { year: "2024", semester: "2학기", score: 99, rank: "1/30" },
    ],
  },
  {
    id: 13, name: "송민혁", grade: "중1", subject: "수학",
    school: "한빛중학교", age: 13, phone: "010-3579-4680",
    parentName: "송지연", parent: "010-9013-3333", enrolled: "2025.03", lastContact: "5일 전",
    memo: "소극적이나 수업 이해도 좋음. 발표를 두려워함. 격려 위주로 지도 중.",
    grades: [
      { year: "2025", semester: "1학기", score: 79, rank: "12/35" },
    ],
  },
  {
    id: 14, name: "류하은", grade: "중2", subject: "수학",
    school: "한빛중학교", age: 14, phone: "010-4680-5791",
    parentName: "류미연", parent: "010-9014-4444", enrolled: "2024.03", lastContact: "1주 전",
    memo: "함수 단원 두각. 심화 문제 스스로 풀려는 의지 강함. 방학 심화반 추천 예정.",
    grades: [
      { year: "2023", semester: "2학기", score: 84, rank: "5/32" },
      { year: "2024", semester: "1학기", score: 88, rank: "4/32" },
      { year: "2024", semester: "2학기", score: 92, rank: "2/32" },
      { year: "2025", semester: "1학기", score: 94, rank: "2/32" },
    ],
  },
  {
    id: 15, name: "문준서", grade: "중3", subject: "수학",
    school: "서원중학교", age: 15, phone: "010-5791-6802",
    parentName: "문현주", parent: "010-9015-5555", enrolled: "2023.09", lastContact: "3주 전",
    memo: "서술형 풀이 능력 부족. 답은 맞히나 과정 감점 多. 논리적 서술 훈련 집중 진행 중.",
    grades: [
      { year: "2023", semester: "2학기", score: 68, rank: "20/30" },
      { year: "2024", semester: "1학기", score: 71, rank: "17/30" },
      { year: "2024", semester: "2학기", score: 74, rank: "15/30" },
    ],
  },
  {
    id: 16, name: "배수빈", grade: "중1", subject: "수학",
    school: "늘봄중학교", age: 13, phone: "010-6802-7913",
    parentName: "배정미", parent: "010-9016-6666", enrolled: "2025.03", lastContact: "오늘",
    memo: "입학 첫 달부터 적극적. 질문을 매우 잘함. 수업 분위기 긍정적으로 이끄는 역할.",
    grades: [
      { year: "2025", semester: "1학기", score: 93, rank: "2/35" },
    ],
  },
  {
    id: 17, name: "조이현", grade: "중2", subject: "수학",
    school: "서원중학교", age: 14, phone: "010-7913-8024",
    parentName: "조미화", parent: "010-9017-7777", enrolled: "2024.09", lastContact: "2일 전",
    memo: "전학 후 합류. 이전 학원과 교육 방식 차이로 초기 적응 필요했으나 현재 안정적.",
    grades: [
      { year: "2024", semester: "2학기", score: 77, rank: "10/32" },
      { year: "2025", semester: "1학기", score: 81, rank: "8/32" },
    ],
  },
  {
    id: 18, name: "황도윤", grade: "중3", subject: "수학",
    school: "푸른중학교", age: 15, phone: "010-8024-9135",
    parentName: "황순이", parent: "010-9018-8888", enrolled: "2023.03", lastContact: "1주 전",
    memo: "3년째 다니는 장기 수강생. 성실하고 꾸준함. 급격한 향상보다 안정적 유지가 강점.",
    grades: [
      { year: "2023", semester: "1학기", score: 73, rank: "14/30" },
      { year: "2023", semester: "2학기", score: 75, rank: "13/30" },
      { year: "2024", semester: "1학기", score: 77, rank: "12/30" },
      { year: "2024", semester: "2학기", score: 79, rank: "10/30" },
    ],
  },
  {
    id: 19, name: "서지우", grade: "중1", subject: "수학",
    school: "한빛중학교", age: 13, phone: "010-9135-0246",
    parentName: "서정란", parent: "010-9019-9999", enrolled: "2025.09", lastContact: "4일 전",
    memo: "9월 신규 등록. 초등 수학 기초 부족 확인. 선행보다 기초 보완 우선으로 커리큘럼 조정.",
    grades: [],
  },
  {
    id: 20, name: "고은채", grade: "중2", subject: "수학",
    school: "한빛중학교", age: 14, phone: "010-0246-1357",
    parentName: "고수연", parent: "010-9020-1020", enrolled: "2024.03", lastContact: "어제",
    memo: "실전 문제 풀이 속도 빠르고 정확. 중간고사 범위 완벽 소화. 상위권 유지 가능성 높음.",
    grades: [
      { year: "2023", semester: "2학기", score: 86, rank: "4/32" },
      { year: "2024", semester: "1학기", score: 89, rank: "3/32" },
      { year: "2024", semester: "2학기", score: 93, rank: "2/32" },
      { year: "2025", semester: "1학기", score: 95, rank: "1/32" },
    ],
  },
];

// ── Messages ──────────────────────────────────────────────────────────────────
export const messages = [
  { id: 1,  student: "김민준",  parent: "010-9001-1111", preview: "안녕하세요, 김민준 어머니. 이번 달 이차방정식 단원 오답률이 20%에서 8%로 크게 줄었습니다. 꾸준한 복습 덕분인 것 같아 칭찬드리고 싶었어요.", date: "2026.03.28", status: "발송완료" },
  { id: 2,  student: "이서연",  parent: "010-9002-2222", preview: "이서연 학생이 이번 달 수학 경시대회 교내 예선을 통과했습니다. 실력이 정말 빠르게 늘고 있어서 선생님도 뿌듯합니다.", date: "2026.03.25", status: "발송완료" },
  { id: 3,  student: "박지호",  parent: "010-9003-3333", preview: "박지호 학생의 수업 집중도가 최근 다소 떨어져 걱정이 됩니다. 한 번 면담을 통해 어려운 점이 있는지 이야기 나눠보면 좋을 것 같습니다.", date: "2026.03.20", status: "초안" },
  { id: 4,  student: "최아린",  parent: "010-9004-4444", preview: "최아린 학생은 3월 모의고사에서 전월 대비 15점 향상되었습니다. 이 추세라면 상위권 유지가 충분히 가능합니다.", date: "2026.03.15", status: "발송완료" },
  { id: 5,  student: "한소희",  parent: "010-9006-6666", preview: "한소희 학생이 이번 달 연립방정식 단원을 완벽하게 소화했습니다. 수업 태도도 훌륭하고 질문도 적극적으로 잘 해줍니다.", date: "2026.03.27", status: "발송완료" },
  { id: 6,  student: "오재원",  parent: "010-9007-7777", preview: "오재원 학생이 기초 연산에서 반복 오류가 나타나고 있습니다. 가정에서 매일 15분씩 기초 문제를 풀어보는 것을 권장드립니다.", date: "2026.03.18", status: "발송완료" },
  { id: 7,  student: "신예은",  parent: "010-9008-8888", preview: "신예은 학생이 고등학교 선행 학습에 들어갔습니다. 이해 속도가 빠르고 응용력도 뛰어나 큰 문제 없이 따라오고 있습니다.", date: "2026.03.26", status: "발송완료" },
  { id: 8,  student: "강태양",  parent: "010-9011-1111", preview: "강태양 학생이 최근 결석이 잦아 진도가 많이 밀려있는 상황입니다. 빠른 보충 수업이 필요할 것 같아 연락드립니다.", date: "2026.03.10", status: "초안" },
  { id: 9,  student: "임나연",  parent: "010-9012-2222", preview: "임나연 학생이 이번 달 수능 수학 모의고사에서 1등급을 받았습니다. 고3 준비가 정말 잘 되어 가고 있습니다.", date: "2026.03.29", status: "발송완료" },
  { id: 10, student: "류하은",  parent: "010-9014-4444", preview: "류하은 학생이 함수 단원에서 특히 두각을 나타내고 있습니다. 이 분야에서 심화 문제를 더 도전해볼 것을 권해드립니다.", date: "2026.03.22", status: "발송완료" },
  { id: 11, student: "문준서",  parent: "010-9015-5555", preview: "문준서 학생이 수업 내 발표 활동에서 자신감이 많이 생겼습니다. 그러나 서술형 문제 풀이 능력을 좀 더 키울 필요가 있습니다.", date: "2026.03.14", status: "초안" },
  { id: 12, student: "고은채",  parent: "010-9020-1020", preview: "고은채 학생이 중간고사 범위를 완벽히 마무리했습니다. 실전 문제 풀이도 빠르고 정확해서 좋은 결과가 기대됩니다.", date: "2026.03.29", status: "발송완료" },
];

// ── Timetable ─────────────────────────────────────────────────────────────────
export const timetable: Record<string, { time: string; className: string; room: string; color: string }[]> = {
  월: [
    { time: "14:00~15:30", className: "중1 수학 기초반", room: "A반", color: "#7c6af7" },
    { time: "16:00~17:30", className: "중2 수학 심화반", room: "B반", color: "#10b981" },
    { time: "18:00~19:30", className: "중3 수학 특강반", room: "A반", color: "#f59e0b" },
  ],
  화: [
    { time: "15:00~16:30", className: "중1 수학 기초반", room: "B반", color: "#7c6af7" },
    { time: "17:00~18:30", className: "중2 수학 보통반", room: "A반", color: "#6366f1" },
  ],
  수: [
    { time: "14:00~15:30", className: "중2 수학 심화반", room: "B반", color: "#10b981" },
    { time: "16:00~17:30", className: "중3 수학 특강반", room: "A반", color: "#f59e0b" },
    { time: "18:00~19:30", className: "중1 수학 기초반", room: "B반", color: "#7c6af7" },
  ],
  목: [
    { time: "15:00~16:30", className: "중2 수학 보통반", room: "B반", color: "#6366f1" },
    { time: "17:00~18:30", className: "중3 수학 특강반", room: "A반", color: "#f59e0b" },
  ],
  금: [
    { time: "14:00~15:30", className: "중1 수학 기초반", room: "A반", color: "#7c6af7" },
    { time: "16:00~17:30", className: "중2 수학 심화반", room: "B반", color: "#10b981" },
  ],
  토: [
    { time: "10:00~12:00", className: "중3 수능 대비반", room: "A반", color: "#ef4444" },
    { time: "13:00~15:00", className: "중2 오전 특강", room: "B반", color: "#6366f1" },
  ],
  일: [],
};

// ── Schedule Events ────────────────────────────────────────────────────────────
export const scheduleEvents = [
  { id: 1,  date: "2026-03-30", title: "중2 월간 모의고사", type: "시험", color: "#ef4444" },
  { id: 2,  date: "2026-04-01", title: "중간고사 대비 특강 시작", type: "수업", color: "#7c6af7" },
  { id: 3,  date: "2026-04-05", title: "학부모 상담 주간 시작", type: "상담", color: "#f59e0b" },
  { id: 4,  date: "2026-04-07", title: "중3 수학여행 (결석 예정)", type: "기타", color: "#6b7280" },
  { id: 5,  date: "2026-04-10", title: "중1 단원평가 (방정식)", type: "시험", color: "#ef4444" },
  { id: 6,  date: "2026-04-12", title: "학부모 상담 주간 종료", type: "상담", color: "#f59e0b" },
  { id: 7,  date: "2026-04-15", title: "중간고사 기간", type: "시험", color: "#ef4444" },
  { id: 8,  date: "2026-04-16", title: "중간고사 기간", type: "시험", color: "#ef4444" },
  { id: 9,  date: "2026-04-17", title: "중간고사 기간", type: "시험", color: "#ef4444" },
  { id: 10, date: "2026-04-20", title: "수업 재개 / 오답 풀이", type: "수업", color: "#7c6af7" },
  { id: 11, date: "2026-04-25", title: "신규 학생 상담 (2명)", type: "상담", color: "#f59e0b" },
  { id: 12, date: "2026-04-28", title: "중2 심화반 진도 점검", type: "수업", color: "#7c6af7" },
  { id: 13, date: "2026-05-05", title: "어린이날 (휴원)", type: "휴원", color: "#10b981" },
  { id: 14, date: "2026-05-10", title: "중3 월간 모의고사", type: "시험", color: "#ef4444" },
];

// ── Groups (부모님 연락 그룹) ───────────────────────────────────────────────────
export const groups = [
  { id: 1, name: "한빛중학교",  members: [1, 2, 4, 13, 14, 16, 19, 20] },
  { id: 2, name: "서원중학교",  members: [3, 5, 11, 15, 17] },
  { id: 3, name: "늘봄중학교",  members: [6, 7, 10, 16] },
  { id: 4, name: "푸른중학교",  members: [8, 9, 12, 15, 18] },
  { id: 5, name: "중1 전체",    members: [6, 7, 10, 13, 16, 19] },
  { id: 6, name: "중2 전체",    members: [1, 2, 3, 4, 5, 11, 14, 17, 20] },
  { id: 7, name: "중3 전체",    members: [8, 9, 12, 15, 18] },
  { id: 8, name: "심화반",      members: [2, 4, 8, 12, 14, 20] },
  { id: 9, name: "기초반",      members: [3, 7, 11, 15, 19] },
];
