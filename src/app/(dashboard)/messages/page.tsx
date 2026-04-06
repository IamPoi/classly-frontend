"use client";

import { useEffect, useState } from "react";
import { createGroup, deleteGroup, generateMessage, getGroups, getStudents, saveMessage } from "@/lib/api";

type Student = {
  id: string; name: string; school?: string; grade?: string;
  parent_name?: string; parent_phone?: string; parent_relation?: string;
};
type Group = { id: string; name: string; member_count?: number; members?: string[] };

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// 학년별 색상
const GRADE_COLOR: Record<string, string> = {
  중1: "#10b981", 중2: "#7c6af7", 중3: "#f59e0b",
  고1: "#ef4444", 고2: "#6366f1", 고3: "#ec4899",
};

export default function MessagesPage() {
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

  // AI 생성 패널
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
    // [학생이름] 치환해서 각 학생 부모님께 개인화 저장
    for (const sid of checked) {
      const s = students.find((x) => x.id === sid);
      if (!s) continue;
      const personalizedContent = messageText.replace(/\[학생이름\]/g, s.name);
      await saveMessage({
        student_id: sid,
        parent_phone: s.parent_phone,
        content: personalizedContent,
        type: "custom",
      }).catch(() => {});
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

    // 학생 선택 없이 더미 학생ID로 호출 (실제론 [학생이름] placeholder 사용)
    // 선택된 학생이 있으면 첫 번째 학생 기준으로 생성
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
      // 이름 부분을 [학생이름] 플레이스홀더로 치환
      const draft = result.draft.replace(
        new RegExp(firstSelected.name, "g"),
        "[학생이름]"
      );
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
      alert(err.message);
    } finally {
      setGroupLoading(false);
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("그룹을 삭제하시겠습니까?")) return;
    await deleteGroup(id).catch(() => {});
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (selectedGroup === id) setSelectedGroup(null);
  }

  const selectedStudents = students.filter((s) => checked.has(s.id));

  // [학생이름] 포함 여부 → 미리보기
  const hasPlaceholder = messageText.includes("[학생이름]");

  return (
    <div className="flex h-full">
      {/* ── 좌측: 부모님 목록 ── */}
      <div className="w-80 flex-shrink-0 border-r h-full flex flex-col"
        style={{ borderColor: "var(--border)", background: "#fff" }}>

        {/* 검색 + 그룹 관리 */}
        <div className="p-4 border-b space-y-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>학부모 목록</h2>
            <button onClick={() => setShowGroupModal(true)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
              그룹 관리
            </button>
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 학교, 학년 검색..."
            className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "#fafafa" }} />
        </div>

        {/* 그룹 필터 */}
        {groups.length > 0 && (
          <div className="px-4 py-2.5 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            <div className="flex gap-1.5 min-w-max">
              <button onClick={() => setSelectedGroup(null)}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                style={{ background: !selectedGroup ? "var(--accent)" : "#f3f4f6", color: !selectedGroup ? "#fff" : "#6b7280" }}>
                전체
              </button>
              {groups.map((g) => (
                <button key={g.id} onClick={() => setSelectedGroup(selectedGroup === g.id ? null : g.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ background: selectedGroup === g.id ? "var(--accent)" : "#f3f4f6", color: selectedGroup === g.id ? "#fff" : "#6b7280" }}>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 전체 선택 */}
        <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
          <input type="checkbox"
            checked={filtered.length > 0 && checked.size === filtered.length}
            onChange={toggleAll}
            className="w-4 h-4 rounded accent-purple-500" />
          <span className="text-xs" style={{ color: "#6b7280" }}>
            {checked.size > 0 ? `${checked.size}명 선택됨` : `전체 선택 (${filtered.length}명)`}
          </span>
        </div>

        {/* 부모님 카드 목록 */}
        <ul className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "var(--border)" }}>
          {filtered.map((s) => {
            const gradeColor = GRADE_COLOR[s.grade ?? ""] ?? "#9ca3af";
            const isChecked = checked.has(s.id);
            return (
              <li key={s.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ background: isChecked ? "#f5f3ff" : undefined }}
                onClick={() => toggleCheck(s.id)}>
                <input type="checkbox" checked={isChecked}
                  onChange={() => toggleCheck(s.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-purple-500 flex-shrink-0" />

                {/* 학생 아바타 */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: gradeColor }}>
                  {s.name[0]}
                </div>

                <div className="flex-1 min-w-0">
                  {/* 부모님 이름 */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {s.parent_name
                        ? `${s.name} ${s.parent_relation === "부" ? "아버님" : "어머님"}`
                        : "부모님 미등록"}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: gradeColor + "18", color: gradeColor }}>
                      {s.grade ?? "-"}
                    </span>
                  </div>
                  {/* 보호자 성함 */}
                  {s.parent_name && (
                    <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{s.parent_name}</p>
                  )}
                  {/* 학생 정보 */}
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" style={{ color: "#9ca3af" }}>
                      <circle cx="12" cy="7" r="4" fill="currentColor" />
                      <path d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-xs" style={{ color: "#9ca3af" }}>{s.name}</span>
                    {s.school && <span className="text-xs" style={{ color: "#9ca3af" }}>· {s.school}</span>}
                  </div>
                  {/* 전화번호 */}
                  {s.parent_phone && (
                    <p className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>{s.parent_phone}</p>
                  )}
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-8 text-center text-sm" style={{ color: "#9ca3af" }}>
              검색 결과가 없습니다.
            </li>
          )}
        </ul>
      </div>

      {/* ── 우측: 메시지 작성 ── */}
      <div className="flex-1 flex flex-col" style={{ background: "var(--background)" }}>
        {/* 수신자 태그 */}
        <div className="px-8 py-4 border-b" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>수신자</p>
            {checked.size > 0 && (
              <button onClick={() => setChecked(new Set())}
                className="text-xs" style={{ color: "#9ca3af" }}>전체 해제</button>
            )}
          </div>
          {checked.size === 0 ? (
            <p className="text-sm" style={{ color: "#d1d5db" }}>왼쪽에서 학부모를 선택하세요</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedStudents.slice(0, 10).map((s) => {
                const gc = GRADE_COLOR[s.grade ?? ""] ?? "#9ca3af";
                return (
                  <span key={s.id}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: gc + "15", color: gc, border: `1px solid ${gc}30` }}>
                    <span style={{ fontWeight: 600 }}>{s.parent_name ?? s.name}</span>
                    <span style={{ opacity: 0.7 }}>({s.name})</span>
                    <button onClick={(e) => { e.stopPropagation(); toggleCheck(s.id); }}
                      className="ml-0.5 hover:opacity-100 opacity-50">×</button>
                  </span>
                );
              })}
              {checked.size > 10 && (
                <span className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}>+{checked.size - 10}명</span>
              )}
            </div>
          )}
        </div>

        {/* 메시지 작성 영역 */}
        <div className="flex-1 flex flex-col px-8 py-6">
          <div className="flex-1 flex flex-col max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>메시지 작성</label>
                {hasPlaceholder && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: "#ede9fe", color: "var(--accent)" }}>
                    [학생이름] 자동 치환됨
                  </span>
                )}
              </div>
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "#faf5ff" }}>
                ✨ AI 초안 생성
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={"메시지를 입력하거나 AI 초안 생성을 사용하세요.\n\n💡 [학생이름] 을 입력하면 발송 시 각 학생 이름으로 자동 치환됩니다."}
              className="flex-1 w-full px-5 py-4 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: "var(--border)", background: "#fff", lineHeight: "1.7", minHeight: "280px" }}
            />

            {/* 미리보기 (선택 학생 있을 때) */}
            {hasPlaceholder && selectedStudents.length > 0 && (
              <div className="mt-3 px-4 py-3 rounded-xl border" style={{ borderColor: "#a78bfa", background: "#faf5ff" }}>
                <p className="text-xs font-medium mb-1.5" style={{ color: "var(--accent)" }}>
                  미리보기 — {selectedStudents[0].name} ({selectedStudents[0].parent_name})
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "#374151" }}>
                  {messageText.replace(/\[학생이름\]/g, selectedStudents[0].name)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs" style={{ color: "#9ca3af" }}>
                {checked.size > 0
                  ? `${checked.size}명에게 ${hasPlaceholder ? "개인화 " : ""}발송됩니다`
                  : "수신자를 선택하세요"}
              </p>
              <button onClick={handleSend}
                disabled={checked.size === 0 || !messageText.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "#FAE100", color: "#1a1a1a" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                카카오톡으로 발송
              </button>
            </div>

            {sent && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "#d1fae5" }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-medium" style={{ color: "#059669" }}>
                  {selectedStudents.length}명에게 발송 완료 (복사 후 카카오톡에서 전송해주세요)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI 초안 생성 모달 ── */}
      {showAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAI(false)}>
          <div className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "var(--foreground)" }}>✨ AI 메시지 초안 생성</h3>
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: "#ede9fe", color: "var(--accent)" }}>
                [학생이름] 자동 삽입
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>메시지 종류</label>
                <div className="flex gap-2 flex-wrap">
                  {[["attendance", "출석 알림"], ["grade", "성적 안내"], ["reminder", "알림장"], ["custom", "직접 입력"]].map(([v, l]) => (
                    <button key={v} onClick={() => setAiType(v)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{ background: aiType === v ? "var(--accent)" : "#f3f4f6", color: aiType === v ? "#fff" : "#6b7280" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>말투</label>
                <div className="flex gap-2">
                  {[["formal", "정중하게"], ["friendly", "친근하게"], ["casual", "간결하게"]].map(([v, l]) => (
                    <button key={v} onClick={() => setAiTone(v)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{ background: aiTone === v ? "var(--accent)" : "#f3f4f6", color: aiTone === v ? "#fff" : "#6b7280" }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>전달 사유 (선택)</label>
                <input type="text" value={aiReason} onChange={(e) => setAiReason(e.target.value)}
                  placeholder="예) 이번 주 수학 점수 안내"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>추가 메모 (선택)</label>
                <input type="text" value={aiNotes} onChange={(e) => setAiNotes(e.target.value)}
                  placeholder="예) 다음 주 월요일 보충수업 예정"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              </div>
            </div>

            {aiError && (
              <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>{aiError}</p>
            )}

            {aiDraft && (
              <div className="mt-4 p-4 rounded-xl border" style={{ borderColor: "#a78bfa", background: "#faf5ff" }}>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--accent)" }}>생성된 초안:</p>
                <p className="text-sm leading-relaxed" style={{ color: "#374151" }}>{aiDraft}</p>
                <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>
                  💡 발송 시 [학생이름]이 각 학생 이름으로 자동 치환됩니다
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowAI(false); setAiDraft(null); }}
                className="flex-1 py-2.5 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "#6b7280" }}>닫기</button>
              {aiDraft ? (
                <button onClick={applyDraft}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white"
                  style={{ background: "var(--accent)" }}>
                  메시지창에 적용
                </button>
              ) : (
                <button onClick={handleGenerateAI} disabled={aiLoading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}>
                  {aiLoading ? "생성 중..." : "AI 초안 생성"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 그룹 관리 모달 ── */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowGroupModal(false)}>
          <div className="w-full max-w-lg rounded-2xl shadow-xl flex flex-col"
            style={{ background: "var(--card)", maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>그룹 관리</h3>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* 기존 그룹 목록 */}
              {groups.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>기존 그룹</p>
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <div key={g.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl border"
                        style={{ borderColor: "var(--border)" }}>
                        <div>
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{g.name}</span>
                          <span className="text-xs ml-2" style={{ color: "#9ca3af" }}>{g.member_count ?? 0}명</span>
                        </div>
                        <button onClick={() => handleDeleteGroup(g.id)}
                          className="text-xs" style={{ color: "#ef4444" }}>삭제</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 그룹 만들기 */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#9ca3af" }}>새 그룹 만들기</p>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="그룹 이름 (예: 중2 수학반)"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none mb-3"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }}
                />
                <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>학생 선택 ({newGroupMembers.size}명)</p>
                <div className="border rounded-xl overflow-hidden" style={{ borderColor: "var(--border)", maxHeight: "200px", overflowY: "auto" }}>
                  {students.map((s) => {
                    const isMember = newGroupMembers.has(s.id);
                    return (
                      <label key={s.id}
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                        style={{ borderColor: "var(--border)", background: isMember ? "#faf5ff" : undefined }}>
                        <input type="checkbox" checked={isMember}
                          onChange={() => {
                            setNewGroupMembers((prev) => {
                              const n = new Set(prev);
                              n.has(s.id) ? n.delete(s.id) : n.add(s.id);
                              return n;
                            });
                          }}
                          className="w-4 h-4 rounded accent-purple-500" />
                        <span className="text-sm" style={{ color: "var(--foreground)" }}>{s.name}</span>
                        <span className="text-xs" style={{ color: "#9ca3af" }}>{s.grade} · {s.school}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex gap-2 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
              <button onClick={() => { setShowGroupModal(false); setNewGroupName(""); setNewGroupMembers(new Set()); }}
                className="flex-1 py-2.5 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "#6b7280" }}>닫기</button>
              <button
                onClick={handleCreateGroup}
                disabled={groupLoading || !newGroupName.trim() || newGroupMembers.size === 0}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "var(--accent)" }}>
                {groupLoading ? "생성 중..." : `그룹 만들기 (${newGroupMembers.size}명)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
