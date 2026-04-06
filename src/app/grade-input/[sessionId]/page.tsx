"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type GradeRow = { subject_name: string; score: string; grade_level: string };

export default function GradeInputPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  // 로그인 상태
  const [token, setToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // 세션 정보
  const [session, setSession] = useState<any>(null);
  const [sessionError, setSessionError] = useState("");

  // 성적 입력
  const [rows, setRows] = useState<GradeRow[]>([{ subject_name: "", score: "", grade_level: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // 토큰 초기화
  useEffect(() => {
    const t = localStorage.getItem("student_token");
    const sid = localStorage.getItem("student_id");
    if (t && sid) { setToken(t); setStudentId(sid); }
  }, []);

  // 세션 로드
  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/grade-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.detail); }))
      .then(setSession)
      .catch((e) => setSessionError(e.message));
  }, [sessionId, token]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${BASE}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem("student_token", data.access_token);
      // 토큰에서 student_id 파싱 (JWT payload)
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      localStorage.setItem("student_id", payload.sub);
      setStudentId(payload.sub);
      setToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function addRow() {
    setRows((r) => [...r, { subject_name: "", score: "", grade_level: "" }]);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }
  function updateRow(i: number, field: keyof GradeRow, value: string) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validRows = rows.filter((r) => r.subject_name.trim());
    if (validRows.length === 0) { setSubmitError("과목을 최소 하나 입력하세요."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BASE}/grade-sessions/${sessionId}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId,
          entries: validRows.map((r) => ({
            subject_name: r.subject_name.trim(),
            score: r.score ? parseInt(r.score) : null,
            grade_level: r.grade_level ? parseInt(r.grade_level) : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 로그인 전
  if (!token) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#faf5ff" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3"
            style={{ background: "#7c6af7" }}>C</div>
          <h1 className="text-lg font-bold" style={{ color: "#111" }}>성적 입력</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>학생 계정으로 로그인하세요</p>
        </div>
        <form onSubmit={handleLogin}
          className="rounded-2xl p-6 border shadow-sm"
          style={{ background: "#fff", borderColor: "#e5e7eb" }}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>아이디</label>
              <input type="text" value={loginForm.username}
                onChange={(e) => setLoginForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="이름+전화뒷4 (예: 홍길동1234)"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>비밀번호</label>
              <input type="password" value={loginForm.password}
                onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }} />
            </div>
          </div>
          {loginError && (
            <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>{loginError}</p>
          )}
          <button type="submit" disabled={loginLoading}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#7c6af7", fontSize: "16px" }}>
            {loginLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </main>
  );

  if (sessionError) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg font-bold mb-2" style={{ color: "#ef4444" }}>세션 오류</p>
        <p className="text-sm" style={{ color: "#9ca3af" }}>{sessionError}</p>
      </div>
    </main>
  );

  if (!session) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: "#9ca3af" }}>불러오는 중...</p>
    </main>
  );

  if (submitted || session.already_submitted) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#faf5ff" }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "#d1fae5" }}>✓</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "#111" }}>제출 완료!</h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          {session.already_submitted ? "이미 제출한 성적입니다." : "성적이 성공적으로 제출되었습니다."}
        </p>
      </div>
    </main>
  );

  const examLabel = `${session.year}년 ${session.exam_type.replace("_", " ")}`;

  return (
    <main className="min-h-screen px-4 py-8" style={{ background: "#faf5ff" }}>
      <div className="max-w-sm mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold" style={{ color: "#111" }}>{examLabel}</h1>
          <p className="text-sm mt-1" style={{ color: "#6b7280" }}>성적을 직접 입력해주세요</p>
        </div>

        <form onSubmit={handleSubmit}
          className="rounded-2xl border p-5 shadow-sm"
          style={{ background: "#fff", borderColor: "#e5e7eb" }}>

          {/* 헤더 행 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <p className="text-xs font-semibold" style={{ color: "#6b7280" }}>과목명</p>
            <p className="text-xs font-semibold text-center" style={{ color: "#6b7280" }}>점수</p>
            <p className="text-xs font-semibold text-center" style={{ color: "#6b7280" }}>등급</p>
          </div>

          {/* 성적 입력 행들 */}
          <div className="space-y-2 mb-4">
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <input
                    type="text"
                    value={row.subject_name}
                    onChange={(e) => updateRow(i, "subject_name", e.target.value)}
                    placeholder="수학"
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }}
                  />
                  <input
                    type="number"
                    value={row.score}
                    onChange={(e) => updateRow(i, "score", e.target.value)}
                    placeholder="85"
                    min="0" max="100"
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none text-center"
                    style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }}
                  />
                  <input
                    type="number"
                    value={row.grade_level}
                    onChange={(e) => updateRow(i, "grade_level", e.target.value)}
                    placeholder="3"
                    min="1" max="9"
                    className="px-3 py-2.5 rounded-xl border text-sm outline-none text-center"
                    style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }}
                  />
                </div>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(i)}
                    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ color: "#ef4444", background: "#fef2f2" }}>×</button>
                )}
              </div>
            ))}
          </div>

          {/* 과목 추가 버튼 */}
          <button type="button" onClick={addRow}
            className="w-full py-2.5 rounded-xl border text-sm font-medium mb-5"
            style={{ borderColor: "#7c6af7", color: "#7c6af7", borderStyle: "dashed" }}>
            + 과목 추가
          </button>

          {submitError && (
            <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>{submitError}</p>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "#7c6af7", fontSize: "16px" }}>
            {submitting ? "제출 중..." : "제출하기"}
          </button>
          <p className="text-xs text-center mt-3" style={{ color: "#ef4444" }}>
            ⚠️ 제출 후 수정이 불가능합니다
          </p>
        </form>
      </div>
    </main>
  );
}
