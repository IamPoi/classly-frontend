"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Alert, Typography, Tooltip, Spin } from "antd";
import { LogoutOutlined, LockOutlined } from "@ant-design/icons";

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? "https://classly-backend.onrender.com";

interface StudentInfo {
  id: string;
  name: string;
  school: string;
  grade: string;
  username: string;
  username_changed: number;
}

function authHeaders() {
  const token = localStorage.getItem("student_token");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export default function StudentMyPage() {
  const router = useRouter();
  const [student, setStudent] = useState<StudentInfo | null>(null);

  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [usernameForm] = Form.useForm();
  const [pwForm] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (!token) { router.push("/student/login"); return; }
    fetch(`${API}/auth/student/me`, { headers: authHeaders() })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("student_token");
          router.push("/student/login");
          return null;
        }
        return res.json();
      })
      .then((data) => data && setStudent(data));
  }, [router]);

  async function handleUsernameChange(values: { new_username: string }) {
    setUsernameError("");
    setUsernameSuccess("");
    setUsernameLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/username`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ new_username: values.new_username.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "변경 실패");
      setUsernameSuccess("아이디가 변경되었습니다.");
      setStudent((prev) => prev ? { ...prev, username: data.username, username_changed: 1 } : prev);
      usernameForm.resetFields();
    } catch (err: any) {
      setUsernameError(err.message);
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handlePasswordChange(values: { current_password: string; new_password: string; confirm_password: string }) {
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    try {
      const res = await fetch(`${API}/auth/student/password`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ current_password: values.current_password, new_password: values.new_password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "변경 실패");
      setPwSuccess("비밀번호가 변경되었습니다.");
      pwForm.resetFields();
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("student_token");
    router.push("/student/login");
  }

  if (!student) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f8f6" }}>
      <Spin size="large" />
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", padding: "40px 16px", background: "#f9f8f6" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "#7c6af7",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 14, fontWeight: 700,
            }}>N</div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#111" }}>Notio</span>
          </div>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>로그아웃</Button>
        </div>

        {/* 내 정보 */}
        <Card title="내 정보">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "이름", value: student.name },
              { label: "학교", value: student.school },
              { label: "학년", value: student.grade },
              { label: "아이디", value: student.username },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary">{label}</Text>
                <Text strong>{value}</Text>
              </div>
            ))}
          </div>
        </Card>

        {/* 아이디 변경 (최초 1회) */}
        {!student.username_changed && (
          <Card
            title={
              <span>
                아이디 변경{" "}
                <Tooltip title="최초 1회만 변경 가능합니다">
                  <LockOutlined style={{ color: "#9ca3af", fontSize: 13 }} />
                </Tooltip>
              </span>
            }
          >
            <Form form={usernameForm} layout="vertical" onFinish={handleUsernameChange} requiredMark={false}>
              <Form.Item
                name="new_username"
                label="새 아이디"
                rules={[{ required: true, message: "새 아이디를 입력해주세요" }]}
              >
                <Input size="large" placeholder="새 아이디 입력" />
              </Form.Item>
              {usernameError && <Alert type="error" message={usernameError} showIcon style={{ marginBottom: 16 }} />}
              {usernameSuccess && <Alert type="success" message={usernameSuccess} showIcon style={{ marginBottom: 16 }} />}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" block loading={usernameLoading}>
                  아이디 변경
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}

        {/* 비밀번호 변경 */}
        <Card title="비밀번호 변경">
          <Form form={pwForm} layout="vertical" onFinish={handlePasswordChange} requiredMark={false}>
            <Form.Item name="current_password" label="현재 비밀번호" rules={[{ required: true, message: "현재 비밀번호를 입력해주세요" }]}>
              <Input.Password size="large" placeholder="현재 비밀번호" />
            </Form.Item>
            <Form.Item name="new_password" label="새 비밀번호" rules={[{ required: true, message: "새 비밀번호를 입력해주세요" }, { min: 4, message: "비밀번호는 4자 이상이어야 합니다" }]}>
              <Input.Password size="large" placeholder="새 비밀번호 (4자 이상)" />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="새 비밀번호 확인"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "비밀번호를 다시 입력해주세요" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value) return Promise.resolve();
                    return Promise.reject(new Error("새 비밀번호가 일치하지 않습니다."));
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="새 비밀번호 재입력" />
            </Form.Item>
            {pwError && <Alert type="error" message={pwError} showIcon style={{ marginBottom: 16 }} />}
            {pwSuccess && <Alert type="success" message={pwSuccess} showIcon style={{ marginBottom: 16 }} />}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={pwLoading}>
                비밀번호 변경
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </main>
  );
}
