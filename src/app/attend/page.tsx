"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Step = "login" | "processing" | "done" | "error";

export default function AttendPage() {
  const params = useSearchParams();
  const classId = params.get("class");
  const t = params.get("t");

  const [step, setStep] = useState<Step>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [result, setResult] = useState<{ status: string; gps_verified: boolean; time_verified: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 이미 로그인된 학생이면 바로 출석 처리
  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (token && classId) {
      processAttendance(token);
    }
  }, [classId]);

  async function processAttendance(token: string) {
    setStep("processing");
    try {
      // 학생 정보에서 student_id 추출
      const meRes = await fetch(`${API}/auth/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        localStorage.removeItem("student_token");
        setStep("login");
        return;
      }
      const me = await meRes.json();

      // QR 코드 재구성 (백엔드에서 저장된 코드 형식: classly://attend?class=...&t=...)
      const qrCode = `classly://attend?class=${classId}&t=${t}`;

      // GPS 위치 가져오기 (실패해도 진행)
      let lat: number | undefined;
      let lon: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // GPS 없어도 진행
      }

      const res = await fetch(`${API}/attendance/attend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_code: qrCode,
          student_id: me.id,
          latitude: lat,
          longitude: lon,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail ?? "출석 처리에 실패했습니다.");
        setStep("error");
        return;
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("error");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoginError(err.detail ?? "로그인 실패");
        return;
      }
      const { access_token } = await res.json();
      localStorage.setItem("student_token", access_token);
      processAttendance(access_token);
    } catch {
      setLoginError("네트워크 오류가 발생했습니다.");
    }
  }

  if (!classId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#f9fafb" }}>
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-base font-semibold" style={{ color: "#374151" }}>유효하지 않은 QR 코드입니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#f9fafb" }}>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "#7c6af7" }}>C</div>
          <span className="text-xl font-bold" style={{ color: "#111827" }}>Classly</span>
        </div>
        <p className="text-sm" style={{ color: "#6b7280" }}>출석 체크</p>
      </div>

      {step === "login" && (
        <form onSubmit={handleLogin}
          className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border"
          style={{ borderColor: "#e5e7eb" }}>
          <h1 className="text-base font-semibold mb-1" style={{ color: "#111827" }}>학생 로그인</h1>
          <p className="text-xs mb-5" style={{ color: "#9ca3af" }}>로그인 후 자동으로 출석 처리됩니다</p>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디 (이름+전화뒷4, 예: 홍길동1234)"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
              />
            </div>
            {loginError && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
                {loginError}
              </p>
            )}
            <button type="submit"
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#7c6af7" }}>
              출석 체크
            </button>
          </div>
        </form>
      )}

      {step === "processing" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-t-transparent mx-auto mb-4 animate-spin"
            style={{ borderColor: "#7c6af7", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#6b7280" }}>출석 처리 중...</p>
        </div>
      )}

      {step === "done" && result && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border text-center"
          style={{ borderColor: "#e5e7eb" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: result.status === "지각" ? "#fef3c7" : "#d1fae5" }}>
            {result.status === "지각" ? "⏰" : "✅"}
          </div>
          <p className="text-xl font-bold mb-1"
            style={{ color: result.status === "지각" ? "#d97706" : "#059669" }}>
            {result.status}
          </p>
          <p className="text-sm mb-5" style={{ color: "#9ca3af" }}>
            {result.status === "지각" ? "지각으로 처리되었습니다." : "출석이 완료되었습니다!"}
          </p>
          <div className="flex justify-center gap-4 text-xs" style={{ color: "#9ca3af" }}>
            <span>GPS {result.gps_verified ? "✓" : "미확인"}</span>
            <span>시간 {result.time_verified ? "✓" : "미확인"}</span>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm border text-center"
          style={{ borderColor: "#e5e7eb" }}>
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-base font-semibold mb-2" style={{ color: "#374151" }}>출석 처리 실패</p>
          <p className="text-sm mb-5" style={{ color: "#ef4444" }}>{errorMsg}</p>
          <button onClick={() => setStep("login")}
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: "#ede9fe", color: "#7c6af7" }}>
            다시 시도
          </button>
        </div>
      )}
    </main>
  );
}
