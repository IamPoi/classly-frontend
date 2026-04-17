"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Form, Input, Button, Alert, Result, Spin, Typography, Select, Radio } from "antd";

const { Text } = Typography;
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://classly-backend.onrender.com";

type SchoolType = "elementary" | "middle" | "high" | null;

function detectSchoolType(school: string): SchoolType {
  if (school.includes("초등학교")) return "elementary";
  if (school.includes("중학교")) return "middle";
  if (school.includes("고등학교")) return "high";
  return null;
}

function getGradeOptions(type: SchoolType) {
  if (type === "elementary") return ["1학년","2학년","3학년","4학년","5학년","6학년"];
  if (type === "middle" || type === "high") return ["1학년","2학년","3학년"];
  return [];
}

function formatPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,7)}-${digits.slice(7,11)}`;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const router = useRouter();

  const [academy, setAcademy] = useState<{ id: string; name: string; address?: string } | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ username: string } | null>(null);
  const [schoolType, setSchoolType] = useState<SchoolType>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!code) { setLoadError("초대 코드가 없습니다."); return; }
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
          username: values.username,
          password: values.password,
          phone: values.phone ?? "",
          parent_name: values.parent_name ?? "",
          parent_phone: values.parent_phone ?? "",
          parent_relation: values.parent_relation ?? "모",
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
      <Result status="error" title="유효하지 않은 초대 링크입니다" subTitle={loadError} />
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
        <Result status="success" title="가입 완료!" subTitle={`${academy.name}에 등록되었습니다.`} />
        <div style={{ borderRadius: 12, padding: 20, border: "1px solid #e5e7eb", background: "#fff", marginBottom: 24, marginTop: -16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>내 아이디</Text>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: "#7c6af7", marginTop: 4 }}>{done.username}</div>
        </div>
        <Button type="primary" block size="large" onClick={() => router.push("/student/login")}>로그인하기</Button>
      </div>
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 16px", background: "#faf5ff" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "#7c6af7", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 auto 12px" }}>N</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{academy.name}</div>
        <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: "block" }}>초대 링크로 학원에 등록합니다</Text>
      </div>

      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, color: "#111" }}>학생 정보 입력</div>
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item label="이름" name="name" rules={[{ required: true, message: "이름을 입력해주세요" }]}>
            <Input size="large" placeholder="홍길동" />
          </Form.Item>
          <Form.Item
            label="학교"
            name="school"
            rules={[
              { required: true, message: "학교를 입력해주세요" },
              {
                validator(_, v) {
                  if (!v) return Promise.resolve();
                  if (v.includes("초등학교") || v.includes("중학교") || v.includes("고등학교")) return Promise.resolve();
                  return Promise.reject(new Error("'초등학교', '중학교', '고등학교' 중 하나가 포함되어야 합니다"));
                }
              }
            ]}
          >
            <Input
              size="large"
              placeholder="한빛중학교"
              onChange={(e) => {
                const type = detectSchoolType(e.target.value);
                setSchoolType(type);
                form.setFieldValue("grade", undefined);
              }}
            />
          </Form.Item>
          <Form.Item label="학년" name="grade" rules={[{ required: true, message: "학년을 선택해주세요" }]}>
            <Select
              size="large"
              placeholder={schoolType ? "학년 선택" : "학교를 먼저 입력해주세요"}
              disabled={!schoolType}
              options={getGradeOptions(schoolType).map((g) => ({ value: g, label: g }))}
            />
          </Form.Item>
          <Form.Item label="아이디" name="username" rules={[{ required: true, message: "아이디를 입력해주세요" }, { min: 3, message: "3자 이상 입력해주세요" }]}>
            <Input size="large" placeholder="사용할 아이디" autoComplete="username" />
          </Form.Item>
          <Form.Item label="비밀번호" name="password" rules={[{ required: true, message: "비밀번호를 입력해주세요" }, { min: 4, message: "4자 이상 입력해주세요" }]}>
            <Input.Password size="large" placeholder="4자 이상" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="비밀번호 확인"
            name="password_confirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "비밀번호를 다시 입력해주세요" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("비밀번호가 일치하지 않습니다"));
                },
              }),
            ]}
          >
            <Input.Password size="large" placeholder="비밀번호 재입력" autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="학생 전화 (선택)"
            name="phone"
            rules={[{ pattern: /^010-\d{4}-\d{4}$/, message: "010-XXXX-XXXX 형식으로 입력해주세요" }]}
          >
            <Input
              size="large"
              placeholder="010-1234-5678"
              onChange={(e) => form.setFieldValue("phone", formatPhone(e.target.value))}
            />
          </Form.Item>
          <Form.Item label="부모님 관계 (선택)" name="parent_relation" initialValue="모">
            <Radio.Group size="large">
              <Radio.Button value="부">아버지 (부)</Radio.Button>
              <Radio.Button value="모">어머니 (모)</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="부모님 이름 (선택)" name="parent_name">
            <Input size="large" placeholder="홍아버지" />
          </Form.Item>
          <Form.Item
            label="부모님 전화 (선택)"
            name="parent_phone"
            rules={[{ pattern: /^010-\d{4}-\d{4}$/, message: "010-XXXX-XXXX 형식으로 입력해주세요" }]}
          >
            <Input
              size="large"
              placeholder="010-1234-5678"
              onChange={(e) => form.setFieldValue("parent_phone", formatPhone(e.target.value))}
            />
          </Form.Item>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>가입 완료</Button>
          </Form.Item>
        </Form>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#faf5ff" }}>
        <Spin size="large" />
      </main>
    }>
      <JoinContent />
    </Suspense>
  );
}
