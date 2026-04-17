"use client";

import { useEffect, useState } from "react";
import {
  Modal, Tabs, Button, Input, Select, Tag, Avatar,
  Tooltip, Popconfirm, Typography, Space, InputNumber, message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { StarOutlined, StarFilled } from "@ant-design/icons";
import {
  createConsultationLog,
  deleteConsultationLog,
  getConsultationLogs,
  getStudentAttendanceStats,
  getStudentGrades,
  addStudentGradesDirect,
  createGradeSession,
  patchStudentMemo,
  updateConsultationLog,
  updateWatch,
} from "@/lib/api";

const { Text } = Typography;

export type ApiStudent = {
  id: string;
  name: string;
  school?: string;
  grade?: string;
  age?: number;
  phone?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_relation?: string;
  subject?: string;
  memo?: string;
  enrolled_at?: string;
  username?: string;
  is_watched?: number;
  watch_reason?: string;
};

interface Props {
  student: ApiStudent;
  onClose: () => void;
  onWatchChange?: (studentId: string, isWatched: boolean) => void;
  onMemoSave?: (studentId: string, memo: string) => void;
}

const EXAM_LABEL: Record<string, string> = {
  "1학기_중간": "1학기 중간",
  "1학기_기말": "1학기 기말",
  "2학기_중간": "2학기 중간",
  "2학기_기말": "2학기 기말",
  모의고사: "모의고사",
};

const CATEGORIES = ["일반", "출결", "성적", "상담", "기타"] as const;
const CATEGORY_COLOR: Record<string, string> = {
  일반: "default",
  출결: "gold",
  성적: "blue",
  상담: "green",
  기타: "purple",
};
const WATCH_REASONS = ["출석률 낮음", "성적 하락", "개인 사정", "학부모 요청"] as const;

function AttendanceBadge({ studentId }: { studentId: string }) {
  const [stats, setStats] = useState<{ rate: number | null; total: number } | null>(null);

  useEffect(() => {
    getStudentAttendanceStats(studentId)
      .then((s) => setStats({ rate: s.rate, total: s.total }))
      .catch(() => {});
  }, [studentId]);

  if (!stats || stats.total === 0) return null;
  const rate = stats.rate ?? 0;

  return (
    <Tag color={rate >= 80 ? "success" : rate >= 60 ? "warning" : "error"}>
      출석률 {rate}%
    </Tag>
  );
}

export default function StudentDetailModal({ student, onClose, onWatchChange, onMemoSave }: Props) {
  const [memo, setMemo] = useState(student.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [grades, setGrades] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesLoaded, setGradesLoaded] = useState(false);

  // 성적 입력 폼 상태
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [gradeYear, setGradeYear] = useState(String(new Date().getFullYear()));
  const [gradeExamType, setGradeExamType] = useState("1학기_중간");
  const [gradeExamMonth, setGradeExamMonth] = useState<number | null>(null);
  const [gradeRows, setGradeRows] = useState<{ subject_name: string; score: number | null; grade_level: number | null }[]>([]);
  const [gradeSaving, setGradeSaving] = useState(false);

  // 성적 입력 링크 생성 상태
  const [sessionLinkYear, setSessionLinkYear] = useState(String(new Date().getFullYear()));
  const [sessionLinkExamType, setSessionLinkExamType] = useState("1학기_중간");
  const [sessionLinkCreating, setSessionLinkCreating] = useState(false);
  const [sessionLinkUrl, setSessionLinkUrl] = useState<string | null>(null);

  const [isWatched, setIsWatched] = useState(Boolean(student.is_watched));
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [watchReason, setWatchReason] = useState(student.watch_reason ?? "");
  const [watchCustom, setWatchCustom] = useState("");
  const [watchLoading, setWatchLoading] = useState(false);

  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logCategory, setLogCategory] = useState<string>("일반");
  const [logSaving, setLogSaving] = useState(false);
  const [editingLog, setEditingLog] = useState<{ id: string; content: string; category: string } | null>(null);

  function handleTabChange(key: string) {
    if (key === "grades" && !gradesLoaded) {
      setGradesLoading(true);
      getStudentGrades(student.id)
        .then(setGrades)
        .catch(() => {})
        .finally(() => { setGradesLoading(false); setGradesLoaded(true); });
    }
    if (key === "logs" && !logsLoaded) {
      setLogsLoading(true);
      getConsultationLogs(student.id)
        .then(setLogs)
        .catch(() => {})
        .finally(() => { setLogsLoading(false); setLogsLoaded(true); });
    }
  }

  async function handleSaveMemo() {
    setSaving(true);
    try {
      await patchStudentMemo(student.id, memo);
      setSaved(true);
      onMemoSave?.(student.id, memo);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleWatchToggle() {
    if (isWatched) {
      setWatchLoading(true);
      try {
        await updateWatch(student.id, false);
        setIsWatched(false);
        onWatchChange?.(student.id, false);
      } finally {
        setWatchLoading(false);
      }
    } else {
      setShowWatchModal(true);
    }
  }

  async function handleWatchConfirm() {
    const reason = watchCustom.trim() || watchReason;
    setWatchLoading(true);
    try {
      await updateWatch(student.id, true, reason || undefined);
      setIsWatched(true);
      setShowWatchModal(false);
      onWatchChange?.(student.id, true);
    } finally {
      setWatchLoading(false);
    }
  }

  async function handleCreateLog() {
    if (!logContent.trim()) return;
    setLogSaving(true);
    try {
      const created = await createConsultationLog(student.id, logContent.trim(), logCategory);
      setLogs((prev) => [created, ...prev]);
      setLogContent("");
      setLogCategory("일반");
    } finally {
      setLogSaving(false);
    }
  }

  async function handleUpdateLog() {
    if (!editingLog || !editingLog.content.trim()) return;
    await updateConsultationLog(student.id, editingLog.id, editingLog.content, editingLog.category);
    setLogs((prev) => prev.map((l) => l.id === editingLog.id ? { ...l, ...editingLog } : l));
    setEditingLog(null);
  }

  async function handleDeleteLog(logId: string) {
    await deleteConsultationLog(student.id, logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
  }

  function openGradeForm() {
    setGradeRows([
      { subject_name: "", score: null, grade_level: null },
      { subject_name: "", score: null, grade_level: null },
      { subject_name: "", score: null, grade_level: null },
    ]);
    setGradeYear(String(new Date().getFullYear()));
    setGradeExamType("1학기_중간");
    setGradeExamMonth(null);
    setShowGradeForm(true);
  }

  async function handleSaveGrades() {
    const filled = gradeRows.filter((r) => r.subject_name.trim() && (r.score != null || r.grade_level != null));
    if (filled.length === 0) { message.warning("과목명과 점수(또는 등급)를 최소 1개 입력하세요."); return; }
    setGradeSaving(true);
    try {
      await addStudentGradesDirect(student.id, {
        year: gradeYear,
        exam_type: gradeExamType,
        exam_month: gradeExamType === "모의고사" ? gradeExamMonth : null,
        entries: filled.map((r) => ({ subject_name: r.subject_name.trim(), score: r.score, grade_level: r.grade_level })),
      });
      const updated = await getStudentGrades(student.id);
      setGrades(updated);
      setShowGradeForm(false);
      message.success("성적이 저장되었습니다.");
    } catch (e: any) {
      message.error(e.message ?? "저장 실패");
    } finally {
      setGradeSaving(false);
    }
  }

  async function importMemoAsLog() {
    if (!memo.trim()) return;
    const created = await createConsultationLog(student.id, memo.trim(), "일반");
    setLogs((prev) => [created, ...prev]);
  }

  const parentLabel = student.parent_name
    ? `${student.parent_name} (${student.parent_relation === "부" ? "아버님" : student.parent_relation === "모" ? "어머님" : "보호자"})`
    : "-";

  const EXAM_ORDER: Record<string, number> = {
    "2학기_기말": 0, "2학기_중간": 1, "1학기_기말": 2, "1학기_중간": 3, 모의고사: 4,
  };
  const gradesByYear: Record<string, any[]> = {};
  grades.forEach((g) => {
    const key = `${g.year}`;
    if (!gradesByYear[key]) gradesByYear[key] = [];
    gradesByYear[key].push(g);
  });
  Object.values(gradesByYear).forEach((list) => {
    list.sort((a, b) => {
      const ao = EXAM_ORDER[a.exam_type] ?? 9, bo = EXAM_ORDER[b.exam_type] ?? 9;
      if (ao !== bo) return ao - bo;
      return (b.exam_month ?? 0) - (a.exam_month ?? 0);
    });
  });

  // ── 탭 콘텐츠 ──

  const InfoTab = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, minHeight: 400 }}>
      {/* 왼쪽: 기본 정보 */}
      <div style={{ padding: "20px 24px 20px 0", borderRight: "1px solid #f0f0f0" }}>
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>기본 정보</Text>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px", marginTop: 16 }}>
          {([
            ["학교", student.school],
            ["학년", student.grade],
            ["나이", student.age ? `${student.age}세` : undefined],
            ["과목", student.subject],
            ["학생 전화", student.phone],
            ["등록일", student.enrolled_at?.slice(0, 10)],
          ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
            <div key={label}>
              <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
              <div style={{ fontWeight: 500, marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>보호자 정보</Text>
          <div style={{
            marginTop: 12,
            padding: 16,
            borderRadius: 10,
            border: "1px solid #f0f0f0",
            background: "#fafafa",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <Avatar size={36} style={{ background: "#f59e0b", fontWeight: 600 }}>
              {student.parent_relation === "부" ? "부" : "모"}
            </Avatar>
            <div>
              <div style={{ fontWeight: 600 }}>{parentLabel}</div>
              <Text type="secondary" style={{ fontSize: 12 }}>{student.parent_phone ?? "-"}</Text>
            </div>
          </div>
        </div>

        {isWatched && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a" }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: "#d97706" }}>⭐ 관심 학생</Text>
            {student.watch_reason && (
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>{student.watch_reason}</div>
            )}
          </div>
        )}
      </div>

      {/* 오른쪽: 메모 */}
      <div style={{ padding: "20px 0 20px 24px", display: "flex", flexDirection: "column" }}>
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>학생 메모</Text>
        <Input.TextArea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이 학생의 특성, 주의사항, 특이사항 등을 자유롭게 메모하세요."
          style={{ flex: 1, marginTop: 12, minHeight: 200, resize: "none", lineHeight: 1.7 }}
          autoSize={{ minRows: 8 }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <Button
            type="primary"
            style={{ flex: 1, background: saved ? "#10b981" : undefined }}
            loading={saving}
            onClick={handleSaveMemo}
          >
            {saved ? "저장 완료!" : "메모 저장"}
          </Button>
          {memo.trim() && (
            <Button onClick={importMemoAsLog} title="메모를 상담 일지로 이관">
              일지로 이관
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const EXAM_OPTIONS = [
    { value: "1학기_중간", label: "1학기 중간" },
    { value: "1학기_기말", label: "1학기 기말" },
    { value: "2학기_중간", label: "2학기 중간" },
    { value: "2학기_기말", label: "2학기 기말" },
    { value: "모의고사", label: "모의고사" },
  ];
  const MOCK_MONTHS = [3, 6, 9, 11];
  const yearNow = new Date().getFullYear();
  const YEAR_OPTIONS = [yearNow, yearNow - 1, yearNow - 2].map((y) => ({ value: String(y), label: `${y}년` }));

  const GradesTab = (
    <div>
      {/* 성적 입력 폼 */}
      {showGradeForm ? (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 10, border: "1px solid #e5e7eb", background: "#fafafa" }}>
          <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>성적 입력</Text>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <Select
              options={YEAR_OPTIONS}
              value={gradeYear}
              onChange={setGradeYear}
              style={{ width: 100 }}
            />
            <Select
              options={EXAM_OPTIONS}
              value={gradeExamType}
              onChange={(v) => { setGradeExamType(v); setGradeExamMonth(null); }}
              style={{ width: 140 }}
            />
            {gradeExamType === "모의고사" && (
              <Select
                options={MOCK_MONTHS.map((m) => ({ value: m, label: `${m}월` }))}
                value={gradeExamMonth}
                onChange={setGradeExamMonth}
                placeholder="월 선택"
                style={{ width: 90 }}
              />
            )}
          </div>

          <table style={{ width: "100%", marginTop: 14, fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 500, color: "#6b7280", width: "36%" }}>과목명</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 500, color: "#6b7280", width: "24%" }}>점수 (0–100)</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 500, color: "#6b7280", width: "24%" }}>등급 (1–9)</th>
                <th style={{ padding: "8px 12px", width: "16%" }} />
              </tr>
            </thead>
            <tbody>
              {gradeRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "6px 12px" }}>
                    <Input
                      value={row.subject_name}
                      onChange={(e) => setGradeRows((prev) => prev.map((r, idx) => idx === i ? { ...r, subject_name: e.target.value } : r))}
                      placeholder="예) 국어, 수학"
                    />
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <InputNumber
                      min={0} max={100}
                      value={row.score}
                      onChange={(v) => setGradeRows((prev) => prev.map((r, idx) => idx === i ? { ...r, score: v as number | null } : r))}
                      style={{ width: "100%" }}
                      placeholder="점수"
                    />
                  </td>
                  <td style={{ padding: "6px 12px" }}>
                    <InputNumber
                      min={1} max={9}
                      value={row.grade_level}
                      onChange={(v) => setGradeRows((prev) => prev.map((r, idx) => idx === i ? { ...r, grade_level: v as number | null } : r))}
                      style={{ width: "100%" }}
                      placeholder="등급"
                    />
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                    <Button
                      type="text" danger size="small"
                      onClick={() => setGradeRows((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      삭제
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button
            size="small"
            style={{ marginTop: 8 }}
            onClick={() => setGradeRows((prev) => [...prev, { subject_name: "", score: null, grade_level: null }])}
          >
            + 행 추가
          </Button>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button type="primary" loading={gradeSaving} onClick={handleSaveGrades}>저장</Button>
            <Button onClick={() => setShowGradeForm(false)}>취소</Button>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
            <Button icon={<PlusOutlined />} onClick={openGradeForm}>성적 추가</Button>
          </div>
          {/* 성적 입력 링크 생성 */}
          <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "12px 14px" }}>
            <Text style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>학생 성적 입력 링크</Text>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <Select
                size="small"
                value={sessionLinkYear}
                onChange={setSessionLinkYear}
                style={{ width: 80 }}
                options={[0, 1, 2].map((i) => {
                  const y = String(new Date().getFullYear() - i);
                  return { label: `${y}년`, value: y };
                })}
              />
              <Select
                size="small"
                value={sessionLinkExamType}
                onChange={setSessionLinkExamType}
                style={{ width: 110 }}
                options={Object.entries(EXAM_LABEL).map(([v, l]) => ({ label: l, value: v }))}
              />
              <Button
                size="small"
                type="primary"
                loading={sessionLinkCreating}
                onClick={async () => {
                  setSessionLinkCreating(true);
                  setSessionLinkUrl(null);
                  try {
                    const res = await createGradeSession({ year: sessionLinkYear, exam_type: sessionLinkExamType });
                    setSessionLinkUrl(res.url);
                  } catch {
                    message.error("링크 생성 실패");
                  } finally {
                    setSessionLinkCreating(false);
                  }
                }}
              >
                링크 생성
              </Button>
            </div>
            {sessionLinkUrl && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, alignItems: "center" }}>
                <Input
                  size="small"
                  value={sessionLinkUrl}
                  readOnly
                  style={{ fontSize: 11, flex: 1 }}
                />
                <Button
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(sessionLinkUrl);
                    message.success("링크 복사됨");
                  }}
                >
                  복사
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 성적 목록 */}
      {gradesLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>불러오는 중...</div>
      ) : grades.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <Text style={{ fontWeight: 500 }}>등록된 성적이 없습니다</Text>
          <div><Text type="secondary" style={{ fontSize: 13 }}>위 버튼으로 선생님이 직접 입력하거나, 학생에게 성적 입력 링크를 공유하세요</Text></div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Object.entries(gradesByYear).sort(([a], [b]) => b.localeCompare(a)).map(([year, records]) => {
            const examGroups: { key: string; label: string; rows: any[] }[] = [];
            const seen = new Map<string, number>();
            records.forEach((g: any) => {
              const key = `${g.exam_type}|${g.exam_month ?? ""}`;
              const label = (EXAM_LABEL[g.exam_type] ?? g.exam_type) + (g.exam_month ? ` (${g.exam_month}월)` : "");
              if (seen.has(key)) { examGroups[seen.get(key)!].rows.push(g); }
              else { seen.set(key, examGroups.length); examGroups.push({ key, label, rows: [g] }); }
            });
            return (
              <div key={year}>
                <Text strong style={{ fontSize: 14 }}>{year}년</Text>
                <div style={{ marginTop: 8, borderRadius: 10, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
                        {["시험", "과목", "점수", "등급"].map((h) => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#6b7280", width: "25%", fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {examGroups.map(({ key, label, rows }) =>
                        rows.map((g: any, ri: number) => {
                          const scoreColor = g.score >= 90 ? "#10b981" : g.score >= 75 ? "#f59e0b" : g.score ? "#ef4444" : "#9ca3af";
                          return (
                            <tr key={`${key}-${ri}`} style={{ borderBottom: "1px solid #f0f0f0" }}>
                              {ri === 0 && (
                                <td rowSpan={rows.length} style={{
                                  padding: "10px 16px", fontSize: 12, fontWeight: 600, color: "#374151",
                                  background: "#fafafa", borderRight: "1px solid #f0f0f0", verticalAlign: "middle",
                                }}>
                                  {label}
                                </td>
                              )}
                              <td style={{ padding: "10px 16px", color: "#1a1a1a" }}>{g.subject_name}</td>
                              <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                <span style={{ fontWeight: 700, color: scoreColor }}>{g.score ?? "-"}</span>
                                {g.score != null && <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 2 }}>점</span>}
                              </td>
                              <td style={{ padding: "10px 16px", textAlign: "center" }}>
                                {g.grade_level ? (
                                  <Tag color="purple" style={{ fontSize: 11 }}>{g.grade_level}등급</Tag>
                                ) : <Text type="secondary">-</Text>}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const LogsTab = (
    <div>
      {/* 작성 폼 */}
      <div style={{ marginBottom: 24, padding: 16, borderRadius: 10, border: "1px solid #f0f0f0", background: "#fafafa" }}>
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          {editingLog ? "일지 수정" : "새 일지 작성"}
        </Text>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, marginBottom: 10 }}>
          {CATEGORIES.map((cat) => (
            <Tag.CheckableTag
              key={cat}
              checked={(editingLog ? editingLog.category : logCategory) === cat}
              onChange={() => editingLog ? setEditingLog({ ...editingLog, category: cat }) : setLogCategory(cat)}
              style={{ fontSize: 12, padding: "2px 10px" }}
            >
              {cat}
            </Tag.CheckableTag>
          ))}
        </div>
        <Input.TextArea
          value={editingLog ? editingLog.content : logContent}
          onChange={(e) =>
            editingLog
              ? setEditingLog({ ...editingLog, content: e.target.value })
              : setLogContent(e.target.value)
          }
          placeholder="상담 내용, 특이사항, 메모를 입력하세요..."
          rows={3}
          style={{ marginBottom: 10, lineHeight: 1.7 }}
        />
        <Space>
          <Button
            type="primary"
            loading={logSaving}
            onClick={editingLog ? handleUpdateLog : handleCreateLog}
          >
            {editingLog ? "수정 완료" : "일지 저장"}
          </Button>
          {editingLog && (
            <Button onClick={() => setEditingLog(null)}>취소</Button>
          )}
        </Space>
      </div>

      {/* 일지 목록 */}
      {logsLoading ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>불러오는 중...</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <Text type="secondary">아직 상담 일지가 없습니다</Text>
          {student.memo?.trim() && (
            <div style={{ marginTop: 12 }}>
              <Button size="small" onClick={importMemoAsLog}>기존 메모 가져오기</Button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {logs.map((log) => (
            <div key={log.id} style={{ padding: 16, borderRadius: 10, border: "1px solid #f0f0f0", background: "#fafafa" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Space>
                  <Tag color={CATEGORY_COLOR[log.category] ?? "default"}>{log.category}</Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(log.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                  </Text>
                </Space>
                <Space>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setEditingLog({ id: log.id, content: log.content, category: log.category })}
                  >
                    수정
                  </Button>
                  <Popconfirm
                    title="일지를 삭제하시겠습니까?"
                    onConfirm={() => handleDeleteLog(log.id)}
                    okText="삭제"
                    cancelText="취소"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" size="small" danger>삭제</Button>
                  </Popconfirm>
                </Space>
              </div>
              <Text style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{log.content}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Modal
        open
        onCancel={onClose}
        footer={null}
        width={860}
        styles={{ body: { padding: "0 24px 24px" } }}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar size={44} style={{ background: "#7c6af7", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
              {student.name[0]}
            </Avatar>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Text strong style={{ fontSize: 16 }}>{student.name}</Text>
                <AttendanceBadge studentId={student.id} />
                {student.username && (
                  <Tag style={{ fontFamily: "monospace", fontSize: 11 }}>{student.username}</Tag>
                )}
              </div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {[student.grade, student.school].filter(Boolean).join(" · ")}
              </Text>
            </div>
            <Tooltip title={isWatched ? "관심 해제" : "관심 학생 등록"}>
              <Button
                type="text"
                icon={isWatched ? <StarFilled style={{ color: "#f59e0b" }} /> : <StarOutlined style={{ color: "#d1d5db" }} />}
                onClick={handleWatchToggle}
                loading={watchLoading}
                style={{ marginLeft: "auto" }}
              />
            </Tooltip>
          </div>
        }
      >
        <Tabs
          defaultActiveKey="info"
          onChange={handleTabChange}
          items={[
            { key: "info", label: "기본 정보", children: InfoTab },
            { key: "grades", label: "성적", children: GradesTab },
            { key: "logs", label: "상담 일지", children: LogsTab },
          ]}
        />
      </Modal>

      {/* 관심 학생 등록 모달 */}
      <Modal
        open={showWatchModal}
        onCancel={() => setShowWatchModal(false)}
        footer={null}
        title="관심 학생 등록"
        width={400}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>등록 사유를 선택하거나 직접 입력하세요</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "16px 0" }}>
          {WATCH_REASONS.map((r) => (
            <Tag.CheckableTag
              key={r}
              checked={watchReason === r && !watchCustom}
              onChange={() => { setWatchReason(r); setWatchCustom(""); }}
            >
              {r}
            </Tag.CheckableTag>
          ))}
        </div>
        <Input
          value={watchCustom}
          onChange={(e) => { setWatchCustom(e.target.value); setWatchReason(""); }}
          placeholder="직접 입력..."
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button
            type="primary"
            style={{ flex: 1, background: "#f59e0b", borderColor: "#f59e0b" }}
            loading={watchLoading}
            onClick={handleWatchConfirm}
          >
            관심 학생 등록
          </Button>
          <Button onClick={() => setShowWatchModal(false)}>취소</Button>
        </div>
      </Modal>
    </>
  );
}
