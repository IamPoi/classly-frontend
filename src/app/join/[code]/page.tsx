"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Form, Input, Button, Alert, Result, Spin, Typography } from "antd";

const { Text } = Typography;
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function JoinPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [academy, setAcademy] = useState<{ id: string; name: string; address?: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ username: string } | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetch(`${BASE}/join/${code}`)
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.detail); }))
      .then(setAcademy)
      .catch((e) => setLoadError(e.message));
  }, [code]);

  async function handleSubmit(values: Record<string, string>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/join/${code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          school: values.school,
          grade: values.grade,
          phone: values.phone,
          parent_name: values.parent_name ?? "",
          parent_phone: values.parent_phone ?? "",
        }),
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
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#faf5ff" }}>
      <Result
        status="error"
        title="유효하지 않은 초대 링크입니다"
        subTitle={loadError}
      />
    </main>
  );

  if (!academy) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf5ff" }}>
      <Spin size="large" tip="불러오는 중..." />
    </main>
  );

  if (done) return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#faf5ff" }}>
      <div style={{ width: "100%", maxWidth: 400, textAlign: "center" }}>
        <Result
          status="success"
          title="가입 완료!"
          subTitle={`${academy.name}에 등록되었습니다.`}
        />
        <div style={{
          borderRadius: 12,
          padding: 20,
          border: "1px solid #e5e7eb",
          background: "#fff",
          marginBottom: 24,
          marginTop: -16,
        }}>
          <Text type="secondary" style={{ fontSize: 12 }}>내 아이디</Text>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#7c6af7", marginTop: 4 }}>
            {done.username}
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 8 }}>
            초기 비밀번호도 아이디와 동일합니다
          </Text>
        </div>
        <Button type="primary" block size="large" onClick={() => router.push("/student/login")}>
          로그인하기
        </Button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#faf5ff" }}>
      {/* 학원 정보 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          width: 56, height: 56,
          borderRadius: 16,
          background: "#7c6af7",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 24, fontWeight: 700,
          margin: "0 auto 12px",
        }}>C</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{academy.name}</div>
        <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: "block" }}>
          초대 링크로 학원에 등록합니다
        </Text>
      </div>

      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: "#111" }}>학생 정보 입력</div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="이름" name="name" rules={[{ required: true, message: "이름을 입력해주세요" }]}>
            <Input size="large" placeholder="홍길동" />
          </Form.Item>
          <Form.Item label="학교" name="school" rules={[{ required: true, message: "학교를 입력해주세요" }]}>
            <Input size="large" placeholder="한빛중학교" />
          </Form.Item>
          <Form.Item label="학년" name="grade" rules={[{ required: true, message: "학년을 입력해주세요" }]}>
            <Input size="large" placeholder="중2" />
          </Form.Item>
          <Form.Item label="학생 전화" name="phone" rules={[{ required: true, message: "전화번호를 입력해주세요" }]}>
            <Input size="large" placeholder="010-0000-0000" />
          </Form.Item>
          <Form.Item label="부모님 이름 (선택)" name="parent_name">
            <Input size="large" placeholder="홍아버지" />
          </Form.Item>
          <Form.Item label="부모님 전화 (선택)" name="parent_phone">
            <Input size="large" placeholder="010-0000-0000" />
          </Form.Item>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              가입 완료
            </Button>
          </Form.Item>
        </Form>
        <Text type="secondary" style={{ fontSize: 12, display: "block", textAlign: "center", marginTop: 12 }}>
          아이디는 이름+전화뒷4자리로 자동 생성됩니다
        </Text>
      </div>
    </main>
  );
}
