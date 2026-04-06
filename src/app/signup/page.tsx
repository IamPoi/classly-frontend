"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", passwordConfirm: "", email: "", name: "", academy_name: "", address: "" });
  const [pwError, setPwError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleAddressSearch() {
    if (typeof window === "undefined") return;
    const el = document.createElement("script");
    el.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    el.onload = () => {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => setForm((f) => ({ ...f, address: data.roadAddress || data.jibunAddress })),
      }).open();
    };
    document.head.appendChild(el);
  }

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (field === "passwordConfirm" || field === "password") {
      const pw = field === "password" ? value : form.password;
      const confirm = field === "passwordConfirm" ? value : form.passwordConfirm;
      setPwError(confirm && confirm !== pw ? "비밀번호가 일치하지 않습니다." : "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwError || !form.username || !form.password || !form.email || !form.name) return;
    setLoading(true);
    setError("");
    try {
      await signup({
        username: form.username,
        password: form.password,
        email: form.email,
        name: form.username,
        academy_name: form.academy_name || form.name,
        academy_address: form.address,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "가입 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--background)" }}>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "var(--accent)" }}>C</div>
          <span className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Classly</span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2"
          style={{ background: "#ede9fe", color: "var(--accent)" }}>
          3개월 무료 체험 · 카드 정보 불필요
        </div>
      </div>

      <form onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-8 shadow-sm border"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--foreground)" }}>회원가입</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>아이디</label>
            <input type="text" value={form.username} onChange={(e) => handleChange("username", e.target.value)}
              placeholder="영문, 숫자 6~20자"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "#fafafa" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>비밀번호</label>
            <input type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)}
              placeholder="8자 이상"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "#fafafa" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>비밀번호 확인</label>
            <input type="password" value={form.passwordConfirm} onChange={(e) => handleChange("passwordConfirm", e.target.value)}
              placeholder="비밀번호 재입력"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: pwError ? "#ef4444" : "var(--border)", background: "#fafafa" }} />
            {pwError && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{pwError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>이메일</label>
            <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "#fafafa" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>학원 이름</label>
            <input type="text" value={form.academy_name} onChange={(e) => handleChange("academy_name", e.target.value)}
              placeholder="예) 김선생 수학학원"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ borderColor: "var(--border)", background: "#fafafa" }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>학원 주소</label>
            <div className="flex gap-2">
              <input type="text" value={form.address} readOnly placeholder="주소 검색을 눌러주세요"
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              <button type="button" onClick={handleAddressSearch}
                className="px-3 py-2.5 rounded-lg text-sm font-medium border whitespace-nowrap"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
                주소 검색
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: "#9ca3af" }}>
              출석 QR의 GPS 기준 위치로 자동 설정됩니다
            </p>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading || !!pwError}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 mt-2"
            style={{ background: "var(--accent)" }}>
            {loading ? "가입 중..." : "가입 완료 · 무료 체험 시작"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <span className="text-xs" style={{ color: "#d1d5db" }}>이미 계정이 있으신가요?</span>
          <Link href="/" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>로그인</Link>
        </div>
      </form>
    </main>
  );
}
