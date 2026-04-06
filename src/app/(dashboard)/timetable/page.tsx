"use client";

import { useEffect, useState } from "react";
import { createSchedule, deleteSchedule, getSchedules } from "@/lib/api";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
type Day = (typeof DAYS)[number];

const CLASS_COLORS = ["#7c6af7", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];

type Schedule = {
  id: string;
  class_name?: string;
  day_of_week: string;
  start_time: string | number;
  end_time: string | number;
  room?: string;
  color?: string;
};

const HOUR_START = 9;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const PX_PER_MIN = 1.5;

// 시간 선택 옵션 (9:00 ~ 22:30, 30분 단위)
const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

// timedelta → 초(number) 또는 "HH:MM[:SS]" 문자열 모두 처리
function toMin(time: string | number | null | undefined): number {
  if (time == null) return 0;
  if (typeof time === "number") return Math.floor(time / 60);  // 초 → 분
  if (typeof time !== "string" || !time.includes(":")) return 0;
  const parts = time.split(":");
  return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
}

function formatTime(time: string | number | null | undefined): string {
  if (time == null) return "";
  const min = toMin(time);
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h === 0 ? 12 : h <= 12 ? h : h - 12;
  return `${ampm} ${hour}:${String(m).padStart(2, "0")}`;
}

function hasOverlap(day: string, newStart: string, newEnd: string, schedules: Schedule[], excludeId?: string): boolean {
  const ns = toMin(newStart);
  const ne = toMin(newEnd);
  return (schedules).some((s) => {
    if (s.day_of_week !== day) return false;
    if (excludeId && s.id === excludeId) return false;
    const ss = toMin(s.start_time);
    const se = toMin(s.end_time);
    return ns < se && ne > ss;
  });
}

const DEFAULT_FORM = { class_name: "", start_time: "15:00", end_time: "16:30", room: "", color: CLASS_COLORS[0] };

export default function TimetablePage() {
  const [byDay, setByDay] = useState<Record<string, Schedule[]>>(
    Object.fromEntries(DAYS.map((d) => [d, []]))
  );
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<Day | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [overlapError, setOverlapError] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await getSchedules();
      const flat: Schedule[] = [];
      const mapped = Object.fromEntries(
        DAYS.map((d) => {
          const list = (data[d] ?? []) as Schedule[];
          flat.push(...list);
          return [d, list];
        })
      );
      setByDay(mapped);
      setAllSchedules(flat);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // 종료 시간 옵션: 시작 시간보다 늦은 것만
  const endOptions = TIME_OPTIONS.filter((t) => toMin(t) > toMin(form.start_time));

  // start_time 바뀌면 end_time이 유효하지 않을 때 자동 조정
  function handleStartChange(val: string) {
    const nextEnd = toMin(form.end_time) > toMin(val) ? form.end_time : endOptions.find((t) => toMin(t) > toMin(val)) ?? val;
    setForm((f) => ({ ...f, start_time: val, end_time: nextEnd }));
    setOverlapError(false);
  }

  async function handleAdd() {
    if (!form.class_name.trim() || !adding) return;
    if (hasOverlap(adding, form.start_time, form.end_time, allSchedules)) {
      setOverlapError(true);
      return;
    }
    setAddLoading(true);
    try {
      await createSchedule({
        day_of_week: adding,
        start_time: form.start_time,
        end_time: form.end_time,
        class_name: form.class_name.trim(),
        room: form.room.trim() || undefined,
        color: form.color,
      });
      await load();
      setAdding(null);
      setForm(DEFAULT_FORM);
      setOverlapError(false);
    } catch {
      // silent
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDelete(id: string, day: string) {
    await deleteSchedule(id).catch(() => {});
    setByDay((prev) => ({ ...prev, [day]: (prev[day] ?? []).filter((s) => s.id !== id) }));
    setAllSchedules((prev) => prev.filter((s) => s.id !== id));
  }

  const gridHeight = (HOUR_END - HOUR_START) * 60 * PX_PER_MIN;

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="p-8">
        <div className="flex items-center justify-between mb-6 no-print">
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>시간표 관리</h1>
            <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>요일 헤더의 + 버튼으로 수업을 추가하세요</p>
          </div>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border no-print"
            style={{ borderColor: "var(--border)", color: "#6b7280" }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            인쇄 / PDF
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-center py-10" style={{ color: "#9ca3af" }}>불러오는 중...</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "#fff" }}>
            {/* 요일 헤더 */}
            <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
              <div className="w-14 flex-shrink-0 border-r py-3" style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              {DAYS.map((day) => (
                <div key={day} className="flex-1 flex items-center justify-between px-3 py-3 border-r last:border-r-0"
                  style={{
                    borderColor: "var(--border)",
                    background: day === "토" || day === "일" ? "#fafafa" : "#fff",
                  }}>
                  <span className="text-sm font-semibold"
                    style={{ color: day === "일" ? "#ef4444" : day === "토" ? "#6366f1" : "var(--foreground)" }}>
                    {day}
                  </span>
                  <button
                    onClick={() => { setAdding(day); setForm(DEFAULT_FORM); setOverlapError(false); }}
                    className="no-print w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "var(--accent)" }}>
                    +
                  </button>
                </div>
              ))}
            </div>

            {/* 시간 그리드 */}
            <div className="flex overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
              {/* 시간축 */}
              <div className="w-14 flex-shrink-0 relative border-r"
                style={{ height: gridHeight, borderColor: "var(--border)", background: "#fafafa" }}>
                {HOURS.map((h) => (
                  <div key={h} className="absolute left-0 right-0 flex items-start justify-end pr-2"
                    style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN, height: 60 * PX_PER_MIN }}>
                    <span className="text-xs leading-none mt-[-6px]" style={{ color: "#9ca3af" }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* 요일 컬럼 */}
              {DAYS.map((day) => (
                <div key={day} className="flex-1 relative border-r last:border-r-0"
                  style={{
                    height: gridHeight,
                    borderColor: "var(--border)",
                    background: day === "토" || day === "일" ? "#fafafa" : "#fff",
                  }}>
                  {/* 시간 눈금선 */}
                  {HOURS.map((h) => (
                    <div key={h} className="absolute left-0 right-0 border-t"
                      style={{
                        top: (h - HOUR_START) * 60 * PX_PER_MIN,
                        borderColor: h % 2 === 0 ? "#e5e7eb" : "#f3f4f6",
                      }} />
                  ))}

                  {/* 수업 블록 */}
                  {(byDay[day] ?? []).map((s) => {
                    const startMin = toMin(s.start_time);
                    const endMin = toMin(s.end_time);
                    const top = (startMin - HOUR_START * 60) * PX_PER_MIN;
                    const height = Math.max((endMin - startMin) * PX_PER_MIN, 24);
                    return (
                      <div key={s.id}
                        className="group absolute left-1 right-1 rounded-lg text-white text-xs overflow-hidden"
                        style={{ top, height, background: s.color ?? "#7c6af7", zIndex: 1 }}>
                        <div className="p-1.5 h-full flex flex-col">
                          <p className="font-semibold leading-tight pr-4 truncate">{s.class_name ?? "-"}</p>
                          {height > 36 && (
                            <p className="opacity-80 mt-0.5 text-[10px]">{formatTime(s.start_time)}~{formatTime(s.end_time)}</p>
                          )}
                          {s.room && height > 52 && (
                            <p className="opacity-70 text-[10px] truncate">{s.room}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(s.id, day)}
                          className="no-print absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "rgba(0,0,0,0.3)" }}>
                          <svg width="7" height="7" fill="none" viewBox="0 0 24 24">
                            <path d="M18 6 6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 수업 추가 모달 */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setAdding(null)}>
          <div className="w-80 rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>{adding}요일 수업 추가</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>수업명 *</label>
                <input type="text" value={form.class_name}
                  onChange={(e) => { setForm((f) => ({ ...f, class_name: e.target.value })); setOverlapError(false); }}
                  placeholder="예) 중2 수학 심화반"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              </div>

              {/* 시간 선택 — 셀렉트 박스 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>시작 시간</label>
                  <select value={form.start_time}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: "var(--border)", background: "#fafafa" }}>
                    {TIME_OPTIONS.slice(0, -1).map((t) => (
                      <option key={t} value={t}>{timeLabel(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>종료 시간</label>
                  <select value={form.end_time}
                    onChange={(e) => { setForm((f) => ({ ...f, end_time: e.target.value })); setOverlapError(false); }}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: overlapError ? "#ef4444" : "var(--border)", background: "#fafafa" }}>
                    {endOptions.map((t) => (
                      <option key={t} value={t}>{timeLabel(t)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 겹침 오류 */}
              {overlapError && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ color: "#ef4444", background: "#fef2f2" }}>
                  이 시간대에 이미 다른 수업이 있습니다.
                </p>
              )}

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>강의실 (선택)</label>
                <input type="text" value={form.room}
                  onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                  placeholder="예) A반"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "#374151" }}>색상</label>
                <div className="flex gap-2">
                  {CLASS_COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        background: c,
                        transform: form.color === c ? "scale(1.25)" : "scale(1)",
                        outline: form.color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => { setAdding(null); setOverlapError(false); }}
                className="flex-1 py-2.5 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)", color: "#6b7280" }}>취소</button>
              <button onClick={handleAdd} disabled={addLoading || !form.class_name.trim()}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                {addLoading ? "저장 중..." : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
