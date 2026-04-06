"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--background)" }}>
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg font-bold"
            style={{ background: "var(--accent)" }}>C</div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Classly</span>
        </div>
        <p className="text-sm" style={{ color: "#6b7280" }}>출결 자동화 · 학부모 소통 한 곳에서</p>
      </div>

      <form onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl p-8 shadow-sm border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>로그인</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디 입력"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: "var(--accent)" }}>
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="text-xs" style={{ color: "#d1d5db" }}>계정이 없으신가요?</span>
          <Link href="/signup" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            회원가입
          </Link>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="text-xs" style={{ color: "#d1d5db" }}>학생이신가요?</span>
          <Link href="/student/login" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            학생 로그인
          </Link>
        </div>
      </form>

      <p className="text-xs mt-6" style={{ color: "#d1d5db" }}>3개월 무료 체험 · 카드 정보 불필요</p>
    </main>
  );
}
