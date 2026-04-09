"use client";

import { useEffect, useState } from "react";
import { Button, Modal, Form, Input, Select, Popconfirm, Tag, Badge, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { createEvent, deleteEvent, getEvents } from "@/lib/api";

const { Text } = Typography;

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
const TYPE_ANTD_COLORS: Record<string, string> = {
  시험: "error", 수업: "purple", 상담: "warning", 기타: "default", 휴원: "success",
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
  const [addForm] = Form.useForm();
  const [addLoading, setAddLoading] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<ApiEvent | null>(null);

  useEffect(() => {
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

  const todayStr = now.toISOString().slice(0, 10);

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

  async function handleAddEvent(values: { title: string; type: string }) {
    if (!addingDate) return;
    setAddLoading(true);
    try {
      await createEvent({ title: values.title.trim(), date: addingDate, type: values.type, description: "" });
      const updated = await getEvents();
      setEvents(updated);
      setAddingDate(null);
      addForm.resetFields();
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
    <div style={{ padding: 32 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>일정 관리</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {TYPES.map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[t], display: "inline-block" }} />
              <Text type="secondary" style={{ fontSize: 12 }}>{t}</Text>
            </div>
          ))}
        </div>
      </div>

      {/* 월 네비게이션 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Button icon={<LeftOutlined />} shape="circle" size="small" onClick={prevMonth} />
        <Text strong style={{ fontSize: 16, minWidth: 100, textAlign: "center" }}>
          {currentYear}년 {MONTHS[currentMonth]}
        </Text>
        <Button icon={<RightOutlined />} shape="circle" size="small" onClick={nextMonth} />
      </div>

      {/* 캘린더 그리드 */}
      <div style={{ borderRadius: 12, border: "1px solid #f0f0f0", overflow: "hidden", background: "#fff" }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f0f0f0" }}>
          {["일", "월", "화", "수", "목", "금", "토"].map((d, i) => (
            <div key={d} style={{
              padding: "12px 0",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: i === 0 ? "#ef4444" : i === 6 ? "#6366f1" : "#6b7280",
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 rows */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #f0f0f0" }}>
            {week.map((day, di) => {
              const dayEvents = day ? eventsForDay(day) : [];
              const isToday = day !== null && dateStr(day) === todayStr;
              return (
                <div
                  key={di}
                  style={{
                    minHeight: 96,
                    padding: 8,
                    borderRight: di < 6 ? "1px solid #f0f0f0" : "none",
                    cursor: day ? "pointer" : "default",
                    background: !day ? "#fafafa" : undefined,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { if (day) (e.currentTarget as HTMLElement).style.background = "#f5f3ff"; }}
                  onMouseLeave={(e) => { if (day) (e.currentTarget as HTMLElement).style.background = ""; }}
                  onClick={() => day && setAddingDate(dateStr(day))}
                >
                  {day && (
                    <>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        fontSize: 12,
                        fontWeight: isToday ? 700 : 400,
                        background: isToday ? "#7c6af7" : "transparent",
                        color: isToday ? "#fff" : di === 0 ? "#ef4444" : di === 6 ? "#6366f1" : "#374151",
                      }}>
                        {day}
                      </span>
                      <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayEvents.slice(0, 3).map((e) => (
                          <div
                            key={e.id}
                            style={{
                              fontSize: 11,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: (TYPE_COLORS[e.type] ?? e.color ?? "#6b7280") + "20",
                              color: TYPE_COLORS[e.type] ?? e.color ?? "#6b7280",
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                            }}
                            onClick={(ev) => { ev.stopPropagation(); setSelectedEvent(e); }}
                          >
                            {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <Text type="secondary" style={{ fontSize: 11 }}>+{dayEvents.length - 3}개</Text>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* 일정 추가 Modal */}
      <Modal
        title={`일정 추가 — ${addingDate?.replace(/-/g, ".") ?? ""}`}
        open={!!addingDate}
        onCancel={() => { setAddingDate(null); addForm.resetFields(); }}
        footer={null}
        width={360}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddEvent}
          requiredMark={false}
          initialValues={{ type: "수업" }}
          style={{ marginTop: 16 }}
        >
          <Form.Item label="일정 제목" name="title" rules={[{ required: true, message: "제목을 입력해주세요" }]}>
            <Input placeholder="일정 내용을 입력하세요" />
          </Form.Item>
          <Form.Item label="유형" name="type">
            <Select
              options={TYPES.map((t) => ({
                value: t,
                label: (
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: TYPE_COLORS[t], display: "inline-block" }} />
                    {t}
                  </span>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <Button style={{ flex: 1 }} onClick={() => { setAddingDate(null); addForm.resetFields(); }}>취소</Button>
              <Button type="primary" htmlType="submit" loading={addLoading} style={{ flex: 1 }}>추가</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 일정 상세 Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: TYPE_COLORS[selectedEvent?.type ?? ""] ?? "#6b7280", display: "inline-block" }} />
            <Tag color={TYPE_ANTD_COLORS[selectedEvent?.type ?? ""] ?? "default"}>{selectedEvent?.type}</Tag>
          </div>
        }
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={
          <div style={{ display: "flex", gap: 8 }}>
            <Popconfirm
              title="일정을 삭제하시겠습니까?"
              onConfirm={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
              okText="삭제"
              cancelText="취소"
              okButtonProps={{ danger: true }}
            >
              <Button danger style={{ flex: 1 }}>삭제</Button>
            </Popconfirm>
            <Button type="primary" style={{ flex: 1 }} onClick={() => setSelectedEvent(null)}>닫기</Button>
          </div>
        }
        width={320}
      >
        {selectedEvent && (
          <>
            <Text strong style={{ fontSize: 16 }}>{selectedEvent.title}</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{selectedEvent.event_date}</Text>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
