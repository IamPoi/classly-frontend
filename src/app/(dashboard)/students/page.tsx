"use client";

import { useEffect, useRef, useState } from "react";
import StudentDetailModal, { ApiStudent } from "@/components/StudentDetailModal";
import { createStudent, deleteStudent, generateInviteCode, getStudents } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function StudentsPage() {
  const [students, setStudents] = useState<ApiStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ApiStudent | null>(null);
  const [nameSearch, setNameSearch] = useState("");
  const [schoolSearch, setSchoolSearch] = useState("");
  const [schoolFocus, setSchoolFocus] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("전체");

  // 학생 추가 모달
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", school: "", grade: "", phone: "",
    parent_name: "", parent_phone: "", subject: "",
    parent_relation: "모",
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // 엑셀 업로드
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<{ created: number; skipped: number } | null>(null);

  // 초대 코드
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 관심 필터
  const [watchFilter, setWatchFilter] = useState(false);

  useEffect(() => {
    getStudents().then(setStudents).finally(() => setLoading(false));
  }, []);

  // 학교 자동완성 목록: 입력값 포함하는 고유 학교명
  const schoolSuggestions = schoolFocus && schoolSearch.trim()
    ? Array.from(new Set(students.map((s) => s.school).filter(Boolean) as string[]))
        .filter((s) => s.includes(schoolSearch) && s !== schoolSearch)
        .slice(0, 6)
    : [];

  // 학년 옵션: 학교 검색에 따라 동적으로 변경
  const allGrades = (() => {
    if (schoolSearch.includes("초")) return ["전체", "초1", "초2", "초3", "초4", "초5", "초6"];
    if (schoolSearch.includes("중")) return ["전체", "중1", "중2", "중3"];
    if (schoolSearch.includes("고")) return ["전체", "고1", "고2", "고3"];
    return ["전체", ...Array.from(
      new Set(students.map((s) => s.grade).filter(Boolean) as string[])
    ).sort()];
  })();

  const filtered = students.filter((s) => {
    const matchName = !nameSearch || s.name.includes(nameSearch);
    const matchSchool = !schoolSearch || (s.school ?? "").includes(schoolSearch);
    const matchGrade = gradeFilter === "전체" || s.grade === gradeFilter;
    const matchWatch = !watchFilter || Boolean((s as any).is_watched);
    return matchName && matchSchool && matchGrade && matchWatch;
  });

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    setAddError("");
    try {
      await createStudent(addForm);
      const updated = await getStudents();
      setStudents(updated);
      setShowAdd(false);
      setAddForm({ name: "", school: "", grade: "", phone: "", parent_name: "", parent_phone: "", subject: "", parent_relation: "모" });
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
      alert(err.message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleGenerateCode() {
    try {
      const data = await generateInviteCode();
      setInviteCode(data.invite_url);
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("학생을 삭제하시겠습니까?")) return;
    await deleteStudent(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>학생 관리</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>
            총 {students.length}명 · 필터 결과 {filtered.length}명
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleGenerateCode}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>
            초대 링크 생성
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          <button onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "var(--border)", color: "#6b7280" }}>
            엑셀 업로드
          </button>
          <button onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}>
            + 학생 추가
          </button>
        </div>
      </div>

      {/* 초대 코드 표시 */}
      {inviteCode && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border"
          style={{ borderColor: "#a78bfa", background: "#ede9fe" }}>
          <span className="text-sm flex-1" style={{ color: "var(--accent)" }}>
            초대 링크: <strong>{inviteCode}</strong>
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
            style={{ background: copied ? "#10b981" : "var(--accent)" }}>
            {copied ? "복사됨 ✓" : "복사"}
          </button>
          <button onClick={() => setInviteCode(null)} className="text-xs" style={{ color: "#9ca3af" }}>닫기</button>
        </div>
      )}

      {/* 엑셀 업로드 결과 */}
      {uploadResult && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "#d1fae5" }}>
          <span className="text-sm font-medium" style={{ color: "#059669" }}>
            업로드 완료 — {uploadResult.created}명 등록, {uploadResult.skipped}명 건너뜀
          </span>
          <button onClick={() => setUploadResult(null)} className="text-xs ml-auto" style={{ color: "#059669" }}>닫기</button>
        </div>
      )}

      {/* 관심 학생 탭 */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setWatchFilter(false)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
          style={!watchFilter
            ? { background: "var(--accent)", color: "#fff" }
            : { background: "#f3f4f6", color: "#6b7280" }}>
          전체 {students.length}명
        </button>
        <button onClick={() => setWatchFilter(true)}
          className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
          style={watchFilter
            ? { background: "#f59e0b", color: "#fff" }
            : { background: "#f3f4f6", color: "#6b7280" }}>
          ★ 관심 학생 {students.filter((s) => (s as any).is_watched).length}명
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-5">
        {/* 이름 검색 */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="이름 검색"
            className="pl-8 pr-3 py-2 rounded-lg border text-sm outline-none w-32"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          />
        </div>

        {/* 학교 검색 (자동완성) */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 z-10" width="13" height="13" fill="none" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="9 22 9 12 15 12 15 22" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="text"
            value={schoolSearch}
            onChange={(e) => setSchoolSearch(e.target.value)}
            onFocus={() => setSchoolFocus(true)}
            onBlur={() => setTimeout(() => setSchoolFocus(false), 150)}
            placeholder="학교명 검색"
            className="pl-8 pr-3 py-2 rounded-lg border text-sm outline-none w-40"
            style={{ borderColor: "var(--border)", background: "#fff" }}
          />
          {/* 자동완성 드롭다운 */}
          {schoolSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border shadow-lg z-20 overflow-hidden"
              style={{ background: "#fff", borderColor: "var(--border)" }}>
              {schoolSuggestions.map((school) => (
                <button key={school}
                  onMouseDown={() => { setSchoolSearch(school); setSchoolFocus(false); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-purple-50 transition-colors"
                  style={{ color: "var(--foreground)" }}>
                  {school}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 학년 드롭다운 */}
        <select
          value={gradeFilter}
          onChange={(e) => setGradeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border text-sm outline-none"
          style={{
            borderColor: "var(--border)",
            background: "#fff",
            color: gradeFilter === "전체" ? "#9ca3af" : "var(--foreground)",
          }}>
          {allGrades.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>

        {/* 필터 초기화 */}
        {(nameSearch || schoolSearch || gradeFilter !== "전체") && (
          <button
            onClick={() => { setNameSearch(""); setSchoolSearch(""); setGradeFilter("전체"); }}
            className="text-xs px-3 py-2 rounded-lg border"
            style={{ borderColor: "var(--border)", color: "#9ca3af" }}>
            초기화
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-sm py-10 text-center" style={{ color: "#9ca3af" }}>불러오는 중...</p>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "#fff" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)`, background: "#fafafa" }}>
                {["이름", "학교", "학년", "학생 전화", "부모님", "부모님 전화", "과목", "아이디", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: "#6b7280" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const parentLabel = s.parent_name
                  ? `${s.parent_name} (${s.parent_relation === "부" ? "아버님" : "어머님"})`
                  : "-";
                return (
                  <tr key={s.id}
                    onClick={() => setSelected(s)}
                    className="border-b hover:bg-purple-50 cursor-pointer transition-colors"
                    style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: "var(--accent)" }}>{s.name[0]}</div>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{s.name}</span>
                        {(s as any).is_watched ? <span style={{ color: "#f59e0b", fontSize: "12px" }}>★</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{s.school ?? "-"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{s.grade ?? "-"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{s.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{parentLabel}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{s.parent_phone ?? "-"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>{s.subject ?? "-"}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "#9ca3af" }}>{s.username ?? "-"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                        className="text-xs" style={{ color: "#ef4444" }}>삭제</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm" style={{ color: "#9ca3af" }}>
                    학생이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 학생 추가 모달 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setShowAdd(false)}>
          <form onSubmit={handleAddStudent}
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>학생 추가</h3>
            <div className="space-y-3">
              {[
                ["이름*", "name", "text", "홍길동"],
                ["학교", "school", "text", "한빛중학교"],
                ["학년", "grade", "text", "중2"],
                ["학생 전화", "phone", "tel", "010-0000-0000"],
                ["부모님 이름", "parent_name", "text", "홍아버지"],
                ["부모님 전화", "parent_phone", "tel", "010-0000-0000"],
                ["과목", "subject", "text", "수학"],
              ].map(([label, field, type, placeholder]) => (
                <div key={field}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>{label}</label>
                  <input
                    type={type}
                    value={(addForm as any)[field]}
                    onChange={(e) => setAddForm((f) => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "#fafafa" }}
                  />
                </div>
              ))}
              {/* 부모님 구분 */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>부모님 구분</label>
                <div className="flex gap-2">
                  {(["모", "부"] as const).map((rel) => (
                    <button key={rel} type="button"
                      onClick={() => setAddForm((f) => ({ ...f, parent_relation: rel }))}
                      className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                      style={{
                        background: addForm.parent_relation === rel ? "var(--accent)" : "#fafafa",
                        color: addForm.parent_relation === rel ? "#fff" : "#6b7280",
                        borderColor: addForm.parent_relation === rel ? "var(--accent)" : "var(--border)",
                      }}>
                      {rel === "모" ? "어머님 (모)" : "아버님 (부)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {addError && <p className="text-xs mt-3 px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>{addError}</p>}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setShowAdd(false)}
                className="flex-1 py-2.5 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "#6b7280" }}>취소</button>
              <button type="submit" disabled={addLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                {addLoading ? "추가 중..." : "추가"}
              </button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <StudentDetailModal
          student={selected}
          onClose={() => setSelected(null)}
          onWatchChange={(id, isWatched) =>
            setStudents((prev) => prev.map((s) => s.id === id ? { ...s, is_watched: isWatched ? 1 : 0 } as any : s))
          }
          onMemoSave={(id, memo) =>
            setStudents((prev) => prev.map((s) => s.id === id ? { ...s, memo } : s))
          }
        />
      )}
    </div>
  );
}
