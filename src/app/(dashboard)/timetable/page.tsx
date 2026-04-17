"use client";

import { useEffect, useState } from "react";
import { Modal, Form, Input, Select, Alert, Button, Typography } from "antd";
import { PrinterOutlined, PlusOutlined } from "@ant-design/icons";
import { createSchedule, deleteSchedule, getSchedules } from "@/lib/api";

const { Text } = Typography;

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
const PX_PER_MIN = 0.9;

const TIME_OPTIONS: string[] = [];
for (let h = 9; h <= 22; h++) {
  for (const m of [0, 30]) {
    if (h === 22 && m === 30) break;
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

function toMin(time: string | number | null | undefined): number {
  if (time == null) return 0;
  if (typeof time === "number") return Math.floor(time / 60);
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

function hasOverlap(day: string, newStart: string, newEnd: string, schedules: Schedule[]): boolean {
  const ns = toMin(newStart);
  const ne = toMin(newEnd);
  return schedules.some((s) => {
    if (s.day_of_week !== day) return false;
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

  const endOptions = TIME_OPTIONS.filter((t) => toMin(t) > toMin(form.start_time));

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
          body { background: white !important; margin: 0 !important; }
          @page { size: A4 landscape; margin: 10mm; }
          .timetable-scroll { overflow: visible !important; max-height: none !important; }
          .timetable-wrap { border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div style={{ padding: 32 }}>
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>시간표 관리</h1>
            <Text type="secondary" style={{ fontSize: 13 }}>요일 헤더의 + 버튼으로 수업을 추가하세요</Text>
          </div>
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>인쇄 / PDF</Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>불러오는 중...</div>
        ) : (
          <div className="timetable-wrap" style={{ borderRadius: 12, border: "1px solid #e5e5e5", overflow: "hidden", background: "#fff" }}>
            {/* 요일 헤더 */}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
              <div style={{ width: 56, flexShrink: 0, borderRight: "1px solid #e5e5e5", padding: "12px 0", background: "#fafafa" }} />
              {DAYS.map((day) => (
                <div key={day} style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px",
                  borderRight: "1px solid #e5e5e5",
                  background: day === "토" || day === "일" ? "#fafafa" : "#fff",
                }}>
                  <Text strong style={{
                    color: day === "일" ? "#ef4444" : day === "토" ? "#6366f1" : "#1a1a1a",
                  }}>
                    {day}
                  </Text>
                  <Button
                    type="primary"
                    shape="circle"
                    size="small"
                    icon={<PlusOutlined />}
                    className="no-print"
                    onClick={() => { setAdding(day); setForm(DEFAULT_FORM); setOverlapError(false); }}
                  />
                </div>
              ))}
            </div>

            {/* 시간 그리드 */}
            <div className="timetable-scroll" style={{ display: "flex", overflowY: "auto", maxHeight: "calc(100vh - 240px)" }}>
              {/* 시간축 */}
              <div style={{ width: 56, flexShrink: 0, position: "relative", borderRight: "1px solid #e5e5e5", height: gridHeight, background: "#fafafa" }}>
                {HOURS.map((h) => (
                  <div key={h} style={{
                    position: "absolute", left: 0, right: 0,
                    top: (h - HOUR_START) * 60 * PX_PER_MIN,
                    height: 60 * PX_PER_MIN,
                    display: "flex", alignItems: "flex-start", justifyContent: "flex-end",
                    paddingRight: 6,
                  }}>
                    <span style={{ fontSize: 11, color: "#9ca3af", marginTop: -6 }}>
                      {String(h).padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* 요일 컬럼 */}
              {DAYS.map((day) => (
                <div key={day} style={{
                  flex: 1, position: "relative",
                  height: gridHeight,
                  borderRight: "1px solid #e5e5e5",
                  background: day === "토" || day === "일" ? "#fafafa" : "#fff",
                }}>
                  {HOURS.map((h) => (
                    <div key={h} style={{
                      position: "absolute", left: 0, right: 0,
                      top: (h - HOUR_START) * 60 * PX_PER_MIN,
                      borderTop: `1px solid ${h % 2 === 0 ? "#e5e7eb" : "#f3f4f6"}`,
                    }} />
                  ))}

                  {(byDay[day] ?? []).map((s) => {
                    const startMin = toMin(s.start_time);
                    const endMin = toMin(s.end_time);
                    const top = (startMin - HOUR_START * 60) * PX_PER_MIN;
                    const height = Math.max((endMin - startMin) * PX_PER_MIN, 18);
                    return (
                      <div key={s.id}
                        className="group"
                        style={{
                          position: "absolute", left: 4, right: 4,
                          top, height,
                          background: s.color ?? "#7c6af7",
                          borderRadius: 8,
                          overflow: "hidden",
                          color: "#fff",
                          fontSize: 11,
                          zIndex: 1,
                        }}>
                        <div style={{ padding: "6px", height: "100%", display: "flex", flexDirection: "column" }}>
                          <p style={{ fontWeight: 600, lineHeight: 1.2, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 16 }}>
                            {s.class_name ?? "-"}
                          </p>
                          {height > 28 && (
                            <p style={{ opacity: 0.8, margin: "2px 0 0", fontSize: 10 }}>
                              {formatTime(s.start_time)}~{formatTime(s.end_time)}
                            </p>
                          )}
                          {s.room && height > 52 && (
                            <p style={{ opacity: 0.7, fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {s.room}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(s.id, day)}
                          className="no-print"
                          style={{
                            position: "absolute", top: 4, right: 4,
                            width: 16, height: 16,
                            borderRadius: "50%",
                            background: "rgba(0,0,0,0.3)",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                          }}>
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

      {/* 수업 추가 Modal */}
      <Modal
        title={`${adding}요일 수업 추가`}
        open={!!adding}
        onCancel={() => { setAdding(null); setOverlapError(false); }}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Button style={{ flex: 1 }} onClick={() => { setAdding(null); setOverlapError(false); }}>취소</Button>
            <Button
              type="primary"
              style={{ flex: 1 }}
              loading={addLoading}
              disabled={!form.class_name.trim()}
              onClick={handleAdd}
            >
              추가
            </Button>
          </div>
        }
        width={360}
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="수업명" required>
            <Input
              value={form.class_name}
              onChange={(e) => { setForm((f) => ({ ...f, class_name: e.target.value })); setOverlapError(false); }}
              placeholder="예) 중2 수학 심화반"
            />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item label="시작 시간">
              <Select
                value={form.start_time}
                onChange={handleStartChange}
                options={TIME_OPTIONS.slice(0, -1).map((t) => ({ value: t, label: timeLabel(t) }))}
              />
            </Form.Item>
            <Form.Item label="종료 시간">
              <Select
                value={form.end_time}
                onChange={(val) => { setForm((f) => ({ ...f, end_time: val })); setOverlapError(false); }}
                options={endOptions.map((t) => ({ value: t, label: timeLabel(t) }))}
                status={overlapError ? "error" : undefined}
              />
            </Form.Item>
          </div>

          {overlapError && (
            <Alert type="error" message="이 시간대에 이미 다른 수업이 있습니다." showIcon style={{ marginBottom: 12 }} />
          )}

          <Form.Item label="강의실 (선택)">
            <Input
              value={form.room}
              onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
              placeholder="예) A반"
            />
          </Form.Item>

          <Form.Item label="색상">
            <div style={{ display: "flex", gap: 8 }}>
              {CLASS_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  style={{
                    width: 28, height: 28,
                    borderRadius: "50%",
                    background: c,
                    border: "none",
                    cursor: "pointer",
                    transform: form.color === c ? "scale(1.25)" : "scale(1)",
                    outline: form.color === c ? `2px solid ${c}` : "none",
                    outlineOffset: 2,
                    transition: "transform 0.15s",
                  }}
                />
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
