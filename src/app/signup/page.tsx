"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Form, Input, Button, Alert, Space, Typography, Tag } from "antd";
import { signup } from "@/lib/api";

const { Text } = Typography;

export default function SignupPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  function handleAddressSearch() {
    if (typeof window === "undefined") return;
    const el = document.createElement("script");
    el.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    el.onload = () => {
      new (window as any).daum.Postcode({
        oncomplete: (data: any) => {
          const addr = data.roadAddress || data.jibunAddress;
          setAddress(addr);
          form.setFieldValue("address", addr);
        },
      }).open();
    };
    document.head.appendChild(el);
  }

  async function handleSubmit(values: {
    username: string;
    password: string;
    passwordConfirm: string;
    email: string;
    academy_name: string;
    address: string;
  }) {
    setLoading(true);
    setError("");
    try {
      await signup({
        username: values.username,
        password: values.password,
        email: values.email,
        name: values.username,
        academy_name: values.academy_name,
        academy_address: values.address ?? "",
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "가입 실패");
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
        padding: "48px 16px",
        background: "var(--background)",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "#7c6af7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            C
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a" }}>Notio</span>
        </div>
        <div>
          <Tag color="purple" style={{ borderRadius: 20 }}>3개월 무료 체험 · 카드 정보 불필요</Tag>
        </div>
      </div>

      {/* 회원가입 카드 */}
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          border: "1px solid #e5e5e5",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "#1a1a1a" }}>회원가입</h2>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          <Form.Item
            label="아이디"
            name="username"
            rules={[{ required: true, message: "아이디를 입력해주세요" }]}
          >
            <Input placeholder="영문, 숫자 6~20자" size="large" />
          </Form.Item>

          <Form.Item
            label="비밀번호"
            name="password"
            rules={[{ required: true, min: 8, message: "비밀번호는 8자 이상이어야 합니다" }]}
          >
            <Input.Password placeholder="8자 이상" size="large" />
          </Form.Item>

          <Form.Item
            label="비밀번호 확인"
            name="passwordConfirm"
            dependencies={["password"]}
            rules={[
              { required: true, message: "비밀번호 확인을 입력해주세요" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("비밀번호가 일치하지 않습니다"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="비밀번호 재입력" size="large" />
          </Form.Item>

          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: "이메일을 입력해주세요" },
              { type: "email", message: "올바른 이메일 형식이 아닙니다" },
            ]}
          >
            <Input placeholder="example@email.com" size="large" />
          </Form.Item>

          <Form.Item
            label="학원 이름"
            name="academy_name"
            rules={[{ required: true, message: "학원 이름을 입력해주세요" }]}
          >
            <Input placeholder="예) 김선생 수학학원" size="large" />
          </Form.Item>

          <Form.Item label="학원 주소" name="address">
            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={address}
                readOnly
                placeholder="주소 검색을 눌러주세요"
                size="large"
                style={{ flex: 1 }}
              />
              <Button size="large" onClick={handleAddressSearch} style={{ color: "#7c6af7", borderColor: "#7c6af7" }}>
                주소 검색
              </Button>
            </Space.Compact>
            <Text type="secondary" style={{ fontSize: 12 }}>
              출석 QR의 GPS 기준 위치로 자동 설정됩니다
            </Text>
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
              가입 완료 · 무료 체험 시작
            </Button>
          </Form.Item>
        </Form>

        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
          <Text style={{ fontSize: 13, color: "#d1d5db" }}>이미 계정이 있으신가요?</Text>
          <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "#7c6af7" }}>
            로그인
          </Link>
        </div>
      </div>
    </main>
  );
}
