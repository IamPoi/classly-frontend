"use client";

import { useEffect, useState } from "react";
import { createEvent, deleteEvent, getEvents } from "@/lib/api";

type ApiEvent = {
  id: string;
  event_date: string;
  title: string;
  type: string;
  color: string;
  description?: string;
};

const TYPE_COLORS: Record<string, string> = {
  시험: "#ef4444", 수업: "#7c6af7", 상담: "#f59e0b", 기타: "#6b7280", 휴원: "#10b981",
};
const TYPES = ["시험", "수업", "상담", "휴원", "기타"];
const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

export default function CalendarPage() {
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [addingDate, setAddingDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("수업");
  const [addLoading, setAddLoading] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  useEffect(() => {
    setLoading(true);
    getEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  function dateStr(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function eventsForDay(day: number) {
    return events.filter((e) => e.event_date === dateStr(day));
  }

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  }

  async function handleAddEvent() {
    if (!newTitle.trim() || !addingDate) return;
    setAddLoading(true);
    try {
      await createEvent({
        title: newTitle.trim(),
        date: addingDate,
        type: newType,
        description: "",
      });
      const updated = await getEvents();
      setEvents(updated);
      setNewTitle("");
      setAddingDate(null);
    } catch {
      // silent
    } finally {
      setAddLoading(false);
    }
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id).catch(() => {});
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelectedEvent(null);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>일정 관리</h1>
        <div className="flex items-center gap-3">
          {TYPES.map((t) => (
            <div key={t} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
              <span className="text-xs" style={{ color: "#6b7280" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Month Nav */}
      <div className="flex items-center gap-4 mb-5">
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-50"
          style={{ borderColor: "var(--border)" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
          {currentYear}년 {MONTHS[currentMonth]}
        </h2>
        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-gray-50"
          style={{ borderColor: "var(--border)" }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "#fff" }}>
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} className="py-3 text-center text-xs font-semibold"
              style={{ color: i === 0 ? "#ef4444" : i === 6 ? "#6366f1" : "#6b7280" }}>
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border)" }}>
            {week.map((day, di) => {
              const dayEvents = day ? eventsForDay(day) : [];
              const isToday = day !== null && dateStr(day) === todayStr;
              return (
                <div key={di}
                  className="min-h-24 p-2 border-r last:border-r-0 cursor-pointer hover:bg-purple-50 transition-colors"
                  style={{ borderColor: "var(--border)", background: !day ? "#fafafa" : undefined }}
                  onClick={() => day && setAddingDate(dateStr(day))}>
                  {day && (
                    <>
                      <span className={`text-xs font-medium inline-flex w-6 h-6 items-center justify-center rounded-full ${isToday ? "text-white" : ""}`}
                        style={{
                          background: isToday ? "var(--accent)" : "transparent",
                          color: isToday ? "#fff" : di === 0 ? "#ef4444" : di === 6 ? "#6366f1" : "#374151",
                        }}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.map((e) => (
                          <div key={e.id}
                            className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer"
                            style={{
                              background: (TYPE_COLORS[e.type] ?? e.color ?? "#6b7280") + "20",
                              color: TYPE_COLORS[e.type] ?? e.color ?? "#6b7280",
                              fontWeight: 500,
                            }}
                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}>
                            {e.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {loading && (
        <p className="text-center text-sm mt-4" style={{ color: "#9ca3af" }}>일정 불러오는 중...</p>
      )}

      {/* Add Event Modal */}
      {addingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setAddingDate(null)}>
          <div className="w-80 rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>일정 추가</h3>
            <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>
              {addingDate.replace(/-/g, "년 ").replace(/년 (\d+)년 /, "년 $1월 ")}일
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>일정 제목</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="일정 내용을 입력하세요"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }}
                  onKeyDown={(e) => e.key === "Enter" && handleAddEvent()} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#374151" }}>유형</label>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <button key={t} onClick={() => setNewType(t)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: newType === t ? TYPE_COLORS[t] : TYPE_COLORS[t] + "18",
                        color: newType === t ? "#fff" : TYPE_COLORS[t],
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setAddingDate(null)}
                  className="flex-1 py-2 rounded-lg text-sm border"
                  style={{ borderColor: "var(--border)", color: "#6b7280" }}>취소</button>
                <button onClick={handleAddEvent} disabled={addLoading}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}>
                  {addLoading ? "저장 중..." : "추가"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setSelectedEvent(null)}>
          <div className="w-72 rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--card)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full"
                style={{ background: TYPE_COLORS[selectedEvent.type] ?? selectedEvent.color }} />
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: (TYPE_COLORS[selectedEvent.type] ?? selectedEvent.color) + "18",
                  color: TYPE_COLORS[selectedEvent.type] ?? selectedEvent.color,
                }}>
                {selectedEvent.type}
              </span>
            </div>
            <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{selectedEvent.title}</p>
            <p className="text-sm" style={{ color: "#9ca3af" }}>{selectedEvent.event_date}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleDeleteEvent(selectedEvent.id)}
                className="flex-1 py-2 rounded-lg text-sm border"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}>삭제</button>
              <button onClick={() => setSelectedEvent(null)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: "var(--accent)" }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
