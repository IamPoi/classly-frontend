"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Form, Input, Button, Alert, Result, Spin, Typography } from "antd";

const { Text } = Typography;
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Step = "login" | "processing" | "done" | "error";

export default function AttendPage() {
  const params = useSearchParams();
  const classId = params.get("class");
  const t = params.get("t");

  const [step, setStep] = useState<Step>("login");
  const [loginError, setLoginError] = useState("");
  const [result, setResult] = useState<{ status: string; gps_verified: boolean; time_verified: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [form] = Form.useForm();

  useEffect(() => {
    const token = localStorage.getItem("student_token");
    if (token && classId) {
      processAttendance(token);
    }
  }, [classId]);

  async function processAttendance(token: string) {
    setStep("processing");
    try {
      const meRes = await fetch(`${API}/auth/student/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!meRes.ok) {
        localStorage.removeItem("student_token");
        setStep("login");
        return;
      }
      const me = await meRes.json();
      const qrCode = `classly://attend?class=${classId}&t=${t}`;

      let lat: number | undefined;
      let lon: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
      } catch {
        // GPS 없어도 진행
      }

      const res = await fetch(`${API}/attendance/attend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_code: qrCode, student_id: me.id, latitude: lat, longitude: lon }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.detail ?? "출석 처리에 실패했습니다.");
        setStep("error");
        return;
      }

      const data = await res.json();
      setResult(data);
      setStep("done");
    } catch {
      setErrorMsg("네트워크 오류가 발생했습니다.");
      setStep("error");
    }
  }

  async function handleLogin(values: { username: string; password: string }) {
    setLoginError("");
    try {
      const res = await fetch(`${API}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.username.trim(), password: values.password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLoginError(err.detail ?? "로그인 실패");
        return;
      }
      const { access_token } = await res.json();
      localStorage.setItem("student_token", access_token);
      processAttendance(access_token);
    } catch {
      setLoginError("네트워크 오류가 발생했습니다.");
    }
  }

  if (!classId) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#f9fafb" }}>
      <Result status="error" title="유효하지 않은 QR 코드입니다." />
    </main>
  );

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#f9fafb" }}>
      {/* 로고 */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "#7c6af7",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 14, fontWeight: 700,
          }}>C</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Classly</span>
        </div>
        <Text type="secondary" style={{ fontSize: 14, display: "block" }}>출석 체크</Text>
      </div>

      {step === "login" && (
        <div style={{
          width: "100%", maxWidth: 400,
          background: "#fff", borderRadius: 16, padding: 32,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: "#111827" }}>학생 로그인</div>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 20 }}>
            로그인 후 자동으로 출석 처리됩니다
          </Text>
          <Form form={form} layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item name="username">
              <Input size="large" placeholder="아이디 (이름+전화뒷4, 예: 홍길동1234)" />
            </Form.Item>
            <Form.Item name="password">
              <Input.Password size="large" placeholder="비밀번호" />
            </Form.Item>
            {loginError && <Alert type="error" message={loginError} showIcon style={{ marginBottom: 16 }} />}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large">
                출석 체크
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}

      {step === "processing" && (
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: "block", marginTop: 16 }}>출석 처리 중...</Text>
        </div>
      )}

      {step === "done" && result && (
        <Result
          status={result.status === "지각" ? "warning" : "success"}
          title={result.status}
          subTitle={result.status === "지각" ? "지각으로 처리되었습니다." : "출석이 완료되었습니다!"}
          extra={
            <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>GPS {result.gps_verified ? "✓" : "미확인"}</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>시간 {result.time_verified ? "✓" : "미확인"}</Text>
            </div>
          }
        />
      )}

      {step === "error" && (
        <Result
          status="error"
          title="출석 처리 실패"
          subTitle={errorMsg}
          extra={
            <Button onClick={() => setStep("login")}>다시 시도</Button>
          }
        />
      )}
    </main>
  );
}
