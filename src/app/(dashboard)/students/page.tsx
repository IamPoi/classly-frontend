"use client";

import { useEffect, useRef, useState } from "react";
import {
  Table, Button, Input, Select, Popconfirm, Modal, Form,
  Radio, Alert, Avatar, Tag, Segmented, AutoComplete, App,
  Typography, Tooltip,
} from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, UploadOutlined, LinkOutlined } from "@ant-design/icons";
import StudentDetailModal, { ApiStudent } from "@/components/StudentDetailModal";
import { createStudent, deleteStudent, generateInviteCode, getStudents } from "@/lib/api";

const { Text } = Typography;
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://classly-backend.onrender.com";

export default function StudentsPage() {
  const { message } = App.useApp();
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiStudent | null>(null);
  const [nameSearch, setNameSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("전체");
  const [watchFilter, setWatchFilter] = useState<"전체" | "관심">("전체");

  // 학생 추가 모달
  const [showAdd, setShowAdd] = useState(false);
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSchoolType, setAddSchoolType] = useState<"elementary" | "middle" | "high" | null>(null);

  // 엑셀 업로드
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number } | null>(null);

  // 초대 코드
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // 엑셀 가이드 모달
  const [showExcelGuide, setShowExcelGuide] = useState(false);

  useEffect(() => {
    getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  // 학교 자동완성
  const schoolOptions = Array.from(new Set(students.map((s) => s.school).filter(Boolean) as string[]))
    .filter((s) => !schoolSearch || s.includes(schoolSearch))
    .slice(0, 6)
    .map((s) => ({ value: s }));

  // 학년 옵션
  const allGrades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean) as string[])).sort();

  const filtered = students.filter((s) => {
    const matchName = !nameSearch || s.name.includes(nameSearch);
    const matchSchool = !schoolSearch || (s.school ?? "").includes(schoolSearch);
    const matchGrade = gradeFilter === "전체" || s.grade === gradeFilter;
    const matchWatch = watchFilter === "전체" || Boolean((s as any).is_watched);
    return matchName && matchSchool && matchGrade && matchWatch;
  });

  function detectSchoolType(school: string): "elementary" | "middle" | "high" | null {
    if (school.includes("초등학교")) return "elementary";
    if (school.includes("중학교")) return "middle";
    if (school.includes("고등학교")) return "high";
    return null;
  }

  function getGradeOptions(type: "elementary" | "middle" | "high" | null) {
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

  async function handleAddStudent(values: any) {
    setAddLoading(true);
    setAddError("");
    try {
      await createStudent({ ...values, parent_relation: values.parent_relation ?? "모" });
      const updated = await getStudents();
      setStudents(updated);
      setShowAdd(false);
      addForm.resetFields();
      setAddSchoolType(null);
      message.success("학생이 추가되었습니다.");
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${BASE}/students/bulk-upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("업로드 실패");
      const result = await res.json();
      setUploadResult(result);
      const updated = await getStudents();
      setStudents(updated);
    } catch (err: any) {
      message.error(err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleGenerateCode() {
    try {
      const data = await generateInviteCode();
      setInviteCode(data.invite_url);
    } catch (err: any) {
      message.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    await deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) setSelected(null);
    message.success("삭제되었습니다.");
  }

  function handleCopyInvite() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      message.success("링크가 복사되었습니다.");
    }
  }

  const columns: ColumnsType<ApiStudent> = [
    {
      title: "이름",
      dataIndex: "name",
      render: (name, record) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar size={28} style={{ background: "#7c6af7", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
            {name[0]}
          </Avatar>
          <Text style={{ fontWeight: 500 }}>{name}</Text>
          {(record as any).is_watched ? <span style={{ color: "#f59e0b" }}>★</span> : null}
        </div>
      ),
    },
    { title: "학교", dataIndex: "school", render: (v) => <Text type="secondary">{v ?? "-"}</Text> },
    { title: "학년", dataIndex: "grade", render: (v) => <Text type="secondary">{v ?? "-"}</Text> },
    { title: "학생 전화", dataIndex: "phone", render: (v) => <Text type="secondary">{v ?? "-"}</Text> },
    {
      title: "부모님",
      render: (_, record) =>
        record.parent_name ? (
          <Text type="secondary">
            {record.parent_name} ({record.parent_relation === "부" ? "아버님" : "어머님"})
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    { title: "부모님 전화", dataIndex: "parent_phone", render: (v) => <Text type="secondary">{v ?? "-"}</Text> },
    { title: "과목", dataIndex: "subject", render: (v) => <Text type="secondary">{v ?? "-"}</Text> },
    {
      title: "아이디",
      dataIndex: "username",
      render: (v) => <Text style={{ fontFamily: "monospace", color: "#9ca3af", fontSize: 12 }}>{v ?? "-"}</Text>,
    },
    {
      title: "",
      width: 60,
      render: (_, record) => (
        <Popconfirm
          title="학생을 삭제하시겠습니까?"
          onConfirm={() => handleDelete(record.id)}
          okText="삭제"
          cancelText="취소"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            danger
            size="small"
            onClick={(e) => e.stopPropagation()}
          >
            삭제
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>학생 관리</h1>
          <Text type="secondary" style={{ fontSize: 13, marginTop: 2, display: "block" }}>
            총 {students.length}명 · 필터 결과 {filtered.length}명
          </Text>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button icon={<LinkOutlined />} onClick={handleGenerateCode}>
            초대 링크 생성
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleExcelUpload} />
          <Button.Group>
            <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
              엑셀 업로드
            </Button>
            <Tooltip title="엑셀 업로드 가이드">
              <Button icon={<QuestionCircleOutlined />} onClick={() => setShowExcelGuide(true)} />
            </Tooltip>
          </Button.Group>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAdd(true)}>
            학생 추가
          </Button>
        </div>
      </div>

      {/* 초대 코드 */}
      {inviteCode && (
        <Alert
          type="info"
          style={{ marginBottom: 16 }}
          message={
            <span>
              초대 링크: <strong>{inviteCode}</strong>
            </span>
          }
          action={
            <Button size="small" onClick={handleCopyInvite}>
              복사
            </Button>
          }
          closable
          onClose={() => setInviteCode(null)}
        />
      )}

      {/* 엑셀 업로드 결과 */}
      {uploadResult && (
        <Alert
          type="success"
          style={{ marginBottom: 16 }}
          message={`업로드 완료 — ${uploadResult.created}명 등록, ${uploadResult.skipped}명 건너뜀`}
          closable
          onClose={() => setUploadResult(null)}
        />
      )}

      {/* 관심 학생 탭 + 필터 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <Segmented
          options={[
            { label: `전체 ${students.length}명`, value: "전체" },
            { label: `★ 관심 ${students.filter((s) => (s as any).is_watched).length}명`, value: "관심" },
          ]}
          value={watchFilter}
          onChange={(v) => setWatchFilter(v as "전체" | "관심")}
        />

        <Input.Search
          placeholder="이름 검색"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          style={{ width: 140 }}
          allowClear
        />

        <AutoComplete
          options={schoolOptions}
          value={schoolSearch}
          onChange={setSchoolSearch}
          placeholder="학교명 검색"
          style={{ width: 160 }}
          allowClear
        />

        <Select
          value={gradeFilter}
          onChange={setGradeFilter}
          style={{ width: 100 }}
          options={[
            { value: "전체", label: "전체 학년" },
            ...allGrades.map((g) => ({ value: g, label: g })),
          ]}
        />

        {(nameSearch || schoolSearch || gradeFilter !== "전체") && (
          <Button
            size="small"
            onClick={() => { setNameSearch(""); setSchoolSearch(""); setGradeFilter("전체"); }}
          >
            초기화
          </Button>
        )}
      </div>

      {/* Table */}
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        size="middle"
        onRow={(record) => ({
          onClick: () => setSelected(record),
          style: { cursor: "pointer" },
        })}
        locale={{ emptyText: "학생이 없습니다." }}
      />

      {/* 학생 추가 모달 */}
      <Modal
        title="학생 추가"
        open={showAdd}
        onCancel={() => { setShowAdd(false); addForm.resetFields(); setAddError(""); setAddSchoolType(null); }}
        footer={null}
        width={480}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddStudent}
          requiredMark={false}
          initialValues={{ parent_relation: "모" }}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="이름" name="name" rules={[{ required: true, message: "이름을 입력해주세요" }]}>
            <Input placeholder="홍길동" />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item
              label="학교"
              name="school"
              rules={[{
                validator(_, v) {
                  if (!v) return Promise.resolve();
                  if (v.includes("초등학교") || v.includes("중학교") || v.includes("고등학교")) return Promise.resolve();
                  return Promise.reject(new Error("'초등학교', '중학교', '고등학교' 중 하나를 포함해야 합니다"));
                }
              }]}
            >
              <Input
                placeholder="한빛중학교"
                onChange={(e) => {
                  const type = detectSchoolType(e.target.value);
                  setAddSchoolType(type);
                  addForm.setFieldValue("grade", undefined);
                }}
              />
            </Form.Item>
            <Form.Item label="학년" name="grade">
              <Select
                placeholder={addSchoolType ? "학년 선택" : "학교 먼저 입력"}
                disabled={!addSchoolType}
                options={getGradeOptions(addSchoolType).map((g) => ({ value: g, label: g }))}
              />
            </Form.Item>
            <Form.Item
              label="학생 전화"
              name="phone"
              rules={[{ pattern: /^010-\d{4}-\d{4}$/, message: "010-XXXX-XXXX 형식으로 입력해주세요" }]}
            >
              <Input
                placeholder="010-1234-5678"
                onChange={(e) => addForm.setFieldValue("phone", formatPhone(e.target.value))}
              />
            </Form.Item>
            <Form.Item label="과목" name="subject">
              <Input placeholder="수학" />
            </Form.Item>
            <Form.Item label="부모님 이름" name="parent_name">
              <Input placeholder="홍아버지" />
            </Form.Item>
            <Form.Item
              label="부모님 전화"
              name="parent_phone"
              rules={[{ pattern: /^010-\d{4}-\d{4}$/, message: "010-XXXX-XXXX 형식으로 입력해주세요" }]}
            >
              <Input
                placeholder="010-1234-5678"
                onChange={(e) => addForm.setFieldValue("parent_phone", formatPhone(e.target.value))}
              />
            </Form.Item>
          </div>
          <Form.Item label="부모님 구분" name="parent_relation">
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="모">어머님 (모)</Radio.Button>
              <Radio.Button value="부">아버님 (부)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {addError && (
            <Form.Item>
              <Alert type="error" message={addError} showIcon />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button onClick={() => { setShowAdd(false); addForm.resetFields(); setAddError(""); setAddSchoolType(null); }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit" loading={addLoading}>
                추가
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 엑셀 업로드 가이드 모달 */}
      <Modal
        title="📊 엑셀 업로드 가이드"
        open={showExcelGuide}
        onCancel={() => setShowExcelGuide(false)}
        footer={<Button type="primary" onClick={() => setShowExcelGuide(false)}>확인</Button>}
        width={720}
      >
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          {/* 기본 정보 컬럼 */}
          <Text strong style={{ display: "block", marginBottom: 6 }}>기본 컬럼 (A–H) — 1행 헤더 필요 없음, 2행부터 데이터</Text>
          <div style={{ overflowX: "auto", marginBottom: 6 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12, minWidth: "100%" }}>
              <thead>
                <tr style={{ background: "#f5f3ff" }}>
                  {[
                    { col: "A", label: "이름", req: true },
                    { col: "B", label: "학교", req: true },
                    { col: "C", label: "학년", req: true },
                    { col: "D", label: "학생전화", req: true },
                    { col: "E", label: "부모이름", req: false },
                    { col: "F", label: "부모전화", req: false },
                    { col: "G", label: "수강과목", req: false },
                    { col: "H", label: "등록일", req: false },
                  ].map(({ col, label, req }) => (
                    <th key={col} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", textAlign: "center", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#7c6af7", fontWeight: 700 }}>{col}</span><br />
                      <span style={{ fontWeight: 500 }}>{label}</span>
                      {req && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {["홍길동", "한빛중학교", "2학년", "01012345678", "홍아버지", "01098765432", "수학", "2026-03-01"].map((v, i) => (
                    <td key={i} style={{ padding: "5px 10px", border: "1px solid #e5e7eb", color: "#6b7280", fontFamily: "monospace", textAlign: "center" }}>{v}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 14 }}>* 필수 항목 &nbsp;|&nbsp; 전화번호는 하이픈 없이 숫자만 (01012345678)</Text>

          {/* 성적 컬럼 */}
          <Text strong style={{ display: "block", marginBottom: 6 }}>
            성적 컬럼 (I–J + 동적) — 선택사항, <span style={{ color: "#d97706" }}>1행에 헤더 필수</span>
          </Text>
          <div style={{ overflowX: "auto", marginBottom: 6 }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#fffbeb" }}>
                  {["I\n연도", "J\n시험종류", "K\n국어_점수", "L\n국어_등급", "M\n수학_점수", "N\n수학_등급", "O\n영어_점수", "..."].map((h, i) => (
                    <th key={i} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", textAlign: "center", whiteSpace: "pre", color: "#d97706", fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {["2025", "1학기_중간", "85", "3", "92", "1", "78", "..."].map((v, i) => (
                    <td key={i} style={{ padding: "5px 10px", border: "1px solid #e5e7eb", color: "#6b7280", fontFamily: "monospace", textAlign: "center" }}>{v}</td>
                  ))}
                </tr>
                <tr style={{ background: "#fafafa" }}>
                  {["2025", "1학기_기말", "90", "2", "88", "2", "", "..."].map((v, i) => (
                    <td key={i} style={{ padding: "5px 10px", border: "1px solid #e5e7eb", color: "#6b7280", fontFamily: "monospace", textAlign: "center" }}>{v || <span style={{ color: "#d1d5db" }}>-</span>}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
            K열 이후: <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>과목명_점수</code> / <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>과목명_등급</code> 형식으로 헤더 작성 — 과목 수 제한 없음
          </Text>
          <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 12 }}>
            한 행 = 학생 1명 × 시험 1개. 같은 학생이 여러 시험이면 행 반복 (이름+전화로 중복 판별, 학생은 1번만 생성)
          </Text>

          <div style={{ background: "#faf5ff", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
            <Text strong style={{ display: "block", marginBottom: 4 }}>아이디 자동 생성 규칙</Text>
            <Text type="secondary">이름(한글→영자판 변환) + 전화번호 뒷 4자리</Text><br />
            <Text type="secondary" style={{ fontFamily: "monospace", fontSize: 12 }}>홍길동 + 5678 → ghdrlfehd5678</Text><br />
            <Text type="secondary" style={{ fontSize: 12 }}>초기 비밀번호 = 아이디와 동일</Text>
          </div>

          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 0 }}
            message="주의사항"
            description={
              <ul style={{ margin: "4px 0", paddingLeft: 18, fontSize: 12 }}>
                <li>전화번호는 하이픈 없이 숫자만 입력 (01012345678)</li>
                <li>같은 이름+전화 조합이면 학생 정보는 건너뛰고 <b>성적만 저장</b></li>
                <li>이름·학교·학년·전화 중 하나라도 비어있으면 오류 처리</li>
                <li>성적 컬럼 사용 시 반드시 <b>1행에 헤더</b> 작성 필요</li>
              </ul>
            }
          />
        </div>
      </Modal>

      {/* 학생 상세 모달 */}
      {selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onWatchChange={(id, isWatched) =>
            setStudents((prev) =>
              prev.map((s) => (s.id === id ? { ...s, is_watched: isWatched ? 1 : 0 } as any : s))
            )
          }
          onMemoSave={(id, memo) =>
            setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, memo } : s)))
          }
        />
      )}
    </div>
  );
}
