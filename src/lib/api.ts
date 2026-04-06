const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "요청 실패");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────
export async function login(username: string, password: string) {
  const data = await request<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function signup(body: {
  username: string;
  password: string;
  email: string;
  name: string;
  academy_name: string;
  academy_address?: string;
}) {
  const data = await request<{ access_token: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
  });
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function getMe() {
  return request<{ id: string; username: string; name: string; role: string; academy_id: string; academy_name: string }>("/auth/me");
}

export function logout() {
  localStorage.removeItem("token");
}

// ── Dashboard ─────────────────────────────────────────────────
export async function getDashboard() {
  return request<{
    today_events: any[];
    attendance_rate: number;
    no_contact_students: any[];
    recent_messages: any[];
  }>("/dashboard");
}

// ── Students ──────────────────────────────────────────────────
export async function getStudents() {
  return request<any[]>("/students");
}

export async function createStudent(body: {
  name: string;
  school?: string;
  grade?: string;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  subject?: string;
  parent_relation?: string;
}) {
  return request<any>("/students", { method: "POST", body: JSON.stringify(body) });
}

export async function patchStudentMemo(studentId: string, memo: string) {
  return request<any>(`/students/${studentId}/memo`, {
    method: "PATCH",
    body: JSON.stringify({ memo }),
  });
}

export async function deleteStudent(studentId: string) {
  return request<void>(`/students/${studentId}`, { method: "DELETE" });
}

export async function getStudentGrades(studentId: string) {
  return request<any[]>(`/students/${studentId}/grades`);
}

export async function getStudentGradeEntries(studentId: string) {
  // EAV 방식 성적 — grade_session_entries 기반
  const sessions = await request<any[]>("/grade-sessions");
  // 각 세션에서 해당 학생 성적 수집 (간소화: 세션 목록만 반환)
  return sessions;
}

// ── Messages ──────────────────────────────────────────────────
export async function getMessages() {
  return request<any[]>("/messages");
}

export async function generateMessage(body: {
  student_id: string;
  message_type: string;
  tone: string;
  reason?: string;
  include_student_name?: boolean;
  extra_notes?: string;
}) {
  return request<{ draft: string; student_name: string; parent_phone: string }>("/messages/generate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function saveMessage(body: {
  student_id?: string;
  parent_phone?: string;
  content: string;
  type?: string;
}) {
  return request<{ id: string }>("/messages", { method: "POST", body: JSON.stringify(body) });
}

// ── Events ────────────────────────────────────────────────────
export async function getEvents() {
  return request<any[]>("/events");
}

export async function createEvent(body: {
  title: string;
  date: string;     // alias — maps to event_date in backend
  type: string;
  description?: string;
}) {
  return request<any>("/events", {
    method: "POST",
    body: JSON.stringify({ ...body, event_date: body.date }),
  });
}

export async function deleteEvent(eventId: string) {
  return request<void>(`/events/${eventId}`, { method: "DELETE" });
}

// ── Schedules ─────────────────────────────────────────────────
export async function getSchedules() {
  return request<Record<string, any[]>>("/schedules");
}

export async function createSchedule(body: {
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_name: string;
  room?: string;
  color?: string;
}) {
  return request<{ id: string }>("/schedules", { method: "POST", body: JSON.stringify(body) });
}

export async function deleteSchedule(scheduleId: string) {
  return request<void>(`/schedules/${scheduleId}`, { method: "DELETE" });
}

// ── Attendance ────────────────────────────────────────────────
export async function getAttendance(params?: { class_id?: string; date?: string }) {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString()
    : "";
  return request<any[]>(`/attendance${qs}`);
}

export async function generateQR(classId: string) {
  return request<{ qr_id: string; qr_token: string; expires_at: string }>("/attendance/qr", {
    method: "POST",
    body: JSON.stringify({ class_id: classId }),
  });
}

// ── Groups ────────────────────────────────────────────────────
export async function getGroups() {
  return request<any[]>("/groups");
}

export async function createGroup(name: string, studentIds: string[]) {
  return request<any>("/groups", {
    method: "POST",
    body: JSON.stringify({ name, student_ids: studentIds }),
  });
}

export async function deleteGroup(groupId: string) {
  return request<void>(`/groups/${groupId}`, { method: "DELETE" });
}

// ── Classes ───────────────────────────────────────────────────
export async function getClasses() {
  return request<any[]>("/classes");
}

// ── Grade Sessions ────────────────────────────────────────────
export async function createGradeSession(body: {
  year: string;
  exam_type: string;
  exam_month?: number;
  expires_at?: string;
}) {
  return request<{ id: string; url: string }>("/grade-sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getGradeSessions() {
  return request<any[]>("/grade-sessions");
}

export async function getGradeSessionResults(sessionId: string) {
  return request<any>(`/grade-sessions/${sessionId}/results`);
}

export async function closeGradeSession(sessionId: string) {
  return request<{ ok: boolean }>(`/grade-sessions/${sessionId}/close`, { method: "PATCH" });
}

// ── Academy ───────────────────────────────────────────────────
export async function generateInviteCode() {
  return request<{ academy_code: string; invite_url: string }>("/academy/generate-code", {
    method: "POST",
  });
}

// ── Watch (관심 학생) ─────────────────────────────────────────
export async function getWatchedStudents() {
  return request<any[]>("/students/watched");
}

export async function updateWatch(studentId: string, isWatched: boolean, reason?: string) {
  return request<{ ok: boolean; is_watched: boolean }>(`/students/${studentId}/watch`, {
    method: "PATCH",
    body: JSON.stringify({ is_watched: isWatched, reason }),
  });
}

// ── Attendance Stats ──────────────────────────────────────────
export async function getStudentAttendanceStats(studentId: string) {
  return request<{
    total: number;
    attended: number;
    late: number;
    absent: number;
    rate: number | null;
    recent_30days: { total: number; present: number; rate: number | null };
  }>(`/students/${studentId}/attendance-stats`);
}

// ── Consultation Logs (상담 일지) ─────────────────────────────
export async function getConsultationLogs(studentId: string) {
  return request<any[]>(`/students/${studentId}/logs`);
}

export async function createConsultationLog(studentId: string, content: string, category: string) {
  return request<any>(`/students/${studentId}/logs`, {
    method: "POST",
    body: JSON.stringify({ content, category }),
  });
}

export async function updateConsultationLog(studentId: string, logId: string, content: string, category: string) {
  return request<{ ok: boolean }>(`/students/${studentId}/logs/${logId}`, {
    method: "PATCH",
    body: JSON.stringify({ content, category }),
  });
}

export async function deleteConsultationLog(studentId: string, logId: string) {
  return request<void>(`/students/${studentId}/logs/${logId}`, { method: "DELETE" });
}
