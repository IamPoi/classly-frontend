"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Row, Col, Progress, Badge, Typography, Tag, Avatar, List, Calendar, Button } from "antd";
import { PlusOutlined, QrcodeOutlined, MessageOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { getDashboard, getEvents, getWatchedStudents } from "@/lib/api";

const { Title, Text } = Typography;

const typeColor: Record<string, string> = {
  시험: "red",
  수업: "purple",
  상담: "orange",
  기타: "default",
  휴원: "green",
};

const typeDotColor: Record<string, string> = {
  시험: "#ef4444",
  수업: "#7c6af7",
  상담: "#f59e0b",
  기타: "#6b7280",
  휴원: "#10b981",
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
    setTodayDisplay(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      })
    );
  }, []);

  const todayEvents = data?.today_events ?? [];
  const attendanceRate = data?.attendance_rate;

  const upcomingEvents = events
    .filter((e) => (e.event_date ?? e.date) > new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.event_date ?? a.date).localeCompare(b.event_date ?? b.date))
    .slice(0, 5);

  // Calendar dateCellRender
  function dateCellRender(value: Dayjs) {
    const dateStr = value.format("YYYY-MM-DD");
    const dayEvents = events.filter((e) => (e.event_date ?? e.date) === dateStr);
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {dayEvents.slice(0, 2).map((e) => (
          <li key={e.id}>
            <Badge
              color={typeDotColor[e.event_type ?? e.type] ?? "#6b7280"}
              text={
                <span style={{ fontSize: 11, color: "#374151" }}>{e.title}</span>
              }
            />
          </li>
        ))}
        {dayEvents.length > 2 && (
          <li>
            <Text style={{ fontSize: 11, color: "#9ca3af" }}>+{dayEvents.length - 2}개</Text>
          </li>
        )}
      </ul>
    );
  }

  return (
    <div style={{ padding: 32, maxWidth: 1100 }}>
      <style>{`
        .dashboard-calendar .ant-picker-cell-inner {
          height: 60px !important;
          overflow: hidden;
        }
        .dashboard-calendar .ant-picker-calendar-date-content {
          height: 38px !important;
          overflow: hidden;
        }
      `}</style>
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <Title level={4} style={{ marginBottom: 4 }}>안녕하세요, 선생님 👋</Title>
        <Text type="secondary">{todayDisplay}</Text>
      </div>

      {/* 상단 위젯 2열 */}
      <Row gutter={20} style={{ marginBottom: 20 }}>
        {/* 오늘 일정 */}
        <Col span={12}>
          <Card
            title={
              <span>
                오늘 일정{" "}
                <Tag color="purple" style={{ fontSize: 11, marginLeft: 4 }}>
                  {todayEvents.length}건
                </Tag>
              </span>
            }
            bordered
            style={{ height: "100%" }}
          >
            {todayEvents.length === 0 ? (
              <Text type="secondary">오늘 등록된 일정이 없어요.</Text>
            ) : (
              <List
                dataSource={todayEvents}
                renderItem={(e: any) => (
                  <List.Item style={{ padding: "6px 0", borderBottom: "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: typeDotColor[e.event_type ?? e.type] ?? "#6b7280",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <Text style={{ fontSize: 14 }}>{e.title}</Text>
                    </div>
                  </List.Item>
                )}
                split={false}
              />
            )}
          </Card>
        </Col>

        {/* 이번 주 출석률 */}
        <Col span={12}>
          <Card title="이번 주 출석률" bordered style={{ height: "100%" }}>
            {attendanceRate !== null && attendanceRate !== undefined ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "#7c6af7", lineHeight: 1 }}>
                    {attendanceRate}%
                  </span>
                </div>
                <Progress
                  percent={attendanceRate}
                  strokeColor="#7c6af7"
                  showInfo={false}
                  strokeWidth={8}
                />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: "block" }}>
                  총 {data?.attendance_total ?? 0}건 기준
                </Text>
              </>
            ) : (
              <Text type="secondary">출석 데이터가 없습니다.</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 빠른 액션 */}
      <Card title="빠른 액션" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/students">
            <Button icon={<PlusOutlined />} size="large" style={{ height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 120, gap: 4 }}>
              학생 추가
            </Button>
          </Link>
          <Link href="/attendance">
            <Button icon={<QrcodeOutlined />} size="large" style={{ height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 120, gap: 4 }}>
              QR 출석
            </Button>
          </Link>
          <Link href="/messages">
            <Button icon={<MessageOutlined />} size="large" style={{ height: 64, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 120, gap: 4 }}>
              메시지 보내기
            </Button>
          </Link>
        </div>
      </Card>

      <Card
        title={
          <span>
            ⭐ 관심 학생{" "}
            <Tag color="gold" style={{ fontSize: 11, marginLeft: 4 }}>
              {watchedStudents.length}명
            </Tag>
          </span>
        }
        extra={
          <Link href="/students" style={{ fontSize: 13, color: "#7c6af7" }}>
            전체 보기 →
          </Link>
        }
        style={{ marginBottom: 20 }}
      >
        {watchedStudents.length === 0 ? (
          <Text type="secondary">관심 학생이 없습니다. 학생 목록에서 ★ 버튼으로 추가할 수 있어요.</Text>
        ) : (
          <List
            dataSource={watchedStudents.slice(0, 5)}
            renderItem={(s: any) => (
              <List.Item
                style={{ padding: "10px 0" }}
                extra={
                  s.attendance_rate !== null && s.attendance_rate !== undefined ? (
                    <Tag
                      color={
                        s.attendance_rate >= 80
                          ? "success"
                          : s.attendance_rate >= 60
                          ? "warning"
                          : "error"
                      }
                    >
                      출석률 {s.attendance_rate}%
                    </Tag>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>출석 없음</Text>
                  )
                }
              >
                <List.Item.Meta
                  avatar={
                    <Avatar style={{ background: "#f59e0b", fontWeight: 600 }}>
                      {s.name[0]}
                    </Avatar>
                  }
                  title={s.name}
                  description={`${s.grade} · ${s.watch_reason ?? "관심 학생"}`}
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* 달력 + 다가오는 일정 */}
      <Row gutter={20}>
        <Col span={16}>
          <Card
            title="달력"
            extra={
              <Link href="/calendar" style={{ fontSize: 13, color: "#7c6af7" }}>
                전체 보기 →
              </Link>
            }
          >
            <Calendar
              fullscreen={false}
              cellRender={dateCellRender}
              className="dashboard-calendar"
              style={{ border: "none" }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="다가오는 일정" style={{ height: "100%" }}>
            {upcomingEvents.length === 0 ? (
              <Text type="secondary">예정된 일정이 없습니다.</Text>
            ) : (
              <List
                dataSource={upcomingEvents}
                renderItem={(e: any) => (
                  <List.Item style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: typeDotColor[e.event_type ?? e.type] ?? "#6b7280",
                          flexShrink: 0,
                          display: "inline-block",
                        }}
                      />
                      <Text
                        style={{ fontSize: 13, flex: 1 }}
                        ellipsis
                      >
                        {e.title}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, flexShrink: 0 }}>
                        {(e.event_date ?? e.date ?? "").slice(5).replace("-", "/")}
                      </Text>
                    </div>
                  </List.Item>
                )}
                split={false}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
