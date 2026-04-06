"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, getEvents, getWatchedStudents } from "@/lib/api";

function MiniCalendar({ events }: { events: any[] }) {
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const firstDay = new Date(month.year, month.month, 1).getDay();
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const eventDates = new Set(
    events
      .filter((e) => {
        const d = new Date(e.event_date ?? e.date);
        return d.getFullYear() === month.year && d.getMonth() === month.month;
      })
      .map((e) => new Date(e.event_date ?? e.date).getDate())
  );
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const todayDate = now.getFullYear() === month.year && now.getMonth() === month.month ? now.getDate() : -1;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold" style={{ color: "#9ca3af" }}>
          {month.year}년 {month.month + 1}월
        </p>
        <div className="flex gap-1">
          <button onClick={() => setMonth((m) => { const d = new Date(m.year, m.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ color: "#9ca3af" }}>‹</button>
          <button onClick={() => setMonth((m) => { const d = new Date(m.year, m.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
            className="w-5 h-5 flex items-center justify-center rounded text-xs" style={{ color: "#9ca3af" }}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="text-xs py-1 font-medium" style={{ color: "#9ca3af" }}>{d}</div>
        ))}
        {weeks.map((week, wi) =>
          week.map((day, di) => (
            <div key={`${wi}-${di}`} className="relative flex flex-col items-center py-1">
              <span className="w-6 h-6 flex items-center justify-center rounded-full text-xs"
                style={{
                  background: day === todayDate ? "var(--accent)" : "transparent",
                  color: day === todayDate ? "#fff" : day ? "var(--foreground)" : "transparent",
                  fontWeight: day === todayDate ? 700 : 400,
                }}>
                {day ?? ""}
              </span>
              {day && eventDates.has(day) && (
                <span className="w-1 h-1 rounded-full mt-0.5" style={{ background: "#ef4444" }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const typeColor: Record<string, string> = {
  시험: "#ef4444", 수업: "#7c6af7", 상담: "#f59e0b", 기타: "#6b7280", 휴원: "#10b981",
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [watchedStudents, setWatchedStudents] = useState<any[]>([]);
  const [todayDisplay, setTodayDisplay] = useState("");

  useEffect(() => {
    getDashboard().then(setData).catch(() => {});
    getEvents().then(setEvents).catch(() => {});
    getWatchedStudents().then(setWatchedStudents).catch(() => {});
    setTodayDisplay(new Date().toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    }));
  }, []);

  const todayEvents = data?.today_events ?? [];
  const attendanceRate = data?.attendance_rate;

  const upcomingEvents = events
    .filter((e) => (e.event_date ?? e.date) > new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.event_date ?? a.date).localeCompare(b.event_date ?? b.date))
    .slice(0, 3);

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>안녕하세요, 선생님 👋</h1>
        <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>{todayDisplay}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* 오늘 일정 */}
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>오늘 일정</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#ede9fe", color: "var(--accent)" }}>
              {todayEvents.length}건
            </span>
          </div>
          {todayEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "#9ca3af" }}>오늘 등록된 일정이 없어요.</p>
          ) : (
            <ul className="space-y-2">
              {todayEvents.map((e: any) => (
                <li key={e.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: typeColor[e.event_type ?? e.type] ?? "#6b7280" }} />
                  <span className="text-sm truncate" style={{ color: "#374151" }}>{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 이번 주 출석률 */}
        <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>이번 주 출석률</p>
          {attendanceRate !== null && attendanceRate !== undefined ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{attendanceRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "#e5e5e5" }}>
                <div className="h-2 rounded-full transition-all" style={{ background: "var(--accent)", width: `${attendanceRate}%` }} />
              </div>
              <p className="text-xs mt-2" style={{ color: "#9ca3af" }}>총 {data?.attendance_total ?? 0}건 기준</p>
            </>
          ) : (
            <p className="text-sm" style={{ color: "#9ca3af" }}>출석 데이터가 없습니다.</p>
          )}
        </div>
      </div>

      {/* 관심 학생 위젯 */}
      {watchedStudents.length > 0 && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>⭐ 관심 학생</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#fef3c7", color: "#d97706" }}>
                {watchedStudents.length}명
              </span>
            </div>
            <Link href="/students" className="text-xs" style={{ color: "var(--accent)" }}>전체 보기 →</Link>
          </div>
          <div className="space-y-2">
            {watchedStudents.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "#f59e0b" }}>{s.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{s.name}</p>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {s.grade} · {s.watch_reason ?? "관심 학생"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {s.attendance_rate !== null && s.attendance_rate !== undefined ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={s.attendance_rate >= 80
                        ? { background: "#d1fae5", color: "#059669" }
                        : s.attendance_rate >= 60
                        ? { background: "#fef3c7", color: "#d97706" }
                        : { background: "#fee2e2", color: "#ef4444" }}>
                      출석률 {s.attendance_rate}%
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "#d1d5db" }}>출석 없음</span>
                  )}
                  {s.last_log_at && (
                    <p className="text-xs mt-0.5" style={{ color: "#d1d5db" }}>
                      최근 상담 {new Date(s.last_log_at).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 달력 */}
      <div className="rounded-xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>달력</span>
          <Link href="/calendar" className="text-xs" style={{ color: "var(--accent)" }}>전체 보기 →</Link>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <MiniCalendar events={events} />
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: "#9ca3af" }}>다가오는 일정</p>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm" style={{ color: "#9ca3af" }}>예정된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((e: any) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: typeColor[e.event_type ?? e.type] ?? "#6b7280" }} />
                    <span className="text-sm flex-1 truncate" style={{ color: "#374151" }}>{e.title}</span>
                    <span className="text-xs flex-shrink-0" style={{ color: "#9ca3af" }}>
                      {(e.event_date ?? e.date ?? "").slice(5).replace("-", "/")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
