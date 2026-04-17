"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Form, Input, Button, Alert, Typography, Checkbox } from "antd";

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://classly-backend.onrender.com";
const SAVED_ID_KEY = "student_saved_id";

export default function StudentLoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveId, setSaveId] = useState(false);

  useEffect(() => {
    // 이미 로그인된 경우 자동 이동
    if (localStorage.getItem("student_token")) {
      router.replace("/student/mypage");
      return;
    }
    // 저장된 아이디 불러오기
    const saved = localStorage.getItem(SAVED_ID_KEY);
    if (saved) {
      form.setFieldValue("username", saved);
      setSaveId(true);
    }
  }, []);

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
      if (saveId) {
        localStorage.setItem(SAVED_ID_KEY, values.username.trim());
      } else {
        localStorage.removeItem(SAVED_ID_KEY);
      }
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
            N
          </div>
          <span style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px" }}>
            Notio
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

        <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
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

          <Form.Item style={{ marginBottom: 12 }}>
            <Checkbox checked={saveId} onChange={(e) => setSaveId(e.target.checked)}>
              아이디 저장
            </Checkbox>
          </Form.Item>

          {error && (
            <Form.Item>
              <Alert type="error" message={error} showIcon />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
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
