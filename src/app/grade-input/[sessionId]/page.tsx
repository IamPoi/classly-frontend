"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Form, Input, Button, Alert, Result, Spin, Typography } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Text } = Typography;
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type GradeRow = { subject_name: string; score: string; grade_level: string };

export default function GradeInputPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [token, setToken] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [session, setSession] = useState<any>(null);
  const [sessionError, setSessionError] = useState("");

  const [rows, setRows] = useState<GradeRow[]>([{ subject_name: "", score: "", grade_level: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [loginForm] = Form.useForm();

  useEffect(() => {
    const t = localStorage.getItem("student_token");
    const sid = localStorage.getItem("student_id");
    if (t && sid) { setToken(t); setStudentId(sid); }
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch(`${BASE}/grade-sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : r.json().then((e) => { throw new Error(e.detail); }))
      .then(setSession)
      .catch((e) => setSessionError(e.message));
  }, [sessionId, token]);

  async function handleLogin(values: { username: string; password: string }) {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch(`${BASE}/auth/student-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      localStorage.setItem("student_token", data.access_token);
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      localStorage.setItem("student_id", payload.sub);
      setStudentId(payload.sub);
      setToken(data.access_token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  }

  function addRow() { setRows((r) => [...r, { subject_name: "", score: "", grade_level: "" }]); }
  function removeRow(i: number) { setRows((r) => r.filter((_, idx) => idx !== i)); }
  function updateRow(i: number, field: keyof GradeRow, value: string) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validRows = rows.filter((r) => r.subject_name.trim());
    if (validRows.length === 0) { setSubmitError("과목을 최소 하나 입력하세요."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`${BASE}/grade-sessions/${sessionId}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          student_id: studentId,
          entries: validRows.map((r) => ({
            subject_name: r.subject_name.trim(),
            score: r.score ? parseInt(r.score) : null,
            grade_level: r.grade_level ? parseInt(r.grade_level) : null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // 로그인 전
  if (!token) return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#faf5ff" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#7c6af7",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 24, fontWeight: 700,
            margin: "0 auto 12px",
          }}>C</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>성적 입력</div>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginTop: 4 }}>학생 계정으로 로그인하세요</Text>
        </div>
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <Form form={loginForm} layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item name="username" label="아이디">
              <Input size="large" placeholder="이름+전화뒷4 (예: 홍길동1234)" />
            </Form.Item>
            <Form.Item name="password" label="비밀번호">
              <Input.Password size="large" placeholder="비밀번호" />
            </Form.Item>
            {loginError && <Alert type="error" message={loginError} showIcon style={{ marginBottom: 16 }} />}
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block size="large" loading={loginLoading}>
                로그인
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </main>
  );

  if (sessionError) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
      <Result status="error" title="세션 오류" subTitle={sessionError} />
    </main>
  );

  if (!session) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spin size="large" />
    </main>
  );

  if (submitted || session.already_submitted) return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "#faf5ff" }}>
      <Result
        status="success"
        title="제출 완료!"
        subTitle={session.already_submitted ? "이미 제출한 성적입니다." : "성적이 성공적으로 제출되었습니다."}
      />
    </main>
  );

  const examLabel = `${session.year}년 ${session.exam_type.replace("_", " ")}`;

  return (
    <main style={{ minHeight: "100vh", padding: "32px 16px", background: "#faf5ff" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{examLabel}</div>
          <Text type="secondary" style={{ fontSize: 14, display: "block", marginTop: 4 }}>성적을 직접 입력해주세요</Text>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #e5e7eb", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <form onSubmit={handleSubmit}>
            {/* 헤더 행 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 32px", gap: 8, marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>과목명</Text>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>점수</Text>
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textAlign: "center" }}>등급</Text>
              <span />
            </div>

            {/* 성적 입력 행 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {rows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 32px", gap: 8, alignItems: "center" }}>
                  <Input
                    value={row.subject_name}
                    onChange={(e) => updateRow(i, "subject_name", e.target.value)}
                    placeholder="수학"
                    size="large"
                  />
                  <Input
                    type="number"
                    value={row.score}
                    onChange={(e) => updateRow(i, "score", e.target.value)}
                    placeholder="85"
                    min={0} max={100}
                    size="large"
                    style={{ textAlign: "center" }}
                  />
                  <Input
                    type="number"
                    value={row.grade_level}
                    onChange={(e) => updateRow(i, "grade_level", e.target.value)}
                    placeholder="3"
                    min={1} max={9}
                    size="large"
                    style={{ textAlign: "center" }}
                  />
                  {rows.length > 1 ? (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeRow(i)}
                      style={{ padding: 0, width: 32, height: 32 }}
                    />
                  ) : <span />}
                </div>
              ))}
            </div>

            {/* 과목 추가 버튼 */}
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={addRow}
              style={{ marginBottom: 20 }}
            >
              과목 추가
            </Button>

            {submitError && <Alert type="error" message={submitError} showIcon style={{ marginBottom: 16 }} />}

            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              제출하기
            </Button>
            <Text type="danger" style={{ fontSize: 12, display: "block", textAlign: "center", marginTop: 12 }}>
              ⚠️ 제출 후 수정이 불가능합니다
            </Text>
          </form>
        </div>
      </div>
    </main>
  );
}
