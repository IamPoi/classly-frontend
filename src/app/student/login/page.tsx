"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function StudentLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(values: { username: string; password: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.username.trim(), password: values.password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? "로그인 실패");
      }
      const { access_token } = await res.json();
      localStorage.setItem("student_token", access_token);
      router.push("/student/mypage");
    } catch (err: any) {
      setError(err.message ?? "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 16px",
        background: "var(--background)",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#7c6af7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            Classly
          </span>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>학생 로그인</Text>
        </div>
      </div>

      {/* 로그인 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          border: "1px solid #e5e5e5",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "#1a1a1a" }}>학생 로그인</h2>

        <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
          <Form.Item
            label="아이디"
            name="username"
            extra="이름+전화뒷4자리 (예: 홍길동1234)"
            rules={[{ required: true, message: "아이디를 입력해주세요" }]}
          >
            <Input placeholder="예: 홍길동1234" size="large" />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            extra="초기 비밀번호는 아이디와 동일합니다"
            rules={[{ required: true, message: "비밀번호를 입력해주세요" }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          {error && (
            <Form.Item>
              <Alert type="error" message={error} showIcon />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
            >
              로그인
            </Button>
          </Form.Item>
        </Form>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Text style={{ fontSize: 13, color: "#d1d5db" }}>선생님이신가요?</Text>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#7c6af7" }}>
            선생님 로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
