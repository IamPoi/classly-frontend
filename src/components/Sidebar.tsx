"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Layout, Menu, Avatar, Button, Tooltip } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { getMe, logout } from "@/lib/api";

const { Sider } = Layout;

const navItems = [
  {
    key: "/dashboard",
    label: "대시보드",
    href: "/dashboard",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".7" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".7" />
      </svg>
    ),
  },
  {
    key: "/students",
    label: "학생 관리",
    href: "/students",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" fill="currentColor" />
        <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 20c0-2.76-2.24-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "/timetable",
    label: "시간표 관리",
    href: "/timetable",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "/calendar",
    label: "일정 관리",
    href: "/calendar",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    key: "/attendance",
    label: "출석체크 QR",
    href: "/attendance",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M14 21h3M20 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "/messages",
    label: "부모님 연락",
    href: "/messages",
    icon: (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; role: string; academy_name: string } | null>(null);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const menuItems = navItems.map((item) => ({
    key: item.key,
    icon: <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>,
    label: <Link href={item.href}>{item.label}</Link>,
  }));

  const roleLabel =
    me?.role === "headmaster" ? "원장" : me?.role === "teacher" ? "선생님" : "";

  return (
    <Sider
      width={224}
      theme="dark"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          padding: "20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid #2a2a3e",
          flexShrink: 0,
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#7c6af7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          C
        </div>
        <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Classly</span>
      </Link>

      {/* Navigation */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          style={{
            background: "#1e1e2e",
            border: "none",
            padding: "12px 0",
          }}
        />
      </div>

      {/* Bottom — 유저 정보 + 로그아웃 */}
      <div
        style={{
          padding: "16px",
          borderTop: "1px solid #2a2a3e",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Avatar
          size={32}
          style={{ background: "#7c6af7", flexShrink: 0, fontSize: 12, fontWeight: 600 }}
        >
          {me?.name?.[0] ?? "?"}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#e5e7eb",
              fontSize: 12,
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {me?.academy_name ?? "불러오는 중..."}
          </div>
          <div
            style={{
              color: "#6c7086",
              fontSize: 11,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {me?.name}{roleLabel ? ` · ${roleLabel}` : ""}
          </div>
        </div>
        <Tooltip title="로그아웃" placement="right">
          <Button
            type="text"
            size="small"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ color: "#6c7086", flexShrink: 0 }}
          />
        </Tooltip>
      </div>
    </Sider>
  );
}
