"use client";

import { useEffect, useRef, useState } from "react";
import {
  Table, Button, Input, Select, Popconfirm, Modal, Form,
  Radio, Alert, Avatar, Tag, Segmented, AutoComplete, App,
  Typography,
} from "antd";
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

  // 엑셀 업로드
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number } | null>(null);

  // 초대 코드
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  // 학교 자동완성
  const schoolOptions = Array.from(new Set(students.map((s) => s.school).filter(Boolean) as string[]))
    .filter((s) => !schoolSearch || s.includes(schoolSearch))
    .slice(0, 6)
    .map((s) => ({ value: s }));

  // 학년 옵션
  const allGrades = (() => {
    if (schoolSearch.includes("초")) return ["초1", "초2", "초3", "초4", "초5", "초6"];
    if (schoolSearch.includes("중")) return ["중1", "중2", "중3"];
    if (schoolSearch.includes("고")) return ["고1", "고2", "고3"];
    return Array.from(new Set(students.map((s) => s.grade).filter(Boolean) as string[])).sort();
  })();

  const filtered = students.filter((s) => {
    const matchName = !nameSearch || s.name.includes(nameSearch);
    const matchSchool = !schoolSearch || (s.school ?? "").includes(schoolSearch);
    const matchGrade = gradeFilter === "전체" || s.grade === gradeFilter;
    const matchWatch = watchFilter === "전체" || Boolean((s as any).is_watched);
    return matchName && matchSchool && matchGrade && matchWatch;
  });

  async function handleAddStudent(values: any) {
    setAddLoading(true);
    setAddError("");
    try {
      await createStudent({ ...values, parent_relation: values.parent_relation ?? "모" });
      const updated = await getStudents();
      setStudents(updated);
      setShowAdd(false);
      addForm.resetFields();
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
          <Button icon={<UploadOutlined />} onClick={() => fileRef.current?.click()}>
            엑셀 업로드
          </Button>
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
        onCancel={() => { setShowAdd(false); addForm.resetFields(); setAddError(""); }}
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
            <Form.Item label="학교" name="school">
              <Input placeholder="한빛중학교" />
            </Form.Item>
            <Form.Item label="학년" name="grade">
              <Input placeholder="중2" />
            </Form.Item>
            <Form.Item label="학생 전화" name="phone">
              <Input placeholder="010-0000-0000" />
            </Form.Item>
            <Form.Item label="과목" name="subject">
              <Input placeholder="수학" />
            </Form.Item>
            <Form.Item label="부모님 이름" name="parent_name">
              <Input placeholder="홍아버지" />
            </Form.Item>
            <Form.Item label="부모님 전화" name="parent_phone">
              <Input placeholder="010-0000-0000" />
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
              <Button onClick={() => { setShowAdd(false); addForm.resetFields(); setAddError(""); }}>
                취소
              </Button>
              <Button type="primary" htmlType="submit" loading={addLoading}>
                추가
              </Button>
            </div>
          </Form.Item>
        </Form>
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
