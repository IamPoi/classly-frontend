"use client";

import { useEffect, useState } from "react";
import {
  createConsultationLog,
  deleteConsultationLog,
  getConsultationLogs,
  getStudentAttendanceStats,
  getStudentGrades,
  patchStudentMemo,
  updateConsultationLog,
  updateWatch,
} from "@/lib/api";

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
  "모의고사": "모의고사",
};

const CATEGORIES = ["일반", "출결", "성적", "상담", "기타"] as const;
const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  일반: { bg: "#f3f4f6", text: "#6b7280" },
  출결: { bg: "#fef3c7", text: "#d97706" },
  성적: { bg: "#dbeafe", text: "#2563eb" },
  상담: { bg: "#d1fae5", text: "#059669" },
  기타: { bg: "#ede9fe", text: "#7c6af7" },
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
  const color = rate >= 80 ? { bg: "#d1fae5", text: "#059669" }
    : rate >= 60 ? { bg: "#fef3c7", text: "#d97706" }
    : { bg: "#fee2e2", text: "#ef4444" };

  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: color.bg, color: color.text }}>
      출석률 {rate}%
    </span>
  );
}

export default function StudentDetailModal({ student, onClose, onWatchChange, onMemoSave }: Props) {
  const [tab, setTab] = useState<"info" | "grades" | "logs">("info");

  // 메모
  const [memo, setMemo] = useState(student.memo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 성적
  const [grades, setGrades] = useState<any[]>([]);
  const [gradesLoading, setGradesLoading] = useState(false);

  // 관심 학생
  const [isWatched, setIsWatched] = useState(Boolean(student.is_watched));
  const [showWatchModal, setShowWatchModal] = useState(false);
  const [watchReason, setWatchReason] = useState(student.watch_reason ?? "");
  const [watchCustom, setWatchCustom] = useState("");
  const [watchLoading, setWatchLoading] = useState(false);

  // 상담 일지
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logCategory, setLogCategory] = useState<string>("일반");
  const [logSaving, setLogSaving] = useState(false);
  const [editingLog, setEditingLog] = useState<{ id: string; content: string; category: string } | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (tab === "grades" && grades.length === 0) {
      setGradesLoading(true);
      getStudentGrades(student.id).then(setGrades).catch(() => {}).finally(() => setGradesLoading(false));
    }
    if (tab === "logs" && logs.length === 0) {
      setLogsLoading(true);
      getConsultationLogs(student.id).then(setLogs).catch(() => {}).finally(() => setLogsLoading(false));
    }
  }, [tab]);

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

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleUpdateLog(e: React.FormEvent) {
    e.preventDefault();
    if (!editingLog || !editingLog.content.trim()) return;
    await updateConsultationLog(student.id, editingLog.id, editingLog.content, editingLog.category);
    setLogs((prev) => prev.map((l) => l.id === editingLog.id ? { ...l, ...editingLog } : l));
    setEditingLog(null);
  }

  async function handleDeleteLog(logId: string) {
    await deleteConsultationLog(student.id, logId);
    setLogs((prev) => prev.filter((l) => l.id !== logId));
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
    "2학기_기말": 0, "2학기_중간": 1, "1학기_기말": 2, "1학기_중간": 3, "모의고사": 4,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: "var(--accent)" }}>
              {student.name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-lg" style={{ color: "var(--foreground)" }}>{student.name}</h2>
                <AttendanceBadge studentId={student.id} />
                {student.username && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: "#f3f4f6", color: "#6b7280" }}>
                    {student.username}
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
                {[student.grade, student.school].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* 관심 학생 별표 */}
            <button
              onClick={handleWatchToggle}
              disabled={watchLoading}
              title={isWatched ? "관심 해제" : "관심 학생 등록"}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              style={{ color: isWatched ? "#f59e0b" : "#d1d5db", fontSize: "18px" }}>
              {isWatched ? "★" : "☆"}
            </button>

            {/* 탭 */}
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              {([["info", "기본 정보"], ["grades", "성적"], ["logs", "상담 일지"]] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className="px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: tab === key ? "var(--accent)" : "#fff",
                    color: tab === key ? "#fff" : "#6b7280",
                  }}>
                  {label}
                </button>
              ))}
            </div>

            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              style={{ color: "#9ca3af" }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* 기본 정보 탭 */}
          {tab === "info" && (
            <div className="grid grid-cols-2 h-full">
              <div className="p-8 border-r" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#9ca3af" }}>기본 정보</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {([
                    ["학교", student.school],
                    ["학년", student.grade],
                    ["나이", student.age ? `${student.age}세` : undefined],
                    ["과목", student.subject],
                    ["학생 전화", student.phone],
                    ["등록일", student.enrolled_at?.slice(0, 10)],
                  ] as [string, string | undefined][]).filter(([, v]) => v).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs mb-1" style={{ color: "#9ca3af" }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9ca3af" }}>보호자 정보</p>
                  <div className="rounded-xl p-4 border" style={{ borderColor: "var(--border)", background: "#fafafa" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                        style={{ background: "#f59e0b" }}>
                        {student.parent_relation === "부" ? "부" : "모"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{parentLabel}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{student.parent_phone ?? "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>
                {isWatched && (
                  <div className="mt-4 p-3 rounded-xl border" style={{ background: "#fffbeb", borderColor: "#fde68a" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#d97706" }}>⭐ 관심 학생</p>
                    {student.watch_reason && (
                      <p className="text-xs" style={{ color: "#92400e" }}>{student.watch_reason}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-8 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "#9ca3af" }}>학생 메모</p>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="이 학생의 특성, 주의사항, 특이사항 등을 자유롭게 메모하세요."
                  className="flex-1 w-full text-sm rounded-xl border p-4 outline-none resize-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa", lineHeight: "1.7", minHeight: "200px" }}
                />
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveMemo} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: saved ? "#10b981" : "var(--accent)" }}>
                    {saved ? "저장 완료!" : saving ? "저장 중..." : "메모 저장"}
                  </button>
                  {memo.trim() && (
                    <button onClick={importMemoAsLog}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold border"
                      style={{ borderColor: "var(--border)", color: "#6b7280" }}
                      title="메모를 상담 일지로 이관">
                      일지로 이관
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 성적 탭 */}
          {tab === "grades" && (
            <div className="p-8">
              <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "#9ca3af" }}>성적 기록</p>
              {gradesLoading ? (
                <p className="text-sm text-center py-10" style={{ color: "#9ca3af" }}>불러오는 중...</p>
              ) : grades.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-4xl mb-3">📊</p>
                  <p className="text-sm font-medium mb-1" style={{ color: "#374151" }}>등록된 성적이 없습니다</p>
                  <p className="text-xs" style={{ color: "#9ca3af" }}>성적 입력 세션을 통해 학생이 직접 입력하거나 선생님이 등록할 수 있습니다</p>
                </div>
              ) : (
                <div className="space-y-6">
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
                        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--foreground)" }}>{year}년</h3>
                        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ background: "#fafafa", borderBottom: "1px solid var(--border)" }}>
                                {["시험", "과목", "점수", "등급"].map((h) => (
                                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#6b7280", width: "25%" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {examGroups.map(({ key, label, rows }) =>
                                rows.map((g: any, ri: number) => {
                                  const scoreColor = g.score >= 90 ? "#10b981" : g.score >= 75 ? "#f59e0b" : g.score ? "#ef4444" : "#9ca3af";
                                  return (
                                    <tr key={`${key}-${ri}`} className={ri === rows.length - 1 ? "border-b" : ""} style={{ borderColor: "var(--border)" }}>
                                      {ri === 0 && (
                                        <td rowSpan={rows.length} className="px-4 py-3 text-xs font-semibold align-middle border-r"
                                          style={{ color: "#374151", borderColor: "var(--border)", background: "#fafafa", borderBottom: "1px solid var(--border)" }}>
                                          {label}
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{g.subject_name}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className="text-sm font-bold" style={{ color: scoreColor }}>{g.score ?? "-"}</span>
                                        {g.score != null && <span className="text-xs ml-0.5" style={{ color: "#9ca3af" }}>점</span>}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        {g.grade_level ? (
                                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#ede9fe", color: "var(--accent)" }}>
                                            {g.grade_level}등급
                                          </span>
                                        ) : <span style={{ color: "#d1d5db" }}>-</span>}
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
          )}

          {/* 상담 일지 탭 */}
          {tab === "logs" && (
            <div className="p-8">
              {/* 작성 폼 */}
              <form onSubmit={editingLog ? handleUpdateLog : handleCreateLog} className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9ca3af" }}>
                  {editingLog ? "일지 수정" : "새 일지 작성"}
                </p>
                <div className="flex gap-2 mb-2">
                  {CATEGORIES.map((cat) => (
                    <button key={cat} type="button"
                      onClick={() => editingLog ? setEditingLog({ ...editingLog, category: cat }) : setLogCategory(cat)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                      style={
                        (editingLog ? editingLog.category : logCategory) === cat
                          ? { background: CATEGORY_COLOR[cat].bg, color: CATEGORY_COLOR[cat].text, borderColor: CATEGORY_COLOR[cat].text }
                          : { background: "#fff", color: "#9ca3af", borderColor: "#e5e7eb" }
                      }>
                      {cat}
                    </button>
                  ))}
                </div>
                <textarea
                  value={editingLog ? editingLog.content : logContent}
                  onChange={(e) => editingLog
                    ? setEditingLog({ ...editingLog, content: e.target.value })
                    : setLogContent(e.target.value)
                  }
                  placeholder="상담 내용, 특이사항, 메모를 입력하세요..."
                  rows={3}
                  className="w-full text-sm rounded-xl border p-4 outline-none resize-none mb-2"
                  style={{ borderColor: "var(--border)", background: "#fafafa", lineHeight: "1.7" }}
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={logSaving}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--accent)" }}>
                    {logSaving ? "저장 중..." : editingLog ? "수정 완료" : "일지 저장"}
                  </button>
                  {editingLog && (
                    <button type="button" onClick={() => setEditingLog(null)}
                      className="px-4 py-2 rounded-xl text-sm border"
                      style={{ borderColor: "var(--border)", color: "#6b7280" }}>
                      취소
                    </button>
                  )}
                </div>
              </form>

              {/* 일지 목록 */}
              {logsLoading ? (
                <p className="text-sm text-center py-8" style={{ color: "#9ca3af" }}>불러오는 중...</p>
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3">📝</p>
                  <p className="text-sm" style={{ color: "#9ca3af" }}>아직 상담 일지가 없습니다</p>
                  {student.memo?.trim() && (
                    <button onClick={importMemoAsLog}
                      className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "#ede9fe", color: "var(--accent)" }}>
                      기존 메모 가져오기
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-xl border p-4"
                      style={{ borderColor: "var(--border)", background: "#fafafa" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: CATEGORY_COLOR[log.category]?.bg ?? "#f3f4f6", color: CATEGORY_COLOR[log.category]?.text ?? "#6b7280" }}>
                            {log.category}
                          </span>
                          <span className="text-xs" style={{ color: "#9ca3af" }}>
                            {new Date(log.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingLog({ id: log.id, content: log.content, category: log.category })}
                            className="text-xs px-2 py-1 rounded-lg hover:bg-gray-100" style={{ color: "#6b7280" }}>
                            수정
                          </button>
                          <button onClick={() => handleDeleteLog(log.id)}
                            className="text-xs px-2 py-1 rounded-lg hover:bg-red-50" style={{ color: "#ef4444" }}>
                            삭제
                          </button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: "#374151", lineHeight: "1.7" }}>
                        {log.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 관심 학생 등록 모달 */}
      {showWatchModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowWatchModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-1" style={{ color: "#111827" }}>관심 학생 등록</h3>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>등록 사유를 선택하거나 직접 입력하세요</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {WATCH_REASONS.map((r) => (
                <button key={r} onClick={() => { setWatchReason(r); setWatchCustom(""); }}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                  style={watchReason === r && !watchCustom
                    ? { background: "#ede9fe", color: "#7c6af7", borderColor: "#7c6af7" }
                    : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}>
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={watchCustom}
              onChange={(e) => { setWatchCustom(e.target.value); setWatchReason(""); }}
              placeholder="직접 입력..."
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none mb-4"
              style={{ borderColor: "#e5e7eb", background: "#fafafa" }}
            />
            <div className="flex gap-2">
              <button onClick={handleWatchConfirm} disabled={watchLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#f59e0b" }}>
                {watchLoading ? "등록 중..." : "관심 학생 등록"}
              </button>
              <button onClick={() => setShowWatchModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm border"
                style={{ borderColor: "#e5e7eb", color: "#6b7280" }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
