"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [academy, setAcademy] = useState<{ id: string; name: string; address?: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState({ name: "", school: "", grade: "", phone: "", parent_name: "", parent_phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ username: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/join/${code}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.detail); }))
      .then(setAcademy)
      .catch((e) => setLoadError(e.message));
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.school || !form.grade || !form.phone) {
      setError("필수 항목을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setDone({ username: data.username });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loadError) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-lg font-bold mb-2" style={{ color: "#ef4444" }}>유효하지 않은 초대 링크입니다</p>
        <p className="text-sm" style={{ color: "#9ca3af" }}>{loadError}</p>
      </div>
    </main>
  );

  if (!academy) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-sm" style={{ color: "#9ca3af" }}>불러오는 중...</p>
    </main>
  );

  if (done) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#faf5ff" }}>
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "#ede9fe" }}>✓</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--foreground, #111)" }}>가입 완료!</h1>
        <p className="text-sm mb-6" style={{ color: "#6b7280" }}>{academy.name}에 등록되었습니다.</p>
        <div className="rounded-xl p-5 border mb-6" style={{ background: "#fff", borderColor: "#e5e7eb" }}>
          <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>내 아이디</p>
          <p className="text-xl font-mono font-bold" style={{ color: "#7c6af7" }}>{done.username}</p>
          <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>초기 비밀번호도 아이디와 동일합니다</p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#7c6af7" }}>
          로그인하기
        </button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "#faf5ff" }}>
      {/* 학원 정보 */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3"
          style={{ background: "#7c6af7" }}>C</div>
        <h1 className="text-lg font-bold" style={{ color: "#111" }}>{academy.name}</h1>
        <p className="text-sm mt-1" style={{ color: "#6b7280" }}>초대 링크로 학원에 등록합니다</p>
      </div>

      <form onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 shadow-sm border"
        style={{ background: "#fff", borderColor: "#e5e7eb" }}>
        <h2 className="font-semibold mb-5" style={{ color: "#111" }}>학생 정보 입력</h2>
        <div className="space-y-3">
          {[
            ["이름 *", "name", "text", "홍길동"],
            ["학교 *", "school", "text", "한빛중학교"],
            ["학년 *", "grade", "text", "중2"],
            ["학생 전화 *", "phone", "tel", "010-0000-0000"],
            ["부모님 이름", "parent_name", "text", "홍아버지"],
            ["부모님 전화", "parent_phone", "tel", "010-0000-0000"],
          ].map(([label, field, type, placeholder]) => (
            <div key={field}>
              <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>{label}</label>
              <input
                type={type}
                value={(form as any)[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
                style={{ borderColor: "#e5e7eb", background: "#fafafa", fontSize: "16px" }}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>{error}</p>
        )}

        <button type="submit" disabled={loading}
          className="w-full mt-5 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "#7c6af7", fontSize: "16px" }}>
          {loading ? "등록 중..." : "가입 완료"}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: "#9ca3af" }}>
          아이디는 이름+전화뒷4자리로 자동 생성됩니다
        </p>
      </form>
    </main>
  );
}
