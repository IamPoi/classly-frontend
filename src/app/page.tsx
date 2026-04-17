"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, Input, Button, Alert, Typography } from "antd";
import { login } from "@/lib/api";

const { Text } = Typography;

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(values: { username: string; password: string }) {
    setLoading(true);
    setError("");
    try {
      await login(values.username, values.password);
      router.push("/dashboard");
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
            N
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            Notio
          </span>
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: 14 }}>
            출결 자동화 · 학부모 소통 한 곳에서
          </Text>
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
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "#1a1a1a" }}>로그인</h2>

        <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
          <Form.Item
            label="아이디"
            name="username"
            rules={[{ required: true, message: "아이디를 입력해주세요" }]}
          >
            <Input placeholder="아이디 입력" size="large" />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
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
          <Text style={{ fontSize: 13, color: "#d1d5db" }}>계정이 없으신가요?</Text>
          <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: "#7c6af7" }}>
            회원가입
          </Link>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 8 }}>
          <Text style={{ fontSize: 13, color: "#d1d5db" }}>학생이신가요?</Text>
          <Link href="/student/login" style={{ fontSize: 13, fontWeight: 600, color: "#7c6af7" }}>
            학생 로그인
          </Link>
        </div>
      </div>

      <Text style={{ fontSize: 12, color: "#d1d5db", marginTop: 24 }}>
        3개월 무료 체험 · 카드 정보 불필요
      </Text>
    </main>
  );
}
