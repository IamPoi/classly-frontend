"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface StudentInfo {
  id: string;
  name: string;
  school: string;
  grade: string;
  username: string;
  username_changed: number;
}

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function StudentMyPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);

  // 아이디 변경 상태
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // 비밀번호 변경 상태
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) {
      router.push("/student/login");
      return;
    }
    fetch(`${API}/auth/student/me`, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("student_token");
          router.push("/student/login");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setStudent(data));
  }, [router]);

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");
    if (!newUsername.trim()) {
      setUsernameError("새 아이디를 입력해주세요.");
      return;
    }
    setUsernameLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/username`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ new_username: newUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "변경 실패");
      setUsernameSuccess("아이디가 변경되었습니다.");
      setStudent((prev) => prev ? { ...prev, username: data.username, username_changed: 1 } : prev);
      setNewUsername("");
    } catch (err: any) {
      setUsernameError(err.message);
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("모든 항목을 입력해주세요.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPw.length < 4) {
      setPwError("비밀번호는 4자 이상이어야 합니다.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "변경 실패");
      setPwSuccess("비밀번호가 변경되었습니다.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("student_token");
    router.push("/student/login");
  }

  if (!student) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <p className="text-sm" style={{ color: "#9ca3af" }}>불러오는 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "var(--background)" }}>
      <div className="max-w-md mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "var(--accent)" }}
            >
              C
            </div>
            <span className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Classly</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: "var(--border)", color: "#6b7280" }}
          >
            로그아웃
          </button>
        </div>

        {/* 학생 정보 */}
        <div
          className="rounded-2xl p-6 border shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            내 정보
          </h2>
          <div className="space-y-2.5">
            {[
              { label: "이름", value: student.name },
              { label: "학교", value: student.school },
              { label: "학년", value: student.grade },
              { label: "아이디", value: student.username },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: "#6b7280" }}>{label}</span>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 아이디 변경 (최초 1회) */}
        {!student.username_changed && (
          <div
            className="rounded-2xl p-6 border shadow-sm"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--foreground)" }}>
              아이디 변경
            </h2>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
              최초 1회만 변경 가능합니다
            </p>
            <form onSubmit={handleUsernameChange} className="space-y-3">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="새 아이디 입력"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              />
              {usernameError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
                  {usernameError}
                </p>
              )}
              {usernameSuccess && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#16a34a", background: "#f0fdf4" }}>
                  {usernameSuccess}
                </p>
              )}
              <button
                type="submit"
                disabled={usernameLoading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--accent)" }}
              >
                {usernameLoading ? "변경 중..." : "아이디 변경"}
              </button>
            </form>
          </div>
        )}

        {/* 비밀번호 변경 */}
        <div
          className="rounded-2xl p-6 border shadow-sm"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            비밀번호 변경
          </h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                현재 비밀번호
              </label>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                새 비밀번호
              </label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="새 비밀번호 (4자 이상)"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                새 비밀번호 확인
              </label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="새 비밀번호 재입력"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              />
            </div>
            {pwError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
                {pwError}
              </p>
            )}
            {pwSuccess && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#16a34a", background: "#f0fdf4" }}>
                {pwSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {pwLoading ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
