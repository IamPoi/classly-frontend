"use client";

import { useEffect, useState } from "react";
import {
  Button, Input, Checkbox, Tag, Avatar, Drawer, Form, Select,
  Modal, Alert, Typography, Popconfirm, App,
} from "antd";
import { SendOutlined, RobotOutlined } from "@ant-design/icons";
import { createGroup, deleteGroup, generateMessage, getGroups, getStudents, saveMessage } from "@/lib/api";

const { Text } = Typography;

type Student = {
  id: string; name: string; school?: string; grade?: string;
  parent_name?: string; parent_phone?: string; parent_relation?: string;
};
type Group = { id: string; name: string; member_count?: number; members?: string[] };

const GRADE_COLOR: Record<string, string> = {
  중1: "#10b981", 중2: "#7c6af7", 중3: "#f59e0b",
  고1: "#ef4444", 고2: "#6366f1", 고3: "#ec4899",
};

export default function MessagesPage() {
  const { message } = App.useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [messageText, setMessageText] = useState("");
  const [sent, setSent] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMembers, setNewGroupMembers] = useState<Set<string>>(new Set());
  const [groupLoading, setGroupLoading] = useState(false);

  // AI Drawer
  const [showAI, setShowAI] = useState(false);
  const [aiType, setAiType] = useState("attendance");
  const [aiTone, setAiTone] = useState("formal");
  const [aiReason, setAiReason] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    getStudents().then(setStudents);
    getGroups().then(setGroups).catch(() => {});
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (s.parent_name ?? "").includes(q) ||
      s.name.includes(q) ||
      (s.school ?? "").includes(q) ||
      (s.grade ?? "").includes(q);
    const matchGroup = !selectedGroup ||
      groups.find((g) => g.id === selectedGroup)?.members?.includes(s.id);
    return matchSearch && matchGroup;
  });

  function toggleCheck(id: string) {
    setChecked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setChecked(checked.size === filtered.length ? new Set() : new Set(filtered.map((s) => s.id)));
  }

  async function handleSend() {
    if (!messageText.trim() || checked.size === 0) return;
    for (const sid of checked) {
      const s = students.find((x) => x.id === sid);
      if (!s) continue;
      const personalizedContent = messageText.replace(/\[학생이름\]/g, s.name);
      await saveMessage({ student_id: sid, parent_phone: s.parent_phone, content: personalizedContent, type: "custom" }).catch(() => {});
    }
    setSent(true);
    setTimeout(() => setSent(false), 2500);
    setMessageText("");
    setChecked(new Set());
  }

  async function handleGenerateAI() {
    setAiLoading(true);
    setAiError("");
    setAiDraft(null);
    const firstSelected = checked.size > 0
      ? students.find((s) => checked.has(s.id))
      : students[0];
    if (!firstSelected) {
      setAiError("학생 데이터가 없습니다.");
      setAiLoading(false);
      return;
    }
    try {
      const result = await generateMessage({
        student_id: firstSelected.id,
        message_type: aiType,
        tone: aiTone,
        reason: aiReason || undefined,
        extra_notes: aiNotes || undefined,
        include_student_name: true,
      });
      const draft = result.draft.replace(new RegExp(firstSelected.name, "g"), "[학생이름]");
      setAiDraft(draft);
    } catch (err: any) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function applyDraft() {
    if (aiDraft) { setMessageText(aiDraft); setShowAI(false); }
  }

  async function handleCreateGroup() {
    if (!newGroupName.trim() || newGroupMembers.size === 0) return;
    setGroupLoading(true);
    try {
      await createGroup(newGroupName.trim(), Array.from(newGroupMembers));
      const updated = await getGroups();
      setGroups(updated);
      setNewGroupName("");
      setNewGroupMembers(new Set());
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setGroupLoading(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    await deleteGroup(id).catch(() => {});
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (selectedGroup === id) setSelectedGroup(null);
  }

  const selectedStudents = students.filter((s) => checked.has(s.id));
  const hasPlaceholder = messageText.includes("[학생이름]");

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* ── 좌측 패널 ── */}
      <div style={{
        width: 320,
        flexShrink: 0,
        borderRight: "1px solid #f0f0f0",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
      }}>
        {/* 검색 + 그룹 관리 */}
        <div style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <Text strong style={{ fontSize: 14 }}>학부모 목록</Text>
            <Button size="small" onClick={() => setShowGroupModal(true)} style={{ color: "#7c6af7", borderColor: "#7c6af7" }}>
              그룹 관리
            </Button>
          </div>
          <Input.Search
            placeholder="이름, 학교, 학년 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        {/* 그룹 필터 */}
        {groups.length > 0 && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f0f0f0", overflowX: "auto" }}>
            <div style={{ display: "flex", gap: 6, minWidth: "max-content" }}>
              <Button
                size="small"
                type={!selectedGroup ? "primary" : "default"}
                shape="round"
                onClick={() => setSelectedGroup(null)}
              >
                전체
              </Button>
              {groups.map((g) => (
                <Button
                  key={g.id}
                  size="small"
                  type={selectedGroup === g.id ? "primary" : "default"}
                  shape="round"
                  onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
                >
                  {g.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* 전체 선택 */}
        <div style={{ padding: "8px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <Checkbox
            checked={filtered.length > 0 && checked.size === filtered.length}
            indeterminate={checked.size > 0 && checked.size < filtered.length}
            onChange={toggleAll}
          >
            <Text style={{ fontSize: 13, color: "#6b7280" }}>
              {checked.size > 0 ? `${checked.size}명 선택됨` : `전체 선택 (${filtered.length}명)`}
            </Text>
          </Checkbox>
        </div>

        {/* 부모님 목록 */}
        <ul style={{ flex: 1, overflowY: "auto", margin: 0, padding: 0, listStyle: "none" }}>
          {filtered.map((s) => {
            const gradeColor = GRADE_COLOR[s.grade ?? ""] ?? "#9ca3af";
            const isChecked = checked.has(s.id);
            return (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  background: isChecked ? "#f5f3ff" : undefined,
                  borderBottom: "1px solid #f5f5f5",
                  transition: "background 0.15s",
                }}
                onClick={() => toggleCheck(s.id)}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => toggleCheck(s.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar size={36} style={{ background: gradeColor, fontWeight: 600, flexShrink: 0 }}>
                  {s.name[0]}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Text strong style={{ fontSize: 13 }}>
                      {s.parent_name
                        ? `${s.name} ${s.parent_relation === "부" ? "아버님" : "어머님"}`
                        : "부모님 미등록"}
                    </Text>
                    <Tag color={gradeColor} style={{ fontSize: 11, padding: "0 6px" }}>{s.grade ?? "-"}</Tag>
                  </div>
                  {s.parent_name && <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{s.parent_name}</Text>}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {s.name}{s.school ? ` · ${s.school}` : ""}
                  </Text>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li style={{ padding: "32px 16px", textAlign: "center" }}>
              <Text type="secondary">검색 결과가 없습니다.</Text>
            </li>
          )}
        </ul>
      </div>

      {/* ── 우측: 메시지 작성 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f9f8f6" }}>
        {/* 수신자 태그 */}
        <div style={{ padding: "14px 32px", borderBottom: "1px solid #e5e5e5", background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>수신자</Text>
            {checked.size > 0 && (
              <Button type="link" size="small" style={{ color: "#9ca3af", padding: 0 }} onClick={() => setChecked(new Set())}>
                전체 해제
              </Button>
            )}
          </div>
          {checked.size === 0 ? (
            <Text type="secondary">왼쪽에서 학부모를 선택하세요</Text>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {selectedStudents.slice(0, 10).map((s) => {
                const gc = GRADE_COLOR[s.grade ?? ""] ?? "#9ca3af";
                return (
                  <Tag
                    key={s.id}
                    closable
                    onClose={() => toggleCheck(s.id)}
                    style={{ background: gc + "18", color: gc, border: `1px solid ${gc}40`, fontSize: 12 }}
                  >
                    {s.parent_name ?? s.name} ({s.name})
                  </Tag>
                );
              })}
              {checked.size > 10 && (
                <Tag style={{ background: "#f3f4f6", color: "#6b7280" }}>+{checked.size - 10}명</Tag>
              )}
            </div>
          )}
        </div>

        {/* 메시지 작성 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 32px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 680 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong>메시지 작성</Text>
                {hasPlaceholder && (
                  <Tag color="purple">[학생이름] 자동 치환됨</Tag>
                )}
              </div>
              <Button
                icon={<RobotOutlined />}
                onClick={() => setShowAI(true)}
                style={{ color: "#7c6af7", borderColor: "#7c6af7", background: "#faf5ff" }}
              >
                AI 초안 생성
              </Button>
            </div>

            <Input.TextArea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={"메시지를 입력하거나 AI 초안 생성을 사용하세요.\n\n💡 [학생이름] 을 입력하면 발송 시 각 학생 이름으로 자동 치환됩니다."}
              style={{ flex: 1, minHeight: 280, lineHeight: 1.7, resize: "none" }}
              autoSize={{ minRows: 10 }}
            />

            {/* 미리보기 */}
            {hasPlaceholder && selectedStudents.length > 0 && (
              <Alert
                type="info"
                style={{ marginTop: 12 }}
                message={`미리보기 — ${selectedStudents[0].name} (${selectedStudents[0].parent_name})`}
                description={messageText.replace(/\[학생이름\]/g, selectedStudents[0].name)}
              />
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {checked.size > 0
                  ? `${checked.size}명에게 ${hasPlaceholder ? "개인화 " : ""}발송됩니다`
                  : "수신자를 선택하세요"}
              </Text>
              <Button
                icon={<SendOutlined />}
                disabled={checked.size === 0 || !messageText.trim()}
                onClick={handleSend}
                style={{
                  background: "#FAE100",
                  borderColor: "#FAE100",
                  color: "#1a1a1a",
                  fontWeight: 600,
                }}
              >
                카카오톡으로 발송
              </Button>
            </div>

            {sent && (
              <Alert
                type="success"
                message={`${selectedStudents.length}명에게 발송 완료 (복사 후 카카오톡에서 전송해주세요)`}
                style={{ marginTop: 12 }}
                showIcon
              />
            )}
          </div>
        </div>
      </div>

      {/* ── AI 초안 Drawer ── */}
      <Drawer
        title="✨ AI 메시지 초안 생성"
        open={showAI}
        onClose={() => { setShowAI(false); setAiDraft(null); }}
        width={420}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: 1 }} onClick={() => { setShowAI(false); setAiDraft(null); }}>닫기</Button>
            {aiDraft ? (
              <Button type="primary" style={{ flex: 1 }} onClick={applyDraft}>메시지창에 적용</Button>
            ) : (
              <Button type="primary" style={{ flex: 1 }} loading={aiLoading} onClick={handleGenerateAI}>
                AI 초안 생성
              </Button>
            )}
          </div>
        }
      >
        <Form layout="vertical">
          <Form.Item label="메시지 종류">
            <Select
              value={aiType}
              onChange={setAiType}
              options={[
                { value: "attendance", label: "출석 알림" },
                { value: "grade", label: "성적 안내" },
                { value: "reminder", label: "알림장" },
                { value: "custom", label: "직접 입력" },
              ]}
            />
          </Form.Item>
          <Form.Item label="말투">
            <Select
              value={aiTone}
              onChange={setAiTone}
              options={[
                { value: "formal", label: "정중하게" },
                { value: "friendly", label: "친근하게" },
                { value: "casual", label: "간결하게" },
              ]}
            />
          </Form.Item>
          <Form.Item label="전달 사유 (선택)">
            <Input
              value={aiReason}
              onChange={(e) => setAiReason(e.target.value)}
              placeholder="예) 이번 주 수학 점수 안내"
            />
          </Form.Item>
          <Form.Item label="추가 메모 (선택)">
            <Input
              value={aiNotes}
              onChange={(e) => setAiNotes(e.target.value)}
              placeholder="예) 다음 주 월요일 보충수업 예정"
            />
          </Form.Item>
        </Form>

        {aiError && <Alert type="error" message={aiError} showIcon style={{ marginBottom: 12 }} />}

        {aiDraft && (
          <Alert
            type="info"
            message="생성된 초안"
            description={
              <>
                <p style={{ lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "8px 0" }}>{aiDraft}</p>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  💡 발송 시 [학생이름]이 각 학생 이름으로 자동 치환됩니다
                </Text>
              </>
            }
          />
        )}
      </Drawer>

      {/* ── 그룹 관리 Modal ── */}
      <Modal
        title="그룹 관리"
        open={showGroupModal}
        onCancel={() => { setShowGroupModal(false); setNewGroupName(""); setNewGroupMembers(new Set()); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: 1 }} onClick={() => { setShowGroupModal(false); setNewGroupName(""); setNewGroupMembers(new Set()); }}>
              닫기
            </Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              disabled={!newGroupName.trim() || newGroupMembers.size === 0}
              loading={groupLoading}
              onClick={handleCreateGroup}
            >
              그룹 만들기 ({newGroupMembers.size}명)
            </Button>
          </div>
        }
        width={520}
      >
        {/* 기존 그룹 목록 */}
        {groups.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>기존 그룹</Text>
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              {groups.map((g) => (
                <div key={g.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderRadius: 8, border: "1px solid #f0f0f0",
                }}>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>{g.name}</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>{g.member_count ?? 0}명</Text>
                  </div>
                  <Popconfirm
                    title="그룹을 삭제하시겠습니까?"
                    onConfirm={() => handleDeleteGroup(g.id)}
                    okText="삭제"
                    cancelText="취소"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger size="small">삭제</Button>
                  </Popconfirm>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 새 그룹 만들기 */}
        <div>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase" }}>새 그룹 만들기</Text>
          <Input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="그룹 이름 (예: 중2 수학반)"
            style={{ marginTop: 8, marginBottom: 12 }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>학생 선택 ({newGroupMembers.size}명)</Text>
          <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto", border: "1px solid #f0f0f0", borderRadius: 8 }}>
            {students.map((s) => {
              const isMember = newGroupMembers.has(s.id);
              return (
                <label
                  key={s.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", cursor: "pointer",
                    background: isMember ? "#f5f3ff" : undefined,
                    borderBottom: "1px solid #f5f5f5",
                  }}
                >
                  <Checkbox
                    checked={isMember}
                    onChange={() => {
                      setNewGroupMembers((prev) => {
                        const n = new Set(prev);
                        n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                        return n;
                      });
                    }}
                  />
                  <Text style={{ fontSize: 13 }}>{s.name}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.grade} · {s.school}</Text>
                </label>
              );
            })}
          </div>
        </div>
      </Modal>
    </div>
  );
}
